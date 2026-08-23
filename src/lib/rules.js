/**
 * @typedef {import('../adapters/adapter.js').AdapterInterface} AdapterInterface
 */

/** @type {Record<string, number>} */
export const ElementWeights = {
  META: 10,
  TITLE: 9,
  PRECONNECT: 8,
  ASYNC_SCRIPT: 7,
  IMPORT_STYLES: 6,
  SYNC_SCRIPT: 5,
  SYNC_STYLES: 4,
  PRELOAD: 3,
  DEFER_SCRIPT: 2,
  PREFETCH_PRERENDER: 1,
  OTHER: 0,
};

/** @type {string[]} */
export const META_HTTP_EQUIV_KEYWORDS = [
  "accept-ch",
  "content-security-policy",
  "content-type",
  "default-style",
  "delegate-ch",
  "origin-trial",
  "x-dns-prefetch-control",
];

/**
 * Check if element is a critical meta/base element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isMeta(element, adapter) {
  const tagName = adapter.getTagName(element);

  if (tagName === "base") {
    return true;
  }

  if (tagName !== "meta") {
    return false;
  }

  if (adapter.hasAttribute(element, "charset")) {
    return true;
  }

  const name = adapter.getAttribute(element, "name");
  if (name && name.toLowerCase() === "viewport") {
    return true;
  }

  const httpEquiv = adapter.getAttribute(element, "http-equiv");
  if (httpEquiv) {
    const normalizedValue = httpEquiv.toLowerCase();
    return META_HTTP_EQUIV_KEYWORDS.includes(normalizedValue);
  }

  return false;
}

/**
 * Check if element is a title element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isTitle(element, adapter) {
  return adapter.getTagName(element) === "title";
}

/**
 * Check if element is a high-priority preload link
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isHighPriorityPreload(element, adapter) {
  if (adapter.getTagName(element) !== "link") {
    return false;
  }

  const rel = adapter.getAttribute(element, "rel")?.toLowerCase();
  if (rel !== "preload" && rel !== "modulepreload") {
    return false;
  }

  const priority = adapter.getAttribute(element, "fetchpriority")?.toLowerCase();
  return priority === "high";
}

/**
 * Check if element is a preconnect or high-priority preload link
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isPreconnect(element, adapter) {
  if (adapter.getTagName(element) !== "link") {
    return false;
  }

  const rel = adapter.getAttribute(element, "rel");
  return rel?.toLowerCase() === "preconnect" || isHighPriorityPreload(element, adapter);
}

/**
 * Check if element is an async script
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isAsyncScript(element, adapter) {
  return (
    adapter.getTagName(element) === "script" &&
    adapter.hasAttribute(element, "src") &&
    adapter.hasAttribute(element, "async")
  );
}

/**
 * Check if element is a style element containing CSS import rules
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isImportStyles(element, adapter) {
  const importRe = /@import/;

  if (adapter.getTagName(element) === "style") {
    const media = adapter.getAttribute(element, "media");
    if (media && media.toLowerCase().trim() === "print") {
      return false;
    }
    return importRe.test(adapter.getTextContent(element));
  }

  return false;
}

/**
 * Check if element is a synchronous script
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isSyncScript(element, adapter) {
  if (adapter.getTagName(element) !== "script") {
    return false;
  }

  if (adapter.hasAttribute(element, "src") && adapter.hasAttribute(element, "defer")) {
    return false;
  }

  if (adapter.hasAttribute(element, "src")) {
    const type = adapter.getAttribute(element, "type");
    if (type && type.toLowerCase() === "module") {
      return false;
    }
  }

  if (adapter.hasAttribute(element, "src") && adapter.hasAttribute(element, "async")) {
    return false;
  }

  const type = adapter.getAttribute(element, "type");
  if (type) {
    const normalizedType = type.toLowerCase().trim();
    if (normalizedType.includes("json") || normalizedType === "speculationrules") {
      return false;
    }
  }

  return true;
}

/**
 * Check if element is a synchronous stylesheet or style block
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isSyncStyles(element, adapter) {
  const tagName = adapter.getTagName(element);

  if (tagName === "style") {
    const media = adapter.getAttribute(element, "media");
    if (media && media.toLowerCase().trim() === "print") {
      return false;
    }
    return true;
  }

  if (tagName === "link") {
    const rel = adapter.getAttribute(element, "rel");
    if (rel?.toLowerCase() === "stylesheet") {
      const media = adapter.getAttribute(element, "media");
      if (media && media.toLowerCase().trim() === "print") {
        return false;
      }
      return true;
    }
  }

  return false;
}

/**
 * Check if element is a preload link
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isPreload(element, adapter) {
  if (adapter.getTagName(element) !== "link") {
    return false;
  }

  const rel = adapter.getAttribute(element, "rel");
  if (!rel) {
    return false;
  }

  const relLower = rel.toLowerCase();
  return relLower === "preload" || relLower === "modulepreload";
}

/**
 * Check if element is a deferred script
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isDeferScript(element, adapter) {
  if (adapter.getTagName(element) !== "script") {
    return false;
  }

  if (!adapter.hasAttribute(element, "src")) {
    return false;
  }

  if (adapter.hasAttribute(element, "defer")) {
    return true;
  }

  const type = adapter.getAttribute(element, "type");
  if (type && type.toLowerCase() === "module") {
    return !adapter.hasAttribute(element, "async");
  }

  return false;
}

/**
 * Check if element is prefetch/dns-prefetch/prerender link or speculationrules script
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isPrefetchPrerender(element, adapter) {
  const tagName = adapter.getTagName(element);

  if (tagName === "script") {
    const type = adapter.getAttribute(element, "type");
    return type?.toLowerCase().trim() === "speculationrules";
  }

  if (tagName !== "link") {
    return false;
  }

  const rel = adapter.getAttribute(element, "rel");
  if (!rel) {
    return false;
  }

  const relLower = rel.toLowerCase();
  return relLower === "prefetch" || relLower === "dns-prefetch" || relLower === "prerender";
}

/**
 * Check if element is an origin trial meta element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isOriginTrial(element, adapter) {
  if (adapter.getTagName(element) !== "meta") {
    return false;
  }

  const httpEquiv = adapter.getAttribute(element, "http-equiv");
  return httpEquiv?.toLowerCase() === "origin-trial";
}

/**
 * Check if element is a Content Security Policy meta element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isMetaCSP(element, adapter) {
  if (adapter.getTagName(element) !== "meta") {
    return false;
  }

  const httpEquiv = adapter.getAttribute(element, "http-equiv");
  if (!httpEquiv) {
    return false;
  }

  const httpEquivLower = httpEquiv.toLowerCase();
  return httpEquivLower === "content-security-policy" || httpEquivLower === "content-security-policy-report-only";
}

/** @type {Record<string, (element: any, adapter: AdapterInterface) => boolean>} */
export const ElementDetectors = {
  META: isMeta,
  TITLE: isTitle,
  PRECONNECT: isPreconnect,
  ASYNC_SCRIPT: isAsyncScript,
  IMPORT_STYLES: isImportStyles,
  SYNC_SCRIPT: isSyncScript,
  SYNC_STYLES: isSyncStyles,
  PRELOAD: isPreload,
  DEFER_SCRIPT: isDeferScript,
  PREFETCH_PRERENDER: isPrefetchPrerender,
};

/**
 * Compute weight for an element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {number}
 */
export function getWeight(element, adapter) {
  for (let [id, detector] of Object.entries(ElementDetectors)) {
    if (detector(element, adapter)) {
      return ElementWeights[id];
    }
  }

  return ElementWeights.OTHER;
}

/**
 * Compute weights for all children of head element
 * @param {any} head
 * @param {AdapterInterface} adapter
 * @returns {Array<{ element: any, weight: number }>}
 */
export function getHeadWeights(head, adapter) {
  const headChildren = adapter.getChildren(head);
  return headChildren
    .filter((element) => {
      const tagName = adapter.getTagName(element);
      return tagName && tagName !== "";
    })
    .map((element) => {
      return {
        element,
        weight: getWeight(element, adapter),
      };
    });
}
