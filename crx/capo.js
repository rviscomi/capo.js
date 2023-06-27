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

function getCapoHeadElement({weight, selector, innerHTML, isValid}) {
  const span = document.createElement('span');
  span.classList.add('capo-head-element');
  span.classList.toggle('invalid', !isValid);
  span.dataset.weight = weight;
  span.dataset.selector = selector;
  span.dataset.innerHTML = innerHTML;
  span.title = `[${weight + 1}] ${selector}`;
  return span;
}

async function handleCapoClick(event) {
  const {weight, selector, innerHTML} = event.target.dataset;
  const isValid = !event.target.classList.contains('invalid');
  console.log('capo', weight, selector);
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    args: [{
      fn: 'logElementFromSelector',
      args: [weight, selector, innerHTML, isValid]
    }],
    func: capo
  });
}

async function capo({fn, args}={}) {
  const FN_EXPORTS = {
    logElementFromSelector
  };

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

  let head;
  
  let isStaticHead = false;
  
  
  async function getStaticHTML() {
    const url = document.location.href;
    const response = await fetch(url);
    return await response.text();
  }
  
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

  function isOriginTrial(element) {
    return element.matches('meta[http-equiv="origin-trial"i]');
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
      return [getLoggableElement(element), getWeight(element), isValidElement(element)];
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

  // Adapted from https://glitch.com/~ot-decode.
  function decodeToken(token) {
    const buffer = new Uint8Array([...atob(token)].map(a => a.charCodeAt(0)));
    const view = new DataView(buffer.buffer)
    const length = view.getUint32(65, false)
    const payload = JSON.parse((new TextDecoder()).decode(buffer.slice(69, 69 + length)));
    payload.expiry = new Date(payload.expiry * 1000);
    return payload;
  }

  function isSameOrigin(a, b) {
    return new URL(a).origin === new URL(b).origin;
  }

  function logElement({viz, weight, element, isValid, omitPrefix = false}) {
    if (!omitPrefix) {
      viz.visual = `${LOGGING_PREFIX}${viz.visual}`;
    }

    let loggingLevel = 'log';
    const args = [viz.visual, viz.style, weight + 1, element];

    if (isStaticHead && !isValid) {
      loggingLevel = 'warn';
      args.push('❌ invalid element');
    }

    if (isOriginTrial(element)) {
      const token = element.getAttribute('content');
      try {
        const payload = decodeToken(token);
        args.push(payload);

        if (payload.expiry < new Date()) {
          loggingLevel = 'warn';
          args.push('❌ expired');
        }
        if (!isSameOrigin(payload.origin, document.location.href)) {
          loggingLevel = 'warn';
          args.push('❌ invalid origin');
        }
      } catch {
        loggingLevel = 'warn';
        args.push('❌ invalid token');
      }
    }

    console[loggingLevel](...args);
  }

  function logWeights() {
    const headWeights = getHeadWeights();
    const actualViz = visualizeWeights(headWeights.map(([_, weight]) => weight));
    
    console.groupCollapsed(`${LOGGING_PREFIX}Actual %c<head>%c order\n${actualViz.visual}`, 'font-family: monospace', 'font-family: inherit',  ...actualViz.styles);
    headWeights.forEach(([element, weight, isValid]) => {
      const viz = visualizeWeight(weight);
      logElement({viz, weight, element, isValid, omitPrefix: true});
    });
    console.log('Actual %c<head>%c element', 'font-family: monospace', 'font-family: inherit', head);
    console.groupEnd();
  
    const sortedWeights = headWeights.sort((a, b) => {
      return b[1] - a[1];
    });
    const sortedViz = visualizeWeights(sortedWeights.map(([_, weight]) => weight));
    
    console.groupCollapsed(`${LOGGING_PREFIX}Sorted %c<head>%c order\n${sortedViz.visual}`, 'font-family: monospace', 'font-family: inherit', ...sortedViz.styles);
    const sortedHead = document.createElement('head');
    sortedWeights.forEach(([element, weight, isValid]) => {
      const viz = visualizeWeight(weight);
      logElement({viz, weight, element, isValid, omitPrefix: true});
      sortedHead.appendChild(element.cloneNode(true));
    });
    console.log('Sorted %c<head>%c element', 'font-family: monospace', 'font-family: inherit', sortedHead);
    console.groupEnd();
  }

  function stringifyElement(element) {
    return element.getAttributeNames().reduce((id, attr) => id += `[${attr}=${JSON.stringify(element.getAttribute(attr))}]`, element.nodeName);
  }

  // Note: AI-generated function.
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
    const candidateWrapper = document.createElement('div');
    const elementWrapper = document.createElement('div');
    elementWrapper.innerHTML = element.innerHTML;
    const candidate = candidates.find(c => {
      candidateWrapper.innerHTML = c.innerHTML;
      return candidateWrapper.innerHTML == elementWrapper.innerHTML;
    });
    if (candidate) {
      return candidate;
    }
    
    return element;
  }

  function logElementFromSelector(weight, selector, innerHTML, isValid) {
    weight = +weight;
    const viz = visualizeWeight(weight);
    let element = createElementFromSelector(selector);
    element.innerHTML = innerHTML;
    element = getLoggableElement(element);

    logElement({viz, weight, element, isValid});
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
  
    // <title> is not the first of its type.
    if (element.matches('title:is(:nth-of-type(n+2))')) {
      return false;
    }
  
    // <base> is not the first of its type.
    if (element.matches('base:is(:nth-of-type(n+2))')) {
      return false;
    }
  
    // CSP meta tag comes after a script.
    if (element.matches('script ~ meta[http-equiv="Content-Security-Policy" i]')) {
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

  if (fn in FN_EXPORTS) {
    return FN_EXPORTS[fn](...args);
  }

  validateHead();
  logWeights();

  return JSON.stringify({
    actual: getHeadWeights().map(([element, weight, isValid]) => ({
      weight,
      selector: stringifyElement(element),
      innerHTML: element.innerHTML,
      isValid
    })),
  }, null, 2);
}
