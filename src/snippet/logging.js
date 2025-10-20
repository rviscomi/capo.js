import { analyzeHead, BrowserAdapter } from '../index.js';

export function validateHead(io, validation) {
  const adapter = new BrowserAdapter();
  const validationWarnings = validation.getValidationWarnings(io.getHead(), adapter);
  io.logValidationWarnings(validationWarnings);
}

export function logWeights(io, validation, rules) {
  const adapter = new BrowserAdapter();
  const headElement = io.getHead();
  const headWeights = rules.getHeadWeights(headElement, adapter).map(({element, weight}) => {
    return {
      weight,
      element: io.getLoggableElement(element),
      isValid: !validation.hasValidationWarning(element, adapter),
      customValidations: validation.getCustomValidations(element, adapter)
    };
  });
  
  io.visualizeHead('Actual', headElement, headWeights);

  const sortedWeights = Array.from(headWeights).sort((a, b) => b.weight - a.weight);
  const sortedHead = document.createElement('head');
  sortedWeights.forEach(({element}) => {
    sortedHead.appendChild(element.cloneNode(true));
  });

  io.visualizeHead('Sorted', sortedHead, sortedWeights);

  return headWeights;
}

