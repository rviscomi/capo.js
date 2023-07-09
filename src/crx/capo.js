import * as logging from '../snippet/logging.js';
import { IO } from '../lib/io.js';
import { Options } from '../lib/options.js';
import * as rules from '../lib/rules.js';
import * as validation from '../lib/validation.js';

async function run(io) {
  await io.init();
  logging.validateHead(io, validation);
  const headWeights = logging.logWeights(io, validation, rules);

  return {
    actual: headWeights.map(({element, weight, isValid, customValidations}) => ({
      weight,
      color: io.getColor(weight),
      selector: io.stringifyElement(element),
      innerHTML: element.innerHTML,
      isValid,
      customValidations
    })),
  };
}

async function initOptions() {
  const {options} = await chrome.storage.sync.get('options');
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
  const {click} = await chrome.storage.local.get('click');
  if (click) {
    io.logElementFromSelector(JSON.parse(click));
    await chrome.storage.local.remove('click');
  } else {
    const data = await run(io);
    await chrome.storage.local.set({
      data: data
    });
  }  
}

init();
