import { IO } from '../lib/io.js';
import * as rules from '../lib/rules.js';
import { Options } from '../lib/options.js';
import * as validation from '../lib/validation.js';

const options = new Options(window?.CapoOptions);

const io = new IO(document, options);


function validateHead() {
  if (!options.isValidationEnabled()) {
    return;
  }

  const validationWarnings = validation.getValidationWarnings(io.getHead());
  validationWarnings.forEach(({warning, elements=[], element}) => {
    elements = elements.map(io.getLoggableElement);
    console.warn(`${options.loggingPrefix}${warning}`, ...elements, element);
  });
}

function logWeights() {
  const headElement = io.getHead();
  const headWeights = rules.getHeadWeights(headElement).map(({element, weight}) => {
    return {
      weight,
      element: io.getLoggableElement(element),
      isValid: !validation.hasValidationWarning(element),
      customValidations: validation.getCustomValidations(element)
    };
  });
  
  io.visualizeHead('Actual', headElement, headWeights);

  const sortedWeights = headWeights.sort((a, b) => b.weight - a.weight);
  const sortedHead = document.createElement('head');
  sortedWeights.forEach(({element}) => {
    sortedHead.appendChild(element.cloneNode(true));
  });

  io.visualizeHead('Sorted', sortedHead, sortedWeights);
}

(async () => {
  await io.init();
  validateHead();
  logWeights();
})();