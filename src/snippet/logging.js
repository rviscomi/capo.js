export function validateHead(io, validation) {
  const validationWarnings = validation.getValidationWarnings(io.getHead());
  io.logValidationWarnings(validationWarnings);
}

export function logWeights(io, validation, rules) {
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

  const sortedWeights = Array.from(headWeights).sort((a, b) => b.weight - a.weight);
  const sortedHead = document.createElement('head');
  sortedWeights.forEach(({element}) => {
    sortedHead.appendChild(element.cloneNode(true));
  });

  io.visualizeHead('Sorted', sortedHead, sortedWeights);

  return headWeights;
}
