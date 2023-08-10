export class VirtualConsole {

  constructor(rootElement) {
    this.rootElement = rootElement;
  }

  log(...args) {
    console.log(...args);
  }

  warn(...args) {
    console.log(...args);
  }

  error(...args) {
    console.error(...args);
  }

  groupCollapsed(...args) {
    console.groupCollapsed(...args);
  }

  groupEnd(...args) {
    console.groupEnd(...args);
  }

}
