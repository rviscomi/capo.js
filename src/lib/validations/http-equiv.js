/**
 * @typedef {import('../../adapters/adapter.js').AdapterInterface} AdapterInterface
 * @typedef {import('../validation.js').CustomValidationResult} CustomValidationResult
 */

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isHttpEquiv(element, adapter) {
  if (adapter.getTagName(element) !== "meta") return false;
  return adapter.hasAttribute(element, "http-equiv");
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
export function validateHttpEquiv(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  const type = adapter.getAttribute(element, "http-equiv")?.toLowerCase() || "";
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
          "This doesn't do anything. The content attribute must be set. However, using refresh is discouraged.",
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
      if (content === "on") {
        warnings.push(`DNS prefetching is enabled by default. Setting it to "${content}" has no effect.`);
      } else if (content !== "off") {
        warnings.push(
          `This is a non-standard way of disabling DNS prefetching, which is a performance optimization. Found content="${content}". Use content="off" if you have a legitimate security concern, otherwise remove it.`,
        );
      } else {
        warnings.push(
          "This is non-standard, however most browsers support disabling speculative DNS prefetching. It should still be noted that DNS prefetching is a generally accepted performance optimization and you should only disable it if you have specific security concerns.",
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
        "This is non-standard and may not work across browsers. http-equiv is not an alternative to HTTP headers.",
      );
      break;
  }

  return {
    ruleId: "no-invalid-http-equiv",
    warnings,
  };
}
