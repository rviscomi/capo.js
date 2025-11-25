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
  OTHER: 0
};

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
  PREFETCH_PRERENDER: isPrefetchPrerender
}

export const META_HTTP_EQUIV_KEYWORDS = [
  'accept-ch',
  'content-security-policy',
  'content-type',
  'default-style',
  'delegate-ch',
  'origin-trial',
  'x-dns-prefetch-control'
];


export function isMeta(element, adapter) {
  const tagName = adapter.getTagName(element);
  
  // Check if it's a base element
  if (tagName === 'base') {
    return true;
  }
  
  // Check if it's a meta element with charset, viewport, or critical http-equiv
  if (tagName !== 'meta') {
    return false;
  }
  
  // Check for charset attribute
  if (adapter.hasAttribute(element, 'charset')) {
    return true;
  }
  
  // Check for viewport meta
  const name = adapter.getAttribute(element, 'name');
  if (name && name.toLowerCase() === 'viewport') {
    return true;
  }
  
  // Check for critical http-equiv values
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  if (httpEquiv) {
    const normalizedValue = httpEquiv.toLowerCase();
    return META_HTTP_EQUIV_KEYWORDS.includes(normalizedValue);
  }
  
  return false;
}

export function isTitle(element, adapter) {
  return adapter.getTagName(element) === 'title';
}

export function isPreconnect(element, adapter) {
  if (adapter.getTagName(element) !== 'link') {
    return false;
  }
  
  const rel = adapter.getAttribute(element, 'rel');
  return rel?.toLowerCase() === 'preconnect';
}

export function isAsyncScript(element, adapter) {
  return adapter.getTagName(element) === 'script' &&
    adapter.hasAttribute(element, 'src') && 
         adapter.hasAttribute(element, 'async');
}

export function isImportStyles(element, adapter) {
  const importRe = /@import/;

  if (adapter.getTagName(element) === 'style') {
    return importRe.test(adapter.getTextContent(element));
  }

  /* TODO: Support external stylesheets.
  if (adapter.getTagName(element) === 'link' && 
      adapter.getAttribute(element, 'rel')?.toLowerCase() === 'stylesheet' &&
      adapter.hasAttribute(element, 'href')) {
    let response = fetch(adapter.getAttribute(element, 'href'));
    response = response.text();
    return importRe.test(response);
  } */

  return false;
}

export function isSyncScript(element, adapter) {
  // Must be a script element
  if (adapter.getTagName(element) !== 'script') {
    return false;
  }
  
  // Original selector: script:not([src][defer],[src][type=module],[src][async],[type*=json])
  // This excludes scripts that match ANY of these compound conditions:
  
  // Exclude: scripts with src AND defer
  if (adapter.hasAttribute(element, 'src') && adapter.hasAttribute(element, 'defer')) {
    return false;
  }
  
  // Exclude: scripts with src AND type=module
  if (adapter.hasAttribute(element, 'src')) {
    const type = adapter.getAttribute(element, 'type');
    if (type && type.toLowerCase() === 'module') {
      return false;
    }
  }
  
  // Exclude: scripts with src AND async
  if (adapter.hasAttribute(element, 'src') && adapter.hasAttribute(element, 'async')) {
    return false;
  }
  
  // Exclude: scripts with type containing "json"
  const type = adapter.getAttribute(element, 'type');
  if (type && type.toLowerCase().includes('json')) {
    return false;
  }
  
  return true;
}

export function isSyncStyles(element, adapter) {
  const tagName = adapter.getTagName(element);
  
  // Check if it's a style element
  if (tagName === 'style') {
    return true;
  }
  
  // Check if it's a stylesheet link
  if (tagName === 'link') {
    const rel = adapter.getAttribute(element, 'rel');
    return rel?.toLowerCase() === 'stylesheet';
  }
  
  return false;
}

export function isPreload(element, adapter) {
  if (adapter.getTagName(element) !== 'link') {
    return false;
  }
  
  const rel = adapter.getAttribute(element, 'rel');
  if (!rel) {
    return false;
  }
  
  const relLower = rel.toLowerCase();
  return relLower === 'preload' || relLower === 'modulepreload';
}

export function isDeferScript(element, adapter) {
  if (adapter.getTagName(element) !== 'script') {
    return false;
  }
  
  if (!adapter.hasAttribute(element, 'src')) {
    return false;
  }
  
  // Script with defer attribute
  if (adapter.hasAttribute(element, 'defer')) {
    return true;
  }
  
  // Module scripts are defer by default, unless they have async
  const type = adapter.getAttribute(element, 'type');
  if (type && type.toLowerCase() === 'module') {
    return !adapter.hasAttribute(element, 'async');
  }
  
  return false;
}

export function isPrefetchPrerender(element, adapter) {
  if (adapter.getTagName(element) !== 'link') {
    return false;
  }
  
  const rel = adapter.getAttribute(element, 'rel');
  if (!rel) {
    return false;
  }
  
  const relLower = rel.toLowerCase();
  return relLower === 'prefetch' || 
         relLower === 'dns-prefetch' || 
         relLower === 'prerender';
}

export function isOriginTrial(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') {
    return false;
  }
  
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  return httpEquiv?.toLowerCase() === 'origin-trial';
}

export function isMetaCSP(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') {
    return false;
  }
  
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  if (!httpEquiv) {
    return false;
  }
  
  const httpEquivLower = httpEquiv.toLowerCase();
  return httpEquivLower === 'content-security-policy' || 
         httpEquivLower === 'content-security-policy-report-only';
}

export function getWeight(element, adapter) {
  for (let [id, detector] of Object.entries(ElementDetectors)) {
    if (detector(element, adapter)) {
      return ElementWeights[id];
    }
  }

  return ElementWeights.OTHER;
}

export function getHeadWeights(head, adapter) {
  const headChildren = adapter.getChildren(head);
  return headChildren
    .filter(element => {
      // Filter out text nodes and comments - only include actual elements
      const tagName = adapter.getTagName(element);
      return tagName && tagName !== '';
    })
    .map(element => {
      return {
        element,
        weight: getWeight(element, adapter)
      };
    });
}
