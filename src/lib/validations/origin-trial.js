/**
 * @typedef {import('../../adapters/adapter.js').AdapterInterface} AdapterInterface
 * @typedef {import('../validation.js').CustomValidationResult} CustomValidationResult
 */

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
 * Decode origin trial token payload
 * @param {string|null} token
 * @returns {any}
 */
export function decodeOriginTrialToken(token) {
  if (!token) throw new Error("Missing token");
  const buffer = new Uint8Array([...atob(token)].map((a) => a.charCodeAt(0)));
  const view = new DataView(buffer.buffer);
  const length = view.getUint32(65, false);
  const payload = JSON.parse(new TextDecoder().decode(buffer.slice(69, 69 + length)));
  payload.expiry = new Date(payload.expiry * 1000);
  return payload;
}

/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {string|null} [pageOrigin=null]
 * @returns {CustomValidationResult}
 */
export function validateOriginTrial(element, adapter, pageOrigin = null) {
  /** @type {CustomValidationResult} */
  const metadata = {
    ruleId: "no-invalid-origin-trial",
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

  const targetOrigin = pageOrigin || (typeof document !== "undefined" && document.location && document.location.href);
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
