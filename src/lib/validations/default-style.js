/**
 * @typedef {import('../../adapters/adapter.js').AdapterInterface} AdapterInterface
 * @typedef {import('../validation.js').CustomValidationResult} CustomValidationResult
 */

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */
export function isDefaultStyle(element, adapter) {
  if (adapter.getTagName(element) !== "meta") return false;
  const httpEquiv = adapter.getAttribute(element, "http-equiv");
  return httpEquiv?.toLowerCase() === "default-style";
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
export function validateDefaultStyle(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;

  const title = adapter.getAttribute(element, "content");

  if (!title) {
    warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
  } else {
    const parent = adapter.getParent(element);
    let stylesheet = null;
    let alternateStylesheets = [];

    if (parent) {
      const children = adapter.getChildren(parent);
      alternateStylesheets = children.filter((child) => {
        if (adapter.getTagName(child) !== "link") return false;
        const rel = adapter.getAttribute(child, "rel") || "";
        const rels = rel.toLowerCase().split(/\s+/);
        return rels.includes("alternate") && rels.includes("stylesheet");
      });

      stylesheet = alternateStylesheets.find((child) => adapter.getAttribute(child, "title") === title);
    }

    if (!stylesheet) {
      payload = {
        alternateStylesheets,
      };
      warnings.push(`This has no effect. No alternate stylesheet found having title="${title}".`);
    }
  }

  warnings.push(
    "Even when used correctly, the default-style method of setting a preferred stylesheet results in a flash of unstyled content. Use modern CSS features like @media rules instead.",
  );

  return { ruleId: "no-default-style", warnings, payload };
}
