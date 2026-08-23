/**
 * Capo.js v2 - DOM-agnostic HTML <head> analyzer
 *
 * Main entry point for programmatic usage.
 * Exports both the core analyzer API and adapter implementations.
 *
 * @module capo
 */

// Core Analysis API
export { analyzeHead, analyzeHeadWithOrdering, checkOrdering, getWeightCategory } from "./analyzer.js";

/**
 * @typedef {import('./analyzer.js').AnalysisResult} AnalysisResult
 * @typedef {import('./analyzer.js').WeightInfo} WeightInfo
 * @typedef {import('./analyzer.js').ValidationWarning} ValidationWarning
 * @typedef {import('./analyzer.js').CustomValidation} CustomValidation
 * @typedef {import('./analyzer.js').OrderingViolation} OrderingViolation
 * @typedef {import('./analyzer.js').AnalysisResultWithOrdering} AnalysisResultWithOrdering
 * @typedef {import('./analyzer.js').AnalyzeHeadOptions} AnalyzeHeadOptions
 */

// Rules API
export {
  ElementWeights,
  getWeight,
  getHeadWeights,
  isMeta,
  isTitle,
  isPreconnect,
  isHighPriorityPreload,
  isAsyncScript,
  isImportStyles,
  isSyncScript,
  isSyncStyles,
  isPreload,
  isDeferScript,
  isPrefetchPrerender,
  isOriginTrial,
  isMetaCSP,
} from "./lib/rules.js";

// Validation API
export {
  VALID_HEAD_ELEMENTS,
  isValidElement,
  hasValidationWarning,
  getValidationWarnings,
  getCustomValidations,
} from "./lib/validation.js";

// Adapters
export { BrowserAdapter } from "./adapters/browser.js";

export { AdapterInterface, validateAdapter } from "./adapters/adapter.js";

// Test utilities for custom adapters
// These are exported via package.json for node usage only
// to avoid bundling node:test in the browser.
