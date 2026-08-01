import { analyzeHead } from "../index.js";
import { BrowserAdapter } from "../adapters/browser.js";
import { IO } from "../lib/io.js";
import { Options } from "../lib/options.js";

/**
 * @param {any} obj
 * @param {IO} [io]
 * @returns {any}
 */
function sanitizeForStorage(obj, io) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "object" && (obj.nodeType || (typeof Element !== "undefined" && obj instanceof Element))) {
    return io ? io.stringifyElement(obj) : obj.outerHTML || obj.tagName || String(obj);
  }
  if (obj instanceof Date) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForStorage(item, io));
  }
  if (typeof obj === "object") {
    /** @type {Record<string, any>} */
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        key === "element" &&
        value &&
        typeof value === "object" &&
        (value.nodeType || (typeof Element !== "undefined" && value instanceof Element))
      ) {
        continue;
      }
      clean[key] = sanitizeForStorage(value, io);
    }
    return clean;
  }
  return obj;
}

/**
 * @param {IO} io
 * @returns {Promise<{ actual: Array<{ weight: number, color: string, selector: string, html: string, isValid: boolean, customValidations: any }> }>}
 */
async function run(io) {
  await io.init();
  const headElement = io.getHead();
  const adapter = new BrowserAdapter();
  const result = analyzeHead(headElement, adapter);

  const headWeights = io.logAnalysis(result);

  return {
    actual: headWeights.map(({ element, weight, isValid, customValidations }) => {
      return {
        weight,
        color: io.getColor(weight),
        selector: io.stringifyElement(element),
        html: element.innerHTML,
        isValid: Boolean(isValid),
        customValidations: sanitizeForStorage(customValidations, io),
      };
    }),
  };
}

/**
 * @returns {Promise<Options>}
 */
async function initOptions() {
  const { options } = await chrome.storage.sync.get("options");
  return new Options(options);
}

/**
 * @returns {Promise<void>}
 */
async function init() {
  const options = await initOptions();
  const io = new IO(document, options);

  const { click } = await chrome.storage.local.get("click");
  if (click) {
    io.logElementFromSelector(JSON.parse(click));
    await chrome.storage.local.remove("click");
  } else {
    const data = await run(io);
    await chrome.storage.local.set({
      data: data,
    });
  }
}

init();
