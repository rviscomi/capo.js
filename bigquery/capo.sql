CREATE OR REPLACE FUNCTION httparchive.fn.CAPO(html STRING)
RETURNS ARRAY<STRUCT<vizWeight STRING, weight INT64, element STRING>>
LANGUAGE js
OPTIONS (library = 'gs://httparchive/lib/cheerio.js') AS '''
try {
const $ = cheerio.load(html);

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
  return $(element).is('meta:is([charset], [http-equiv], [name=viewport])');
}

function isTitle(element) {
  return $(element).is('title');
}

function isPreconnect(element) {
  return $(element).is('link[rel=preconnect]');
}

function isAsyncScript(element) {
  return $(element).is('script[src][async]');
}

function isImportStyles(element) {
  const importRe = /@import/;

  if ($(element).is('style')) {
    return importRe.test($(element).text());
  }

  // TODO: Support external stylesheets.
  return false;
}

function isSyncScript(element) {
  return $(element).is('script:not([src][defer],[src][async],[type*=json])')
}

function isSyncStyles(element) {
  return $(element).is('link[rel=stylesheet],style');
}

function isPreload(element) {
  return $(element).is('link[rel=preload]');
}

function isDeferScript(element) {
  return $(element).is('script[src][defer]');
}

function isPrefetchPrerender(element) {
  return $(element).is('link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])');
}

function stringifyElement(element) {
  return $(element).toString();
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

return Array.from($('head > *')).map(element => {
  const weight = getWeight(element);
  return {
    vizWeight: visualizeWeight(weight),
    weight,
    element: stringifyElement(element)
  };
});
} catch (e) {
  return null;
}
''';
