import { isMetaCSP, isOriginTrial } from "./rules";

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

export function isValidElement(element) {
  return VALID_HEAD_ELEMENTS.has(element.tagName.toLowerCase());
}

export function hasValidationWarning(element) {
  // Element itself is not valid.
  if (!isValidElement(element)) {
    return true;
  }

  // Children are not valid.
  if (element.matches(`:has(:not(${Array.from(VALID_HEAD_ELEMENTS).join(', ')}))`)) {
    return true;
  }

  // <title> is not the first of its type.
  if (element.matches('title:is(:nth-of-type(n+2))')) {
    return true;
  }

  // <base> is not the first of its type.
  if (element.matches('base:is(:nth-of-type(n+2))')) {
    return true;
  }
  
  // CSP meta tag anywhere.
  if (isMetaCSP(element)) {
    return true;
  }

  return false;
}

export function getValidationWarnings(head) {
  const validationWarnings = [];

  const titleElements = Array.from(head.querySelectorAll('title'));
  const titleElementCount = titleElements.length;
  if (titleElementCount != 1) {
    validationWarnings.push({
      warning: `Expected exactly 1 <title> element, found ${titleElementCount}`,
      elements: titleElements
    });
  }

  const baseElements = Array.from(head.querySelectorAll('base'));
  const baseElementCount = baseElements.length;
  if (baseElementCount > 1) {
    validationWarnings.push({
      warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
      elements: baseElements
    });
  }
  
  const metaCSP = head.querySelector('meta[http-equiv="Content-Security-Policy" i]');
  if (metaCSP) {
    validationWarnings.push({
      warning: 'CSP meta tags disable the preload scanner due to a bug in Chrome. Use the CSP header instead. Learn more: https://crbug.com/1458493',
      element: metaCSP
    });
  }

  head.querySelectorAll('*').forEach(element => {
    if (isValidElement(element)) {
      return;
    }

    let root = element;
    while (root.parentElement != head) {
      root = root.parentElement;
    }

    validationWarnings.push({
      warning: `${element.tagName} elements are not allowed in the <head>`,
      element: root
    });
  });

  return validationWarnings;
}

export function getCustomValidations(element) {
  if (isOriginTrial(element)) {
    return validateOriginTrial(element);
  }

  if (isMetaCSP(element)) {
    return validateCSP(element);
  }

  return {};
}

function validateCSP(element) {
  return {
    warnings: ['meta CSP discouraged. See https://crbug.com/1458493.']
  };
}

function validateOriginTrial(element) {
  const metadata = {
    payload: null,
    warnings: []
  };

  const token = element.getAttribute('content');
  try {
    metadata.payload = decodeOriginTrialToken(token);

    if (metadata.payload.expiry < new Date()) {
      metadata.warnings.push('expired');
    }
    if (!metadata.payload.isThirdParty && !isSameOrigin(metadata.payload.origin, document.location.href)) {
      metadata.warnings.push('invalid origin');
    }
  } catch {
    metadata.warnings.push('invalid token');
  }

  return metadata;
}

// Adapted from https://glitch.com/~ot-decode.
function decodeOriginTrialToken(token) {
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