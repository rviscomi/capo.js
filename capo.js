const Priorities = {
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

const PriorityDetectors = {
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

const PRIORITY_COLORS = [
  '#d53e4f',
  '#f46d43',
  '#fdae61',
  '#fee08b',
  '#9e0142',
  '#e6f598',
  '#abdda4',
  '#66c2a5',
  '#3288bd',
  '#5e4fa2'
];

const LOGGING_PREFIX = 'Capo';

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
  return element.matches('script[async]');
}

function isImportStyles(element) {
  // TODO
  return false;
}

function isSyncScript(element) {
  return element.matches('script:not([defer],[async],[type*=json])')
}

function isSyncStyles(element) {
  return element.matches('link[rel=stylesheet],style');
}

function isPreload(element) {
  return element.matches('link[rel=preload]');
}

function isDeferScript(element) {
  return element.matches('script[defer]');
}

function isPrefetchPrerender(element) {
  return element.matches('link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])');
}

function getPriority(element) {
  for ([id, detector] of Object.entries(PriorityDetectors)) {
    if (detector(element)) {
      return Priorities[id];
    }
  }

  return Priorities.OTHER;
}

function getHeadPriorities() {
  const headChildren = Array.from(document.head.children);
  return headChildren.map(element => {
    return [element.cloneNode(true), getPriority(element)];
  });
}

function visualizePriorities() {
  const headPriorities = getHeadPriorities().map(([element, priority]) => {
    const visual = new Array(priority + 1).fill('█').join('');
    return [visual, priority, element];
  });
  console.groupCollapsed(`${LOGGING_PREFIX}: Actual <head> order`);
  headPriorities.forEach(([visual, priority, element]) => {
    console.log(`%c${visual}`, `color: ${PRIORITY_COLORS[10 - priority]}`, priority, element);
  });
  console.log('Actual <head> element', document.head);
  console.groupEnd();

  const sortedPriorities = headPriorities.sort((a, b) => {
    return b[1] - a[1];
  });
  console.groupCollapsed(`${LOGGING_PREFIX}: Priority <head> order`);
  const priorityHead = document.createElement('head');
  sortedPriorities.forEach(([visual, priority, element]) => {
    console.log(`%c${visual}`, `color: ${PRIORITY_COLORS[10 - priority]}`, priority, element);
    priorityHead.appendChild(element);
  });
  console.log('Prioritized <head> element', priorityHead);
  console.groupEnd();
}

visualizePriorities();