import * as colors from '../lib/colors.js';
import { IO } from '../lib/io.js';
import * as rules from '../lib/rules.js';
import { Options } from '../lib/options.js';
import * as validation from '../lib/validation.js';

const options = new Options({
  // [ STATIC | DYNAMIC ]
  preferredAssessmentMode: Options.AssessmentMode.STATIC,

  // [ true | false ]
  validation: true,

  // [ DEFAULT | PINK | BLUE | generateSwatches(<hue>) ]
  palette: colors.DEFAULT,

  // <string>
  loggingPrefix: 'Capo: '
});

const io = new IO(document, options);


function logWeights() {
  const headElement = io.getHead();
  const headWeights = rules.getHeadWeights(headElement).map(({element, weight}) => {
    return {
      weight,
      element: io.getLoggableElement(element),
      isValid: isValidElement(element),
      customValidations: validation.getCustomValidations(element)
    };
  });

  if (!io.isStaticHead && options.prefersStaticAssessment()) {
    console.warn(`${options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`, headElement);
  }
  
  io.visualizeHead('Actual', headElement, headWeights);

  const sortedWeights = headWeights.sort((a, b) => {
    return b.weight - a.weight;
  });
  const sortedHead = document.createElement('head');
  sortedWeights.forEach(({element}) => {
    sortedHead.appendChild(element.cloneNode(true));
  });

  io.visualizeHead('Sorted', sortedHead, sortedWeights);
}

function isValidElement(element) {
  if (!options.isValidationEnabled()) {
    return true;
  }

  return !validation.hasValidationWarning(element);
}

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

(async () => {
  await io.getStaticOrDynamicHead();
  validateHead();
  logWeights();
})();