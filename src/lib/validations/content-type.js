/**
 * @typedef {import('../../adapters/adapter.js').AdapterInterface} AdapterInterface
 * @typedef {import('../validation.js').CustomValidationResult} CustomValidationResult
 */

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isContentType(element, adapter) {
  if (adapter.getTagName(element) !== "meta") return false;
  if (adapter.hasAttribute(element, "charset")) return true;
  const httpEquiv = adapter.getAttribute(element, "http-equiv");
  return httpEquiv?.toLowerCase() === "content-type";
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
export function validateContentType(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;

  const isCharset = adapter.hasAttribute(element, "charset");
  const httpEquiv = adapter.getAttribute(element, "http-equiv");
  const isContentTypeMeta = httpEquiv?.toLowerCase() === "content-type";

  if (isCharset || isContentTypeMeta) {
    const siblings = adapter.getSiblings(element);
    const hasDuplicateCharset = siblings.some((sibling) => {
      if (adapter.getTagName(sibling) !== "meta") return false;
      if (adapter.hasAttribute(sibling, "charset")) return true;
      const siblingHttpEquiv = adapter.getAttribute(sibling, "http-equiv");
      return siblingHttpEquiv?.toLowerCase() === "content-type";
    });

    if (hasDuplicateCharset) {
      const parent = adapter.getParent(element);
      if (parent) {
        const charsetElements = adapter.getChildren(parent).filter((/** @type {any} */ child) => {
          if (adapter.getTagName(child) !== "meta") return false;
          if (adapter.hasAttribute(child, "charset")) return true;
          const childHttpEquiv = adapter.getAttribute(child, "http-equiv");
          return childHttpEquiv?.toLowerCase() === "content-type";
        });
        const encodingDeclaration = charsetElements.find((/** @type {any} */ el) => el !== element);
        if (encodingDeclaration) {
          payload = payload ?? {};
          payload.encodingDeclaration = encodingDeclaration;
          warnings.push(
            `There can only be one meta-based character encoding declaration per document. Already found \`${adapter.stringify(encodingDeclaration)}\`.`,
          );
        }
      }
    }
  }

  if (typeof adapter.getCharacterPosition === "function") {
    const charPos = adapter.getCharacterPosition(element);
    if (charPos !== null && charPos > 1024) {
      payload = payload ?? {};
      payload.characterPosition = charPos;
      warnings.push(
        `The element containing the character encoding declaration must be serialized completely within the first 1024 bytes of the document. Found at byte ${charPos}.`,
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

  if (charset?.toLowerCase() !== "utf-8") {
    payload = payload ?? {};
    payload.charset = charset;
    warnings.push(`Documents are required to use UTF-8 encoding. Found "${charset}".`);
  }

  if (warnings.length) {
    warnings[warnings.length - 1] +=
      "\nLearn more: https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration";
  }

  return { ruleId: "valid-charset", warnings, payload };
}
