/**
 * Core DOM-agnostic analyzer for capo.js
 * Provides single-pass analysis of HTML <head> elements
 * 
 * @module analyzer
 */

import * as rules from './lib/rules.js';
import { getValidationWarnings, getCustomValidations } from './lib/validation.js';

/**
 * @typedef {Object} AnalysisResult
 * @property {Array<WeightInfo>} weights - Weight information for each element
 * @property {Array<ValidationWarning>} validationWarnings - Document-level validation warnings
 * @property {Array<CustomValidation>} customValidations - Element-level validation warnings
 * @property {any} headElement - Reference to the analyzed head element
 */

/**
 * @typedef {Object} WeightInfo
 * @property {any} element - The DOM/AST element
 * @property {number} weight - Computed weight (0-10)
 * @property {string} category - Weight category name (META, TITLE, etc.)
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} warning - Warning message
 * @property {any|Array<any>} [element] - Associated element(s)
 * @property {Array<any>} [elements] - Associated elements array
 */

/**
 * @typedef {Object} CustomValidation
 * @property {any} element - The element with validation issues
 * @property {Array<string>} warnings - Validation warning messages
 */

/**
 * Analyze the head element and return element weights, validation warnings, and custom validations.
 *
 * @param {any} headNode - The head element to analyze
 * @param {Object} adapter - Adapter for element operations
 * @param {Object} [options={}] - Analysis options
 * @param {boolean} [options.includeValidation=true] - Whether to include document-level validation warnings
 * @param {boolean} [options.includeCustomValidations=true] - Whether to include element-level custom validations
 * @returns {Object} Analysis results
 * @returns {Array} returns.weights - Array of element weight objects
 * @returns {Array} returns.validationWarnings - Document-level validation warnings
 * @returns {Array} returns.customValidations - Element-level custom validation results
 * @returns {any} returns.headElement - The analyzed head element
 *
 * @example
 * const adapter = new HtmlEslintAdapter();
 * const results = analyzeHead(head, adapter);
 * 
 * console.log(`Found ${results.weights.length} elements`);
 * console.log(`${results.validationWarnings.length} document warnings`);
 */
export function analyzeHead(headNode, adapter, options = {}) {
  const {
    includeValidation = true,
    includeCustomValidations = true,
  } = options;

  // Pass 1: Compute weights for all elements
  const weights = rules.getHeadWeights(headNode, adapter);

  // Pass 2: Get document-level validation warnings
  const validationWarnings = includeValidation
    ? getValidationWarnings(headNode, adapter)
    : [];

  // Pass 3: Get element-level custom validations
  const customValidations = includeCustomValidations
    ? getElementValidations(headNode, adapter)
    : [];

  return {
    weights,
    validationWarnings,
    customValidations,
    headElement: headNode,
  };
}

/**
 * Get custom validations for all elements in head
 * 
 * @param {any} headNode - The <head> element
 * @param {Object} adapter - HTMLAdapter implementation
 * @returns {Array<CustomValidation>}
 * @private
 */
function getElementValidations(headNode, adapter) {
  const customValidations = [];
  const children = adapter.getChildren(headNode);

  for (const element of children) {
    const validation = getCustomValidations(element, adapter, headNode);

    if (validation && validation.warnings && validation.warnings.length > 0) {
      customValidations.push({
        ruleId: validation.ruleId,
        element,
        warnings: validation.warnings,
        payload: validation.payload,
      });
    }
  }

  return customValidations;
}

/**
 * Get weight category name from weight value
 * 
 * @param {number} weight - Weight value (0-10)
 * @returns {string} Category name
 * 
 * @example
 * getWeightCategory(10); // 'META'
 * getWeightCategory(9);  // 'TITLE'
 * getWeightCategory(0);  // 'OTHER'
 */
export function getWeightCategory(weight) {
  // Find the category that matches this weight
  for (const [category, value] of Object.entries(rules.ElementWeights)) {
    if (value === weight) {
      return category;
    }
  }
  return 'UNKNOWN';
}

/**
 * Check if elements are in optimal order
 * 
 * @param {Array<WeightInfo>} weights - Weight information array
 * @returns {Array<Object>} Array of ordering violations
 * 
 * @example
 * const weights = analyzeHead(head, adapter).weights;
 * const violations = checkOrdering(weights);
 * console.log(`${violations.length} ordering issues found`);
 */
export function checkOrdering(weights) {
  const violations = [];

  for (let i = 0; i < weights.length - 1; i++) {
    const current = weights[i];
    const next = weights[i + 1];

    if (current.weight < next.weight) {
      const currentCategory = getWeightCategory(current.weight);
      const nextCategory = getWeightCategory(next.weight);

      violations.push({
        index: i + 1,
        currentElement: current.element,
        nextElement: next.element,
        currentWeight: current.weight,
        nextWeight: next.weight,
        currentCategory,
        nextCategory,
        message: `${nextCategory} element should come before ${currentCategory} element`,
      });
    }
  }

  return violations;
}

/**
 * Analyze and return both weights and ordering violations
 * Convenience function that combines analyzeHead() and checkOrdering()
 * 
 * @param {any} headNode - The <head> element
 * @param {Object} adapter - HTMLAdapter implementation
 * @param {Object} [options={}] - Analysis options
 * @returns {Object} Combined analysis with weights, violations, and validations
 * 
 * @example
 * const analysis = analyzeHeadWithOrdering(head, adapter);
 * console.log(`${analysis.orderingViolations.length} ordering issues`);
 */
export function analyzeHeadWithOrdering(headNode, adapter, options = {}) {
  const result = analyzeHead(headNode, adapter, options);
  const orderingViolations = checkOrdering(result.weights);

  return {
    ...result,
    orderingViolations,
  };
}
