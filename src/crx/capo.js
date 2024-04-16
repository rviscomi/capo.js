import * as capo from "../main.js";
import * as logging from "../snippet/logging.js";

async function run(io) {
  await io.init();
  logging.validateHead(io, capo.validation);
  const headWeights = logging.logWeights(io, capo.validation, capo.rules);

  return {
    actual: headWeights.map(
      ({ element, weight, isValid, customValidations }) => {
        if (customValidations?.payload?.expiry) {
          // Serialize origin trial expiration dates.
          customValidations.payload.expiry =
            customValidations.payload.expiry.toString();
        }
        return {
          weight,
          color: io.getColor(weight),
          selector: io.stringifyElement(element),
          innerHTML: element.innerHTML,
          isValid,
          customValidations,
        };
      }
    ),
  };
}

async function initOptions() {
  const { options } = await chrome.storage.sync.get("options");
  return new capo.options.Options(options);
}

async function init() {
  const options = await initOptions();
  const io = new capo.io.IO(document, options);

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
