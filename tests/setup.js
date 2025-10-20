import { JSDOM } from 'jsdom';

/**
 * Create a JSDOM instance with a head element
 * Uses the static-head trick to preserve invalid elements (just like capo.js in production)
 * @param {string} headHTML - HTML content for <head>
 * @param {object} options - Options { useStaticHead: boolean }
 * @returns {object} { document, head, window }
 */
export function createDocument(headHTML, options = { useStaticHead: true }) {
  const html = `<!DOCTYPE html><html><head>${headHTML}</head><body></body></html>`;
  
  // Use static-head trick to prevent browser from moving invalid elements
  // This mirrors how capo.js works in production (see src/lib/io.js)
  const modifiedHtml = options.useStaticHead 
    ? html.replace(/(\<\/?)(head)/gi, "$1static-head")
    : html;
  
  const dom = new JSDOM(modifiedHtml);
  const headSelector = options.useStaticHead ? 'static-head' : 'head';
  
  return {
    document: dom.window.document,
    head: dom.window.document.querySelector(headSelector),
    window: dom.window,
    isStaticHead: options.useStaticHead,
  };
}

/**
 * Create a single element for testing
 * Uses static-head by default to preserve invalid elements
 * @param {string} elementHTML - HTML string for element
 * @param {object} options - Options { useStaticHead: boolean }
 * @returns {Element}
 */
export function createElement(elementHTML, options = { useStaticHead: true }) {
  const { head } = createDocument(elementHTML, options);
  return head.firstElementChild;
}

/**
 * Mock console for testing logging
 */
export function mockConsole() {
  const logs = [];
  return {
    log: (...args) => logs.push({ type: 'log', args }),
    warn: (...args) => logs.push({ type: 'warn', args }),
    error: (...args) => logs.push({ type: 'error', args }),
    group: (...args) => logs.push({ type: 'group', args }),
    groupEnd: () => logs.push({ type: 'groupEnd', args: [] }),
    getLogs: () => logs,
    clear: () => logs.length = 0,
  };
}
