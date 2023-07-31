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


export function isMeta(element) {
  const httpEquivSelector = META_HTTP_EQUIV_KEYWORDS.map(keyword => {
    return `[http-equiv="${keyword}" i]`;
  }).join(', ');
  
  return element.matches(`meta:is([charset], ${httpEquivSelector}, [name=viewport]), base`);
}

export function isTitle(element) {
  return element.matches('title');
}

export function isPreconnect(element) {
  return element.matches('link[rel=preconnect]');
}

export function isAsyncScript(element) {
  return element.matches('script[src][async]');
}

export function isImportStyles(element) {
  const importRe = /@import/;

  if (element.matches('style')) {
    return importRe.test(element.textContent);
  }

  /* TODO: Support external stylesheets.
  if (element.matches('link[rel=stylesheet][href]')) {
    let response = fetch(element.href);
    response = response.text();
    return importRe.test(response);
  } */

  return false;
}

export function isSyncScript(element) {
  return element.matches('script:not([src][defer],[src][type=module],[src][async],[type*=json])');
}

export function isSyncStyles(element) {
  return element.matches('link[rel=stylesheet],style');
}

export function isPreload(element) {
  return element.matches('link:is([rel=preload], [rel=modulepreload])');
}

export function isDeferScript(element) {
  return element.matches('script[src][defer], script:not([src][async])[src][type=module]');
}

export function isPrefetchPrerender(element) {
  return element.matches('link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])');
}

export function isOriginTrial(element) {
  return element.matches('meta[http-equiv="origin-trial"i]');
}

export function isMetaCSP(element) {
  return element.matches('meta[http-equiv="Content-Security-Policy" i]');
}

export function getWeight(element) {
  for ([id, detector] of Object.entries(ElementDetectors)) {
    if (detector(element)) {
      return ElementWeights[id];
    }
  }

  return ElementWeights.OTHER;
}

export function getHeadWeights(head) {
  const headChildren = Array.from(head.children);
  return headChildren.map(element => {
    return {
      element,
      weight: getWeight(element)
    };
  });
}
