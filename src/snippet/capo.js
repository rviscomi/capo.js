import * as colors from '../lib/colors.js';
import { Head } from '../lib/head.js';
import * as rules from '../lib/rules.js';
import { Options, AssessmentMode } from '../lib/options.js';
import * as validation from '../lib/validation.js';

const options = new Options({
  // [ STATIC | DYNAMIC ]
  preferredAssessmentMode: AssessmentMode.DYNAMIC,

  // [ true | false ]
  validation: true
});

// [ DEFAULT | PINK | BLUE | generateSwatches(<hue>) ]
const WEIGHT_COLORS = colors.DEFAULT;

const head = new Head(document, options);

const LOGGING_PREFIX = 'Capo: ';


function visualizeWeights(weights) {
  const visual = weights.map(_ => '%c ').join('');
  const styles = weights.map(weight => {
    const color = WEIGHT_COLORS[10 - weight];
    return `background-color: ${color}; padding: 5px; margin: 0 -1px;`
  });

  return {visual, styles};
}

function visualizeWeight(weight) {
  const visual = `%c${new Array(weight + 1).fill('█').join('')}`;
  const style = `color: ${WEIGHT_COLORS[10 - weight]}`;

  return {visual, style};
}

function stringifyElement(element) {
  return element.getAttributeNames().reduce((id, attr) => id += `[${attr}=${JSON.stringify(element.getAttribute(attr))}]`, element.nodeName);
}
  
function getLoggableElement(element) {
  if (!head.isStatic) {
    return element;
  }

  const selector = stringifyElement(element);
  const candidates = Array.from(document.head.querySelectorAll(selector));
  if (candidates.length == 0) {
    return element;
  }
  if (candidates.length == 1) {
    return candidates[0];
  }

  // The way the static elements are parsed makes their innerHTML different.
  // Recreate the element in DOM and compare its innerHTML with those of the candidates.
  // This ensures a consistent parsing and positive string matches.
  const candidateWrapper = document.createElement('div');
  const elementWrapper = document.createElement('div');
  elementWrapper.innerHTML = element.innerHTML;
  const candidate = candidates.find(c => {
    candidateWrapper.innerHTML = c.innerHTML;
    return candidateWrapper.innerHTML == elementWrapper.innerHTML;
  });
  if (candidate) {
    return candidate;
  }
  
  return element;
}

function logElement({viz, weight, element, isValid, omitPrefix = false}) {
  if (!omitPrefix) {
    viz.visual = `${LOGGING_PREFIX}${viz.visual}`;
  }

  let loggingLevel = 'log';
  const args = [viz.visual, viz.style, weight + 1, element];

  if (!options.isValidationEnabled()) {
    console[loggingLevel](...args);
    return;
  }

  const {payload, warnings} = validation.getCustomValidations(element);
  if (payload) {
    args.push(payload);
  }

  if (warnings?.length) {
    // Element-specific warnings.
    loggingLevel = 'warn';
    warnings.forEach(warning => args.push(`❌ ${warning}`));
  } else if (!isValid && (options.prefersDynamicAssessment() || head.isStatic)) {
    // General warnings.
    loggingLevel = 'warn';
    args.push(`❌ invalid element (${element.tagName})`);
  }

  console[loggingLevel](...args);
}

function logWeights() {
  const headElement = head.getElement();
  const headWeights = rules.getHeadWeights(headElement).map(({element, weight}) => {
    return [getLoggableElement(element), weight, isValidElement(element)];
  });
  const actualViz = visualizeWeights(headWeights.map(([_, weight]) => weight));

  if (!head.isStatic && options.prefersStaticAssessment()) {
    console.warn(`${LOGGING_PREFIX}Unable to parse the static (server-rendered) <head>. Falling back to document.head`, headElement);
  }
  
  console.groupCollapsed(`${LOGGING_PREFIX}Actual %c<head>%c order\n${actualViz.visual}`, 'font-family: monospace', 'font-family: inherit',  ...actualViz.styles);
  headWeights.forEach(([element, weight, isValid]) => {
    const viz = visualizeWeight(weight);
    logElement({viz, weight, element, isValid, omitPrefix: true});
  });
  console.log('Actual %c<head>%c element', 'font-family: monospace', 'font-family: inherit', headElement);
  console.groupEnd();

  const sortedWeights = headWeights.sort((a, b) => {
    return b[1] - a[1];
  });
  const sortedViz = visualizeWeights(sortedWeights.map(([_, weight]) => weight));
  
  console.groupCollapsed(`${LOGGING_PREFIX}Sorted %c<head>%c order\n${sortedViz.visual}`, 'font-family: monospace', 'font-family: inherit', ...sortedViz.styles);
  const sortedHead = document.createElement('head');
  sortedWeights.forEach(([element, weight, isValid]) => {
    const viz = visualizeWeight(weight);
    logElement({viz, weight, element, isValid, omitPrefix: true});
    sortedHead.appendChild(element.cloneNode(true));
  });
  console.log('Sorted %c<head>%c element', 'font-family: monospace', 'font-family: inherit', sortedHead);
  console.groupEnd();
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

  const validationWarnings = validation.getValidationWarnings(head.getElement());
  validationWarnings.forEach(({warning, elements=[], element}) => {
    elements = elements.map(getLoggableElement);
    console.warn(`${LOGGING_PREFIX}${warning}`, ...elements, element);
  });
}

(async () => {
  await head.getStaticOrDynamicHead();
  validateHead();
  logWeights();
})();