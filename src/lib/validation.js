import { isMetaCSP, isOriginTrial } from "./rules.js";

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

export function isValidElement(element, adapter) {
  return VALID_HEAD_ELEMENTS.has(adapter.getTagName(element).toLowerCase());
}

/**
 * Check if element has any invalid child elements
 * @param {any} element - Element to check
 * @param {any} adapter - Adapter instance
 * @returns {boolean}
 */
function hasInvalidChildren(element, adapter) {
  const children = adapter.getChildren(element);
  return children.some(child => !isValidElement(child, adapter));
}

/**
 * Check if this is a duplicate title element (2nd+ occurrence)
 * @param {any} element - Element to check
 * @param {any} adapter - Adapter instance
 * @returns {boolean}
 */
function isDuplicateTitle(element, adapter) {
  if (adapter.getTagName(element) !== 'title') {
    return false;
  }
  const parent = adapter.getParent(element);
  if (!parent) {
    return false;
  }
  // Check if this is the first title element
  let foundFirst = false;
  for (const child of adapter.getChildren(parent)) {
    if (adapter.getTagName(child) === 'title') {
      if (child === element) {
        // This is the element we're checking - it's a duplicate if we already found a title
        return foundFirst;
      }
      // Found a title element - mark that we've seen one
      foundFirst = true;
    }
  }
  return false;
}

/**
 * Check if this is a duplicate base element
 * @param {any} element - Element to check  
 * @param {any} adapter - Adapter instance
 * @returns {boolean}
 */
function isDuplicateBase(element, adapter) {
  if (adapter.getTagName(element) !== 'base') {
    return false;
  }
  const siblings = adapter.getSiblings(element);
  return siblings.some(sibling => adapter.getTagName(sibling) === 'base');
}

export function hasValidationWarning(element, adapter) {
  // Element itself is not valid.
  if (!isValidElement(element, adapter)) {
    return true;
  }

  // Children are not valid.
  if (hasInvalidChildren(element, adapter)) {
    return true;
  }

  // <title> is not the first of its type.
  if (isDuplicateTitle(element, adapter)) {
    return true;
  }

  // <base> is not the first of its type.
  if (isDuplicateBase(element, adapter)) {
    return true;
  }

  // CSP meta tag anywhere.
  if (isMetaCSP(element, adapter)) {
    return true;
  }

  // Invalid http-equiv.
  if (isInvalidHttpEquiv(element, adapter)) {
    return true;
  }

  // Invalid meta viewport.
  if (isInvalidMetaViewport(element, adapter)) {
    return true;
  }

  // Invalid default-style.
  if (isInvalidDefaultStyle(element, adapter)) {
    return true;
  }

  // Invalid character encoding.
  if (isInvalidContentType(element, adapter)) {
    return true;
  }

  // Origin trial expired, or invalid origin.
  if (isInvalidOriginTrial(element, adapter)) {
    return true;
  }

  // Preload is unnecessary.
  if (isUnnecessaryPreload(element, adapter)) {
    return true;
  }

  return false;
}

export function getValidationWarnings(head, adapter) {
  const validationWarnings = [];

  // Get all children of head element
  const children = adapter.getChildren(head);

  // Check for title elements
  const titleElements = children.filter(child => adapter.getTagName(child) === 'title');
  const titleElementCount = titleElements.length;
  if (titleElementCount != 1) {
    validationWarnings.push({
      warning: `Expected exactly 1 <title> element, found ${titleElementCount}`,
      elements: titleElements,
    });
  }

  // Check for meta viewport
  const metaViewport = children.filter(child => {
    if (adapter.getTagName(child) !== 'meta') return false;
    const name = adapter.getAttribute(child, 'name');
    return name && name.toLowerCase() === 'viewport';
  });
  if (metaViewport.length != 1) {
    validationWarnings.push({
      warning: `Expected exactly 1 <meta name=viewport> element, found ${metaViewport.length}`,
    });
  }

  // Check for base elements
  const baseElements = children.filter(child => adapter.getTagName(child) === 'base');
  const baseElementCount = baseElements.length;
  if (baseElementCount > 1) {
    validationWarnings.push({
      warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
      elements: baseElements,
    });
  }

  // Check for CSP meta tags
  const metaCSP = children.find(child => {
    if (adapter.getTagName(child) !== 'meta') return false;
    const httpEquiv = adapter.getAttribute(child, 'http-equiv');
    return httpEquiv && httpEquiv.toLowerCase() === 'content-security-policy';
  });
  if (metaCSP) {
    validationWarnings.push({
      warning:
        "CSP meta tags disable the preload scanner due to a bug in Chrome. Use the CSP header instead. Learn more: https://crbug.com/1458493",
      element: metaCSP,
    });
  }

  // Check for invalid elements
  children.forEach((element) => {
    if (isValidElement(element, adapter)) {
      return;
    }

    // For invalid elements, we just report the element itself
    // (adapter doesn't have parentElement concept, so we can't find root)
    validationWarnings.push({
      warning: `${adapter.getTagName(element)} elements are not allowed in the <head>`,
      element: element,
    });
  });

  // Check for origin trials
  const originTrials = children.filter(child => {
    if (adapter.getTagName(child) !== 'meta') return false;
    const httpEquiv = adapter.getAttribute(child, 'http-equiv');
    return httpEquiv && httpEquiv.toLowerCase() === 'origin-trial';
  });
  originTrials.forEach((element) => {
    const metadata = validateOriginTrial(element, adapter);

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

export function getCustomValidations(element, adapter) {
  if (isOriginTrial(element, adapter)) {
    return validateOriginTrial(element, adapter);
  }

  if (isMetaCSP(element, adapter)) {
    return validateCSP(element, adapter);
  }

  if (isDefaultStyle(element, adapter)) {
    return validateDefaultStyle(element, adapter);
  }

  if (isMetaViewport(element, adapter)) {
    return validateMetaViewport(element, adapter);
  }

  if (isContentType(element, adapter)) {
    return validateContentType(element, adapter);
  }

  if (isHttpEquiv(element, adapter)) {
    return validateHttpEquiv(element, adapter);
  }

  if (isUnnecessaryPreload(element, adapter)) {
    return validateUnnecessaryPreload(element, adapter);
  }

  return {};
}

function validateCSP(element, adapter) {
  const warnings = [];
  let payload = null;

  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  const httpEquivLower = httpEquiv?.toLowerCase();
  
  if (httpEquivLower === 'content-security-policy-report-only') {
    //https://w3c.github.io/webappsec-csp/#meta-element
    warnings.push("CSP Report-Only is forbidden in meta tags");
    return warnings;
  }

  if (httpEquivLower === 'content-security-policy') {
    warnings.push("meta CSP discouraged. See https://crbug.com/1458493.");
  }

  const content = adapter.getAttribute(element, "content");
  if (!content) {
    warnings.push("Invalid CSP. The content attribute must be set.");
    return { warnings, payload };
  }

  const directives = Object.fromEntries(
    content.split(/\s*;\s*/).map((directive) => {
      const [key, ...value] = directive.split(" ");
      return [key, value.join(" ")];
    })
  );
  payload = payload ?? {};
  payload.directives = directives;

  if ("report-uri" in directives) {
    warnings.push(
      "The report-uri directive is not supported. Use the Content-Security-Policy-Report-Only HTTP header instead."
    );
  }
  if ("frame-ancestors" in directives) {
    warnings.push(
      "The frame-ancestors directive is not supported. Use the Content-Security-Policy HTTP header instead."
    );
  }
  if ("sandbox" in directives) {
    warnings.push("The sandbox directive is not supported. Use the Content-Security-Policy HTTP header instead.");
  }

  return {
    warnings,
    payload,
  };
}

function isInvalidOriginTrial(element, adapter) {
  if (!isOriginTrial(element, adapter)) {
    return false;
  }

  const { warnings } = validateOriginTrial(element, adapter);
  return warnings.length > 0;
}

function validateOriginTrial(element, adapter) {
  const metadata = {
    payload: null,
    warnings: [],
  };

  const token = adapter.getAttribute(element, "content");
  try {
    metadata.payload = decodeOriginTrialToken(token);
  } catch {
    metadata.warnings.push("invalid token");
    return metadata;
  }

  if (metadata.payload.expiry < new Date()) {
    metadata.warnings.push("expired");
  }
  
  // Origin validation only works in browser context with document.location
  if (typeof document !== 'undefined' && document.location && document.location.href) {
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

function isDefaultStyle(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') return false;
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  return httpEquiv?.toLowerCase() === 'default-style';
}

function isContentType(element, adapter) {
  // Matches: meta[http-equiv="content-type" i], meta[charset]
  if (adapter.getTagName(element) !== 'meta') return false;
  if (adapter.hasAttribute(element, 'charset')) return true;
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  return httpEquiv?.toLowerCase() === 'content-type';
}

function isHttpEquiv(element, adapter) {
  // Matches: meta[http-equiv]
  if (adapter.getTagName(element) !== 'meta') return false;
  return adapter.hasAttribute(element, 'http-equiv');
}

function isMetaViewport(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') return false;
  const name = adapter.getAttribute(element, 'name');
  return name?.toLowerCase() === 'viewport';
}

function isInvalidDefaultStyle(element, adapter) {
  if (!isDefaultStyle(element, adapter)) {
    return false;
  }

  const { warnings } = validateDefaultStyle(element, adapter);
  return warnings.length > 0;
}

function isInvalidContentType(element, adapter) {
  if (!isContentType(element, adapter)) {
    return false;
  }

  const { warnings } = validateContentType(element, adapter);
  return warnings.length > 0;
}

function isInvalidHttpEquiv(element, adapter) {
  if (!isHttpEquiv(element, adapter)) {
    return false;
  }

  const { warnings } = validateHttpEquiv(element, adapter);
  return warnings.length > 0;
}

function isInvalidMetaViewport(element, adapter) {
  if (!isMetaViewport(element, adapter)) {
    return false;
  }

  const { warnings } = validateMetaViewport(element, adapter);
  return warnings.length > 0;
}

function isUnnecessaryPreload(element, adapter) {
  // Matches: link:is([rel="preload" i], [rel="modulepreload" i])
  if (adapter.getTagName(element) !== 'link') {
    return false;
  }
  const rel = adapter.getAttribute(element, 'rel');
  const relLower = rel?.toLowerCase();
  if (relLower !== 'preload' && relLower !== 'modulepreload') {
    return false;
  }

  const href = adapter.getAttribute(element, "href");
  if (!href) {
    return false;
  }

  // This validation only works in browser context
  if (!element.parentElement || typeof document === 'undefined') {
    return false;
  }

  const preloadedUrl = absolutifyUrl(href);

  return findElementWithSource(element.parentElement, preloadedUrl) != null;
}

function findElementWithSource(root, sourceUrl) {
  // Browser-only function
  if (!root || !root.querySelectorAll) {
    return null;
  }
  
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
  // Browser-only function
  if (typeof document === 'undefined' || !document.baseURI) {
    // In non-browser context, return href as-is
    return href;
  }
  return new URL(href, document.baseURI).href;
}

function validateDefaultStyle(element, adapter) {
  const warnings = [];
  let payload = null;

  // Check if the value points to an alternate stylesheet with that title
  const title = adapter.getAttribute(element, "content");
  
  // Browser-only validation
  if (element.parentElement && element.parentElement.querySelector) {
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
  } else if (!title) {
    // In non-browser context, we can still check for missing title
    warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
  }

  warnings.push(
    "Even when used correctly, the default-style method of setting a preferred stylesheet results in a flash of unstyled content. Use modern CSS features like @media rules instead."
  );

  return { warnings, payload };
}

function validateContentType(element, adapter) {
  const warnings = [];
  let payload = null;
  // https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration
  // Check if there exists both meta[http-equiv] and meta[chartset] variations
  
  // Check if this is a charset or content-type meta
  const isCharset = adapter.hasAttribute(element, 'charset');
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  const isContentTypeMeta = httpEquiv?.toLowerCase() === 'content-type';
  
  if (isCharset || isContentTypeMeta) {
    // Check for duplicate charset declarations among siblings
    const siblings = adapter.getSiblings(element);
    const hasDuplicateCharset = siblings.some(sibling => {
      if (adapter.getTagName(sibling) !== 'meta') return false;
      // Check if sibling is also a charset declaration
      if (adapter.hasAttribute(sibling, 'charset')) return true;
      const siblingHttpEquiv = adapter.getAttribute(sibling, 'http-equiv');
      return siblingHttpEquiv?.toLowerCase() === 'content-type';
    });
    
    if (hasDuplicateCharset) {
      const parent = adapter.getParent(element);
      if (parent) {
        const charsetElements = adapter.getChildren(parent).filter(child => {
          if (adapter.getTagName(child) !== 'meta') return false;
          if (adapter.hasAttribute(child, 'charset')) return true;
          const childHttpEquiv = adapter.getAttribute(child, 'http-equiv');
          return childHttpEquiv?.toLowerCase() === 'content-type';
        });
        // Find the first one (not this element)
        const encodingDeclaration = charsetElements.find(el => el !== element);
        if (encodingDeclaration) {
          payload = payload ?? {};
          payload.encodingDeclaration = encodingDeclaration;
          warnings.push(
            `There can only be one meta-based character encoding declaration per document. Already found \`${adapter.stringify(encodingDeclaration)}\`.`
          );
        }
      }
    }
  }

  // Check if it completely exists in the first 1024 bytes
  // This check only works in browser context with ownerDocument
  if (element.ownerDocument?.documentElement?.outerHTML && element.outerHTML) {
    const charPos = element.ownerDocument.documentElement.outerHTML.indexOf(element.outerHTML) + element.outerHTML.length;
    if (charPos > 1024) {
      payload = payload ?? {};
      payload.characterPosition = charPos;
      warnings.push(
        `The element containing the character encoding declaration must be serialized completely within the first 1024 bytes of the document. Found at byte ${charPos}.`
      );
    }
  }

  // Check that the character encoding is UTF-8
  let charset = null;
  if (isCharset) {
    charset = adapter.getAttribute(element, "charset");
  } else {
    const charsetPattern = /text\/html;\s*charset=(.*)/i;
    charset = adapter.getAttribute(element, "content")?.match(charsetPattern)?.[1]?.trim();
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

function validateHttpEquiv(element, adapter) {
  const warnings = [];
  const type = adapter.getAttribute(element, "http-equiv").toLowerCase();
  const content = adapter.getAttribute(element, "content")?.toLowerCase();

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

function validateMetaViewport(element, adapter) {
  const warnings = [];
  let payload = null;

  // Redundant meta viewport validation.
  // Check if there are other viewport meta elements among siblings
  const siblings = adapter.getSiblings(element);
  const hasDuplicateViewport = siblings.some(sibling => {
    if (adapter.getTagName(sibling) !== 'meta') return false;
    const name = adapter.getAttribute(sibling, 'name');
    return name?.toLowerCase() === 'viewport';
  });
  
  if (hasDuplicateViewport) {
    const parent = adapter.getParent(element);
    if (parent) {
      const viewportElements = adapter.getChildren(parent).filter(child => {
        if (adapter.getTagName(child) !== 'meta') return false;
        const name = adapter.getAttribute(child, 'name');
        return name?.toLowerCase() === 'viewport';
      });
      // Find the first one (not this element)
      const firstMetaViewport = viewportElements.find(el => el !== element);
      if (firstMetaViewport) {
        payload = { firstMetaViewport };
        warnings.push(
          "Another meta viewport element has already been declared. Having multiple viewport settings can lead to unexpected behavior."
        );
        return { warnings, payload };
      }
    }
  }

  // Additional validation performed only on the first meta viewport.
  const content = adapter.getAttribute(element, "content")?.toLowerCase();
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

  if ("viewport-fit" in directives) {
    const viewportFit = directives["viewport-fit"];
    const validValues = ["auto", "contain", "cover"];
    if (!validValues.includes(viewportFit)) {
      warnings.push(`Unsupported value "${viewportFit}" found. Should be one of: ${validValues.join(", ")}.`);
    }
  }

  if ("shrink-to-fit" in directives) {
    warnings.push(
      "The shrink-to-fit directive has been obsolete since iOS 9.2.\n  See https://www.scottohara.me/blog/2018/12/11/shrink-to-fit.html"
    );
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
      if (validDirectives.has(directive)) {
        // The directive is valid.
        return false;
      }
      if (directive == "shrink-to-fit") {
        // shrink-to-fit is not valid, but we have a separate warning for it.
        return false;
      }
      if (directive == "viewport-fit") {
        // viewport-fit is non-standard, but widely supported.
        // https://github.com/rviscomi/capo.js/issues/110
        return false;
      }
      return true;
    })
    .forEach((directive) => {
      warnings.push(`Invalid viewport directive "${directive}".`);
    });

  return { warnings, payload };
}

function validateUnnecessaryPreload(element, adapter) {
  const href = adapter.getAttribute(element, "href");
  const preloadedUrl = absolutifyUrl(href);
  
  // This validation only works in browser context
  if (!element.parentElement) {
    return { warnings: [] };
  }
  
  const preloadedElement = findElementWithSource(element.parentElement, preloadedUrl);

  if (!preloadedElement) {
    // In non-browser context, findElementWithSource may return null
    // Don't throw error, just return no warnings
    return { warnings: [] };
  }

  return {
    warnings: [
      `This preload has little to no effect. ${href} is already discoverable by another ${preloadedElement.tagName} element.`,
    ],
  };
}
