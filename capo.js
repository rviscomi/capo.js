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
  '#5e4fa2',
  '#cccccc'
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
    return [element, getPriority(element)];
  });
}

function visualizePriorities(priorities) {
  const visual = priorities.map(_ => '%c█').join('');
  const styles = priorities.map(priority => `color: ${PRIORITY_COLORS[10 - priority]}; margin-left: -1px;`);

  return {visual, styles};
}

function visualizePriority(priority) {
  const visual = `%c${new Array(priority + 1).fill('█').join('')}`;
  const style = `color: ${PRIORITY_COLORS[10 - priority]}`;

  return {visual, style};
}

function logPriorities() {
  const headPriorities = getHeadPriorities();
  const actualViz = visualizePriorities(headPriorities.map(([_, priority]) => priority));
  console.groupCollapsed(`${LOGGING_PREFIX}: Actual <head> order\n${actualViz.visual}`, ...actualViz.styles);
  headPriorities.forEach(([element, priority]) => {
    const viz = visualizePriority(priority);
    console.log(viz.visual, viz.style, priority, element);
  });
  console.log('Actual <head> element', document.head);
  console.groupEnd();

  const sortedPriorities = headPriorities.sort((a, b) => {
    return b[1] - a[1];
  });
  const priorityViz = visualizePriorities(sortedPriorities.map(([_, priority]) => priority));
  console.groupCollapsed(`${LOGGING_PREFIX}: Priority <head> order\n${priorityViz.visual}`, ...priorityViz.styles);
  const priorityHead = document.createElement('head');
  sortedPriorities.forEach(([element, priority]) => {
    const viz = visualizePriority(priority);
    console.log(viz.visual, viz.style, priority, element);
    priorityHead.appendChild(element.cloneNode(true));
  });
  console.log('Prioritized <head> element', priorityHead);
  console.groupEnd();
}

logPriorities();
