export class IO {

  constructor(document, options) {
    this.document = document;
    this.options = options;
    this.isStaticHead = false;
    this.head = null;
  }

  async init() {
    if (this.head) {
      return;
    }

    if (this.options.prefersDynamicAssessment()) {
      this.head = this.document.head;
      return;
    }

    try {
      let html = await this.getStaticHTML();
      html = html.replace(/(<\/?)(head)/ig, '$1static-head');
      const staticDoc = this.document.implementation.createHTMLDocument('New Document');
      staticDoc.documentElement.innerHTML = html;
      this.head = staticDoc.querySelector('static-head');
      
      if (this.head) {
        this.isStaticHead = true;
      } else {
        this.head = this.document.head;
      }
    } catch (e) {
      console.error(`${this.options.loggingPrefix}An exception occurred while getting the static <head>:`, e);
      this.head = this.document.head;
    }

    if (!this.isStaticHead) {
      console.warn(`${this.options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`, this.head);
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
    return element.getAttributeNames().reduce((id, attr) => id += `[${attr}=${JSON.stringify(element.getAttribute(attr))}]`, element.nodeName);
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
    const candidateWrapper = this.document.createElement('div');
    const elementWrapper = this.document.createElement('div');
    elementWrapper.innerHTML = element.innerHTML;
    const candidate = candidates.find(c => {
      candidateWrapper.innerHTML = c.innerHTML;
      return candidateWrapper.innerHTML == elementWrapper.innerHTML;
    });
    if (candidate) {
      return candidate;
    }
    
    return element;
  }

  logElement({viz, weight, element, isValid, customValidations, omitPrefix = false}) {
    if (!omitPrefix) {
      viz.visual = `${this.options.loggingPrefix}${viz.visual}`;
    }

    let loggingLevel = 'log';
    const args = [viz.visual, viz.style, weight + 1, element];

    if (!this.options.isValidationEnabled()) {
      console[loggingLevel](...args);
      return;
    }

    const {payload, warnings} = customValidations;
    if (payload) {
      args.push(payload);
    }

    if (warnings?.length) {
      // Element-specific warnings.
      loggingLevel = 'warn';
      warnings.forEach(warning => args.push(`❌ ${warning}`));
    } else if (!isValid && (this.options.prefersDynamicAssessment() || this.isStaticHead)) {
      // General warnings.
      loggingLevel = 'warn';
      args.push(`❌ invalid element (${element.tagName})`);
    }

    console[loggingLevel](...args);
  }

  getHeadVisualization(weights) {
    const visual = weights.map(_ => '%c ').join('');
    const styles = weights.map(weight => {
      const color = this.options.palette[10 - weight];
      return `background-color: ${color}; padding: 5px; margin: 0 -1px;`
    });

    return {visual, styles};
  }

  getElementVisualization(weight) {
    const visual = `%c${new Array(weight + 1).fill('█').join('')}`;
    const style = `color: ${this.options.palette[10 - weight]}`;
  
    return {visual, style};
  }

  visualizeHead(groupName, headElement, headWeights) {
    const headViz = this.getHeadVisualization(headWeights.map(({weight}) => weight));

    console.groupCollapsed(`${this.options.loggingPrefix}${groupName} %c<head>%c order\n${headViz.visual}`, 'font-family: monospace', 'font-family: inherit',  ...headViz.styles);
    
    headWeights.forEach(({weight, element, isValid, customValidations}) => {
      const viz = this.getElementVisualization(weight);
      this.logElement({viz, weight, element, isValid, customValidations, omitPrefix: true});
    });
    
    console.log(`${groupName} %c<head>%c element`, 'font-family: monospace', 'font-family: inherit', headElement);
    
    console.groupEnd();
  }

}