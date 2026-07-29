/**
 * Capo.js v2 - DOM-agnostic HTML <head> analyzer
 * 
 * Main entry point for programmatic usage.
 * Exports both the core analyzer API and adapter implementations.
 * 
 * @module capo
 */ // Core Analysis API
/**
 * Core DOM-agnostic analyzer for capo.js
 * Provides single-pass analysis of HTML <head> elements
 * 
 * @module analyzer
 */ /**
 * @typedef {import('../adapters/adapter.js').AdapterInterface} AdapterInterface
 */ /** @type {Record<string, number>} */ const $ee7e0c73e51ebfda$export$881088883fcab450 = {
    META: 10,
    TITLE: 9,
    PRECONNECT: 8,
    ASYNC_SCRIPT: 7,
    IMPORT_STYLES: 6,
    SYNC_SCRIPT: 5,
    SYNC_STYLES: 4,
    PRELOAD: 3,
    DEFER_SCRIPT: 2,
    PREFETCH_PRERENDER: 1,
    OTHER: 0
};
const $ee7e0c73e51ebfda$export$b7417cf4a2235f73 = [
    'accept-ch',
    'content-security-policy',
    'content-type',
    'default-style',
    'delegate-ch',
    'origin-trial',
    'x-dns-prefetch-control'
];
function $ee7e0c73e51ebfda$export$daeb0db0c224decd(element, adapter) {
    const tagName = adapter.getTagName(element);
    if (tagName === 'base') return true;
    if (tagName !== 'meta') return false;
    if (adapter.hasAttribute(element, 'charset')) return true;
    const name = adapter.getAttribute(element, 'name');
    if (name && name.toLowerCase() === 'viewport') return true;
    const httpEquiv = adapter.getAttribute(element, 'http-equiv');
    if (httpEquiv) {
        const normalizedValue = httpEquiv.toLowerCase();
        return $ee7e0c73e51ebfda$export$b7417cf4a2235f73.includes(normalizedValue);
    }
    return false;
}
function $ee7e0c73e51ebfda$export$e55aad21605f020a(element, adapter) {
    return adapter.getTagName(element) === 'title';
}
function $ee7e0c73e51ebfda$export$a3316bd0a640eb8b(element, adapter) {
    if (adapter.getTagName(element) !== 'link') return false;
    const rel = adapter.getAttribute(element, 'rel');
    return rel?.toLowerCase() === 'preconnect';
}
function $ee7e0c73e51ebfda$export$20e2051ffd813ee3(element, adapter) {
    return adapter.getTagName(element) === 'script' && adapter.hasAttribute(element, 'src') && adapter.hasAttribute(element, 'async');
}
function $ee7e0c73e51ebfda$export$be443fc6335656f0(element, adapter) {
    const importRe = /@import/;
    const tagName = adapter.getTagName(element);
    if (tagName === 'style') {
        const media = adapter.getAttribute(element, 'media');
        if (media && media.toLowerCase().trim() === 'print') return false;
        return importRe.test(adapter.getTextContent(element));
    }
    if (tagName === 'link') {
        const rel = adapter.getAttribute(element, 'rel');
        if (rel?.toLowerCase() === 'stylesheet') {
            const media = adapter.getAttribute(element, 'media');
            if (media && media.toLowerCase().trim() === 'print') return false;
            const sheet = adapter.getSheet(element);
            if (sheet) try {
                const cssRules = sheet.cssRules || sheet.rules;
                if (cssRules) for (const rule of cssRules){
                    if (rule.type === 3 || typeof CSSImportRule !== 'undefined' && rule instanceof CSSImportRule || rule.cssText && importRe.test(rule.cssText)) return true;
                }
            } catch (e) {
            // Ignore CORS security errors when accessing cross-origin cssRules
            }
            // Check textContent in case a custom adapter or non-browser parser populated CSS text on link
            const textContent = adapter.getTextContent(element);
            if (textContent && importRe.test(textContent)) return true;
        }
    }
    return false;
}
function $ee7e0c73e51ebfda$export$65983fc0a5543400(element, adapter) {
    if (adapter.getTagName(element) !== 'script') return false;
    if (adapter.hasAttribute(element, 'src') && adapter.hasAttribute(element, 'defer')) return false;
    if (adapter.hasAttribute(element, 'src')) {
        const type = adapter.getAttribute(element, 'type');
        if (type && type.toLowerCase() === 'module') return false;
    }
    if (adapter.hasAttribute(element, 'src') && adapter.hasAttribute(element, 'async')) return false;
    const type = adapter.getAttribute(element, 'type');
    if (type && type.toLowerCase().includes('json')) return false;
    return true;
}
function $ee7e0c73e51ebfda$export$9d6cdbffb13bee21(element, adapter) {
    const tagName = adapter.getTagName(element);
    if (tagName === 'style') {
        const media = adapter.getAttribute(element, 'media');
        if (media && media.toLowerCase().trim() === 'print') return false;
        return true;
    }
    if (tagName === 'link') {
        const rel = adapter.getAttribute(element, 'rel');
        if (rel?.toLowerCase() === 'stylesheet') {
            const media = adapter.getAttribute(element, 'media');
            if (media && media.toLowerCase().trim() === 'print') return false;
            return true;
        }
    }
    return false;
}
function $ee7e0c73e51ebfda$export$226ad5ba23be83f0(element, adapter) {
    if (adapter.getTagName(element) !== 'link') return false;
    const rel = adapter.getAttribute(element, 'rel');
    if (!rel) return false;
    const relLower = rel.toLowerCase();
    return relLower === 'preload' || relLower === 'modulepreload';
}
function $ee7e0c73e51ebfda$export$3d269f86e8bd1d24(element, adapter) {
    if (adapter.getTagName(element) !== 'script') return false;
    if (!adapter.hasAttribute(element, 'src')) return false;
    if (adapter.hasAttribute(element, 'defer')) return true;
    const type = adapter.getAttribute(element, 'type');
    if (type && type.toLowerCase() === 'module') return !adapter.hasAttribute(element, 'async');
    return false;
}
function $ee7e0c73e51ebfda$export$4d2ed086e1fec499(element, adapter) {
    if (adapter.getTagName(element) !== 'link') return false;
    const rel = adapter.getAttribute(element, 'rel');
    if (!rel) return false;
    const relLower = rel.toLowerCase();
    return relLower === 'prefetch' || relLower === 'dns-prefetch' || relLower === 'prerender';
}
function $ee7e0c73e51ebfda$export$38a04d482ec50f88(element, adapter) {
    if (adapter.getTagName(element) !== 'meta') return false;
    const httpEquiv = adapter.getAttribute(element, 'http-equiv');
    return httpEquiv?.toLowerCase() === 'origin-trial';
}
function $ee7e0c73e51ebfda$export$14b1a2f64a600585(element, adapter) {
    if (adapter.getTagName(element) !== 'meta') return false;
    const httpEquiv = adapter.getAttribute(element, 'http-equiv');
    if (!httpEquiv) return false;
    const httpEquivLower = httpEquiv.toLowerCase();
    return httpEquivLower === 'content-security-policy' || httpEquivLower === 'content-security-policy-report-only';
}
const $ee7e0c73e51ebfda$export$6ade8bb3620eb74b = {
    META: $ee7e0c73e51ebfda$export$daeb0db0c224decd,
    TITLE: $ee7e0c73e51ebfda$export$e55aad21605f020a,
    PRECONNECT: $ee7e0c73e51ebfda$export$a3316bd0a640eb8b,
    ASYNC_SCRIPT: $ee7e0c73e51ebfda$export$20e2051ffd813ee3,
    IMPORT_STYLES: $ee7e0c73e51ebfda$export$be443fc6335656f0,
    SYNC_SCRIPT: $ee7e0c73e51ebfda$export$65983fc0a5543400,
    SYNC_STYLES: $ee7e0c73e51ebfda$export$9d6cdbffb13bee21,
    PRELOAD: $ee7e0c73e51ebfda$export$226ad5ba23be83f0,
    DEFER_SCRIPT: $ee7e0c73e51ebfda$export$3d269f86e8bd1d24,
    PREFETCH_PRERENDER: $ee7e0c73e51ebfda$export$4d2ed086e1fec499
};
function $ee7e0c73e51ebfda$export$de32fe5d64aee40c(element, adapter) {
    for (let [id, detector] of Object.entries($ee7e0c73e51ebfda$export$6ade8bb3620eb74b)){
        if (detector(element, adapter)) return $ee7e0c73e51ebfda$export$881088883fcab450[id];
    }
    return $ee7e0c73e51ebfda$export$881088883fcab450.OTHER;
}
function $ee7e0c73e51ebfda$export$5cc4a311ddbe699c(head, adapter) {
    const headChildren = adapter.getChildren(head);
    return headChildren.filter((element)=>{
        const tagName = adapter.getTagName(element);
        return tagName && tagName !== '';
    }).map((element)=>{
        return {
            element: element,
            weight: $ee7e0c73e51ebfda$export$de32fe5d64aee40c(element, adapter)
        };
    });
}



const $c322f9a5057eaf5c$export$79e124b7caef7aa9 = new Set([
    "base",
    "link",
    "meta",
    "noscript",
    "script",
    "style",
    "template",
    "title"
]);
const $c322f9a5057eaf5c$export$2f975f13375faaa1 = 'meta[http-equiv="content-type" i], meta[charset]';
const $c322f9a5057eaf5c$export$9739336dee0b3205 = "meta[http-equiv]";
const $c322f9a5057eaf5c$export$5540ac2a18901364 = 'link:is([rel="preload" i], [rel="modulepreload" i])';
function $c322f9a5057eaf5c$export$a8257692ac88316c(element, adapter) {
    const tagName = adapter.getTagName(element);
    // Text nodes and comment nodes are valid (they don't have tag names)
    if (!tagName || tagName === '') return true;
    return $c322f9a5057eaf5c$export$79e124b7caef7aa9.has(tagName.toLowerCase());
}
/**
 * Check if element has any invalid child elements
 * @param {any} element - Element to check
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$hasInvalidChildren(element, adapter) {
    const children = adapter.getChildren(element);
    return children.some((child)=>!$c322f9a5057eaf5c$export$a8257692ac88316c(child, adapter));
}
/**
 * Check if this is a duplicate title element (2nd+ occurrence)
 * @param {any} element - Element to check
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isDuplicateTitle(element, adapter) {
    if (adapter.getTagName(element) !== 'title') return false;
    const parent = adapter.getParent(element);
    if (!parent) return false;
    // Check if this is the first title element
    let foundFirst = false;
    for (const child of adapter.getChildren(parent))if (adapter.getTagName(child) === 'title') {
        if (child === element) // This is the element we're checking - it's a duplicate if we already found a title
        return foundFirst;
        // Found a title element - mark that we've seen one
        foundFirst = true;
    }
    return false;
}
/**
 * Check if this is a duplicate base element
 * @param {any} element - Element to check  
 * @param {AdapterInterface} adapter - Adapter instance
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isDuplicateBase(element, adapter) {
    if (adapter.getTagName(element) !== 'base') return false;
    const siblings = adapter.getSiblings(element);
    return siblings.some((sibling)=>adapter.getTagName(sibling) === 'base');
}
function $c322f9a5057eaf5c$export$eeefd08c3a6f8db7(element, adapter, pageOrigin = null) {
    // Element itself is not valid.
    if (!$c322f9a5057eaf5c$export$a8257692ac88316c(element, adapter)) return true;
    // Children are not valid.
    if ($c322f9a5057eaf5c$var$hasInvalidChildren(element, adapter)) return true;
    // <title> is not the first of its type.
    if ($c322f9a5057eaf5c$var$isDuplicateTitle(element, adapter)) return true;
    // <base> is not the first of its type.
    if ($c322f9a5057eaf5c$var$isDuplicateBase(element, adapter)) return true;
    // CSP meta tag anywhere.
    if ((0, $ee7e0c73e51ebfda$export$14b1a2f64a600585)(element, adapter)) return true;
    // Invalid http-equiv.
    if ($c322f9a5057eaf5c$var$isInvalidHttpEquiv(element, adapter)) return true;
    // Invalid meta viewport.
    if ($c322f9a5057eaf5c$var$isInvalidMetaViewport(element, adapter)) return true;
    // Invalid default-style.
    if ($c322f9a5057eaf5c$var$isInvalidDefaultStyle(element, adapter)) return true;
    // Invalid character encoding.
    if ($c322f9a5057eaf5c$var$isInvalidContentType(element, adapter)) return true;
    // Origin trial expired, or invalid origin.
    if ($c322f9a5057eaf5c$var$isInvalidOriginTrial(element, adapter, pageOrigin)) return true;
    // Preload is unnecessary.
    if ($c322f9a5057eaf5c$var$isUnnecessaryPreload(element, adapter)) return true;
    // Preload is missing crossorigin.
    if ($c322f9a5057eaf5c$var$isInvalidFontPreload(element, adapter)) return true;
    return false;
}
function $c322f9a5057eaf5c$export$b01ab94d0cd042a0(head, adapter) {
    /** @type {ValidationWarningResult[]} */ const validationWarnings = [];
    // Get all children of head element
    const children = adapter.getChildren(head);
    // Check for title elements
    const titleElements = children.filter((child)=>adapter.getTagName(child) === 'title');
    const titleElementCount = titleElements.length;
    if (titleElementCount != 1) validationWarnings.push({
        ruleId: titleElementCount === 0 ? 'require-title' : 'no-duplicate-title',
        warning: `Expected exactly 1 <title> element, found ${titleElementCount}`,
        elements: titleElements
    });
    // Check for meta viewport
    const metaViewport = children.filter((child)=>{
        if (adapter.getTagName(child) !== 'meta') return false;
        const name = adapter.getAttribute(child, 'name');
        return name && name.toLowerCase() === 'viewport';
    });
    if (metaViewport.length != 1) validationWarnings.push({
        ruleId: metaViewport.length === 0 ? 'require-meta-viewport' : 'valid-meta-viewport',
        warning: `Expected exactly 1 <meta name=viewport> element, found ${metaViewport.length}`,
        elements: metaViewport
    });
    // Check for base elements
    const baseElements = children.filter((child)=>adapter.getTagName(child) === 'base');
    const baseElementCount = baseElements.length;
    if (baseElementCount > 1) validationWarnings.push({
        ruleId: 'no-duplicate-base',
        warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
        elements: baseElements
    });
    // Check for invalid elements
    children.forEach((element)=>{
        if ($c322f9a5057eaf5c$export$a8257692ac88316c(element, adapter)) {
            const elementChildren = adapter.getChildren(element);
            elementChildren.forEach((child)=>{
                if (!$c322f9a5057eaf5c$export$a8257692ac88316c(child, adapter)) validationWarnings.push({
                    ruleId: 'no-invalid-head-elements',
                    warning: `${adapter.getTagName(child).toUpperCase()} elements are not allowed in the <head>`,
                    element: element
                });
            });
            return;
        }
        validationWarnings.push({
            ruleId: 'no-invalid-head-elements',
            warning: `${adapter.getTagName(element)} elements are not allowed in the <head>`,
            element: element
        });
    });
    return validationWarnings;
}
function $c322f9a5057eaf5c$export$6c93e2175c028eeb(element, adapter, parentElement = null, pageOrigin = null) {
    /** @type {CustomValidationResult[]} */ const results = [];
    if ((0, $ee7e0c73e51ebfda$export$38a04d482ec50f88)(element, adapter)) results.push($c322f9a5057eaf5c$var$validateOriginTrial(element, adapter, pageOrigin));
    if ((0, $ee7e0c73e51ebfda$export$14b1a2f64a600585)(element, adapter)) results.push($c322f9a5057eaf5c$var$validateCSP(element, adapter));
    if ($c322f9a5057eaf5c$var$isDefaultStyle(element, adapter)) results.push($c322f9a5057eaf5c$var$validateDefaultStyle(element, adapter));
    if ($c322f9a5057eaf5c$var$isMetaViewport(element, adapter)) results.push($c322f9a5057eaf5c$var$validateMetaViewport(element, adapter));
    if ($c322f9a5057eaf5c$var$isContentType(element, adapter)) results.push($c322f9a5057eaf5c$var$validateContentType(element, adapter));
    if ($c322f9a5057eaf5c$var$isHttpEquiv(element, adapter)) results.push($c322f9a5057eaf5c$var$validateHttpEquiv(element, adapter));
    if ($c322f9a5057eaf5c$var$isUnnecessaryPreload(element, adapter, parentElement)) results.push($c322f9a5057eaf5c$var$validateUnnecessaryPreload(element, adapter, parentElement));
    if ($c322f9a5057eaf5c$var$isInvalidFontPreload(element, adapter)) results.push($c322f9a5057eaf5c$var$validateInvalidFontPreload(element, adapter));
    if (results.length === 0) return {};
    if (results.length === 1) return results[0];
    // Merge results
    /** @type {CustomValidationResult} */ const combined = {
        warnings: [],
        payload: {},
        ruleId: results[0].ruleId
    };
    results.forEach((result)=>{
        if (result.warnings) combined.warnings?.push(...result.warnings);
        if (result.payload) Object.assign(combined.payload, result.payload);
    });
    return combined;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateCSP(element, adapter) {
    /** @type {string[]} */ const warnings = [];
    /** @type {any} */ let payload = null;
    const httpEquiv = adapter.getAttribute(element, 'http-equiv');
    const httpEquivLower = httpEquiv?.toLowerCase();
    if (httpEquivLower === 'content-security-policy-report-only') {
        warnings.push("CSP Report-Only is forbidden in meta tags");
        return {
            ruleId: 'no-meta-csp',
            warnings: warnings,
            payload: payload
        };
    }
    if (httpEquivLower === 'content-security-policy') warnings.push("meta CSP discouraged. See https://crbug.com/1458493.");
    const content = adapter.getAttribute(element, "content");
    if (!content) {
        warnings.push("Invalid CSP. The content attribute must be set.");
        return {
            warnings: warnings,
            payload: payload
        };
    }
    /** @type {Record<string, string>} */ const directives = Object.fromEntries(content.split(/\s*;\s*/).map((directive)=>{
        const [key, ...value] = directive.split(" ");
        return [
            key,
            value.join(" ")
        ];
    }));
    payload = payload ?? {};
    payload.directives = directives;
    if ("report-uri" in directives) warnings.push("The report-uri directive is not supported. Use the Content-Security-Policy-Report-Only HTTP header instead.");
    if ("frame-ancestors" in directives) warnings.push("The frame-ancestors directive is not supported. Use the Content-Security-Policy HTTP header instead.");
    if ("sandbox" in directives) warnings.push("The sandbox directive is not supported. Use the Content-Security-Policy HTTP header instead.");
    return {
        ruleId: 'no-meta-csp',
        warnings: warnings,
        payload: payload
    };
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {string|null} [pageOrigin=null]
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isInvalidOriginTrial(element, adapter, pageOrigin = null) {
    if (!(0, $ee7e0c73e51ebfda$export$38a04d482ec50f88)(element, adapter)) return false;
    const { warnings: warnings } = $c322f9a5057eaf5c$var$validateOriginTrial(element, adapter, pageOrigin);
    return (warnings?.length ?? 0) > 0;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {string|null} [pageOrigin=null]
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateOriginTrial(element, adapter, pageOrigin = null) {
    /** @type {CustomValidationResult} */ const metadata = {
        ruleId: 'no-invalid-origin-trial',
        payload: null,
        warnings: []
    };
    const token = adapter.getAttribute(element, "content");
    try {
        metadata.payload = $c322f9a5057eaf5c$var$decodeOriginTrialToken(token);
    } catch  {
        metadata.warnings?.push("Invalid origin trial token: invalid token");
        return metadata;
    }
    if (metadata.payload.expiry < new Date()) metadata.warnings?.push("Invalid origin trial token: expired");
    const targetOrigin = pageOrigin || typeof document !== 'undefined' && document.location && document.location.href;
    if (targetOrigin) {
        if (!$c322f9a5057eaf5c$var$isSameOrigin(metadata.payload.origin, targetOrigin)) {
            const subdomain = $c322f9a5057eaf5c$var$isSubdomain(metadata.payload.origin, targetOrigin);
            if (subdomain && !metadata.payload.isSubdomain) metadata.warnings?.push("Invalid origin trial token: invalid subdomain");
            else if (!subdomain && !metadata.payload.isThirdParty) metadata.warnings?.push("Invalid origin trial token: invalid third-party origin");
        }
    }
    return metadata;
}
/**
 * Decode origin trial token payload
 * @param {string|null} token
 * @returns {any}
 */ function $c322f9a5057eaf5c$var$decodeOriginTrialToken(token) {
    if (!token) throw new Error("Missing token");
    const buffer = new Uint8Array([
        ...atob(token)
    ].map((a)=>a.charCodeAt(0)));
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
 */ function $c322f9a5057eaf5c$var$isSameOrigin(a, b) {
    return new URL(a).origin === new URL(b).origin;
}
/**
 * @param {string} tokenOrigin - Origin from origin trial token (e.g., https://youtube.com:443)
 * @param {string} pageUrl - Page URL or origin (e.g., https://www.youtube.com)
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isSubdomain(tokenOrigin, pageUrl) {
    const urlA = new URL(tokenOrigin);
    const urlB = new URL(pageUrl);
    return urlB.host.endsWith(`.${urlA.host}`);
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isDefaultStyle(element, adapter) {
    if (adapter.getTagName(element) !== 'meta') return false;
    const httpEquiv = adapter.getAttribute(element, 'http-equiv');
    return httpEquiv?.toLowerCase() === 'default-style';
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isContentType(element, adapter) {
    if (adapter.getTagName(element) !== 'meta') return false;
    if (adapter.hasAttribute(element, 'charset')) return true;
    const httpEquiv = adapter.getAttribute(element, 'http-equiv');
    return httpEquiv?.toLowerCase() === 'content-type';
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isHttpEquiv(element, adapter) {
    if (adapter.getTagName(element) !== 'meta') return false;
    return adapter.hasAttribute(element, 'http-equiv');
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isMetaViewport(element, adapter) {
    if (adapter.getTagName(element) !== 'meta') return false;
    const name = adapter.getAttribute(element, 'name');
    return name?.toLowerCase() === 'viewport';
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isInvalidDefaultStyle(element, adapter) {
    if (!$c322f9a5057eaf5c$var$isDefaultStyle(element, adapter)) return false;
    const { warnings: warnings } = $c322f9a5057eaf5c$var$validateDefaultStyle(element, adapter);
    return (warnings?.length ?? 0) > 0;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isInvalidContentType(element, adapter) {
    if (!$c322f9a5057eaf5c$var$isContentType(element, adapter)) return false;
    const { warnings: warnings } = $c322f9a5057eaf5c$var$validateContentType(element, adapter);
    return (warnings?.length ?? 0) > 0;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isInvalidHttpEquiv(element, adapter) {
    if (!$c322f9a5057eaf5c$var$isHttpEquiv(element, adapter)) return false;
    const { warnings: warnings } = $c322f9a5057eaf5c$var$validateHttpEquiv(element, adapter);
    return (warnings?.length ?? 0) > 0;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isInvalidMetaViewport(element, adapter) {
    if (!$c322f9a5057eaf5c$var$isMetaViewport(element, adapter)) return false;
    const { warnings: warnings } = $c322f9a5057eaf5c$var$validateMetaViewport(element, adapter);
    return (warnings?.length ?? 0) > 0;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isUnnecessaryPreload(element, adapter, parentElement = null) {
    const tagName = adapter.getTagName(element);
    if (tagName !== 'link') return false;
    const rel = adapter.getAttribute(element, 'rel');
    const relLower = rel?.toLowerCase();
    if (relLower !== 'preload' && relLower !== 'modulepreload') return false;
    const href = adapter.getAttribute(element, "href");
    if (!href) return false;
    const parent = parentElement || adapter.getParent(element);
    if (!parent) return false;
    const found = $c322f9a5057eaf5c$var$findElementWithSource(parent, href, element, adapter);
    return found != null;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {boolean}
 */ function $c322f9a5057eaf5c$var$isInvalidFontPreload(element, adapter) {
    const tagName = adapter.getTagName(element);
    if (tagName !== 'link') return false;
    const rel = adapter.getAttribute(element, 'rel');
    if (rel?.toLowerCase() !== 'preload') return false;
    const as = adapter.getAttribute(element, 'as');
    if (as?.toLowerCase() !== 'font') return false;
    return !adapter.hasAttribute(element, 'crossorigin');
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateInvalidFontPreload(element, adapter) {
    const warnings = [
        "Font preloads must have the crossorigin attribute set, even for same-origin fonts."
    ];
    return {
        ruleId: 'valid-font-preload',
        warnings: warnings,
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
 */ function $c322f9a5057eaf5c$var$findElementWithSource(parent, sourceUrl, excludeElement, adapter) {
    const children = adapter.getChildren(parent);
    for (const child of children){
        if (child === excludeElement) continue;
        const tagName = adapter.getTagName(child);
        if (tagName === 'link') {
            const rel = adapter.getAttribute(child, 'rel');
            if (rel && /\b(preload|modulepreload)\b/i.test(rel)) continue;
            const childHref = adapter.getAttribute(child, 'href');
            if (childHref === sourceUrl) return child;
        }
        if (tagName === 'script') {
            const src = adapter.getAttribute(child, 'src');
            if (src === sourceUrl) return child;
        }
    }
    return null;
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateDefaultStyle(element, adapter) {
    /** @type {string[]} */ const warnings = [];
    /** @type {any} */ let payload = null;
    const title = adapter.getAttribute(element, "content");
    if (element.parentElement && element.parentElement.querySelector) {
        const stylesheet = element.parentElement.querySelector(`link[rel~="alternate" i][rel~="stylesheet" i][title="${title}"]`);
        if (!title) warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
        else if (!stylesheet) {
            payload = {
                alternateStylesheets: Array.from(element.parentElement.querySelectorAll('link[rel~="alternate" i][rel~="stylesheet" i]'))
            };
            warnings.push(`This has no effect. No alternate stylesheet found having title="${title}".`);
        }
    } else if (!title) warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
    warnings.push("Even when used correctly, the default-style method of setting a preferred stylesheet results in a flash of unstyled content. Use modern CSS features like @media rules instead.");
    return {
        ruleId: 'no-default-style',
        warnings: warnings,
        payload: payload
    };
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateContentType(element, adapter) {
    /** @type {string[]} */ const warnings = [];
    /** @type {any} */ let payload = null;
    const isCharset = adapter.hasAttribute(element, 'charset');
    const httpEquiv = adapter.getAttribute(element, 'http-equiv');
    const isContentTypeMeta = httpEquiv?.toLowerCase() === 'content-type';
    if (isCharset || isContentTypeMeta) {
        const siblings = adapter.getSiblings(element);
        const hasDuplicateCharset = siblings.some((sibling)=>{
            if (adapter.getTagName(sibling) !== 'meta') return false;
            if (adapter.hasAttribute(sibling, 'charset')) return true;
            const siblingHttpEquiv = adapter.getAttribute(sibling, 'http-equiv');
            return siblingHttpEquiv?.toLowerCase() === 'content-type';
        });
        if (hasDuplicateCharset) {
            const parent = adapter.getParent(element);
            if (parent) {
                const charsetElements = adapter.getChildren(parent).filter((/** @type {any} */ child)=>{
                    if (adapter.getTagName(child) !== 'meta') return false;
                    if (adapter.hasAttribute(child, 'charset')) return true;
                    const childHttpEquiv = adapter.getAttribute(child, 'http-equiv');
                    return childHttpEquiv?.toLowerCase() === 'content-type';
                });
                const encodingDeclaration = charsetElements.find((/** @type {any} */ el)=>el !== element);
                if (encodingDeclaration) {
                    payload = payload ?? {};
                    payload.encodingDeclaration = encodingDeclaration;
                    warnings.push(`There can only be one meta-based character encoding declaration per document. Already found \`${adapter.stringify(encodingDeclaration)}\`.`);
                }
            }
        }
    }
    if (element.ownerDocument?.documentElement?.outerHTML && element.outerHTML) {
        const charPos = element.ownerDocument.documentElement.outerHTML.indexOf(element.outerHTML) + element.outerHTML.length;
        if (charPos > 1024) {
            payload = payload ?? {};
            payload.characterPosition = charPos;
            warnings.push(`The element containing the character encoding declaration must be serialized completely within the first 1024 bytes of the document. Found at byte ${charPos}.`);
        }
    }
    let charset = null;
    if (isCharset) charset = adapter.getAttribute(element, "charset");
    else {
        const charsetPattern = /text\/html;\s*charset=(.*)/i;
        charset = adapter.getAttribute(element, "content")?.match(charsetPattern)?.[1]?.trim();
    }
    if (charset?.toLowerCase() != "utf-8") {
        payload = payload ?? {};
        payload.charset = charset;
        warnings.push(`Documents are required to use UTF-8 encoding. Found "${charset}".`);
    }
    if (warnings.length) warnings[warnings.length - 1] += "\nLearn more: https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration";
    return {
        ruleId: 'valid-charset',
        warnings: warnings,
        payload: payload
    };
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateHttpEquiv(element, adapter) {
    /** @type {string[]} */ const warnings = [];
    const type = adapter.getAttribute(element, "http-equiv")?.toLowerCase() || '';
    const content = adapter.getAttribute(element, "content")?.toLowerCase();
    switch(type){
        case "content-security-policy":
        case "content-security-policy-report-only":
        case "origin-trial":
        case "content-type":
        case "default-style":
            break;
        case "refresh":
            if (!content) {
                warnings.push("This doesn't do anything. The content attribute must be set. However, using refresh is discouraged.");
                break;
            }
            if (content.includes("url=")) warnings.push("Meta auto-redirects are discouraged. Use HTTP 3XX responses instead.");
            else warnings.push("Meta auto-refreshes are discouraged unless users have the ability to disable it.");
            break;
        case "x-dns-prefetch-control":
            if (content == "on") warnings.push(`DNS prefetching is enabled by default. Setting it to "${content}" has no effect.`);
            else if (content != "off") warnings.push(`This is a non-standard way of disabling DNS prefetching, which is a performance optimization. Found content="${content}". Use content="off" if you have a legitimate security concern, otherwise remove it.`);
            else warnings.push("This is non-standard, however most browsers support disabling speculative DNS prefetching. It should still be noted that DNS prefetching is a generally accepted performance optimization and you should only disable it if you have specific security concerns.");
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
            warnings.push("This is non-standard and may not work across browsers. http-equiv is not an alternative to HTTP headers.");
            break;
    }
    return {
        ruleId: 'no-invalid-http-equiv',
        warnings: warnings
    };
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateMetaViewport(element, adapter) {
    /** @type {string[]} */ const warnings = [];
    /** @type {any} */ let payload = null;
    const siblings = adapter.getSiblings(element);
    const hasDuplicateViewport = siblings.some((sibling)=>{
        if (adapter.getTagName(sibling) !== 'meta') return false;
        const name = adapter.getAttribute(sibling, 'name');
        return name?.toLowerCase() === 'viewport';
    });
    if (hasDuplicateViewport) {
        const parent = adapter.getParent(element);
        if (parent) {
            const viewportElements = adapter.getChildren(parent).filter((/** @type {any} */ child)=>{
                if (adapter.getTagName(child) !== 'meta') return false;
                const name = adapter.getAttribute(child, 'name');
                return name?.toLowerCase() === 'viewport';
            });
            const firstMetaViewport = viewportElements.find((/** @type {any} */ el)=>el !== element);
            if (firstMetaViewport) {
                payload = {
                    firstMetaViewport: firstMetaViewport
                };
                warnings.push("Another meta viewport element has already been declared. Having multiple viewport settings can lead to unexpected behavior.");
                return {
                    warnings: warnings,
                    payload: payload
                };
            }
        }
    }
    const content = adapter.getAttribute(element, "content")?.toLowerCase();
    if (!content) {
        warnings.push("Invalid viewport. The content attribute must be set.");
        return {
            warnings: warnings,
            payload: payload
        };
    }
    /** @type {Record<string, string>} */ const directives = Object.fromEntries(content.split(",").map((directive)=>{
        const [key, value] = directive.split("=");
        return [
            key?.trim(),
            value?.trim()
        ];
    }));
    if ("width" in directives) {
        const width = directives["width"];
        if (Number(width) < 1 || Number(width) > 10000) warnings.push(`Invalid width "${width}". Numeric values must be between 1 and 10000.`);
        else if (width != "device-width") warnings.push(`Invalid width "${width}".`);
    }
    if ("height" in directives) {
        const height = directives["height"];
        if (Number(height) < 1 || Number(height) > 10000) warnings.push(`Invalid height "${height}". Numeric values must be between 1 and 10000.`);
        else if (height != "device-height") warnings.push(`Invalid height "${height}".`);
    }
    if ("initial-scale" in directives) {
        const initialScale = Number(directives["initial-scale"]);
        if (isNaN(initialScale)) warnings.push(`Invalid initial zoom level "${directives["initial-scale"]}". Values must be numeric.`);
        if (initialScale < 0.1 || initialScale > 10) warnings.push(`Invalid initial zoom level "${initialScale}". Values must be between 0.1 and 10.`);
    }
    if ("minimum-scale" in directives) {
        const minimumScale = Number(directives["minimum-scale"]);
        if (isNaN(minimumScale)) warnings.push(`Invalid minimum zoom level "${directives["minimum-scale"]}". Values must be numeric.`);
        if (minimumScale < 0.1 || minimumScale > 10) warnings.push(`Invalid minimum zoom level "${minimumScale}". Values must be between 0.1 and 10.`);
    }
    if ("maximum-scale" in directives) {
        const maxScale = Number(directives["maximum-scale"]);
        if (isNaN(maxScale)) warnings.push(`Invalid maximum zoom level "${directives["maximum-scale"]}". Values must be numeric.`);
        if (maxScale < 0.1 || maxScale > 10) warnings.push(`Invalid maximum zoom level "${maxScale}". Values must be between 0.1 and 10.`);
        if (maxScale < 2) warnings.push(`Disabling zoom levels under 2x can cause accessibility issues. Found "maximum-scale=${directives["maximum-scale"]}".`);
    }
    if ("user-scalable" in directives) {
        const userScalable = directives["user-scalable"];
        if (userScalable == "no" || userScalable == "0") warnings.push(`Disabling zooming can cause accessibility issues to users with visual impairments. Found "user-scalable=${userScalable}".`);
        if (![
            "0",
            "1",
            "yes",
            "no"
        ].includes(userScalable)) warnings.push(`Unsupported value "${userScalable}" found.`);
    }
    if ("interactive-widget" in directives) {
        const interactiveWidget = directives["interactive-widget"];
        const validValues = [
            "resizes-visual",
            "resizes-content",
            "overlays-content"
        ];
        if (!validValues.includes(interactiveWidget)) warnings.push(`Unsupported value "${interactiveWidget}" found.`);
    }
    if ("viewport-fit" in directives) {
        const viewportFit = directives["viewport-fit"];
        const validValues = [
            "auto",
            "contain",
            "cover"
        ];
        if (!validValues.includes(viewportFit)) warnings.push(`Unsupported value "${viewportFit}" found. Should be one of: ${validValues.join(", ")}.`);
    }
    if ("shrink-to-fit" in directives) warnings.push("The shrink-to-fit directive has been obsolete since iOS 9.2.\n  See https://www.scottohara.me/blog/2018/12/11/shrink-to-fit.html");
    const validDirectives = new Set([
        "width",
        "height",
        "initial-scale",
        "minimum-scale",
        "maximum-scale",
        "user-scalable",
        "interactive-widget"
    ]);
    Object.keys(directives).filter((directive)=>{
        if (validDirectives.has(directive)) return false;
        if (directive == "shrink-to-fit") return false;
        if (directive == "viewport-fit") return false;
        return true;
    }).forEach((directive)=>{
        warnings.push(`Invalid viewport directive "${directive}".`);
    });
    return {
        ruleId: 'valid-meta-viewport',
        warnings: warnings,
        payload: payload
    };
}
/**
 * @param {any} element
 * @param {AdapterInterface} adapter
 * @param {any} [parentElement=null]
 * @returns {CustomValidationResult}
 */ function $c322f9a5057eaf5c$var$validateUnnecessaryPreload(element, adapter, parentElement = null) {
    const href = adapter.getAttribute(element, "href");
    if (!href) return {
        ruleId: 'no-unnecessary-preload',
        warnings: []
    };
    const parent = parentElement || adapter.getParent(element);
    if (!parent) return {
        ruleId: 'no-unnecessary-preload',
        warnings: []
    };
    const preloadedElement = $c322f9a5057eaf5c$var$findElementWithSource(parent, href, element, adapter);
    if (!preloadedElement) return {
        ruleId: 'no-unnecessary-preload',
        warnings: []
    };
    return {
        ruleId: 'no-unnecessary-preload',
        warnings: [
            `This preload has little to no effect. ${href} is already discoverable by another ${adapter.getTagName(preloadedElement)} element.`
        ]
    };
}


function $4638c35e8aec1c56$export$66aa292af6e88fd9(headNode, adapter, options = {}) {
    const { includeValidation: includeValidation = true, includeCustomValidations: includeCustomValidations = true, pageOrigin: pageOrigin = null } = options;
    // Pass 1: Compute weights for all elements
    const weights = $ee7e0c73e51ebfda$export$5cc4a311ddbe699c(headNode, adapter);
    // Pass 2: Get document-level validation warnings
    const validationWarnings = includeValidation ? (0, $c322f9a5057eaf5c$export$b01ab94d0cd042a0)(headNode, adapter) : [];
    // Pass 3: Get element-level custom validations
    const customValidations = includeCustomValidations ? $4638c35e8aec1c56$var$getElementValidations(headNode, adapter, pageOrigin) : [];
    return {
        weights: weights,
        validationWarnings: validationWarnings,
        customValidations: customValidations,
        headElement: headNode
    };
}
/**
 * Get custom validations for all elements in head
 * 
 * @param {any} headNode - The <head> element
 * @param {AdapterInterface} adapter - HTMLAdapter implementation
 * @param {string|null} [pageOrigin=null] - Page origin for validation
 * @returns {Array<CustomValidation>}
 * @private
 */ function $4638c35e8aec1c56$var$getElementValidations(headNode, adapter, pageOrigin = null) {
    /** @type {Array<CustomValidation>} */ const customValidations = [];
    const children = adapter.getChildren(headNode);
    for (const element of children){
        const validation = (0, $c322f9a5057eaf5c$export$6c93e2175c028eeb)(element, adapter, headNode, pageOrigin);
        if (validation && validation.warnings && validation.warnings.length > 0) customValidations.push({
            ruleId: validation.ruleId,
            element: element,
            warnings: validation.warnings,
            payload: validation.payload
        });
    }
    return customValidations;
}
function $4638c35e8aec1c56$export$a824357f4ceaf2cf(weight) {
    // Find the category that matches this weight
    for (const [category, value] of Object.entries($ee7e0c73e51ebfda$export$881088883fcab450)){
        if (value === weight) return category;
    }
    return 'UNKNOWN';
}
function $4638c35e8aec1c56$export$9d3d5cf01843f4a8(weights) {
    /** @type {Array<OrderingViolation>} */ const violations = [];
    for(let i = 0; i < weights.length - 1; i++){
        const current = weights[i];
        const next = weights[i + 1];
        if (current.weight < next.weight) {
            const currentCategory = $4638c35e8aec1c56$export$a824357f4ceaf2cf(current.weight);
            const nextCategory = $4638c35e8aec1c56$export$a824357f4ceaf2cf(next.weight);
            violations.push({
                index: i + 1,
                currentElement: current.element,
                nextElement: next.element,
                currentWeight: current.weight,
                nextWeight: next.weight,
                currentCategory: currentCategory,
                nextCategory: nextCategory,
                message: `${nextCategory} element should come before ${currentCategory} element`
            });
        }
    }
    return violations;
}
function $4638c35e8aec1c56$export$283ccd6e4ed2051d(headNode, adapter, options = {}) {
    const result = $4638c35e8aec1c56$export$66aa292af6e88fd9(headNode, adapter, options);
    const orderingViolations = $4638c35e8aec1c56$export$9d3d5cf01843f4a8(result.weights);
    return {
        ...result,
        orderingViolations: orderingViolations
    };
}




/**
 * @file Browser DOM adapter
 * 
 * Wraps native DOM Element APIs to implement the HTMLAdapter interface.
 * This adapter is used in browser environments where capo.js operates
 * on actual DOM elements.
 */ /**
 * @file Base adapter interface for HTML tree operations
 * 
 * This file defines the contract that all adapters must implement.
 * Adapters abstract away environment-specific operations (browser DOM vs AST nodes)
 * to make capo.js core logic reusable across different contexts.
 */ /**
 * Source location information for a node
 * @typedef {Object} SourceLocation
 * @property {number} line
 * @property {number} column
 * @property {number} [endLine]
 * @property {number} [endColumn]
 */ /** @type {readonly string[]} */ const $7afc5bf68bcc75e1$var$REQUIRED_METHODS = [
    'isElement',
    'getTagName',
    'getAttribute',
    'hasAttribute',
    'getAttributeNames',
    'getTextContent',
    'getChildren',
    'getParent',
    'getSiblings',
    'stringify'
];
class $7afc5bf68bcc75e1$export$d1d100ae3c773a95 {
    /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */ isElement(node) {
        throw new Error('isElement() not implemented');
    }
    /**
   * Get the tag name of an element (lowercase)
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */ getTagName(node) {
        throw new Error('getTagName() not implemented');
    }
    /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */ getAttribute(node, attrName) {
        throw new Error('getAttribute() not implemented');
    }
    /**
   * Check if element has a specific attribute
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */ hasAttribute(node, attrName) {
        throw new Error('hasAttribute() not implemented');
    }
    /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */ getAttributeNames(node) {
        throw new Error('getAttributeNames() not implemented');
    }
    /**
   * Get text content of a node (for inline scripts/styles)
   * @param {any} node - Element node
   * @returns {string} - Text content
   */ getTextContent(node) {
        throw new Error('getTextContent() not implemented');
    }
    /**
   * Get child elements of a node
   * @param {any} node - Parent node
   * @returns {any[]} - Array of child element nodes (excluding text/comment nodes)
   */ getChildren(node) {
        throw new Error('getChildren() not implemented');
    }
    /**
   * Get parent element of a node
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */ getParent(node) {
        throw new Error('getParent() not implemented');
    }
    /**
   * Get sibling elements of a node
   * @param {any} node - Element node
   * @returns {any[]} - Array of sibling element nodes (excluding the node itself)
   */ getSiblings(node) {
        throw new Error('getSiblings() not implemented');
    }
    /**
   * Get source location for a node (optional, for linting)
   * @param {any} node - Element node
   * @returns {SourceLocation | null}
   */ getLocation(node) {
        return null;
    }
    /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */ stringify(node) {
        throw new Error('stringify() not implemented');
    }
}
function $7afc5bf68bcc75e1$export$8b0c6d51edeaa8b(adapter) {
    if (!adapter || typeof adapter !== 'object') throw new Error('Adapter must be an object');
    for (const method of $7afc5bf68bcc75e1$var$REQUIRED_METHODS){
        if (typeof /** @type {Record<string, any>} */ adapter[method] !== 'function') throw new Error(`Adapter missing required method: ${method}()`);
    }
}


class $6e48536853157d9f$export$e467cc3399500025 extends (0, $7afc5bf68bcc75e1$export$d1d100ae3c773a95) {
    /**
   * Check if node is an Element (not text, comment, etc.)
   * @override
   * @param {any} node - The node to check
   * @returns {boolean}
   */ isElement(node) {
        if (!node) return false;
        // Node.ELEMENT_NODE === 1
        return node.nodeType === 1;
    }
    /**
   * Get the tag name of an element (lowercase)
   * @override
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */ getTagName(node) {
        if (!node || !node.tagName) return '';
        const name = node.tagName.toLowerCase();
        if (name === 'static-head') return 'head';
        return name;
    }
    /**
   * Get attribute value from element
   * @override
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */ getAttribute(node, attrName) {
        if (!node || typeof node.getAttribute !== 'function') return null;
        return node.getAttribute(attrName);
    }
    /**
   * Check if element has a specific attribute
   * @override
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */ hasAttribute(node, attrName) {
        if (!node || typeof node.hasAttribute !== 'function') return false;
        return node.hasAttribute(attrName);
    }
    /**
   * Get all attribute names for an element
   * @override
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */ getAttributeNames(node) {
        if (!node || typeof node.getAttributeNames !== 'function') return [];
        return node.getAttributeNames();
    }
    /**
   * Get text content of a node (for inline scripts/styles)
   * @override
   * @param {any} node - Element node
   * @returns {string} - Text content
   */ getTextContent(node) {
        if (!node) return '';
        return node.textContent || '';
    }
    /**
   * Get child elements of a node
   * @override
   * @param {any} node - Parent node
   * @returns {any[]} - Array of child element nodes (excluding text/comment nodes)
   */ getChildren(node) {
        if (!node) return [];
        if (this.getTagName(node) === 'noscript') {
            const content = node.innerHTML || '';
            if (content.trim()) {
                const doc = node.ownerDocument || (typeof document !== 'undefined' ? document : null);
                if (doc) {
                    const temp = doc.createElement('div');
                    temp.innerHTML = content;
                    return Array.from(temp.children);
                }
            }
        }
        if (!node.children) return [];
        return Array.from(node.children);
    }
    /**
   * Get parent element of a node
   * @override
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */ getParent(node) {
        if (!node) return null;
        return node.parentElement || null;
    }
    /**
   * Get sibling elements of a node
   * @override
   * @param {any} node - Element node
   * @returns {any[]} - Array of sibling element nodes (excluding the node itself)
   */ getSiblings(node) {
        if (!node) return [];
        const parent = node.parentElement;
        if (!parent) return [];
        return Array.from(parent.children).filter((child)=>child !== node);
    }
    /**
   * Get source location for a node (optional, for linting)
   * 
   * Browser DOM elements don't have source location information,
   * so this always returns null.
   * 
   * @override
   * @param {any} node - Element node
   * @returns {null}
   */ getLocation(node) {
        // Not available in browser DOM
        return null;
    }
    /**
   * Get style sheet object for a style or link element
   * @override
   * @param {any} node - Element node
   * @returns {CSSStyleSheet | null}
   */ getSheet(node) {
        if (!node) return null;
        return node.sheet || null;
    }
    /**
   * Stringify element for logging/debugging
   * @override
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */ stringify(node) {
        if (!node || !node.nodeName) return '[invalid node]';
        const tagName = this.getTagName(node);
        const attrNames = this.getAttributeNames(node);
        if (attrNames.length === 0) return `<${tagName}>`;
        // Build attribute string
        const attrs = attrNames.map((attr)=>{
            const value = this.getAttribute(node, attr);
            // Escape value for display
            const escapedValue = value ? value.replace(/"/g, '&quot;') : '';
            return `${attr}="${escapedValue}"`;
        }).join(' ');
        return `<${tagName} ${attrs}>`;
    }
}



 // Test utilities for custom adapters
 // These are exported via package.json for node usage only
 // to avoid bundling node:test in the browser.



const $47602b39438c5a8c$var$Hues = {
    PINK: 320,
    BLUE: 200
};
function $47602b39438c5a8c$export$921514c0345db5eb(hue) {
    return [
        `oklch(5% .1 ${hue})`,
        `oklch(13% .2 ${hue})`,
        `oklch(25% .2 ${hue})`,
        `oklch(35% .25 ${hue})`,
        `oklch(50% .27 ${hue})`,
        `oklch(67% .31 ${hue})`,
        `oklch(72% .25 ${hue})`,
        `oklch(80% .2 ${hue})`,
        `oklch(90% .1 ${hue})`,
        `oklch(99% .05 ${hue})`,
        '#ccc'
    ];
}
const $47602b39438c5a8c$export$e6952b12ade67489 = [
    '#9e0142',
    '#d53e4f',
    '#f46d43',
    '#fdae61',
    '#fee08b',
    '#e6f598',
    '#abdda4',
    '#66c2a5',
    '#3288bd',
    '#5e4fa2',
    '#cccccc'
];
const $47602b39438c5a8c$export$d68d0fda4a10dbc2 = $47602b39438c5a8c$export$921514c0345db5eb($47602b39438c5a8c$var$Hues.PINK);
const $47602b39438c5a8c$export$738c3b9a44c87ecc = $47602b39438c5a8c$export$921514c0345db5eb($47602b39438c5a8c$var$Hues.BLUE);
const $47602b39438c5a8c$export$9a82c28ef488e918 = {
    DEFAULT: $47602b39438c5a8c$export$e6952b12ade67489,
    PINK: $47602b39438c5a8c$export$d68d0fda4a10dbc2,
    BLUE: $47602b39438c5a8c$export$738c3b9a44c87ecc
};
function $47602b39438c5a8c$export$18c940335d915715(elementColor) {
    let invalidColor = '#cccccc';
    if (elementColor == invalidColor) invalidColor = 'red';
    return `repeating-linear-gradient(45deg, ${elementColor}, ${elementColor} 3px, ${invalidColor} 3px, ${invalidColor} 6px)`;
}


class $33f7359dc421be0c$export$8f8422ac5947a789 {
    /**
   * @param {Document|null} document
   * @param {Options} options
   * @param {ConsoleOutput|any} [output=window.console]
   */ constructor(document1, options, output = typeof window !== 'undefined' ? window.console : console){
        this.document = document1;
        this.options = options;
        this.console = output;
        this.isStaticHead = false;
        /** @type {any} */ this.head = null;
    }
    /**
   * @param {string} html
   * @returns {string}
   */ static formatStaticHeadHTML(html) {
        if (/<head[\s>]/i.test(html)) return html.replace(/(\<\/?)(head)/gi, "$1static-head");
        return `<static-head>${html}</static-head>`;
    }
    /**
   * @param {any} head
   */ initFromStaticHead(head) {
        this.head = head;
        this.isStaticHead = true;
    }
    /**
   * @param {string} html
   */ initFromHTML(html) {
        const formattedHtml = $33f7359dc421be0c$export$8f8422ac5947a789.formatStaticHeadHTML(html.trim());
        const parser = new (this.document?.defaultView?.DOMParser || DOMParser)();
        const staticDoc = parser.parseFromString(formattedHtml, "text/html");
        this.initFromStaticHead(staticDoc.querySelector("static-head") || staticDoc.head);
    }
    /**
   * @returns {Promise<void>}
   */ async init() {
        if (this.head) return;
        if (this.options.prefersDynamicAssessment()) {
            this.head = this.document?.querySelector("head") || null;
            return;
        }
        try {
            let html = await this.getStaticHTML();
            html = $33f7359dc421be0c$export$8f8422ac5947a789.formatStaticHeadHTML(html);
            const parser = new (this.document?.defaultView?.DOMParser || DOMParser)();
            const staticDoc = parser.parseFromString(html, "text/html");
            const staticHead = staticDoc.querySelector("static-head");
            if (staticHead) this.initFromStaticHead(staticHead);
            else this.head = this.document?.head || null;
        } catch (e) {
            this.console.error(`${this.options.loggingPrefix}An exception occurred while getting the static <head>:`, e);
            this.head = this.document?.head || null;
        }
        if (!this.isStaticHead) this.console.warn(`${this.options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`, this.head);
    }
    /**
   * @returns {Promise<string>}
   */ async getStaticHTML() {
        const url = this.document?.location.href || '';
        const response = await fetch(url);
        return await response.text();
    }
    /**
   * @returns {any}
   */ getHead() {
        return this.head;
    }
    /**
   * @param {any} element
   * @returns {string}
   */ stringifyElement(element) {
        return element.getAttributeNames().reduce((/** @type {string} */ id, /** @type {string} */ attr)=>{
            return id += `[${CSS.escape(attr)}=${JSON.stringify(element.getAttribute(attr))}]`;
        }, element.nodeName);
    }
    /**
   * @param {any} element
   * @returns {any}
   */ getLoggableElement(element) {
        if (!this.isStaticHead) return element;
        const head = this.document?.head || this.head;
        if (!head) return element;
        const selector = this.stringifyElement(element);
        const candidates = Array.from(head.querySelectorAll(selector));
        if (candidates.length == 0) return element;
        if (candidates.length == 1) return candidates[0];
        // The way the static elements are parsed makes their innerHTML different.
        // Compare child nodes using isEqualNode to avoid unsafe innerHTML assignment.
        // This ensures a consistent parsing and positive matches.
        const candidate = candidates.find((c)=>{
            if (c.childNodes.length !== element.childNodes.length) return false;
            for(let i = 0; i < c.childNodes.length; i++){
                if (!c.childNodes[i].isEqualNode(element.childNodes[i])) return false;
            }
            return true;
        });
        if (candidate) return candidate;
        return element;
    }
    /**
   * Create an element from a CSS selector
   * @param {string} selector
   * @returns {any}
   */ createElementFromSelector(selector) {
        const match = selector.match(/^[A-Za-z]+/);
        const tagName = match ? match[0] : null;
        if (!tagName) return;
        // Create the new element
        const element = document.createElement(tagName);
        // Extract the attribute key-value pairs from the selector
        const attributes = selector.match(/\[([A-Za-z-]+)="([^"]+)"\]/g) || [];
        // Set the attributes on the new element
        attributes.forEach((attribute)=>{
            // Trim square brackets
            attribute = attribute.slice(1, -1);
            const delimeterPosition = attribute.indexOf("=");
            // Everything before the =
            const key = attribute.slice(0, delimeterPosition);
            // Everything after the =, with quotes trimmed
            const value = attribute.slice(delimeterPosition + 1).slice(1, -1);
            element.setAttribute(key, value);
        });
        return element;
    }
    /**
   * @param {AnalysisResult} result
   * @returns {HeadWeightInfo[]}
   */ logAnalysis(result) {
        const headElement = this.getHead();
        const headWeights = result.weights.map((w)=>{
            const customValidation = result.customValidations.find((v)=>v.element === w.element);
            const validationWarning = result.validationWarnings.find((v)=>v.element === w.element || v.elements && v.elements.includes(w.element));
            const isElementValid = !customValidation && !validationWarning;
            return {
                element: w.element,
                weight: w.weight,
                isValid: isElementValid,
                customValidations: customValidation || {}
            };
        });
        this.logValidationWarnings(result.validationWarnings);
        // Log custom validations (e.g. origin trials) at the top level
        result.customValidations.forEach((v)=>{
            if (v.warnings.length > 0) this.console.warn(`${this.options.loggingPrefix}${v.warnings[0]}`, v.element, v.payload || '');
        });
        this.visualizeHead("Actual", headElement, headWeights);
        const sortedHeadWeights = [
            ...headWeights
        ].sort((a, b)=>b.weight - a.weight);
        const sortedHeadElement = headElement.cloneNode(false);
        sortedHeadWeights.forEach(({ element: element })=>{
            if (element) sortedHeadElement.appendChild(element.cloneNode(true));
        });
        this.visualizeHead("Sorted", sortedHeadElement, sortedHeadWeights);
        return headWeights;
    }
    /**
   * @param {Object} params
   * @param {number|string} params.weight
   * @param {string} params.selector
   * @param {string} params.html
   * @param {boolean} [params.isValid]
   * @param {Record<string, any>} [params.customValidations]
   */ logElementFromSelector({ weight: weight, selector: selector, html: html, isValid: isValid, customValidations: customValidations = {} }) {
        const numWeight = +weight;
        const viz = this.getElementVisualization(numWeight, isValid);
        let element = this.createElementFromSelector(selector);
        const parser = new (this.document?.defaultView?.DOMParser || DOMParser)();
        const doc = parser.parseFromString(html || "", "text/html");
        const nodes = [
            ...doc.head.childNodes,
            ...doc.body.childNodes
        ];
        nodes.forEach((child)=>element.appendChild(child.cloneNode(true)));
        element = this.getLoggableElement(element);
        this.logElement({
            viz: viz,
            weight: numWeight,
            element: element,
            isValid: isValid,
            customValidations: customValidations
        });
    }
    /**
   * @param {Object} params
   * @param {ElementVisualization} params.viz
   * @param {number} params.weight
   * @param {any} params.element
   * @param {boolean} [params.isValid]
   * @param {Record<string, any>} [params.customValidations]
   * @param {boolean} [params.omitPrefix]
   */ logElement({ viz: viz, weight: weight, element: element, isValid: isValid, customValidations: customValidations = {}, omitPrefix: omitPrefix = false }) {
        if (!omitPrefix) viz.visual = `${this.options.loggingPrefix}${viz.visual}`;
        let loggingLevel = "log";
        const args = [
            viz.visual,
            viz.style,
            weight + 1,
            element
        ];
        if (!this.options.isValidationEnabled()) {
            this.console[loggingLevel](...args);
            return;
        }
        const { payload: payload, warnings: warnings } = customValidations;
        if (payload && Object.keys(payload).length > 0) {
            if (typeof payload.expiry == "string") // Deserialize origin trial expiration dates.
            payload.expiry = new Date(payload.expiry);
            args.push(payload);
        }
        if (warnings?.length) {
            // Element-specific warnings.
            loggingLevel = "warn";
            args.push("\n" + warnings.map((/** @type {string} */ warning)=>`  \u{274C} ${warning}`).join("\n"));
        } else if (!isValid && (this.options.prefersDynamicAssessment() || this.isStaticHead)) {
            // General warnings.
            loggingLevel = "warn";
            args.push(`
  \u{274C} invalid element (${element.tagName})`);
        }
        this.console[loggingLevel](...args);
    }
    /**
   * @param {Array<import('../analyzer.js').ValidationWarning>} warnings
   */ logValidationWarnings(warnings) {
        if (!this.options.isValidationEnabled()) return;
        warnings.forEach(({ warning: warning, elements: elements = [], element: element })=>{
            elements = elements.map(this.getLoggableElement.bind(this));
            this.console.warn(`${this.options.loggingPrefix}${warning}`, ...elements, element || "");
        });
    }
    /**
   * @param {number} weight
   * @returns {string}
   */ getColor(weight) {
        return this.options.palette[10 - weight];
    }
    /**
   * @param {HeadWeightInfo[]} elements
   * @returns {HeadVisualization}
   */ getHeadVisualization(elements) {
        let visual = "";
        /** @type {string[]} */ const styles = [];
        elements.forEach(({ weight: weight, isValid: isValid })=>{
            visual += "%c ";
            const color = this.getColor(weight);
            let style = `padding: 5px; margin: 4px -1px 0; display: inline-block; `;
            if (isValid) style += `background-color: ${color};`;
            else style += `background-image: ${(0, $47602b39438c5a8c$export$18c940335d915715)(color)}`;
            styles.push(style);
        });
        return {
            visual: visual,
            styles: styles
        };
    }
    /**
   * @param {number} weight
   * @param {boolean} [isValid=true]
   * @returns {ElementVisualization}
   */ getElementVisualization(weight, isValid = true) {
        const visual = `%c${new Array(weight + 1).fill("\u2588").join("")}`;
        const color = this.getColor(weight);
        let style = `color: ${color}`;
        return {
            visual: visual,
            style: style
        };
    }
    /**
   * @param {string} groupName
   * @param {any} headElement
   * @param {HeadWeightInfo[]} headWeights
   */ visualizeHead(groupName, headElement, headWeights) {
        const headViz = this.getHeadVisualization(headWeights);
        this.console.groupCollapsed(`${this.options.loggingPrefix}${groupName} %chead%c order\n${headViz.visual}`, "font-family: monospace", "font-family: inherit", ...headViz.styles);
        headWeights.forEach(({ weight: weight, element: element, isValid: isValid, customValidations: customValidations })=>{
            const viz = this.getElementVisualization(weight, isValid);
            this.logElement({
                viz: viz,
                weight: weight,
                element: element,
                isValid: isValid,
                customValidations: customValidations,
                omitPrefix: true
            });
        });
        this.console.log(`${groupName} %chead%c element`, "font-family: monospace", "font-family: inherit", headElement);
        this.console.groupEnd();
    }
}



class $5daa40bf356478d7$export$c019608e5b5bb4cb {
    /**
   * @param {OptionsInit} [options={}]
   */ constructor({ preferredAssessmentMode: preferredAssessmentMode = $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.STATIC, validation: validation = true, palette: palette = $47602b39438c5a8c$export$e6952b12ade67489, loggingPrefix: loggingPrefix = 'Capo: ' } = {}){
        /** @type {string} */ this.preferredAssessmentMode = $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.STATIC;
        /** @type {boolean} */ this.validation = true;
        /** @type {string[]} */ this.palette = $47602b39438c5a8c$export$e6952b12ade67489;
        /** @type {string} */ this.loggingPrefix = 'Capo: ';
        this.setPreferredAssessmentMode(preferredAssessmentMode);
        this.setValidation(validation);
        this.setPalette(palette);
        this.setLoggingPrefix(loggingPrefix);
    }
    /**
   * @returns {{ STATIC: 'static', DYNAMIC: 'dynamic' }}
   */ static get AssessmentMode() {
        return {
            STATIC: 'static',
            DYNAMIC: 'dynamic'
        };
    }
    /**
   * @returns {Record<string, string[]>}
   */ static get Palettes() {
        return $47602b39438c5a8c$export$9a82c28ef488e918;
    }
    /**
   * @returns {boolean}
   */ prefersStaticAssessment() {
        return this.preferredAssessmentMode === $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.STATIC;
    }
    /**
   * @returns {boolean}
   */ prefersDynamicAssessment() {
        return this.preferredAssessmentMode === $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.DYNAMIC;
    }
    /**
   * @returns {boolean}
   */ isValidationEnabled() {
        return this.validation;
    }
    /**
   * @param {string} preferredAssessmentMode
   */ setPreferredAssessmentMode(preferredAssessmentMode) {
        if (!this.isValidAssessmentMode(preferredAssessmentMode)) throw new Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`);
        this.preferredAssessmentMode = preferredAssessmentMode;
    }
    /**
   * @param {boolean} prefersStatic
   */ setPreferredAssessmentModeToStatic(prefersStatic) {
        /** @type {string} */ let mode = $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.STATIC;
        if (!prefersStatic) mode = $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.DYNAMIC;
        this.setPreferredAssessmentMode(mode);
    }
    /**
   * @param {boolean} validation
   */ setValidation(validation) {
        if (!this.isValidValidation(validation)) throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
        this.validation = validation;
    }
    /**
   * @param {string | string[]} palette
   */ setPalette(palette) {
        if (!this.isValidPalette(palette)) throw new Error(`Invalid option: palette, expected [${Object.keys($47602b39438c5a8c$export$9a82c28ef488e918).join('|')}] or an array of colors, got "${palette}".`);
        if (typeof palette === 'string') {
            this.palette = $47602b39438c5a8c$export$9a82c28ef488e918[palette];
            return;
        }
        this.palette = palette;
    }
    /**
   * @param {string} loggingPrefix
   */ setLoggingPrefix(loggingPrefix) {
        if (!this.isValidLoggingPrefix(loggingPrefix)) throw new Error(`Invalid option: logging prefix, expected string, got "${loggingPrefix}".`);
        this.loggingPrefix = loggingPrefix;
    }
    /**
   * @param {any} assessmentMode
   * @returns {boolean}
   */ isValidAssessmentMode(assessmentMode) {
        return Object.values($5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode).includes(assessmentMode);
    }
    /**
   * @param {any} validation
   * @returns {boolean}
   */ isValidValidation(validation) {
        return typeof validation === 'boolean';
    }
    /**
   * @param {any} palette
   * @returns {boolean}
   */ isValidPalette(palette) {
        if (typeof palette === 'string') return Object.keys($47602b39438c5a8c$export$9a82c28ef488e918).includes(palette);
        if (!Array.isArray(palette)) return false;
        return palette.length === 11 && palette.every((color)=>typeof color === 'string');
    }
    /**
   * @param {any} loggingPrefix
   * @returns {boolean}
   */ isValidLoggingPrefix(loggingPrefix) {
        return typeof loggingPrefix === 'string';
    }
    /**
   * @param {string[]} palette
   * @returns {boolean}
   */ isPreferredPalette(palette) {
        return JSON.stringify(this.palette) == JSON.stringify(palette);
    }
    /**
   * @returns {OptionsValue}
   */ valueOf() {
        return {
            preferredAssessmentMode: this.preferredAssessmentMode,
            validation: this.validation,
            palette: this.palette,
            loggingPrefix: this.loggingPrefix
        };
    }
}


const $3536df9ffc9a62b8$var$FORCED_OPTIONS = {
    preferredAssessmentMode: (0, $5daa40bf356478d7$export$c019608e5b5bb4cb).AssessmentMode.DYNAMIC
};
function $3536df9ffc9a62b8$export$889ea624f2cb2c57(input, output, userOptions = {}) {
    const pageOrigin = userOptions.pageOrigin || null;
    userOptions = Object.assign({}, userOptions, $3536df9ffc9a62b8$var$FORCED_OPTIONS);
    const options = new (0, $5daa40bf356478d7$export$c019608e5b5bb4cb)(userOptions);
    const io = new (0, $33f7359dc421be0c$export$8f8422ac5947a789)(null, options, output);
    io.initFromHTML(input);
    const headElement = io.getHead();
    const adapter = new (0, $6e48536853157d9f$export$e467cc3399500025)();
    const result = (0, $4638c35e8aec1c56$export$66aa292af6e88fd9)(headElement, adapter, {
        pageOrigin: pageOrigin
    });
    io.logAnalysis(result);
}


export {$3536df9ffc9a62b8$export$889ea624f2cb2c57 as run};
