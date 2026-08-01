import { getInvalidBackgroundColor } from "./colors.js";

/**
 * @typedef {import('./options.js').Options} Options
 * @typedef {import('../analyzer.js').AnalysisResult} AnalysisResult
 *
 * @typedef {Object} ConsoleOutput
 * @property {(...args: any[]) => void} log
 * @property {(...args: any[]) => void} warn
 * @property {(...args: any[]) => void} error
 * @property {(...args: any[]) => void} groupCollapsed
 * @property {() => void} groupEnd
 *
 * @typedef {Object} HeadWeightInfo
 * @property {any} [element]
 * @property {number} weight
 * @property {boolean} [isValid]
 * @property {Record<string, any>} [customValidations]
 *
 * @typedef {Object} ElementVisualization
 * @property {string} visual
 * @property {string} style
 *
 * @typedef {Object} HeadVisualization
 * @property {string} visual
 * @property {string[]} styles
 */

export class IO {
  /**
   * @param {Document|null} document
   * @param {Options} options
   * @param {ConsoleOutput|any} [output=window.console]
   */
  constructor(document, options, output = typeof window !== "undefined" ? window.console : console) {
    this.document = document;
    this.options = options;
    this.console = output;
    this.isStaticHead = false;
    /** @type {any} */
    this.head = null;
  }

  /**
   * @param {string} html
   * @returns {string}
   */
  static formatStaticHeadHTML(html) {
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/(\<\/?)(head)/gi, "$1static-head");
    }
    return `<static-head>${html}</static-head>`;
  }

  /**
   * @param {any} head
   */
  initFromStaticHead(head) {
    this.head = head;
    this.isStaticHead = true;
  }

  /**
   * @param {string} html
   */
  initFromHTML(html) {
    const formattedHtml = IO.formatStaticHeadHTML(html.trim());
    const parser = new (this.document?.defaultView?.DOMParser || DOMParser)();
    const staticDoc = parser.parseFromString(formattedHtml, "text/html");
    this.initFromStaticHead(staticDoc.querySelector("static-head") || staticDoc.head);
  }

  /**
   * @returns {Promise<void>}
   */
  async init() {
    if (this.head) {
      return;
    }

    if (this.options.prefersDynamicAssessment()) {
      this.head = this.document?.querySelector("head") || null;
      return;
    }

    try {
      let html = await this.getStaticHTML();
      html = IO.formatStaticHeadHTML(html);
      const parser = new (this.document?.defaultView?.DOMParser || DOMParser)();
      const staticDoc = parser.parseFromString(html, "text/html");
      const staticHead = staticDoc.querySelector("static-head");

      if (staticHead) {
        this.initFromStaticHead(staticHead);
      } else {
        this.head = this.document?.head || null;
      }
    } catch (e) {
      this.console.error(`${this.options.loggingPrefix}An exception occurred while getting the static <head>:`, e);
      this.head = this.document?.head || null;
    }

    if (!this.isStaticHead) {
      this.console.warn(
        `${this.options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`,
        this.head,
      );
    }
  }

  /**
   * @returns {Promise<string>}
   */
  async getStaticHTML() {
    const url = this.document?.location.href || "";
    const response = await fetch(url);
    return await response.text();
  }

  /**
   * @returns {any}
   */
  getHead() {
    return this.head;
  }

  /**
   * @param {any} element
   * @returns {string}
   */
  stringifyElement(element) {
    return element.getAttributeNames().reduce((/** @type {string} */ id, /** @type {string} */ attr) => {
      return (id += `[${CSS.escape(attr)}=${JSON.stringify(element.getAttribute(attr))}]`);
    }, element.nodeName);
  }

  /**
   * @param {any} element
   * @returns {any}
   */
  getLoggableElement(element) {
    if (!this.isStaticHead) {
      return element;
    }

    const head = this.document?.head || this.head;
    if (!head) {
      return element;
    }

    const selector = this.stringifyElement(element);
    const candidates = Array.from(head.querySelectorAll(selector));
    if (candidates.length === 0) {
      return element;
    }
    if (candidates.length === 1) {
      return candidates[0];
    }

    // The way the static elements are parsed makes their innerHTML different.
    // Compare child nodes using isEqualNode to avoid unsafe innerHTML assignment.
    // This ensures a consistent parsing and positive matches.
    const candidate = candidates.find((c) => {
      if (c.childNodes.length !== element.childNodes.length) {
        return false;
      }
      for (let i = 0; i < c.childNodes.length; i++) {
        if (!c.childNodes[i].isEqualNode(element.childNodes[i])) {
          return false;
        }
      }
      return true;
    });
    if (candidate) {
      return candidate;
    }

    return element;
  }

  /**
   * Create an element from a CSS selector
   * @param {string} selector
   * @returns {any}
   */
  createElementFromSelector(selector) {
    const match = selector.match(/^[A-Za-z]+/);
    const tagName = match ? match[0] : null;

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

  /**
   * @param {AnalysisResult} result
   * @returns {HeadWeightInfo[]}
   */
  logAnalysis(result) {
    const headElement = this.getHead();
    const headWeights = result.weights.map((w) => {
      const customValidation = result.customValidations.find((v) => v.element === w.element);
      const validationWarning = result.validationWarnings.find(
        (v) => v.element === w.element || (v.elements && v.elements.includes(w.element)),
      );
      const isElementValid = !customValidation && !validationWarning;
      return {
        element: w.element,
        weight: w.weight,
        isValid: isElementValid,
        customValidations: customValidation || {},
      };
    });

    this.logValidationWarnings(result.validationWarnings);

    // Log custom validations (e.g. origin trials) at the top level
    result.customValidations.forEach((v) => {
      if (v.warnings.length > 0) {
        this.console.warn(`${this.options.loggingPrefix}${v.warnings[0]}`, v.element, v.payload || "");
      }
    });

    this.visualizeHead("Actual", headElement, headWeights);

    const sortedHeadWeights = [...headWeights].sort((a, b) => b.weight - a.weight);
    const sortedHeadElement = headElement.cloneNode(false);
    sortedHeadWeights.forEach(({ element }) => {
      if (element) {
        sortedHeadElement.appendChild(element.cloneNode(true));
      }
    });
    this.visualizeHead("Sorted", sortedHeadElement, sortedHeadWeights);

    return headWeights;
  }

  /**
   * @param {Object} params
   * @param {number|string} params.weight
   * @param {string} params.selector
   * @param {string} params.html
   * @param {boolean} [params.isValid]
   * @param {Record<string, any>} [params.customValidations]
   */
  logElementFromSelector({ weight, selector, html, isValid, customValidations = {} }) {
    const numWeight = +weight;
    const viz = this.getElementVisualization(numWeight, isValid);
    let element = this.createElementFromSelector(selector);
    const parser = new (this.document?.defaultView?.DOMParser || DOMParser)();
    const doc = parser.parseFromString(html || "", "text/html");
    const nodes = [...doc.head.childNodes, ...doc.body.childNodes];
    nodes.forEach((child) => element.appendChild(child.cloneNode(true)));
    element = this.getLoggableElement(element);

    this.logElement({ viz, weight: numWeight, element, isValid, customValidations });
  }

  /**
   * @param {Object} params
   * @param {ElementVisualization} params.viz
   * @param {number} params.weight
   * @param {any} params.element
   * @param {boolean} [params.isValid]
   * @param {Record<string, any>} [params.customValidations]
   * @param {boolean} [params.omitPrefix]
   */
  logElement({ viz, weight, element, isValid, customValidations = {}, omitPrefix = false }) {
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
    if (payload && Object.keys(payload).length > 0) {
      if (typeof payload.expiry === "string") {
        // Deserialize origin trial expiration dates.
        payload.expiry = new Date(payload.expiry);
      }
      args.push(payload);
    }

    if (warnings?.length) {
      // Element-specific warnings.
      loggingLevel = "warn";
      args.push("\n" + warnings.map((/** @type {string} */ warning) => `  ❌ ${warning}`).join("\n"));
    } else if (!isValid && (this.options.prefersDynamicAssessment() || this.isStaticHead)) {
      // General warnings.
      loggingLevel = "warn";
      args.push(`\n  ❌ invalid element (${element.tagName})`);
    }

    this.console[loggingLevel](...args);
  }

  /**
   * @param {Array<import('../analyzer.js').ValidationWarning>} warnings
   */
  logValidationWarnings(warnings) {
    if (!this.options.isValidationEnabled()) {
      return;
    }

    warnings.forEach(({ warning, elements = [], element }) => {
      elements = elements.map(this.getLoggableElement.bind(this));
      this.console.warn(`${this.options.loggingPrefix}${warning}`, ...elements, element || "");
    });
  }

  /**
   * @param {number} weight
   * @returns {string}
   */
  getColor(weight) {
    return this.options.palette[10 - weight];
  }

  /**
   * @param {HeadWeightInfo[]} elements
   * @returns {HeadVisualization}
   */
  getHeadVisualization(elements) {
    let visual = "";
    /** @type {string[]} */
    const styles = [];

    elements.forEach(({ weight, isValid }) => {
      visual += "%c ";

      const color = this.getColor(weight);
      let style = `padding: 5px; margin: 4px -1px 0; display: inline-block; `;

      if (isValid) {
        style += `background-color: ${color};`;
      } else {
        style += `background-image: ${getInvalidBackgroundColor(color)}`;
      }

      styles.push(style);
    });

    return { visual, styles };
  }

  /**
   * @param {number} weight
   * @param {boolean} [isValid=true]
   * @returns {ElementVisualization}
   */
  getElementVisualization(weight, isValid = true) {
    const visual = `%c${new Array(weight + 1).fill("█").join("")}`;
    const color = this.getColor(weight);
    let style = `color: ${color}`;

    return { visual, style };
  }

  /**
   * @param {string} groupName
   * @param {any} headElement
   * @param {HeadWeightInfo[]} headWeights
   */
  visualizeHead(groupName, headElement, headWeights) {
    const headViz = this.getHeadVisualization(headWeights);

    this.console.groupCollapsed(
      `${this.options.loggingPrefix}${groupName} %chead%c order\n${headViz.visual}`,
      "font-family: monospace",
      "font-family: inherit",
      ...headViz.styles,
    );

    headWeights.forEach(({ weight, element, isValid, customValidations }) => {
      const viz = this.getElementVisualization(weight, isValid);
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
