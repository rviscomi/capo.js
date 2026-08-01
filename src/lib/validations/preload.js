/**
 * @typedef {import('../../adapters/adapter.js').AdapterInterface} AdapterInterface
 * @typedef {import('../validation.js').CustomValidationResult} CustomValidationResult
 */

/**
 * Find an element with matching source using adapter
 * @param {any} parent - Parent element to search within
 * @param {string} sourceUrl - URL to match
 * @param {any} excludeElement - Element to exclude from search
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {any|null} - Matching element or null
 */
export function findElementWithSource(parent, sourceUrl, excludeElement, adapter) {
  const children = adapter.getChildren(parent);

  for (const child of children) {
    if (child === excludeElement) {
      continue;
    }

    const tagName = adapter.getTagName(child);

    if (tagName === "link") {
      const rel = adapter.getAttribute(child, "rel");
      if (rel && /\b(preload|modulepreload)\b/i.test(rel)) {
        continue;
      }

      const childHref = adapter.getAttribute(child, "href");
      if (childHref === sourceUrl) {
        return child;
      }
    }

    if (tagName === "script") {
      const src = adapter.getAttribute(child, "src");
      if (src === sourceUrl) {
        return child;
      }
    }
  }

  return null;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @returns {boolean}
 */
export function isUnnecessaryPreload(element, adapter, parentElement = null) {
  const tagName = adapter.getTagName(element);
  if (tagName !== "link") {
    return false;
  }
  const rel = adapter.getAttribute(element, "rel");
  const relLower = rel?.toLowerCase();
  if (relLower !== "preload" && relLower !== "modulepreload") {
    return false;
  }
  const href = adapter.getAttribute(element, "href");
  if (!href) {
    return false;
  }
  const parent = parentElement || adapter.getParent(element);
  if (!parent) {
    return false;
  }
  const found = findElementWithSource(parent, href, element, adapter);
  return found !== null && found !== undefined;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isInvalidFontPreload(element, adapter) {
  const tagName = adapter.getTagName(element);
  if (tagName !== "link") {
    return false;
  }
  const rel = adapter.getAttribute(element, "rel");
  if (rel?.toLowerCase() !== "preload") {
    return false;
  }
  const as = adapter.getAttribute(element, "as");
  if (as?.toLowerCase() !== "font") {
    return false;
  }
  return !adapter.hasAttribute(element, "crossorigin");
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @returns {CustomValidationResult}
 */
export function validateUnnecessaryPreload(element, adapter, parentElement = null) {
  const href = adapter.getAttribute(element, "href");
  if (!href) {
    return { ruleId: "no-unnecessary-preload", warnings: [] };
  }
  const parent = parentElement || adapter.getParent(element);
  if (!parent) {
    return { ruleId: "no-unnecessary-preload", warnings: [] };
  }
  const preloadedElement = findElementWithSource(parent, href, element, adapter);
  if (!preloadedElement) {
    return { ruleId: "no-unnecessary-preload", warnings: [] };
  }
  return {
    ruleId: "no-unnecessary-preload",
    warnings: [
      `This preload has little to no effect. ${href} is already discoverable by another ${adapter.getTagName(preloadedElement)} element.`,
    ],
  };
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
export function validateInvalidFontPreload(element, adapter) {
  const warnings = ["Font preloads must have the crossorigin attribute set, even for same-origin fonts."];
  return {
    ruleId: "valid-font-preload",
    warnings,
    payload: null,
  };
}
