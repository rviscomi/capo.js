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

export const CONTENT_TYPE_SELECTOR = 'meta[http-equiv="content-type" i], meta[charset]';

export const HTTP_EQUIV_SELECTOR = "meta[http-equiv]";

export const PRELOAD_SELECTOR = 'link:is([rel="preload" i], [rel="modulepreload" i])';

export function isValidElement(element) {
  return VALID_HEAD_ELEMENTS.has(element.tagName.toLowerCase());
}

export function hasValidationWarning(element) {
  // Element itself is not valid.
  if (!isValidElement(element)) {
    return true;
  }

  // Children are not valid.
  if (element.matches(`:has(:not(${Array.from(VALID_HEAD_ELEMENTS).join(", ")}))`)) {
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

  // Invalid http-equiv.
  if (isInvalidHttpEquiv(element)) {
    return true;
  }

  // Invalid meta viewport.
  if (isInvalidMetaViewport(element)) {
    return true;
  }

  // Invalid default-style.
  if (isInvalidDefaultStyle(element)) {
    return true;
  }

  // Invalid character encoding.
  if (isInvalidContentType(element)) {
    return true;
  }

  // Origin trial expired, or invalid origin.
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

  const metaViewport = head.querySelectorAll('meta[name="viewport" i]');
  if (metaViewport.length != 1) {
    validationWarnings.push({
      warning: `Expected exactly 1 <meta name=viewport> element, found ${metaViewport.length}`,
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

  const metaCSP = head.querySelector('meta[http-equiv="Content-Security-Policy" i]');
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

  const originTrials = Array.from(head.querySelectorAll('meta[http-equiv="Origin-Trial" i]'));
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

  if (isDefaultStyle(element)) {
    return validateDefaultStyle(element);
  }

  if (isMetaViewport(element)) {
    return validateMetaViewport(element);
  }

  if (isContentType(element)) {
    return validateContentType(element);
  }

  if (isHttpEquiv(element)) {
    return validateHttpEquiv(element);
  }

  if (isUnnecessaryPreload(element)) {
    return validateUnnecessaryPreload(element);
  }

  return {};
}

function validateCSP(element) {
  const warnings = [];

  if (element.matches('meta[http-equiv="Content-Security-Policy-Report-Only" i]')) {
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
    const subdomain = isSubdomain(metadata.payload.origin, document.location.href);
    // Cross-origin OTs are only valid if:
    //   1. The document is a subdomain of the OT origin and the isSubdomain config is set
    //   2. The isThirdParty config is set
    if (subdomain && !metadata.payload.isSubdomain) {
      metadata.warnings.push("invalid subdomain");
    } else if (!subdomain && !metadata.payload.isThirdParty) {
      metadata.warnings.push("invalid third-party origin");
    }
  }

  return metadata;
}

// Adapted from https://glitch.com/~ot-decode.
function decodeOriginTrialToken(token) {
  const buffer = new Uint8Array([...atob(token)].map((a) => a.charCodeAt(0)));
  const view = new DataView(buffer.buffer);
  const length = view.getUint32(65, false);
  const payload = JSON.parse(new TextDecoder().decode(buffer.slice(69, 69 + length)));
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

function isDefaultStyle(element) {
  return element.matches('meta[http-equiv="default-style" i]');
}

function isContentType(element) {
  return element.matches(CONTENT_TYPE_SELECTOR);
}

function isHttpEquiv(element) {
  return element.matches(HTTP_EQUIV_SELECTOR);
}

function isMetaViewport(element) {
  return element.matches('meta[name="viewport" i]');
}

function isInvalidDefaultStyle(element) {
  if (!isDefaultStyle(element)) {
    return false;
  }

  const { warnings } = validateDefaultStyle(element);
  return warnings.length > 0;
}

function isInvalidContentType(element) {
  if (!isContentType(element)) {
    return false;
  }

  const { warnings } = validateContentType(element);
  return warnings.length > 0;
}

function isInvalidHttpEquiv(element) {
  if (!isHttpEquiv(element)) {
    return false;
  }

  const { warnings } = validateHttpEquiv(element);
  return warnings.length > 0;
}

function isInvalidMetaViewport(element) {
  if (!isMetaViewport(element)) {
    return false;
  }

  const { warnings } = validateMetaViewport(element);
  return warnings.length > 0;
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
  const linksAndScripts = Array.from(root.querySelectorAll(`link:not(${PRELOAD_SELECTOR}), script`));

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

function validateDefaultStyle(element) {
  const warnings = [];
  let payload = null;

  // Check if the value points to an alternate stylesheet with that title
  const title = element.getAttribute("content");
  const stylesheet = element.parentElement.querySelector(
    `link[rel~="alternate" i][rel~="stylesheet" i][title="${title}"]`
  );

  if (!title) {
    warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
  } else if (!stylesheet) {
    payload = {
      alternateStylesheets: Array.from(
        element.parentElement.querySelectorAll('link[rel~="alternate" i][rel~="stylesheet" i]')
      ),
    };
    warnings.push(`This has no effect. No alternate stylesheet found having title="${title}".`);
  }

  warnings.push(
    "Even when used correctly, the default-style method of setting a preferred stylesheet results in a flash of unstyled content. Use modern CSS features like @media rules instead."
  );

  return { warnings, payload };
}

function validateContentType(element) {
  const warnings = [];
  let payload = null;
  // https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration
  // Check if there exists both meta[http-equiv] and meta[chartset] variations
  if (
    element.matches(':is(meta[charset] ~ meta[http-equiv="content-type" i])') ||
    element.matches(":has(~ meta[charset])")
  ) {
    const encodingDeclaration = element.parentElement.querySelector("meta[charset]");
    payload = payload ?? {};
    payload.encodingDeclaration = encodingDeclaration;
    warnings.push(
      `There can only be one meta-based character encoding declaration per document. Already found \`${encodingDeclaration.outerHTML}\`.`
    );
  }

  // Check if it compeltely exists in the first 1024 bytes
  const charPos = element.ownerDocument.documentElement.outerHTML.indexOf(element.outerHTML) + element.outerHTML.length;
  if (charPos > 1024) {
    payload = payload ?? {};
    payload.characterPosition = charPos;
    warnings.push(
      `The element containing the character encoding declaration must be serialized completely within the first 1024 bytes of the document. Found at byte ${charPos}.`
    );
  }

  // Check that the character encoding is UTF-8
  let charset = null;
  if (element.matches("meta[charset]")) {
    charset = element.getAttribute("charset");
  } else {
    const charsetPattern = /text\/html;\s*charset=(.*)/i;
    charset = element.getAttribute("content")?.match(charsetPattern)?.[1]?.trim();
  }

  if (charset?.toLowerCase() != "utf-8") {
    payload = payload ?? {};
    payload.charset = charset;
    warnings.push(`Documents are required to use UTF-8 encoding. Found "${charset}".`);
  }

  if (warnings.length) {
    // Append the spec source to the last warning
    warnings[warnings.length - 1] +=
      "\nLearn more: https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration";
  }

  return { warnings, payload };
}

function validateHttpEquiv(element) {
  const warnings = [];
  const type = element.getAttribute("http-equiv").toLowerCase();
  const content = element.getAttribute("content")?.toLowerCase();

  switch (type) {
    case "content-security-policy":
    case "content-security-policy-report-only":
    case "origin-trial":
    case "content-type":
    case "default-style":
      // Legitimate use case and/or more specific validation already exists
      break;

    case "refresh":
      if (!content) {
        warnings.push(
          "This doesn't do anything. The content attribute must be set. However, using refresh is discouraged."
        );
        break;
      }
      if (content.includes("url=")) {
        warnings.push("Meta auto-redirects are discouraged. Use HTTP 3XX responses instead.");
      } else {
        warnings.push("Meta auto-refreshes are discouraged unless users have the ability to disable it.");
      }
      break;

    case "x-dns-prefetch-control":
      if (content == "on") {
        warnings.push(`DNS prefetching is enabled by default. Setting it to "${content}" has no effect.`);
      } else if (content != "off") {
        warnings.push(
          `This is a non-standard way of disabling DNS prefetching, which is a performance optimization. Found content="${content}". Use content="off" if you have a legitimate security concern, otherwise remove it.`
        );
      } else {
        warnings.push(
          "This is non-standard, however most browsers support disabling speculative DNS prefetching. It should still be noted that DNS prefetching is a generally accepted performance optimization and you should only disable it if you have specific security concerns."
        );
      }
      break;

    case "cache-control":
    case "etag":
    case "pragma":
    case "expires":
    case "last-modified":
      warnings.push("This doesn't do anything. Use HTTP headers for any cache directives.");
      break;

    case "x-frame-options":
      warnings.push("This doesn't do anything. Use the CSP HTTP header with the frame-ancestors directive instead.");
      break;

    case "x-ua-compatible":
    case "content-style-type":
    case "content-script-type":
    case "imagetoolbar":
    case "cleartype":
    case "page-enter":
    case "page-exit":
    case "site-enter":
    case "site-exit":
    case "msthemecompatible":
    case "window-target":
      warnings.push("This doesn't do anything. It was an Internet Explorer feature and is now deprecated.");
      break;

    case "content-language":
    case "language":
      warnings.push("This is non-conforming. Use the html[lang] attribute instead.");
      break;

    case "set-cookie":
      warnings.push("This is non-conforming. Use the Set-Cookie HTTP header instead.");
      break;

    case "application-name":
    case "author":
    case "description":
    case "generator":
    case "keywords":
    case "referrer":
    case "theme-color":
    case "color-scheme":
    case "viewport":
    case "creator":
    case "googlebot":
    case "publisher":
    case "robots":
      warnings.push(`This doesn't do anything. Did you mean \`meta[name=${type}]\`?`);
      break;

    case "encoding":
      warnings.push("This doesn't do anything. Did you mean `meta[charset]`?");
      break;

    case "title":
      warnings.push("This doesn't do anything. Did you mean to use the `title` tag instead?");
      break;

    case "accept-ch":
    case "delegate-ch":
      warnings.push("This is non-standard and may not work across browsers. Use HTTP headers instead.");
      break;

    default:
      warnings.push(
        "This is non-standard and may not work across browsers. http-equiv is not an alternative to HTTP headers."
      );
      break;
  }

  return {
    warnings,
  };
}

function validateMetaViewport(element) {
  const warnings = [];
  let payload = null;

  // Redundant meta viewport validation.
  if (element.matches('meta[name="viewport" i] ~ meta[name="viewport" i]')) {
    const firstMetaViewport = element.parentElement.querySelector('meta[name="viewport" i]');
    payload = { firstMetaViewport };
    warnings.push(
      "Another meta viewport element has already been declared. Having multiple viewport settings can lead to unexpected behavior."
    );
    return { warnings, payload };
  }

  // Additional validation performed only on the first meta viewport.
  const content = element.getAttribute("content")?.toLowerCase();
  if (!content) {
    warnings.push("Invalid viewport. The content attribute must be set.");
    return { warnings, payload };
  }

  const directives = Object.fromEntries(
    content.split(",").map((directive) => {
      const [key, value] = directive.split("=");
      return [key?.trim(), value?.trim()];
    })
  );

  if ("width" in directives) {
    const width = directives["width"];
    if (Number(width) < 1 || Number(width) > 10000) {
      warnings.push(`Invalid width "${width}". Numeric values must be between 1 and 10000.`);
    } else if (width != "device-width") {
      warnings.push(`Invalid width "${width}".`);
    }
  }

  if ("height" in directives) {
    const height = directives["height"];
    if (Number(height) < 1 || Number(height) > 10000) {
      warnings.push(`Invalid height "${height}". Numeric values must be between 1 and 10000.`);
    } else if (height != "device-height") {
      warnings.push(`Invalid height "${height}".`);
    }
  }

  if ("initial-scale" in directives) {
    const initialScale = Number(directives["initial-scale"]);
    if (isNaN(initialScale)) {
      warnings.push(`Invalid initial zoom level "${directives["initial-scale"]}". Values must be numeric.`);
    }
    if (initialScale < 0.1 || initialScale > 10) {
      warnings.push(`Invalid initial zoom level "${initialScale}". Values must be between 0.1 and 10.`);
    }
  }

  if ("minimum-scale" in directives) {
    const minimumScale = Number(directives["minimum-scale"]);
    if (isNaN(minimumScale)) {
      warnings.push(`Invalid minimum zoom level "${directives["minimum-scale"]}". Values must be numeric.`);
    }
    if (minimumScale < 0.1 || minimumScale > 10) {
      warnings.push(`Invalid minimum zoom level "${minimumScale}". Values must be between 0.1 and 10.`);
    }
  }

  if ("maximum-scale" in directives) {
    const maxScale = Number(directives["maximum-scale"]);
    if (isNaN(maxScale)) {
      warnings.push(`Invalid maximum zoom level "${directives["maximum-scale"]}". Values must be numeric.`);
    }
    if (maxScale < 0.1 || maxScale > 10) {
      warnings.push(`Invalid maximum zoom level "${maxScale}". Values must be between 0.1 and 10.`);
    }
    if (maxScale < 2) {
      warnings.push(`Disabling zoom levels under 2x can cause accessibility issues. Found "${maxScale}".`);
    }
  }

  if ("user-scalable" in directives) {
    const userScalable = directives["user-scalable"];
    if (userScalable == "no" || userScalable == "0") {
      warnings.push(
        `Disabling zooming can cause accessibility issues to users with visual impairments. Found "${userScalable}".`
      );
    }
    if (!["0", "1", "yes", "no"].includes(userScalable)) {
      warnings.push(`Unsupported value "${userScalable}" found.`);
    }
  }

  if ("interactive-widget" in directives) {
    const interactiveWidget = directives["interactive-widget"];
    const validValues = ["resizes-visual", "resizes-content", "overlays-content"];
    if (!validValues.includes(interactiveWidget)) {
      warnings.push(`Unsupported value "${interactiveWidget}" found.`);
    }
  }

  const validDirectives = new Set([
    "width",
    "height",
    "initial-scale",
    "minimum-scale",
    "maximum-scale",
    "user-scalable",
    "interactive-widget",
  ]);
  Object.keys(directives)
    .filter((directive) => {
      return !validDirectives.has(directive);
    })
    .forEach((directive) => {
      warnings.push(`Invalid viewport directive "${directive}".`);
    });

  return { warnings, payload };
}

function validateUnnecessaryPreload(element) {
  const href = element.getAttribute("href");
  const preloadedUrl = absolutifyUrl(href);
  const preloadedElement = findElementWithSource(element.parentElement, preloadedUrl);

  if (!preloadedElement) {
    throw new Error("Expected an invalid preload, but none found.");
  }

  return {
    warnings: [
      `This preload has little to no effect. ${href} is already discoverable by another ${preloadedElement.tagName} element.`,
    ],
  };
}
