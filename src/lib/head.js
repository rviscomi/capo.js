export class Head {

  constructor(document, options) {
    this.document = document;
    this.options = options;
    this.isStatic = false;
    this.head = null;
  }

  getElement() {
    return this.head;
  }

  async getStaticHTML() {
    const url = this.document.location.href;
    const response = await fetch(url);
    return await response.text();
    }

  async getStaticOrDynamicHead() {
    if (this.head) {
      return this.head;
    }

    if (this.options.prefersDynamicAssessment()) {
      this.head = this.document.head;
      return this.head;
    }

    try {
      let html = await this.getStaticHTML();
      html = html.replace(/(<\/?)(head)/ig, '$1static-head');
      const staticDoc = this.document.implementation.createHTMLDocument('New Document');
      staticDoc.documentElement.innerHTML = html;
      this.head = staticDoc.querySelector('static-head');
      
      if (this.head) {
        this.isStatic = true;
      } else {
        this.head = this.document.head;
      }
    } catch {
      this.head = this.document.head;
    }
    return this.head;
  }

}