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
  const httpEquivSelector = META_HTTP_EQUIV_KEYWORDS.map(keyword => {
    return `[http-equiv="${keyword}" i]`;
  }).join(', ');
  
  return adapter.matches(element, `meta:is([charset], ${httpEquivSelector}, [name=viewport]), base`);
}

export function isTitle(element, adapter) {
  return adapter.matches(element, 'title');
}

export function isPreconnect(element, adapter) {
  return adapter.matches(element, 'link[rel=preconnect]');
}

export function isAsyncScript(element, adapter) {
  return adapter.matches(element, 'script[src][async]');
}

export function isImportStyles(element, adapter) {
  const importRe = /@import/;

  if (adapter.matches(element, 'style')) {
    return importRe.test(adapter.getTextContent(element));
  }

  /* TODO: Support external stylesheets.
  if (adapter.matches(element, 'link[rel=stylesheet][href]')) {
    let response = fetch(adapter.getAttribute(element, 'href'));
    response = response.text();
    return importRe.test(response);
  } */

  return false;
}

export function isSyncScript(element, adapter) {
  return adapter.matches(element, 'script:not([src][defer],[src][type=module],[src][async],[type*=json])');
}

export function isSyncStyles(element, adapter) {
  return adapter.matches(element, 'link[rel=stylesheet],style');
}

export function isPreload(element, adapter) {
  return adapter.matches(element, 'link:is([rel=preload], [rel=modulepreload])');
}

export function isDeferScript(element, adapter) {
  return adapter.matches(element, 'script[src][defer], script:not([src][async])[src][type=module]');
}

export function isPrefetchPrerender(element, adapter) {
  return adapter.matches(element, 'link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])');
}

export function isOriginTrial(element, adapter) {
  return adapter.matches(element, 'meta[http-equiv="origin-trial"i]');
}

export function isMetaCSP(element, adapter) {
  return adapter.matches(element, 'meta[http-equiv="Content-Security-Policy" i], meta[http-equiv="Content-Security-Policy-Report-Only" i]');
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
  return headChildren.map(element => {
    return {
      element,
      weight: getWeight(element, adapter)
    };
  });
}
