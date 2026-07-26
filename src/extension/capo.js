import { analyzeHead } from "@rviscomi/capo.js";
import { BrowserAdapter } from "@rviscomi/capo.js/adapters/browser";
import { IO } from "@rviscomi/capo.js/lib/io";
import { Options } from "@rviscomi/capo.js/lib/options";

function sanitizeForStorage(obj, io) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "object" && (obj.nodeType || (typeof Element !== "undefined" && obj instanceof Element))) {
    return io ? io.stringifyElement(obj) : (obj.outerHTML || obj.tagName || String(obj));
  }
  if (obj instanceof Date) {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForStorage(item, io));
  }
  if (typeof obj === "object") {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "element" && value && typeof value === "object" && (value.nodeType || (typeof Element !== "undefined" && value instanceof Element))) {
        continue;
      }
      clean[key] = sanitizeForStorage(value, io);
    }
    return clean;
  }
  return obj;
}

async function run(io) {
  await io.init();
  const headElement = io.getHead();
  const adapter = new BrowserAdapter();
  const result = analyzeHead(headElement, adapter);

  const headWeights = io.logAnalysis(result);

  return {
    actual: headWeights.map(
      ({ element, weight, isValid, customValidations }) => {
        return {
          weight,
          color: io.getColor(weight),
          selector: io.stringifyElement(element),
          html: element.innerHTML,
          isValid,
          customValidations: sanitizeForStorage(customValidations, io),
        };
      }
    ),
  };
}

async function initOptions() {
  const { options } = await chrome.storage.sync.get("options");
  return new Options(options);
}

async function init() {
  const options = await initOptions();
  const io = new IO(document, options);

  // This file is executed by the extension in two scenarios:
  //
  //     1. User opens the extension via the icon
  //     2. User clicks an element in the color bar
  //
  // The existence of the click object tells us which scenario we're in.
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
