import { getInvalidBackgroundColor } from "./colors.js";

export class IO {
  constructor(document, options, output = window.console) {
    this.document = document;
    this.options = options;
    this.console = output;
    this.isStaticHead = false;
    this.head = null;
  }

  async init() {
    if (this.head) {
      return;
    }

    if (this.options.prefersDynamicAssessment()) {
      this.head = this.document.querySelector("head");
      return;
    }

    try {
      let html = await this.getStaticHTML();
      html = html.replace(/(\<\/?)(head)/gi, "$1static-head");
      const staticDoc = this.document.implementation.createHTMLDocument("New Document");
      staticDoc.documentElement.innerHTML = html;
      this.head = staticDoc.querySelector("static-head");

      if (this.head) {
        this.isStaticHead = true;
      } else {
        this.head = this.document.head;
      }
    } catch (e) {
      this.console.error(`${this.options.loggingPrefix}An exception occurred while getting the static <head>:`, e);
      this.head = this.document.head;
    }

    if (!this.isStaticHead) {
      this.console.warn(
        `${this.options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`,
        this.head
      );
    }
  }

  async getStaticHTML() {
    const url = this.document.location.href;
    const response = await fetch(url);
    return await response.text();
  }

  getHead() {
    return this.head;
  }

  stringifyElement(element) {
    return element.getAttributeNames().reduce((id, attr) => {
      return (id += `[${CSS.escape(attr)}=${JSON.stringify(element.getAttribute(attr))}]`);
    }, element.nodeName);
  }

  getLoggableElement(element) {
    if (!this.isStaticHead) {
      return element;
    }

    const selector = this.stringifyElement(element);
    const candidates = Array.from(this.document.head.querySelectorAll(selector));
    if (candidates.length == 0) {
      return element;
    }
    if (candidates.length == 1) {
      return candidates[0];
    }

    // The way the static elements are parsed makes their innerHTML different.
    // Recreate the element in DOM and compare its innerHTML with those of the candidates.
    // This ensures a consistent parsing and positive string matches.
    const candidateWrapper = this.document.createElement("div");
    const elementWrapper = this.document.createElement("div");
    elementWrapper.innerHTML = element.innerHTML;
    const candidate = candidates.find((c) => {
      candidateWrapper.innerHTML = c.innerHTML;
      return candidateWrapper.innerHTML == elementWrapper.innerHTML;
    });
    if (candidate) {
      return candidate;
    }

    return element;
  }

  // Note: AI-generated function.
  createElementFromSelector(selector) {
    // Extract the tag name from the selector
    const tagName = selector.match(/^[A-Za-z]+/)[0];

    if (!tagName) {
      return;
    }

    // Create the new element
    const element = document.createElement(tagName);

    // Extract the attribute key-value pairs from the selector
    const attributes = selector.match(/\[([A-Za-z-]+)="([^"]+)"\]/g) || [];

    // Set the attributes on the new element
    attributes.forEach((attribute) => {
      // Trim square brackets
      attribute = attribute.slice(1, -1);
      const delimeterPosition = attribute.indexOf("=");
      // Everything before the =
      const key = attribute.slice(0, delimeterPosition);
      // Everything after the =, with quotes trimmed
      const value = attribute.slice(delimeterPosition + 1).slice(1, -1);
      element.setAttribute(key, value);
    });

    return element;
  }

  logElementFromSelector({ weight, selector, innerHTML, isValid, customValidations = {} }) {
    weight = +weight;
    const viz = this.getElementVisualization(weight);
    let element = this.createElementFromSelector(selector);
    element.innerHTML = innerHTML;
    element = this.getLoggableElement(element);

    this.logElement({ viz, weight, element, isValid, customValidations });
  }

  logElement({ viz, weight, element, isValid, customValidations, omitPrefix = false }) {
    if (!omitPrefix) {
      viz.visual = `${this.options.loggingPrefix}${viz.visual}`;
    }

    let loggingLevel = "log";
    const args = [viz.visual, viz.style, weight + 1, element];

    if (!this.options.isValidationEnabled()) {
      this.console[loggingLevel](...args);
      return;
    }

    const { payload, warnings } = customValidations;
    if (payload) {
      if (typeof payload.expiry == "string") {
        // Deserialize origin trial expiration dates.
        payload.expiry = new Date(payload.expiry);
      }
      args.push(payload);
    }

    if (warnings?.length) {
      // Element-specific warnings.
      loggingLevel = "warn";
      args.push("\n" + warnings.map((warning) => `  ❌ ${warning}`).join("\n"));
    } else if (!isValid && (this.options.prefersDynamicAssessment() || this.isStaticHead)) {
      // General warnings.
      loggingLevel = "warn";
      args.push(`\n  ❌ invalid element (${element.tagName})`);
    }

    this.console[loggingLevel](...args);
  }

  logValidationWarnings(warnings) {
    if (!this.options.isValidationEnabled()) {
      return;
    }

    warnings.forEach(({ warning, elements = [], element }) => {
      elements = elements.map(this.getLoggableElement.bind(this));
      this.console.warn(`${this.options.loggingPrefix}${warning}`, ...elements, element || "");
    });
  }

  getColor(weight) {
    return this.options.palette[10 - weight];
  }

  getHeadVisualization(elements) {
    let visual = "";
    const styles = [];

    elements.forEach(({ weight, isValid }) => {
      visual += "%c ";

      const color = this.getColor(weight);
      let style = `padding: 5px; margin: 0 -1px; `;

      if (isValid) {
        style += `background-color: ${color};`;
      } else {
        style += `background-image: ${getInvalidBackgroundColor(color)}`;
      }

      styles.push(style);
    });

    return { visual, styles };
  }

  getElementVisualization(weight) {
    const visual = `%c${new Array(weight + 1).fill("█").join("")}`;
    const color = this.getColor(weight);
    const style = `color: ${color}`;

    return { visual, style };
  }

  visualizeHead(groupName, headElement, headWeights) {
    const headViz = this.getHeadVisualization(headWeights);

    this.console.groupCollapsed(
      `${this.options.loggingPrefix}${groupName} %chead%c order\n${headViz.visual}`,
      "font-family: monospace",
      "font-family: inherit",
      ...headViz.styles
    );

    headWeights.forEach(({ weight, element, isValid, customValidations }) => {
      const viz = this.getElementVisualization(weight);
      this.logElement({
        viz,
        weight,
        element,
        isValid,
        customValidations,
        omitPrefix: true,
      });
    });

    this.console.log(`${groupName} %chead%c element`, "font-family: monospace", "font-family: inherit", headElement);

    this.console.groupEnd();
  }
}
