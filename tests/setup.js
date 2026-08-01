import { JSDOM } from "jsdom";

/**
 * @typedef {Object} CreateDocumentOptions
 * @property {boolean} [useStaticHead=true]
 *
 * @typedef {Object} CreatedDocument
 * @property {any} document
 * @property {any} head
 * @property {import('jsdom').DOMWindow} window
 * @property {boolean} isStaticHead
 */

/**
 * Create a JSDOM instance with a head element
 * Uses the static-head trick to preserve invalid elements (just like capo.js in production)
 * @param {string} headHTML - HTML content for <head>
 * @param {CreateDocumentOptions} [options={ useStaticHead: true }] - Options { useStaticHead: boolean }
 * @returns {CreatedDocument} { document, head, window, isStaticHead }
 */
export function createDocument(headHTML, options = { useStaticHead: true }) {
  const useStaticHead = options.useStaticHead !== false;
  const html = `<!DOCTYPE html><html><head>${headHTML}</head><body></body></html>`;

  // Use static-head trick to prevent browser from moving invalid elements
  // This mirrors how capo.js works in production (see src/lib/io.js)
  const modifiedHtml = useStaticHead ? html.replace(/(\<\/?)(head)/gi, "$1static-head") : html;

  const dom = new JSDOM(modifiedHtml);
  const headSelector = useStaticHead ? "static-head" : "head";

  return {
    document: dom.window.document,
    head: dom.window.document.querySelector(headSelector),
    window: dom.window,
    isStaticHead: useStaticHead,
  };
}

/**
 * Create a single element for testing
 * Uses static-head by default to preserve invalid elements
 * @param {string} elementHTML - HTML string for element
 * @param {CreateDocumentOptions} [options={ useStaticHead: true }] - Options { useStaticHead: boolean }
 * @returns {Element|null}
 */
export function createElement(elementHTML, options = { useStaticHead: true }) {
  const { head } = createDocument(elementHTML, options);
  return head ? head.firstElementChild : null;
}

/**
 * Mock console for testing logging
 */
export function mockConsole() {
  /** @type {Array<{ type: string, args: any[] }>} */
  const logs = [];
  return {
    log: (/** @type {any[]} */ ...args) => logs.push({ type: "log", args }),
    warn: (/** @type {any[]} */ ...args) => logs.push({ type: "warn", args }),
    error: (/** @type {any[]} */ ...args) => logs.push({ type: "error", args }),
    group: (/** @type {any[]} */ ...args) => logs.push({ type: "group", args }),
    groupEnd: () => logs.push({ type: "groupEnd", args: [] }),
    getLogs: () => logs,
    clear: () => (logs.length = 0),
  };
}
