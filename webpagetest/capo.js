[capo]

const WPT_BODIES = $WPT_BODIES;
const RAW_HTML = WPT_BODIES[0].response_body;
const RAW_DOCUMENT = document.implementation.createHTMLDocument('New Document');
RAW_DOCUMENT.documentElement.innerHTML = RAW_HTML;

const ElementWeights = {
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

const ElementDetectors = {
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


function isMeta(element) {
  return element.matches('meta:is([charset], [http-equiv], [name=viewport])');
}

function isTitle(element) {
  return element.matches('title');
}

function isPreconnect(element) {
  return element.matches('link[rel=preconnect]');
}

function isAsyncScript(element) {
  return element.matches('script[src][async]');
}

function isImportStyles(element) {
  const importRe = /@import/;

  if (element.matches('style')) {
    return importRe.test(element.textContent);
  }

  if (element.matches('link[rel=stylesheet][href]')) {
    const base = new URL(location.href).origin;
    const href = element.getAttribute('href');
    const stylesheet = new URL(href, base).href;

    const entry = WPT_BODIES.find(i => i.url == stylesheet);
    return importRe.test(entry?.response_body);
  }

  return false;
}

function isSyncScript(element) {
  return element.matches('script:not([src][defer],[src][type=module],[src][async],[type*=json])');
}

function isSyncStyles(element) {
  return element.matches('link[rel=stylesheet],style');
}

function isPreload(element) {
  return element.matches('link[rel=preload]');
}

function isDeferScript(element) {
  return element.matches('script[src][defer], script:not([src][async])[src][type=module]');
}

function isPrefetchPrerender(element) {
  return element.matches('link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])');
}

function stringifyElement(element) {
  return element.getAttributeNames().reduce((id, attr) => id += `[${attr}="${element.getAttribute(attr)}"]`, element.nodeName);
}

function getWeight(element) {
  for ([id, detector] of Object.entries(ElementDetectors)) {
    if (detector(element)) {
      return ElementWeights[id];
    }
  }

  return ElementWeights.OTHER;
}

function visualizeWeight(weight) {
  return new Array(weight + 1).fill('█').join('');
}

function getHeadWeights() {
  const headChildren = Array.from(RAW_DOCUMENT.head.children);
  return headChildren.map(element => {
    const weight = getWeight(element);
    return [visualizeWeight(weight), weight, stringifyElement(element)];
  });
}

function getSortedHead() {
  const headChildren = Array.from(RAW_DOCUMENT.head.children);
  const headWeights = headChildren.map(element => {
    const weight = getWeight(element);
    return [weight, element];
  });
  const sortedWeights = headWeights.sort((a, b) => {
    return b[1] - a[1];
  });
  const sortedHead = document.createElement('head');
  sortedWeights.forEach(([weight, element]) => {
    sortedHead.appendChild(element.cloneNode(true));
  });
  return sortedHead.outerHTML;
}

return JSON.stringify({
  actual: getHeadWeights(),
  sorted: getSortedHead()
}, null, 2);
