import * as logging from '../snippet/logging.js';
import { IO } from '../lib/io.js';
import { Options } from '../lib/options.js';
import * as rules from '../lib/rules.js';
import * as validation from '../lib/validation.js';


const CAPO_GLOBAL = '__CAPO__';

async function run(io) {
  await io.init();
  logging.validateHead(io, validation);
  const headWeights = logging.logWeights(io, validation, rules);

  return {
    actual: headWeights.map(({element, weight, isValid, customValidations}) => ({
      weight,
      selector: io.stringifyElement(element),
      innerHTML: element.innerHTML,
      isValid,
      customValidations
    })),
  };
}

async function init() {
  self[CAPO_GLOBAL] = self[CAPO_GLOBAL] || {};
  const options = new Options(self[CAPO_GLOBAL].options);
  const io = new IO(document, options);

  // This file is executed by the extension in two scenarios:
  //
  //     1. User clicks the extension icon
  //     2. User clicks an element in the color bar
  //
  // The existence of the selector tells us which scenario we're in.
  const data = self[CAPO_GLOBAL].click
  if (data) {
    io.logElementFromSelector(data);
    self[CAPO_GLOBAL].click = undefined;
  } else {
    const data = await run(io);
    self[CAPO_GLOBAL].data = data;
  }  
}

init();
