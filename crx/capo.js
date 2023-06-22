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

  result.sorted = result.actual.sort((a, b) => {
    return b.weight - a.weight;
  });
  frag = document.createDocumentFragment();
  for (let r of result.sorted) {
    frag.appendChild(getCapoHeadElement(r));
  }
  sorted.appendChild(frag);
  document.body.addEventListener('click', handleCapoClick);
}

function getCapoHeadElement({weight, selector, isValid}) {
  const span = document.createElement('span');
  span.classList.add('capo-head-element');
  span.classList.toggle('invalid', !isValid);
  span.dataset.weight = weight;
  span.dataset.selector = selector;
  span.title = `[${weight + 1}] ${selector}`;
  return span;
}

async function handleCapoClick(event) {
  const {weight, selector} = event.target.dataset;
  const invalid = event.target.classList.contains('invalid');
  console.log('capo', weight, selector);
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const [{result}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    args: [weight, selector],
    // TODO: Call capo again, but with args that tell it which inner function to run, reusing its code.
    func: (weight, selector) => {
      /* Note: AI-generated function. */
      function createElementFromSelector(selector) {
        // Extract the tag name from the selector
        const tagName = selector.match(/^[A-Za-z]+/)[0];

        if (!tagName) {
          return;
        }
      
        // Create the new element
        const element = document.createElement(tagName);
      
        // Extract the attribute key-value pairs from the selector
        const attributes = selector.match(/\[([A-Za-z-]+)="([^"]+)"\]/g) || [];
      
        // Set the attributes on the new element
        attributes.forEach(attribute => {
          const [key, value] = attribute
            .replace('[', '')
            .replace(']', '')
            .split('=');
          element.setAttribute(key, value.slice(1, -1));
        });
      
        return element;
      }
      
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
      // Try to find the element in the live document.
      let element = document.head.querySelector(selector);
      // Otherwise recreate it.
      if (!element) {
        element = createElementFromSelector(selector);
      }
      // If all else fails, just use the selector.
      if (!element) {
        element = selector;
      }
      console.log(`Capo: ${visual}`, style, weight + 1, element)
    }
  });
}

async function capo() {
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

  const VALID_HEAD_ELEMENTS = new Set([
    'base',
    'link',
    'meta',
    'noscript',
    'script',
    'style',
    'template',
    'title'
  ]);
  
  const LOGGING_PREFIX = 'Capo: ';


  async function getStaticHTML() {
    const url = document.location.href;
    let response = await fetch(url);
    let responseText = await response.text();
    return responseText;
  }
  
  let head;
  let isStaticHead = false;
  async function getStaticOrDynamicHead() {
    if (head) {
      return head;
    }
  
    try {
      let html = await getStaticHTML();
      html = html.replace(/(<\/?)(head)/ig, '$1static-head');
      const staticDoc = document.implementation.createHTMLDocument('New Document');
      staticDoc.documentElement.innerHTML = html;
      head = staticDoc.querySelector('static-head');
      
      if (head) {
        isStaticHead = true;
      } else {
        head = document.head;
      }
    } catch {
      head = document.head;
    }
    return head;
  }
  
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
    return element.matches('script:not([src][defer],[src][type=module],[src][async],[type*=json])')
  }
  
  function isSyncStyles(element) {
    return element.matches('link[rel=stylesheet],style');
  }
  
  function isPreload(element) {
    return element.matches('link:is([rel=preload], [rel=modulepreload])');
  }
  
  function isDeferScript(element) {
    return element.matches('script[src][defer], script:not([src][async])[src][type=module]');
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
    const headChildren = Array.from(head.children);
    return headChildren.map(element => {
      return [getLoggableElement(element), getWeight(element)];
    });
  }
  
  function visualizeWeights(weights) {
    const visual = weights.map(_ => '%c ').join('');
    const styles = weights.map(weight => {
      const color = WEIGHT_COLORS[10 - weight];
      return `background-color: ${color}; padding: 5px; margin: 0 -1px;`
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
      const isValid = isValidElement(element);
      if (isStaticHead && !isValid) {
        console.warn(viz.visual, viz.style, weight + 1, element, '❌ invalid element');
      } else {
        console.log(viz.visual, viz.style, weight + 1, element);
      }
    });
    console.log('Actual %c<head>%c element', 'font-family: monospace', 'font-family: inherit', head);
    console.groupEnd();
  
    const sortedWeights = headWeights.sort((a, b) => {
      return b[1] - a[1];
    });
    const sortedViz = visualizeWeights(sortedWeights.map(([_, weight]) => weight));
    
    console.groupCollapsed(`${LOGGING_PREFIX}Sorted %c<head>%c order\n${sortedViz.visual}`, 'font-family: monospace', 'font-family: inherit', ...sortedViz.styles);
    const sortedHead = document.createElement('head');
    sortedWeights.forEach(([element, weight]) => {
      const viz = visualizeWeight(weight);
      const isValid = isValidElement(element);
      if (isStaticHead && !isValid) {
        console.warn(viz.visual, viz.style, weight + 1, element, '❌ invalid element');
      } else {
        console.log(viz.visual, viz.style, weight + 1, element);
      }
      sortedHead.appendChild(element.cloneNode(true));
    });
    console.log('Sorted %c<head>%c element', 'font-family: monospace', 'font-family: inherit', sortedHead);
    console.groupEnd();
  }

  function stringifyElement(element) {
    return element.getAttributeNames().reduce((id, attr) => id += `[${attr}=${JSON.stringify(element.getAttribute(attr))}]`, element.nodeName);
  }
  
  function getLoggableElement(element) {
    if (!isStaticHead) {
      return element;
    }
  
    const selector = stringifyElement(element);
    const candidates = Array.from(document.head.querySelectorAll(selector));
    if (candidates.length == 0) {
      return element;
    }
    if (candidates.length == 1) {
      return candidates[0];
    }
  
    // The way the static elements are parsed makes their innerHTML different.
    // Recreate the element in DOM and compare its innerHTML with those of the candidates.
    // This ensures a consistent parsing and positive string matches.
    const elementWrapper = document.createElement('div');
    let candidateWrapper = document.createElement('div');
    const candidate = candidates.find(c => {
      candidateWrapper.innerHTML = c.innerHTML;
      return candidateWrapper.innerHTML == elementWrapper.innerHTML;
    });
    if (candidate) {
      return candidate;
    }
    
    return element;
  }

  function isValidElement(element) {
    // Element itself is not valid.
    if (!VALID_HEAD_ELEMENTS.has(element.tagName.toLowerCase())) {
      return false;
    }
    
    // Children are not valid.
    if (element.matches(`:has(:not(${Array.from(VALID_HEAD_ELEMENTS).join(', ')}))`)) {
      return false;
    }

    return true;
  }

  function validateHead() {
    const titleElements = Array.from(head.querySelectorAll('title')).map(getLoggableElement);
    const titleElementCount = titleElements.length;
    if (titleElementCount != 1) {
      console.warn(`${LOGGING_PREFIX}Expected exactly 1 <title> element, found ${titleElementCount}`, titleElements);
    }
  
    const baseElements = Array.from(head.querySelectorAll('base')).map(getLoggableElement);
    const baseElementCount = baseElements.length;
    if (baseElementCount > 1) {
      console.warn(`${LOGGING_PREFIX}Expected at most 1 <base> element, found ${baseElementCount}`, baseElements);
    }
  
    const postScriptCSP = head.querySelector('script ~ meta[http-equiv="Content-Security-Policy" i]');
    if (postScriptCSP) {
      console.warn(`${LOGGING_PREFIX}CSP meta tag must be placed before any <script> elements to avoid disabling the preload scanner.`, getLoggableElement(postScriptCSP));
    }
  
    if (!isStaticHead) {
      return;
    }
    head.querySelectorAll('*').forEach(element => {
      if (VALID_HEAD_ELEMENTS.has(element.tagName.toLowerCase())) {
        return;
      }
      let root = element;
      while (root.parentElement != head) {
        root = root.parentElement;
      }
      console.warn(`${LOGGING_PREFIX}${element.tagName} elements are not allowed in the <head>`, getLoggableElement(root));
    });
  }

  await getStaticOrDynamicHead();
  validateHead();
  logWeights();

  return JSON.stringify({
    actual: getHeadWeights().map(([element, weight]) => ({
      weight,
      selector: stringifyElement(element),
      isValid: isValidElement(element)
    })),
  }, null, 2);
}
