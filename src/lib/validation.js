import { isMetaCSP, isOriginTrial } from "./rules";

export const VALID_HEAD_ELEMENTS = new Set([
  "base",
  "link",
  "meta",
  "noscript",
  "script",
  "style",
  "template",
  "title",
]);

export const PRELOAD_SELECTOR =
  'link:is([rel="preload" i], [rel="modulepreload" i])';

export function isValidElement(element) {
  return VALID_HEAD_ELEMENTS.has(element.tagName.toLowerCase());
}

export function hasValidationWarning(element) {
  // Element itself is not valid.
  if (!isValidElement(element)) {
    return true;
  }

  // Children are not valid.
  if (
    element.matches(`:has(:not(${Array.from(VALID_HEAD_ELEMENTS).join(", ")}))`)
  ) {
    return true;
  }

  // <title> is not the first of its type.
  if (element.matches("title:is(:nth-of-type(n+2))")) {
    return true;
  }

  // <base> is not the first of its type.
  if (element.matches("base:has(~ base), base ~ base")) {
    return true;
  }

  // CSP meta tag anywhere.
  if (isMetaCSP(element)) {
    return true;
  }

  // Origin trial expired or cross-origin.
  if (isInvalidOriginTrial(element)) {
    return true;
  }

  // Preload is unnecessary.
  if (isUnnecessaryPreload(element)) {
    return true;
  }

  return false;
}

export function getValidationWarnings(head) {
  const validationWarnings = [];

  const titleElements = Array.from(head.querySelectorAll("title"));
  const titleElementCount = titleElements.length;
  if (titleElementCount != 1) {
    validationWarnings.push({
      warning: `Expected exactly 1 <title> element, found ${titleElementCount}`,
      elements: titleElements,
    });
  }

  const baseElements = Array.from(head.querySelectorAll("base"));
  const baseElementCount = baseElements.length;
  if (baseElementCount > 1) {
    validationWarnings.push({
      warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
      elements: baseElements,
    });
  }

  const metaCSP = head.querySelector(
    'meta[http-equiv="Content-Security-Policy" i]'
  );
  if (metaCSP) {
    validationWarnings.push({
      warning:
        "CSP meta tags disable the preload scanner due to a bug in Chrome. Use the CSP header instead. Learn more: https://crbug.com/1458493",
      element: metaCSP,
    });
  }

  head.querySelectorAll("*").forEach((element) => {
    if (isValidElement(element)) {
      return;
    }

    let root = element;
    while (root.parentElement != head) {
      root = root.parentElement;
    }

    validationWarnings.push({
      warning: `${element.tagName} elements are not allowed in the <head>`,
      element: root,
    });
  });

  const originTrials = Array.from(
    head.querySelectorAll('meta[http-equiv="Origin-Trial" i]')
  );
  originTrials.forEach((element) => {
    const metadata = validateOriginTrial(element);

    if (metadata.warnings.length == 0) {
      return;
    }

    validationWarnings.push({
      warning: `Invalid origin trial token: ${metadata.warnings.join(", ")}`,
      elements: [element],
      element: metadata.payload,
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

  if (isUnnecessaryPreload(element)) {
    return validateUnnecessaryPreload(element);
  }

  return {};
}

function validateCSP(element) {
  const warnings = [];

  if (
    element.matches('meta[http-equiv="Content-Security-Policy-Report-Only" i]')
  ) {
    //https://w3c.github.io/webappsec-csp/#meta-element
    warnings.push("CSP Report-Only is forbidden in meta tags");
  } else if (element.matches('meta[http-equiv="Content-Security-Policy" i]')) {
    warnings.push("meta CSP discouraged. See https://crbug.com/1458493.");

    // TODO: Validate that CSP doesn't include `report-uri`, `frame-ancestors`, or `sandbox` directives.
  }

  return {
    warnings,
  };
}

function isInvalidOriginTrial(element) {
  if (!isOriginTrial(element)) {
    return false;
  }

  const { warnings } = validateOriginTrial(element);
  return warnings.length > 0;
}

function validateOriginTrial(element) {
  const metadata = {
    payload: null,
    warnings: [],
  };

  const token = element.getAttribute("content");
  try {
    metadata.payload = decodeOriginTrialToken(token);
  } catch {
    metadata.warnings.push("invalid token");
    return metadata;
  }

  if (metadata.payload.expiry < new Date()) {
    metadata.warnings.push("expired");
  }
  if (!isSameOrigin(metadata.payload.origin, document.location.href)) {
    const subdomain = isSubdomain(
      metadata.payload.origin,
      document.location.href
    );
    // Cross-origin OTs are only valid if:
    //   1. The document is a subdomain of the OT origin and the isSubdomain config is set
    //   2. The isThirdParty config is set
    if (subdomain && !metadata.payload.isSubdomain) {
      metadata.warnings.push("invalid subdomain");
    } else if (!metadata.payload.isThirdParty) {
      metadata.warnings.push("invalid origin");
    }
  }

  return metadata;
}

// Adapted from https://glitch.com/~ot-decode.
function decodeOriginTrialToken(token) {
  const buffer = new Uint8Array([...atob(token)].map((a) => a.charCodeAt(0)));
  const view = new DataView(buffer.buffer);
  const length = view.getUint32(65, false);
  const payload = JSON.parse(
    new TextDecoder().decode(buffer.slice(69, 69 + length))
  );
  payload.expiry = new Date(payload.expiry * 1000);
  return payload;
}

function isSameOrigin(a, b) {
  return new URL(a).origin === new URL(b).origin;
}

// Whether b is a subdomain of a
function isSubdomain(a, b) {
  // www.example.com ends with .example.com
  a = new URL(a);
  b = new URL(b);
  return b.host.endsWith(`.${a.host}`);
}

function isUnnecessaryPreload(element) {
  if (!element.matches(PRELOAD_SELECTOR)) {
    return false;
  }

  const href = element.getAttribute("href");
  if (!href) {
    return false;
  }

  const preloadedUrl = absolutifyUrl(href);

  return findElementWithSource(element.parentElement, preloadedUrl) != null;
}

function findElementWithSource(root, sourceUrl) {
  const linksAndScripts = Array.from(
    root.querySelectorAll(`link:not(${PRELOAD_SELECTOR}), script`)
  );

  return linksAndScripts.find((e) => {
    const src = e.getAttribute("href") || e.getAttribute("src");
    if (!src) {
      return false;
    }

    return sourceUrl == absolutifyUrl(src);
  });
}

function absolutifyUrl(href) {
  return new URL(href, document.baseURI).href;
}

function validateUnnecessaryPreload(element) {
  const href = element.getAttribute("href");
  const preloadedUrl = absolutifyUrl(href);
  const preloadedElement = findElementWithSource(
    element.parentElement,
    preloadedUrl
  );

  if (!preloadedElement) {
    throw new Error("Expected an invalid preload, but none found.");
  }

  return {
    warnings: [
      `This preload has little to no effect. ${href} is already discoverable by another ${preloadedElement.tagName} element.`,
    ],
  };
}
