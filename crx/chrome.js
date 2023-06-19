(async () => {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const [{result}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: capo
  });
  print(JSON.parse(result));
})();

function print(result) {
  let frag = document.createDocumentFragment();
  for (let r of result.actual) {
    frag.appendChild(getCapoHeadElement(r));
  }
  actual.appendChild(frag);

  result.sorted = result.actual.sort(([a], [b]) => {
    return b - a;
  });
  frag = document.createDocumentFragment();
  for (let r of result.sorted) {
    frag.appendChild(getCapoHeadElement(r));
  }
  sorted.appendChild(frag);
  document.body.addEventListener('click', handleCapoClick);
}

function getCapoHeadElement([weight, element]) {
  const span = document.createElement('span');
  span.classList.add('capo-head-element');
  span.dataset.weight = weight;
  span.dataset.element = element;
  span.title = `[${weight + 1}] ${element}`;
  return span;
}

async function handleCapoClick(event) {
  const {weight, element} = event.target.dataset;
  console.log('capo', weight, element);
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const [{result}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    args: [weight, element],
    func: (weight, element) => {
      weight = +weight;
      const WEIGHT_COLORS = [
        '#9e0142',
        '#d53e4f',
        '#f46d43',
        '#fdae61',
        '#fee08b',
        '#e6f598',
        '#abdda4',
        '#66c2a5',
        '#3288bd',
        '#5e4fa2',
        '#cccccc'
      ];
      const visual = `%c${new Array(weight + 1).fill('█').join('')}`;
      const style = `color: ${WEIGHT_COLORS[10 - weight]}`;
      console.log(visual, style, weight + 1, document.querySelector(element) || element)
    }
  });
}

function capo() {
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
  
  const WEIGHT_COLORS = [
    '#9e0142',
    '#d53e4f',
    '#f46d43',
    '#fdae61',
    '#fee08b',
    '#e6f598',
    '#abdda4',
    '#66c2a5',
    '#3288bd',
    '#5e4fa2',
    '#cccccc'
  ];
  
  const LOGGING_PREFIX = 'Capo: ';
  
  function isMeta(element) {
    return element.matches('meta:is([charset], [http-equiv], [name=viewport], base)');
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
  
    /* TODO: Support external stylesheets.
    if (element.matches('link[rel=stylesheet][href]')) {
      let response = fetch(element.href);
      response = response.text();
      return importRe.test(response);
    } */
  
    return false;
  }
  
  function isSyncScript(element) {
    return element.matches('script:not([src][defer],[src][async],[type*=json])')
  }
  
  function isSyncStyles(element) {
    return element.matches('link[rel=stylesheet],style');
  }
  
  function isPreload(element) {
    return element.matches('link:is([rel=preload], [rel=modulepreload])');
  }
  
  function isDeferScript(element) {
    return element.matches('script[src][defer]');
  }
  
  function isPrefetchPrerender(element) {
    return element.matches('link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])');
  }
  
  function getWeight(element) {
    for ([id, detector] of Object.entries(ElementDetectors)) {
      if (detector(element)) {
        return ElementWeights[id];
      }
    }
  
    return ElementWeights.OTHER;
  }
  
  function getHeadWeights() {
    const headChildren = Array.from(document.head.children);
    return headChildren.map(element => {
      return [element, getWeight(element)];
    });
  }
  
  function visualizeWeights(weights) {
    const visual = weights.map(_ => '%c ').join('');
    const styles = weights.map(weight => {
      const color = WEIGHT_COLORS[10 - weight];
      return `background-color: ${color}; padding: 5px; margin: -1px;`
    });
  
    return {visual, styles};
  }
  
  function visualizeWeight(weight) {
    const visual = `%c${new Array(weight + 1).fill('█').join('')}`;
    const style = `color: ${WEIGHT_COLORS[10 - weight]}`;
  
    return {visual, style};
  }
  
  function logWeights() {
    const headWeights = getHeadWeights();
    const actualViz = visualizeWeights(headWeights.map(([_, weight]) => weight));
    
    console.groupCollapsed(`${LOGGING_PREFIX}Actual %c<head>%c order\n${actualViz.visual}`, 'font-family: monospace', 'font-family: inherit',  ...actualViz.styles);
    headWeights.forEach(([element, weight]) => {
      const viz = visualizeWeight(weight);
      console.log(viz.visual, viz.style, weight + 1, element);
    });
    console.log('Actual %c<head>%c element', 'font-family: monospace', 'font-family: inherit', document.head);
    console.groupEnd();
  
    const sortedWeights = headWeights.sort((a, b) => {
      return b[1] - a[1];
    });
    const sortedViz = visualizeWeights(sortedWeights.map(([_, weight]) => weight));
    
    console.groupCollapsed(`${LOGGING_PREFIX}Sorted %c<head>%c order\n${sortedViz.visual}`, 'font-family: monospace', 'font-family: inherit', ...sortedViz.styles);
    const sortedHead = document.createElement('head');
    sortedWeights.forEach(([element, weight]) => {
      const viz = visualizeWeight(weight);
      console.log(viz.visual, viz.style, weight + 1, element);
      sortedHead.appendChild(element.cloneNode(true));
    });
    console.log('Sorted %c<head>%c element', 'font-family: monospace', 'font-family: inherit', sortedHead);
    console.groupEnd();
  }

  function stringifyElement(element) {
    return element.getAttributeNames().reduce((id, attr) => id += `[${attr}="${element.getAttribute(attr)}"]`, element.nodeName);
  }

  logWeights();

  return JSON.stringify({
    actual: getHeadWeights().map(([element, weight]) => [weight, stringifyElement(element)])
  }, null, 2);
}
