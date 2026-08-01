/**
 * @typedef {import('../../adapters/adapter.js').AdapterInterface} AdapterInterface
 * @typedef {import('../validation.js').CustomValidationResult} CustomValidationResult
 */

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */
export function validateCSP(element, adapter) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {any} */
  let payload = null;

  const httpEquiv = adapter.getAttribute(element, "http-equiv");
  const httpEquivLower = httpEquiv?.toLowerCase();

  if (httpEquivLower === "content-security-policy-report-only") {
    warnings.push("CSP Report-Only is forbidden in meta tags");
    return {
      ruleId: "no-meta-csp",
      warnings,
      payload,
    };
  }

  if (httpEquivLower === "content-security-policy") {
    warnings.push("meta CSP discouraged. See https://crbug.com/1458493.");
  }

  const content = adapter.getAttribute(element, "content");
  if (!content) {
    warnings.push("Invalid CSP. The content attribute must be set.");
    return { ruleId: "no-meta-csp", warnings, payload };
  }

  /** @type {Record<string, string>} */
  const directives = Object.fromEntries(
    content.split(/\s*;\s*/).map((directive) => {
      const [key, ...value] = directive.split(" ");
      return [key, value.join(" ")];
    }),
  );
  payload = payload ?? {};
  payload.directives = directives;

  if ("report-uri" in directives) {
    warnings.push(
      "The report-uri directive is not supported. Use the Content-Security-Policy-Report-Only HTTP header instead.",
    );
  }
  if ("frame-ancestors" in directives) {
    warnings.push(
      "The frame-ancestors directive is not supported. Use the Content-Security-Policy HTTP header instead.",
    );
  }
  if ("sandbox" in directives) {
    warnings.push("The sandbox directive is not supported. Use the Content-Security-Policy HTTP header instead.");
  }

  return {
    ruleId: "no-meta-csp",
    warnings,
    payload,
  };
}
