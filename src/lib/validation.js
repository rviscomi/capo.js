import { isMetaCSP, isOriginTrial } from "./rules.js";
import { validateCSP } from "./validations/csp.js";
import { validateOriginTrial } from "./validations/origin-trial.js";
import { isDefaultStyle, validateDefaultStyle } from "./validations/default-style.js";
import { isContentType, validateContentType } from "./validations/content-type.js";
import { isHttpEquiv, validateHttpEquiv } from "./validations/http-equiv.js";
import { isMetaViewport, validateMetaViewport } from "./validations/viewport.js";
import {
  isUnnecessaryPreload,
  validateUnnecessaryPreload,
  isInvalidFontPreload,
  validateInvalidFontPreload,
} from "./validations/preload.js";

/**
 * @typedef {import('../adapters/adapter.js').AdapterInterface} AdapterInterface
 *
 * @typedef {Object} ValidationWarningResult
 * @property {string} ruleId
 * @property {string} warning
 * @property {any} [element]
 * @property {any[]} [elements]
 *
 * @typedef {Object} CustomValidationResult
 * @property {string} [ruleId]
 * @property {string[]} [warnings]
 * @property {any} [payload]
 * @property {any} [element]
 */

export const VALID_HEAD_ELEMENTS = new Set([
  "base",
  "link",
  "meta",
  "noscript",
  "script",
  "style",
  "template",
  "title",
]);

export const CONTENT_TYPE_SELECTOR = 'meta[http-equiv="content-type" i], meta[charset]';

export const HTTP_EQUIV_SELECTOR = "meta[http-equiv]";

export const PRELOAD_SELECTOR = 'link:is([rel="preload" i], [rel="modulepreload" i])';

/**
 * Check if element is a valid HTML <head> element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isValidElement(element, adapter) {
  const tagName = adapter.getTagName(element);
  // Text nodes and comment nodes are valid (they don't have tag names)
  if (!tagName || tagName === "") {
    return true;
  }
  return VALID_HEAD_ELEMENTS.has(tagName.toLowerCase());
}

/**
 * Check if element has any invalid child elements
 * @param {any} element - Element to check
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */
function hasInvalidChildren(element, adapter) {
  const children = adapter.getChildren(element);
  return children.some((child) => !isValidElement(child, adapter));
}

/**
 * Check if this is a duplicate title element (2nd+ occurrence)
 * @param {any} element - Element to check
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */
function isDuplicateTitle(element, adapter) {
  if (adapter.getTagName(element) !== "title") {
    return false;
  }
  const parent = adapter.getParent(element);
  if (!parent) {
    return false;
  }
  // Check if this is the first title element
  let foundFirst = false;
  for (const child of adapter.getChildren(parent)) {
    if (adapter.getTagName(child) === "title") {
      if (child === element) {
        // This is the element we're checking - it's a duplicate if we already found a title
        return foundFirst;
      }
      // Found a title element - mark that we've seen one
      foundFirst = true;
    }
  }
  return false;
}

/**
 * Check if this is a duplicate base element
 * @param {any} element - Element to check  
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */
function isDuplicateBase(element, adapter) {
  if (adapter.getTagName(element) !== "base") {
    return false;
  }
  const siblings = adapter.getSiblings(element);
  return siblings.some((sibling) => adapter.getTagName(sibling) === "base");
}

/**
 * Check if an element has any validation warning
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {string|null} [pageOrigin=null]
 * @returns {boolean}
 */
export function hasValidationWarning(element, adapter, pageOrigin = null) {
  // Element itself is not valid.
  if (!isValidElement(element, adapter)) {
    return true;
  }

  // Children are not valid.
  if (hasInvalidChildren(element, adapter)) {
    return true;
  }

  // <title> is not the first of its type.
  if (isDuplicateTitle(element, adapter)) {
    return true;
  }

  // <base> is not the first of its type.
  if (isDuplicateBase(element, adapter)) {
    return true;
  }

  // For other checks, we reuse getCustomValidations logic to avoid computing twice.
  // We only run validations for elements that match specific rules.
  if (
    isOriginTrial(element, adapter) ||
    isMetaCSP(element, adapter) ||
    isDefaultStyle(element, adapter) ||
    isMetaViewport(element, adapter) ||
    isContentType(element, adapter) ||
    isHttpEquiv(element, adapter) ||
    isUnnecessaryPreload(element, adapter) ||
    isInvalidFontPreload(element, adapter)
  ) {
    const validations = getCustomValidations(element, adapter, null, pageOrigin);
    if (validations.warnings && validations.warnings.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Get document-level validation warnings for a <head> element
 * @param {any} head
 * @param {AdapterInterface} adapter
 * @returns {ValidationWarningResult[]}
 */
export function getValidationWarnings(head, adapter) {
  /** @type {ValidationWarningResult[]} */
  const validationWarnings = [];

  // Get all children of head element
  const children = adapter.getChildren(head);

  // Check for title elements
  const titleElements = children.filter((child) => adapter.getTagName(child) === "title");
  const titleElementCount = titleElements.length;
  if (titleElementCount !== 1) {
    validationWarnings.push({
      ruleId: titleElementCount === 0 ? "require-title" : "no-duplicate-title",
      warning: `Expected exactly 1 <title> element, found ${titleElementCount}`,
      elements: titleElements,
    });
  }

  // Check for meta viewport
  const metaViewport = children.filter((child) => {
    if (adapter.getTagName(child) !== "meta") return false;
    const name = adapter.getAttribute(child, "name");
    return name && name.toLowerCase() === "viewport";
  });
  if (metaViewport.length !== 1) {
    validationWarnings.push({
      ruleId: metaViewport.length === 0 ? "require-meta-viewport" : "valid-meta-viewport",
      warning: `Expected exactly 1 <meta name=viewport> element, found ${metaViewport.length}`,
      elements: metaViewport,
    });
  }

  // Check for base elements
  const baseElements = children.filter((child) => adapter.getTagName(child) === "base");
  const baseElementCount = baseElements.length;
  if (baseElementCount > 1) {
    validationWarnings.push({
      ruleId: "no-duplicate-base",
      warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
      elements: baseElements,
    });
  }

  // Check for invalid elements
  children.forEach((element) => {
    if (isValidElement(element, adapter)) {
      const elementChildren = adapter.getChildren(element);
      elementChildren.forEach((child) => {
        if (!isValidElement(child, adapter)) {
          validationWarnings.push({
            ruleId: "no-invalid-head-elements",
            warning: `${adapter.getTagName(child).toUpperCase()} elements are not allowed in the <head>`,
            element: element,
          });
        }
      });
      return;
    }

    validationWarnings.push({
      ruleId: "no-invalid-head-elements",
      warning: `${adapter.getTagName(element)} elements are not allowed in the <head>`,
      element: element,
    });
  });

  return validationWarnings;
}

/**
 * Get custom element-level validations for an element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @param {string|null} [pageOrigin=null]
 * @returns {CustomValidationResult}
 */
export function getCustomValidations(element, adapter, parentElement = null, pageOrigin = null) {
  /** @type {CustomValidationResult[]} */
  const results = [];

  if (isOriginTrial(element, adapter)) {
    results.push(validateOriginTrial(element, adapter, pageOrigin));
  }

  if (isMetaCSP(element, adapter)) {
    results.push(validateCSP(element, adapter));
  }

  if (isDefaultStyle(element, adapter)) {
    results.push(validateDefaultStyle(element, adapter));
  }

  if (isMetaViewport(element, adapter)) {
    results.push(validateMetaViewport(element, adapter));
  }

  if (isContentType(element, adapter)) {
    results.push(validateContentType(element, adapter));
  }

  if (isHttpEquiv(element, adapter)) {
    results.push(validateHttpEquiv(element, adapter));
  }

  if (isUnnecessaryPreload(element, adapter, parentElement)) {
    results.push(validateUnnecessaryPreload(element, adapter, parentElement));
  }

  if (isInvalidFontPreload(element, adapter)) {
    results.push(validateInvalidFontPreload(element, adapter));
  }

  if (results.length === 0) {
    return {};
  }

  if (results.length === 1) {
    return results[0];
  }

  // Merge results
  /** @type {CustomValidationResult} */
  const combined = {
    warnings: [],
    payload: {},
    ruleId: results[0].ruleId,
  };
  results.forEach((result) => {
    if (result.warnings) {
      combined.warnings?.push(...result.warnings);
    }
    if (result.payload) {
      Object.assign(combined.payload, result.payload);
    }
  });
  return combined;
}
