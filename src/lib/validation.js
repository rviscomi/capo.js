import { isMetaCSP, isOriginTrial } from './rules.js';

/**
 * @typedef {import('../adapters/adapter.js').AdapterInterface} AdapterInterface
 * 
 * @typedef {Object} ValidationWarningResult
 * @property {string} ruleId
 * @property {string} warning
 * @property {any} [element]
 * @property {any[]} [elements]
 * 
 * @typedef {Object} CustomValidationResult
 * @property {string} [ruleId]
 * @property {string[]} [warnings]
 * @property {any} [payload]
 * @property {any} [element]
 */

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

/**
 * Check if element is a valid HTML <head> element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isValidElement(element, adapter) {
  const tagName = adapter.getTagName(element);
  // Text nodes and comment nodes are valid (they don't have tag names)
  if (!tagName || tagName === '') {
    return true;
  }
  return VALID_HEAD_ELEMENTS.has(tagName.toLowerCase());
}

/**
 * Check if element has any invalid child elements
 * @param {any} element - Element to check
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */
function hasInvalidChildren(element, adapter) {
  const children = adapter.getChildren(element);
  return children.some(child => !isValidElement(child, adapter));
}

/**
 * Check if this is a duplicate title element (2nd+ occurrence)
 * @param {any} element - Element to check
 * @param {AdapterInterface} adapter - Adapter instance
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
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */
function isDuplicateBase(element, adapter) {
  if (adapter.getTagName(element) !== 'base') {
    return false;
  }
  const siblings = adapter.getSiblings(element);
  return siblings.some(sibling => adapter.getTagName(sibling) === 'base');
}

/**
 * Check if an element has any validation warning
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {string|null} [pageOrigin=null]
 * @returns {boolean}
 */
export function hasValidationWarning(element, adapter, pageOrigin = null) {
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
  if (isInvalidOriginTrial(element, adapter, pageOrigin)) {
    return true;
  }

  // Preload is unnecessary.
  if (isUnnecessaryPreload(element, adapter)) {
    return true;
  }

  // Preload is missing crossorigin.
  if (isInvalidFontPreload(element, adapter)) {
    return true;
  }

  return false;
}

/**
 * Get document-level validation warnings for a <head> element
 * @param {any} head
 * @param {AdapterInterface} adapter
 * @returns {ValidationWarningResult[]}
 */
export function getValidationWarnings(head, adapter) {
  /** @type {ValidationWarningResult[]} */
  const validationWarnings = [];

  // Get all children of head element
  const children = adapter.getChildren(head);

  // Check for title elements
  const titleElements = children.filter(child => adapter.getTagName(child) === 'title');
  const titleElementCount = titleElements.length;
  if (titleElementCount != 1) {
    validationWarnings.push({
      ruleId: titleElementCount === 0 ? 'require-title' : 'no-duplicate-title',
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
      ruleId: metaViewport.length === 0 ? 'require-meta-viewport' : 'valid-meta-viewport',
      warning: `Expected exactly 1 <meta name=viewport> element, found ${metaViewport.length}`,
      elements: metaViewport,
    });
  }

  // Check for base elements
  const baseElements = children.filter(child => adapter.getTagName(child) === 'base');
  const baseElementCount = baseElements.length;
  if (baseElementCount > 1) {
    validationWarnings.push({
      ruleId: 'no-duplicate-base',
      warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
      elements: baseElements,
    });
  }

  // Check for invalid elements
  children.forEach((element) => {
    if (isValidElement(element, adapter)) {
      const elementChildren = adapter.getChildren(element);
      elementChildren.forEach((child) => {
        if (!isValidElement(child, adapter)) {
          validationWarnings.push({
            ruleId: 'no-invalid-head-elements',
            warning: `${adapter.getTagName(child).toUpperCase()} elements are not allowed in the <head>`,
            element: element,
          });
        }
      });
      return;
    }

    validationWarnings.push({
      ruleId: 'no-invalid-head-elements',
      warning: `${adapter.getTagName(element)} elements are not allowed in the <head>`,
      element: element,
    });
  });

  return validationWarnings;
}

/**
 * Get custom element-level validations for an element
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @param {string|null} [pageOrigin=null]
 * @returns {CustomValidationResult}
 */
export function getCustomValidations(element, adapter, parentElement = null, pageOrigin = null) {
  /** @type {CustomValidationResult[]} */
  const results = [];

  if (isOriginTrial(element, adapter)) {
    results.push(validateOriginTrial(element, adapter, pageOrigin));
  }

  if (isMetaCSP(element, adapter)) {
    results.push(validateCSP(element, adapter));
  }

  if (isDefaultStyle(element, adapter)) {
    results.push(validateDefaultStyle(element, adapter));
  }

  if (isMetaViewport(element, adapter)) {
    results.push(validateMetaViewport(element, adapter));
  }

  if (isContentType(element, adapter)) {
    results.push(validateContentType(element, adapter));
  }

  if (isHttpEquiv(element, adapter)) {
    results.push(validateHttpEquiv(element, adapter));
  }

  if (isUnnecessaryPreload(element, adapter, parentElement)) {
    results.push(validateUnnecessaryPreload(element, adapter, parentElement));
  }

  if (isInvalidFontPreload(element, adapter)) {
    results.push(validateInvalidFontPreload(element, adapter));
  }

  if (results.length === 0) {
    return {};
  }

  if (results.length === 1) {
    return results[0];
  }

  // Merge results
  /** @type {CustomValidationResult} */
  const combined = {
    warnings: [],
    payload: {},
    ruleId: results[0].ruleId
  };
  results.forEach(result => {
    if (result.warnings) {
      combined.warnings?.push(...result.warnings);
    }
    if (result.payload) {
      Object.assign(combined.payload, result.payload);
    }
  });
  return combined;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
function validateCSP(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;

  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  const httpEquivLower = httpEquiv?.toLowerCase();
  
  if (httpEquivLower === 'content-security-policy-report-only') {
    warnings.push("CSP Report-Only is forbidden in meta tags");
    return {
      ruleId: 'no-meta-csp',
      warnings,
      payload,
    };
  }

  if (httpEquivLower === 'content-security-policy') {
    warnings.push("meta CSP discouraged. See https://crbug.com/1458493.");
  }

  const content = adapter.getAttribute(element, "content");
  if (!content) {
    warnings.push("Invalid CSP. The content attribute must be set.");
    return { warnings, payload };
  }

  /** @type {Record<string, string>} */
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
    ruleId: 'no-meta-csp',
    warnings,
    payload,
  };
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {string|null} [pageOrigin=null]
 * @returns {boolean}
 */
function isInvalidOriginTrial(element, adapter, pageOrigin = null) {
  if (!isOriginTrial(element, adapter)) {
    return false;
  }

  const { warnings } = validateOriginTrial(element, adapter, pageOrigin);
  return (warnings?.length ?? 0) > 0;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {string|null} [pageOrigin=null]
 * @returns {CustomValidationResult}
 */
function validateOriginTrial(element, adapter, pageOrigin = null) {
  /** @type {CustomValidationResult} */
  const metadata = {
    ruleId: 'no-invalid-origin-trial',
    payload: null,
    warnings: [],
  };

  const token = adapter.getAttribute(element, "content");
  try {
    metadata.payload = decodeOriginTrialToken(token);
  } catch {
    metadata.warnings?.push("Invalid origin trial token: invalid token");
    return metadata;
  }

  if (metadata.payload.expiry < new Date()) {
    metadata.warnings?.push("Invalid origin trial token: expired");
  }
  
  const targetOrigin = pageOrigin || (typeof document !== 'undefined' && document.location && document.location.href);
  if (targetOrigin) {
    if (!isSameOrigin(metadata.payload.origin, targetOrigin)) {
      const subdomain = isSubdomain(metadata.payload.origin, targetOrigin);
      if (subdomain && !metadata.payload.isSubdomain) {
        metadata.warnings?.push("Invalid origin trial token: invalid subdomain");
      } else if (!subdomain && !metadata.payload.isThirdParty) {
        metadata.warnings?.push("Invalid origin trial token: invalid third-party origin");
      }
    }
  }

  return metadata;
}

/**
 * Decode origin trial token payload
 * @param {string|null} token
 * @returns {any}
 */
function decodeOriginTrialToken(token) {
  if (!token) throw new Error("Missing token");
  const buffer = new Uint8Array([...atob(token)].map((a) => a.charCodeAt(0)));
  const view = new DataView(buffer.buffer);
  const length = view.getUint32(65, false);
  const payload = JSON.parse(new TextDecoder().decode(buffer.slice(69, 69 + length)));
  payload.expiry = new Date(payload.expiry * 1000);
  return payload;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isSameOrigin(a, b) {
  return new URL(a).origin === new URL(b).origin;
}

/**
 * @param {string} tokenOrigin - Origin from origin trial token (e.g., https://youtube.com:443)
 * @param {string} pageUrl - Page URL or origin (e.g., https://www.youtube.com)
 * @returns {boolean}
 */
function isSubdomain(tokenOrigin, pageUrl) {
  const urlA = new URL(tokenOrigin);
  const urlB = new URL(pageUrl);
  return urlB.host.endsWith(`.${urlA.host}`);
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isDefaultStyle(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') return false;
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  return httpEquiv?.toLowerCase() === 'default-style';
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isContentType(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') return false;
  if (adapter.hasAttribute(element, 'charset')) return true;
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  return httpEquiv?.toLowerCase() === 'content-type';
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isHttpEquiv(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') return false;
  return adapter.hasAttribute(element, 'http-equiv');
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isMetaViewport(element, adapter) {
  if (adapter.getTagName(element) !== 'meta') return false;
  const name = adapter.getAttribute(element, 'name');
  return name?.toLowerCase() === 'viewport';
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isInvalidDefaultStyle(element, adapter) {
  if (!isDefaultStyle(element, adapter)) {
    return false;
  }

  const { warnings } = validateDefaultStyle(element, adapter);
  return (warnings?.length ?? 0) > 0;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isInvalidContentType(element, adapter) {
  if (!isContentType(element, adapter)) {
    return false;
  }

  const { warnings } = validateContentType(element, adapter);
  return (warnings?.length ?? 0) > 0;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isInvalidHttpEquiv(element, adapter) {
  if (!isHttpEquiv(element, adapter)) {
    return false;
  }

  const { warnings } = validateHttpEquiv(element, adapter);
  return (warnings?.length ?? 0) > 0;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isInvalidMetaViewport(element, adapter) {
  if (!isMetaViewport(element, adapter)) {
    return false;
  }

  const { warnings } = validateMetaViewport(element, adapter);
  return (warnings?.length ?? 0) > 0;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @returns {boolean}
 */
function isUnnecessaryPreload(element, adapter, parentElement = null) {
  const tagName = adapter.getTagName(element);
  if (tagName !== 'link') {
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
  const parent = parentElement || adapter.getParent(element);
  if (!parent) {
    return false;
  }
  const found = findElementWithSource(parent, href, element, adapter);
  return found != null;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
function isInvalidFontPreload(element, adapter) {
  const tagName = adapter.getTagName(element);
  if (tagName !== 'link') {
    return false;
  }
  const rel = adapter.getAttribute(element, 'rel');
  if (rel?.toLowerCase() !== 'preload') {
    return false;
  }
  const as = adapter.getAttribute(element, 'as');
  if (as?.toLowerCase() !== 'font') {
    return false;
  }
  return !adapter.hasAttribute(element, 'crossorigin');
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
function validateInvalidFontPreload(element, adapter) {
  const warnings = ["Font preloads must have the crossorigin attribute set, even for same-origin fonts."];
  return {
    ruleId: 'valid-font-preload',
    warnings,
    payload: null
  };
}

/**
 * Find an element with matching source using adapter
 * @param {any} parent - Parent element to search within
 * @param {string} sourceUrl - URL to match
 * @param {any} excludeElement - Element to exclude from search
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {any|null} - Matching element or null
 */
function findElementWithSource(parent, sourceUrl, excludeElement, adapter) {
  const children = adapter.getChildren(parent);

  for (const child of children) {
    if (child === excludeElement) {
      continue;
    }

    const tagName = adapter.getTagName(child);

    if (tagName === 'link') {
      const rel = adapter.getAttribute(child, 'rel');
      if (rel && /\b(preload|modulepreload)\b/i.test(rel)) {
        continue;
      }

      const childHref = adapter.getAttribute(child, 'href');
      if (childHref === sourceUrl) {
        return child;
      }
    }

    if (tagName === 'script') {
      const src = adapter.getAttribute(child, 'src');
      if (src === sourceUrl) {
        return child;
      }
    }
  }

  return null;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
function validateDefaultStyle(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;

  const title = adapter.getAttribute(element, "content");
  
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
    warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
  }

  warnings.push(
    "Even when used correctly, the default-style method of setting a preferred stylesheet results in a flash of unstyled content. Use modern CSS features like @media rules instead."
  );

  return { ruleId: 'no-default-style', warnings, payload };
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
function validateContentType(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;
  
  const isCharset = adapter.hasAttribute(element, 'charset');
  const httpEquiv = adapter.getAttribute(element, 'http-equiv');
  const isContentTypeMeta = httpEquiv?.toLowerCase() === 'content-type';
  
  if (isCharset || isContentTypeMeta) {
    const siblings = adapter.getSiblings(element);
    const hasDuplicateCharset = siblings.some(sibling => {
      if (adapter.getTagName(sibling) !== 'meta') return false;
      if (adapter.hasAttribute(sibling, 'charset')) return true;
      const siblingHttpEquiv = adapter.getAttribute(sibling, 'http-equiv');
      return siblingHttpEquiv?.toLowerCase() === 'content-type';
    });
    
    if (hasDuplicateCharset) {
      const parent = adapter.getParent(element);
      if (parent) {
        const charsetElements = adapter.getChildren(parent).filter((/** @type {any} */ child) => {
          if (adapter.getTagName(child) !== 'meta') return false;
          if (adapter.hasAttribute(child, 'charset')) return true;
          const childHttpEquiv = adapter.getAttribute(child, 'http-equiv');
          return childHttpEquiv?.toLowerCase() === 'content-type';
        });
        const encodingDeclaration = charsetElements.find((/** @type {any} */ el) => el !== element);
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
    warnings[warnings.length - 1] +=
      "\nLearn more: https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration";
  }

  return { ruleId: 'valid-charset', warnings, payload };
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
function validateHttpEquiv(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  const type = adapter.getAttribute(element, "http-equiv")?.toLowerCase() || '';
  const content = adapter.getAttribute(element, "content")?.toLowerCase();

  switch (type) {
    case "content-security-policy":
    case "content-security-policy-report-only":
    case "origin-trial":
    case "content-type":
    case "default-style":
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
    ruleId: 'no-invalid-http-equiv',
    warnings,
  };
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
function validateMetaViewport(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;

  const siblings = adapter.getSiblings(element);
  const hasDuplicateViewport = siblings.some(sibling => {
    if (adapter.getTagName(sibling) !== 'meta') return false;
    const name = adapter.getAttribute(sibling, 'name');
    return name?.toLowerCase() === 'viewport';
  });
  
  if (hasDuplicateViewport) {
    const parent = adapter.getParent(element);
    if (parent) {
      const viewportElements = adapter.getChildren(parent).filter((/** @type {any} */ child) => {
        if (adapter.getTagName(child) !== 'meta') return false;
        const name = adapter.getAttribute(child, 'name');
        return name?.toLowerCase() === 'viewport';
      });
      const firstMetaViewport = viewportElements.find((/** @type {any} */ el) => el !== element);
      if (firstMetaViewport) {
        payload = { firstMetaViewport };
        warnings.push(
          "Another meta viewport element has already been declared. Having multiple viewport settings can lead to unexpected behavior."
        );
        return { warnings, payload };
      }
    }
  }

  const content = adapter.getAttribute(element, "content")?.toLowerCase();
  if (!content) {
    warnings.push("Invalid viewport. The content attribute must be set.");
    return { warnings, payload };
  }

  /** @type {Record<string, string>} */
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
      warnings.push(
        `Disabling zoom levels under 2x can cause accessibility issues. Found "maximum-scale=${directives["maximum-scale"]}".`
      );
    }
  }

  if ("user-scalable" in directives) {
    const userScalable = directives["user-scalable"];
    if (userScalable == "no" || userScalable == "0") {
      warnings.push(
        `Disabling zooming can cause accessibility issues to users with visual impairments. Found "user-scalable=${userScalable}".`
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
        return false;
      }
      if (directive == "shrink-to-fit") {
        return false;
      }
      if (directive == "viewport-fit") {
        return false;
      }
      return true;
    })
    .forEach((directive) => {
      warnings.push(`Invalid viewport directive "${directive}".`);
    });

  return { ruleId: 'valid-meta-viewport', warnings, payload };
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @returns {CustomValidationResult}
 */
function validateUnnecessaryPreload(element, adapter, parentElement = null) {
  const href = adapter.getAttribute(element, "href");
  if (!href) {
    return { ruleId: 'no-unnecessary-preload', warnings: [] };
  }
  const parent = parentElement || adapter.getParent(element);
  if (!parent) {
    return { ruleId: 'no-unnecessary-preload', warnings: [] };
  }
  const preloadedElement = findElementWithSource(parent, href, element, adapter);
  if (!preloadedElement) {
    return { ruleId: 'no-unnecessary-preload', warnings: [] };
  }
  return {
    ruleId: 'no-unnecessary-preload',
    warnings: [
      `This preload has little to no effect. ${href} is already discoverable by another ${adapter.getTagName(preloadedElement)} element.`,
    ],
  };
}
