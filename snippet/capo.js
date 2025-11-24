(() => {
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
// Legacy exports for backward compatibility
const $eb5be8077a65b10b$var$Hues = {
    PINK: 320,
    BLUE: 200
};
function $eb5be8077a65b10b$export$921514c0345db5eb(hue) {
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
        "#ccc"
    ];
}
const $eb5be8077a65b10b$export$e6952b12ade67489 = [
    "#9e0142",
    "#d53e4f",
    "#f46d43",
    "#fdae61",
    "#fee08b",
    "#e6f598",
    "#abdda4",
    "#66c2a5",
    "#3288bd",
    "#5e4fa2",
    "#cccccc"
];
const $eb5be8077a65b10b$export$d68d0fda4a10dbc2 = $eb5be8077a65b10b$export$921514c0345db5eb($eb5be8077a65b10b$var$Hues.PINK);
const $eb5be8077a65b10b$export$738c3b9a44c87ecc = $eb5be8077a65b10b$export$921514c0345db5eb($eb5be8077a65b10b$var$Hues.BLUE);
const $eb5be8077a65b10b$export$9a82c28ef488e918 = {
    DEFAULT: $eb5be8077a65b10b$export$e6952b12ade67489,
    PINK: $eb5be8077a65b10b$export$d68d0fda4a10dbc2,
    BLUE: $eb5be8077a65b10b$export$738c3b9a44c87ecc
};
function $eb5be8077a65b10b$export$18c940335d915715(elementColor) {
    let invalidColor = "#cccccc";
    if (elementColor == invalidColor) invalidColor = "red";
    return `repeating-linear-gradient(45deg, ${elementColor}, ${elementColor} 3px, ${invalidColor} 3px, ${invalidColor} 6px)`;
}


var $d410929ede0a2ee4$exports = {};

$parcel$export($d410929ede0a2ee4$exports, "IO", () => $d410929ede0a2ee4$export$8f8422ac5947a789);

class $d410929ede0a2ee4$export$8f8422ac5947a789 {
    constructor(document1, options, output = window.console){
        this.document = document1;
        this.options = options;
        this.console = output;
        this.isStaticHead = false;
        this.head = null;
    }
    async init() {
        if (this.head) return;
        if (this.options.prefersDynamicAssessment()) {
            this.head = this.document.querySelector("head");
            return;
        }
        try {
            let html = await this.getStaticHTML();
            html = html.replace(/(\<\/?)(head)/gi, "$1static-head");
            const staticDoc = this.document.implementation.createHTMLDocument("New Document");
            staticDoc.documentElement.innerHTML = html;
            this.head = staticDoc.querySelector("static-head");
            if (this.head) this.isStaticHead = true;
            else this.head = this.document.head;
        } catch (e) {
            this.console.error(`${this.options.loggingPrefix}An exception occurred while getting the static <head>:`, e);
            this.head = this.document.head;
        }
        if (!this.isStaticHead) this.console.warn(`${this.options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`, this.head);
    }
    async getStaticHTML() {
        const url = this.document.location.href;
        const response = await fetch(url);
        return await response.text();
    }
    getHead() {
        return this.head;
    }
    stringifyElement(element) {
        return element.getAttributeNames().reduce((id, attr)=>{
            return id += `[${CSS.escape(attr)}=${JSON.stringify(element.getAttribute(attr))}]`;
        }, element.nodeName);
    }
    getLoggableElement(element) {
        if (!this.isStaticHead) return element;
        const selector = this.stringifyElement(element);
        const candidates = Array.from(this.document.head.querySelectorAll(selector));
        if (candidates.length == 0) return element;
        if (candidates.length == 1) return candidates[0];
        // The way the static elements are parsed makes their innerHTML different.
        // Recreate the element in DOM and compare its innerHTML with those of the candidates.
        // This ensures a consistent parsing and positive string matches.
        const candidateWrapper = this.document.createElement("div");
        const elementWrapper = this.document.createElement("div");
        elementWrapper.innerHTML = element.innerHTML;
        const candidate = candidates.find((c)=>{
            candidateWrapper.innerHTML = c.innerHTML;
            return candidateWrapper.innerHTML == elementWrapper.innerHTML;
        });
        if (candidate) return candidate;
        return element;
    }
    // Note: AI-generated function.
    createElementFromSelector(selector) {
        // Extract the tag name from the selector
        const tagName = selector.match(/^[A-Za-z]+/)[0];
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
    logElementFromSelector({ weight: weight, selector: selector, innerHTML: innerHTML, isValid: isValid, customValidations: customValidations = {} }) {
        weight = +weight;
        const viz = this.getElementVisualization(weight, isValid);
        let element = this.createElementFromSelector(selector);
        element.innerHTML = innerHTML;
        element = this.getLoggableElement(element);
        this.logElement({
            viz: viz,
            weight: weight,
            element: element,
            isValid: isValid,
            customValidations: customValidations
        });
    }
    logElement({ viz: viz, weight: weight, element: element, isValid: isValid, customValidations: customValidations = {}, omitPrefix: omitPrefix = false }) {
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
        if (payload) {
            if (typeof payload.expiry == "string") // Deserialize origin trial expiration dates.
            payload.expiry = new Date(payload.expiry);
            args.push(payload);
        }
        if (warnings?.length) {
            // Element-specific warnings.
            loggingLevel = "warn";
            args.push("\n" + warnings.map((warning)=>`  ❌ ${warning}`).join("\n"));
        } else if (!isValid && (this.options.prefersDynamicAssessment() || this.isStaticHead)) {
            // General warnings.
            loggingLevel = "warn";
            args.push(`\n  ❌ invalid element (${element.tagName})`);
        }
        this.console[loggingLevel](...args);
    }
    logValidationWarnings(warnings) {
        if (!this.options.isValidationEnabled()) return;
        warnings.forEach(({ warning: warning, elements: elements = [], element: element })=>{
            elements = elements.map(this.getLoggableElement.bind(this));
            this.console.warn(`${this.options.loggingPrefix}${warning}`, ...elements, element || "");
        });
    }
    getColor(weight) {
        return this.options.palette[10 - weight];
    }
    getHeadVisualization(elements) {
        let visual = "";
        const styles = [];
        elements.forEach(({ weight: weight, isValid: isValid })=>{
            visual += "%c ";
            const color = this.getColor(weight);
            let style = `padding: 5px; margin: 0 -1px; `;
            if (isValid) style += `background-color: ${color};`;
            else style += `background-image: ${(0, $eb5be8077a65b10b$export$18c940335d915715)(color)}`;
            styles.push(style);
        });
        return {
            visual: visual,
            styles: styles
        };
    }
    getElementVisualization(weight, isValid = true) {
        const visual = `%c${new Array(weight + 1).fill("█").join("")}`;
        const color = this.getColor(weight);
        let style = `color: ${color}`;
        return {
            visual: visual,
            style: style
        };
    }
    visualizeHead(groupName, headElement, headWeights) {
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


var $5b739339de321a37$exports = {};

$parcel$export($5b739339de321a37$exports, "Options", () => $5b739339de321a37$export$c019608e5b5bb4cb);

class $5b739339de321a37$export$c019608e5b5bb4cb {
    constructor({ preferredAssessmentMode: preferredAssessmentMode = $5b739339de321a37$export$c019608e5b5bb4cb.AssessmentMode.STATIC, validation: validation = true, palette: palette = $eb5be8077a65b10b$export$e6952b12ade67489, loggingPrefix: loggingPrefix = "Capo: " } = {}){
        this.setPreferredAssessmentMode(preferredAssessmentMode);
        this.setValidation(validation);
        this.setPalette(palette);
        this.setLoggingPrefix(loggingPrefix);
    }
    static get AssessmentMode() {
        return {
            STATIC: "static",
            DYNAMIC: "dynamic"
        };
    }
    static get Palettes() {
        return $eb5be8077a65b10b$export$9a82c28ef488e918;
    }
    prefersStaticAssessment() {
        return this.preferredAssessmentMode === $5b739339de321a37$export$c019608e5b5bb4cb.AssessmentMode.STATIC;
    }
    prefersDynamicAssessment() {
        return this.preferredAssessmentMode === $5b739339de321a37$export$c019608e5b5bb4cb.AssessmentMode.DYNAMIC;
    }
    isValidationEnabled() {
        return this.validation;
    }
    setPreferredAssessmentMode(preferredAssessmentMode) {
        if (!this.isValidAssessmentMode(preferredAssessmentMode)) throw new Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`);
        this.preferredAssessmentMode = preferredAssessmentMode;
    }
    setPreferredAssessmentModeToStatic(prefersStatic) {
        let mode = $5b739339de321a37$export$c019608e5b5bb4cb.AssessmentMode.STATIC;
        if (!prefersStatic) mode = $5b739339de321a37$export$c019608e5b5bb4cb.AssessmentMode.DYNAMIC;
        this.setPreferredAssessmentMode(mode);
    }
    setValidation(validation) {
        if (!this.isValidValidation(validation)) throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
        this.validation = validation;
    }
    setPalette(palette) {
        if (!this.isValidPalette(palette)) throw new Error(`Invalid option: palette, expected [${Object.keys($eb5be8077a65b10b$export$9a82c28ef488e918).join("|")}] or an array of colors, got "${palette}".`);
        if (typeof palette === "string") {
            this.palette = $eb5be8077a65b10b$export$9a82c28ef488e918[palette];
            return;
        }
        this.palette = palette;
    }
    setLoggingPrefix(loggingPrefix) {
        if (!this.isValidLoggingPrefix(loggingPrefix)) throw new Error(`Invalid option: logging prefix, expected string, got "${loggingPrefix}".`);
        this.loggingPrefix = loggingPrefix;
    }
    isValidAssessmentMode(assessmentMode) {
        return Object.values($5b739339de321a37$export$c019608e5b5bb4cb.AssessmentMode).includes(assessmentMode);
    }
    isValidValidation(validation) {
        return typeof validation === "boolean";
    }
    isValidPalette(palette) {
        if (typeof palette === "string") return Object.keys($eb5be8077a65b10b$export$9a82c28ef488e918).includes(palette);
        if (!Array.isArray(palette)) return false;
        return palette.length === 11 && palette.every((color)=>typeof color === "string");
    }
    isValidLoggingPrefix(loggingPrefix) {
        return typeof loggingPrefix === "string";
    }
    isPreferredPalette(palette) {
        return JSON.stringify(this.palette) == JSON.stringify(palette);
    }
    valueOf() {
        return {
            preferredAssessmentMode: this.preferredAssessmentMode,
            validation: this.validation,
            palette: this.palette,
            loggingPrefix: this.loggingPrefix
        };
    }
}


const $9c3989fcb9437829$export$881088883fcab450 = {
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
const $9c3989fcb9437829$export$6ade8bb3620eb74b = {
    META: $9c3989fcb9437829$export$daeb0db0c224decd,
    TITLE: $9c3989fcb9437829$export$e55aad21605f020a,
    PRECONNECT: $9c3989fcb9437829$export$a3316bd0a640eb8b,
    ASYNC_SCRIPT: $9c3989fcb9437829$export$20e2051ffd813ee3,
    IMPORT_STYLES: $9c3989fcb9437829$export$be443fc6335656f0,
    SYNC_SCRIPT: $9c3989fcb9437829$export$65983fc0a5543400,
    SYNC_STYLES: $9c3989fcb9437829$export$9d6cdbffb13bee21,
    PRELOAD: $9c3989fcb9437829$export$226ad5ba23be83f0,
    DEFER_SCRIPT: $9c3989fcb9437829$export$3d269f86e8bd1d24,
    PREFETCH_PRERENDER: $9c3989fcb9437829$export$4d2ed086e1fec499
};
const $9c3989fcb9437829$export$b7417cf4a2235f73 = [
    "accept-ch",
    "content-security-policy",
    "content-type",
    "default-style",
    "delegate-ch",
    "origin-trial",
    "x-dns-prefetch-control"
];
function $9c3989fcb9437829$export$daeb0db0c224decd(element, adapter) {
    const tagName = adapter.getTagName(element);
    // Check if it's a base element
    if (tagName === "base") return true;
    // Check if it's a meta element with charset, viewport, or critical http-equiv
    if (tagName !== "meta") return false;
    // Check for charset attribute
    if (adapter.hasAttribute(element, "charset")) return true;
    // Check for viewport meta
    const name = adapter.getAttribute(element, "name");
    if (name && name.toLowerCase() === "viewport") return true;
    // Check for critical http-equiv values
    const httpEquiv = adapter.getAttribute(element, "http-equiv");
    if (httpEquiv) {
        const normalizedValue = httpEquiv.toLowerCase();
        return $9c3989fcb9437829$export$b7417cf4a2235f73.includes(normalizedValue);
    }
    return false;
}
function $9c3989fcb9437829$export$e55aad21605f020a(element, adapter) {
    return adapter.getTagName(element) === "title";
}
function $9c3989fcb9437829$export$a3316bd0a640eb8b(element, adapter) {
    if (adapter.getTagName(element) !== "link") return false;
    const rel = adapter.getAttribute(element, "rel");
    return rel?.toLowerCase() === "preconnect";
}
function $9c3989fcb9437829$export$20e2051ffd813ee3(element, adapter) {
    return adapter.getTagName(element) === "script" && adapter.hasAttribute(element, "src") && adapter.hasAttribute(element, "async");
}
function $9c3989fcb9437829$export$be443fc6335656f0(element, adapter) {
    const importRe = /@import/;
    if (adapter.getTagName(element) === "style") return importRe.test(adapter.getTextContent(element));
    /* TODO: Support external stylesheets.
  if (adapter.getTagName(element) === 'link' && 
      adapter.getAttribute(element, 'rel')?.toLowerCase() === 'stylesheet' &&
      adapter.hasAttribute(element, 'href')) {
    let response = fetch(adapter.getAttribute(element, 'href'));
    response = response.text();
    return importRe.test(response);
  } */ return false;
}
function $9c3989fcb9437829$export$65983fc0a5543400(element, adapter) {
    // Must be a script element
    if (adapter.getTagName(element) !== "script") return false;
    // Original selector: script:not([src][defer],[src][type=module],[src][async],[type*=json])
    // This excludes scripts that match ANY of these compound conditions:
    // Exclude: scripts with src AND defer
    if (adapter.hasAttribute(element, "src") && adapter.hasAttribute(element, "defer")) return false;
    // Exclude: scripts with src AND type=module
    if (adapter.hasAttribute(element, "src")) {
        const type = adapter.getAttribute(element, "type");
        if (type && type.toLowerCase() === "module") return false;
    }
    // Exclude: scripts with src AND async
    if (adapter.hasAttribute(element, "src") && adapter.hasAttribute(element, "async")) return false;
    // Exclude: scripts with type containing "json"
    const type = adapter.getAttribute(element, "type");
    if (type && type.toLowerCase().includes("json")) return false;
    return true;
}
function $9c3989fcb9437829$export$9d6cdbffb13bee21(element, adapter) {
    const tagName = adapter.getTagName(element);
    // Check if it's a style element
    if (tagName === "style") return true;
    // Check if it's a stylesheet link
    if (tagName === "link") {
        const rel = adapter.getAttribute(element, "rel");
        return rel?.toLowerCase() === "stylesheet";
    }
    return false;
}
function $9c3989fcb9437829$export$226ad5ba23be83f0(element, adapter) {
    if (adapter.getTagName(element) !== "link") return false;
    const rel = adapter.getAttribute(element, "rel");
    if (!rel) return false;
    const relLower = rel.toLowerCase();
    return relLower === "preload" || relLower === "modulepreload";
}
function $9c3989fcb9437829$export$3d269f86e8bd1d24(element, adapter) {
    if (adapter.getTagName(element) !== "script") return false;
    if (!adapter.hasAttribute(element, "src")) return false;
    // Script with defer attribute
    if (adapter.hasAttribute(element, "defer")) return true;
    // Module scripts are defer by default, unless they have async
    const type = adapter.getAttribute(element, "type");
    if (type && type.toLowerCase() === "module") return !adapter.hasAttribute(element, "async");
    return false;
}
function $9c3989fcb9437829$export$4d2ed086e1fec499(element, adapter) {
    if (adapter.getTagName(element) !== "link") return false;
    const rel = adapter.getAttribute(element, "rel");
    if (!rel) return false;
    const relLower = rel.toLowerCase();
    return relLower === "prefetch" || relLower === "dns-prefetch" || relLower === "prerender";
}
function $9c3989fcb9437829$export$38a04d482ec50f88(element, adapter) {
    if (adapter.getTagName(element) !== "meta") return false;
    const httpEquiv = adapter.getAttribute(element, "http-equiv");
    return httpEquiv?.toLowerCase() === "origin-trial";
}
function $9c3989fcb9437829$export$14b1a2f64a600585(element, adapter) {
    if (adapter.getTagName(element) !== "meta") return false;
    const httpEquiv = adapter.getAttribute(element, "http-equiv");
    if (!httpEquiv) return false;
    const httpEquivLower = httpEquiv.toLowerCase();
    return httpEquivLower === "content-security-policy" || httpEquivLower === "content-security-policy-report-only";
}
function $9c3989fcb9437829$export$de32fe5d64aee40c(element, adapter) {
    for (let [id, detector] of Object.entries($9c3989fcb9437829$export$6ade8bb3620eb74b)){
        if (detector(element, adapter)) return $9c3989fcb9437829$export$881088883fcab450[id];
    }
    return $9c3989fcb9437829$export$881088883fcab450.OTHER;
}
function $9c3989fcb9437829$export$5cc4a311ddbe699c(head, adapter) {
    const headChildren = adapter.getChildren(head);
    return headChildren.filter((element)=>{
        // Filter out text nodes and comments - only include actual elements
        const tagName = adapter.getTagName(element);
        return tagName && tagName !== "";
    }).map((element)=>{
        return {
            element: element,
            weight: $9c3989fcb9437829$export$de32fe5d64aee40c(element, adapter)
        };
    });
}



const $580f7ed6bc170ae8$export$79e124b7caef7aa9 = new Set([
    "base",
    "link",
    "meta",
    "noscript",
    "script",
    "style",
    "template",
    "title"
]);
const $580f7ed6bc170ae8$export$2f975f13375faaa1 = 'meta[http-equiv="content-type" i], meta[charset]';
const $580f7ed6bc170ae8$export$9739336dee0b3205 = "meta[http-equiv]";
const $580f7ed6bc170ae8$export$5540ac2a18901364 = 'link:is([rel="preload" i], [rel="modulepreload" i])';
function $580f7ed6bc170ae8$export$a8257692ac88316c(element, adapter) {
    const tagName = adapter.getTagName(element);
    // Text nodes and comment nodes are valid (they don't have tag names)
    if (!tagName || tagName === "") return true;
    return $580f7ed6bc170ae8$export$79e124b7caef7aa9.has(tagName.toLowerCase());
}
/**
 * Check if element has any invalid child elements
 * @param {any} element - Element to check
 * @param {any} adapter - Adapter instance
 * @returns {boolean}
 */ function $580f7ed6bc170ae8$var$hasInvalidChildren(element, adapter) {
    const children = adapter.getChildren(element);
    return children.some((child)=>!$580f7ed6bc170ae8$export$a8257692ac88316c(child, adapter));
}
/**
 * Check if this is a duplicate title element (2nd+ occurrence)
 * @param {any} element - Element to check
 * @param {any} adapter - Adapter instance
 * @returns {boolean}
 */ function $580f7ed6bc170ae8$var$isDuplicateTitle(element, adapter) {
    if (adapter.getTagName(element) !== "title") return false;
    const parent = adapter.getParent(element);
    if (!parent) return false;
    // Check if this is the first title element
    let foundFirst = false;
    for (const child of adapter.getChildren(parent))if (adapter.getTagName(child) === "title") {
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
 * @param {any} adapter - Adapter instance
 * @returns {boolean}
 */ function $580f7ed6bc170ae8$var$isDuplicateBase(element, adapter) {
    if (adapter.getTagName(element) !== "base") return false;
    const siblings = adapter.getSiblings(element);
    return siblings.some((sibling)=>adapter.getTagName(sibling) === "base");
}
function $580f7ed6bc170ae8$export$eeefd08c3a6f8db7(element, adapter) {
    // Element itself is not valid.
    if (!$580f7ed6bc170ae8$export$a8257692ac88316c(element, adapter)) return true;
    // Children are not valid.
    if ($580f7ed6bc170ae8$var$hasInvalidChildren(element, adapter)) return true;
    // <title> is not the first of its type.
    if ($580f7ed6bc170ae8$var$isDuplicateTitle(element, adapter)) return true;
    // <base> is not the first of its type.
    if ($580f7ed6bc170ae8$var$isDuplicateBase(element, adapter)) return true;
    // CSP meta tag anywhere.
    if ((0, $9c3989fcb9437829$export$14b1a2f64a600585)(element, adapter)) return true;
    // Invalid http-equiv.
    if ($580f7ed6bc170ae8$var$isInvalidHttpEquiv(element, adapter)) return true;
    // Invalid meta viewport.
    if ($580f7ed6bc170ae8$var$isInvalidMetaViewport(element, adapter)) return true;
    // Invalid default-style.
    if ($580f7ed6bc170ae8$var$isInvalidDefaultStyle(element, adapter)) return true;
    // Invalid character encoding.
    if ($580f7ed6bc170ae8$var$isInvalidContentType(element, adapter)) return true;
    // Origin trial expired, or invalid origin.
    if ($580f7ed6bc170ae8$var$isInvalidOriginTrial(element, adapter)) return true;
    // Preload is unnecessary.
    if ($580f7ed6bc170ae8$var$isUnnecessaryPreload(element, adapter)) return true;
    // Preload is missing crossorigin.
    if ($580f7ed6bc170ae8$var$isInvalidFontPreload(element, adapter)) return true;
    return false;
}
function $580f7ed6bc170ae8$export$b01ab94d0cd042a0(head, adapter) {
    const validationWarnings = [];
    // Get all children of head element
    const children = adapter.getChildren(head);
    // Check for title elements
    const titleElements = children.filter((child)=>adapter.getTagName(child) === "title");
    const titleElementCount = titleElements.length;
    if (titleElementCount != 1) validationWarnings.push({
        ruleId: titleElementCount === 0 ? "require-title" : "no-duplicate-title",
        warning: `Expected exactly 1 <title> element, found ${titleElementCount}`,
        elements: titleElements
    });
    // Check for meta viewport
    const metaViewport = children.filter((child)=>{
        if (adapter.getTagName(child) !== "meta") return false;
        const name = adapter.getAttribute(child, "name");
        return name && name.toLowerCase() === "viewport";
    });
    if (metaViewport.length != 1) validationWarnings.push({
        ruleId: metaViewport.length === 0 ? "require-meta-viewport" : "valid-meta-viewport",
        warning: `Expected exactly 1 <meta name=viewport> element, found ${metaViewport.length}`,
        elements: metaViewport
    });
    // Check for base elements
    const baseElements = children.filter((child)=>adapter.getTagName(child) === "base");
    const baseElementCount = baseElements.length;
    if (baseElementCount > 1) validationWarnings.push({
        ruleId: "no-duplicate-base",
        warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
        elements: baseElements
    });
    // Note: CSP meta tags are validated in customValidations, not here
    // to avoid duplicate reporting
    // Check for invalid elements
    children.forEach((element)=>{
        if ($580f7ed6bc170ae8$export$a8257692ac88316c(element, adapter)) return;
        // For invalid elements, we just report the element itself
        // (adapter doesn't have parentElement concept, so we can't find root)
        validationWarnings.push({
            ruleId: "no-invalid-head-elements",
            warning: `${adapter.getTagName(element)} elements are not allowed in the <head>`,
            element: element
        });
    });
    // Note: Origin trials are validated in customValidations, not here
    // to avoid duplicate reporting
    return validationWarnings;
}
function $580f7ed6bc170ae8$export$6c93e2175c028eeb(element, adapter, parentElement = null) {
    const results = [];
    if ((0, $9c3989fcb9437829$export$38a04d482ec50f88)(element, adapter)) results.push($580f7ed6bc170ae8$var$validateOriginTrial(element, adapter));
    if ((0, $9c3989fcb9437829$export$14b1a2f64a600585)(element, adapter)) results.push($580f7ed6bc170ae8$var$validateCSP(element, adapter));
    if ($580f7ed6bc170ae8$var$isDefaultStyle(element, adapter)) results.push($580f7ed6bc170ae8$var$validateDefaultStyle(element, adapter));
    if ($580f7ed6bc170ae8$var$isMetaViewport(element, adapter)) results.push($580f7ed6bc170ae8$var$validateMetaViewport(element, adapter));
    if ($580f7ed6bc170ae8$var$isContentType(element, adapter)) results.push($580f7ed6bc170ae8$var$validateContentType(element, adapter));
    if ($580f7ed6bc170ae8$var$isHttpEquiv(element, adapter)) results.push($580f7ed6bc170ae8$var$validateHttpEquiv(element, adapter));
    if ($580f7ed6bc170ae8$var$isUnnecessaryPreload(element, adapter, parentElement)) results.push($580f7ed6bc170ae8$var$validateUnnecessaryPreload(element, adapter, parentElement));
    if ($580f7ed6bc170ae8$var$isInvalidFontPreload(element, adapter)) results.push($580f7ed6bc170ae8$var$validateInvalidFontPreload(element, adapter));
    if (results.length === 0) return {};
    if (results.length === 1) return results[0];
    // Merge results
    const combined = {
        warnings: [],
        payload: {},
        ruleId: results[0].ruleId
    };
    results.forEach((result)=>{
        if (result.warnings) combined.warnings.push(...result.warnings);
        if (result.payload) Object.assign(combined.payload, result.payload);
    });
    return combined;
}
function $580f7ed6bc170ae8$var$validateCSP(element, adapter) {
    const warnings = [];
    let payload = null;
    const httpEquiv = adapter.getAttribute(element, "http-equiv");
    const httpEquivLower = httpEquiv?.toLowerCase();
    if (httpEquivLower === "content-security-policy-report-only") {
        //https://w3c.github.io/webappsec-csp/#meta-element
        warnings.push("CSP Report-Only is forbidden in meta tags");
        return {
            ruleId: "no-meta-csp",
            warnings: warnings,
            payload: payload
        };
    }
    if (httpEquivLower === "content-security-policy") warnings.push("meta CSP discouraged. See https://crbug.com/1458493.");
    const content = adapter.getAttribute(element, "content");
    if (!content) {
        warnings.push("Invalid CSP. The content attribute must be set.");
        return {
            warnings: warnings,
            payload: payload
        };
    }
    const directives = Object.fromEntries(content.split(/\s*;\s*/).map((directive)=>{
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
        ruleId: "no-meta-csp",
        warnings: warnings,
        payload: payload
    };
}
function $580f7ed6bc170ae8$var$isInvalidOriginTrial(element, adapter) {
    if (!(0, $9c3989fcb9437829$export$38a04d482ec50f88)(element, adapter)) return false;
    const { warnings: warnings } = $580f7ed6bc170ae8$var$validateOriginTrial(element, adapter);
    return warnings.length > 0;
}
function $580f7ed6bc170ae8$var$validateOriginTrial(element, adapter) {
    const metadata = {
        ruleId: "no-invalid-origin-trial",
        payload: null,
        warnings: []
    };
    const token = adapter.getAttribute(element, "content");
    try {
        metadata.payload = $580f7ed6bc170ae8$var$decodeOriginTrialToken(token);
    } catch  {
        metadata.warnings.push("invalid token");
        return metadata;
    }
    if (metadata.payload.expiry < new Date()) metadata.warnings.push("expired");
    // Origin validation only works in browser context with document.location
    if (typeof document !== "undefined" && document.location && document.location.href) {
        if (!$580f7ed6bc170ae8$var$isSameOrigin(metadata.payload.origin, document.location.href)) {
            const subdomain = $580f7ed6bc170ae8$var$isSubdomain(metadata.payload.origin, document.location.href);
            // Cross-origin OTs are only valid if:
            //   1. The document is a subdomain of the OT origin and the isSubdomain config is set
            //   2. The isThirdParty config is set
            if (subdomain && !metadata.payload.isSubdomain) metadata.warnings.push("invalid subdomain");
            else if (!subdomain && !metadata.payload.isThirdParty) metadata.warnings.push("invalid third-party origin");
        }
    }
    return metadata;
}
// Adapted from https://glitch.com/~ot-decode.
function $580f7ed6bc170ae8$var$decodeOriginTrialToken(token) {
    const buffer = new Uint8Array([
        ...atob(token)
    ].map((a)=>a.charCodeAt(0)));
    const view = new DataView(buffer.buffer);
    const length = view.getUint32(65, false);
    const payload = JSON.parse(new TextDecoder().decode(buffer.slice(69, 69 + length)));
    payload.expiry = new Date(payload.expiry * 1000);
    return payload;
}
function $580f7ed6bc170ae8$var$isSameOrigin(a, b) {
    return new URL(a).origin === new URL(b).origin;
}
// Whether b is a subdomain of a
function $580f7ed6bc170ae8$var$isSubdomain(a, b) {
    // www.example.com ends with .example.com
    a = new URL(a);
    b = new URL(b);
    return b.host.endsWith(`.${a.host}`);
}
function $580f7ed6bc170ae8$var$isDefaultStyle(element, adapter) {
    if (adapter.getTagName(element) !== "meta") return false;
    const httpEquiv = adapter.getAttribute(element, "http-equiv");
    return httpEquiv?.toLowerCase() === "default-style";
}
function $580f7ed6bc170ae8$var$isContentType(element, adapter) {
    // Matches: meta[http-equiv="content-type" i], meta[charset]
    if (adapter.getTagName(element) !== "meta") return false;
    if (adapter.hasAttribute(element, "charset")) return true;
    const httpEquiv = adapter.getAttribute(element, "http-equiv");
    return httpEquiv?.toLowerCase() === "content-type";
}
function $580f7ed6bc170ae8$var$isHttpEquiv(element, adapter) {
    // Matches: meta[http-equiv]
    if (adapter.getTagName(element) !== "meta") return false;
    return adapter.hasAttribute(element, "http-equiv");
}
function $580f7ed6bc170ae8$var$isMetaViewport(element, adapter) {
    if (adapter.getTagName(element) !== "meta") return false;
    const name = adapter.getAttribute(element, "name");
    return name?.toLowerCase() === "viewport";
}
function $580f7ed6bc170ae8$var$isInvalidDefaultStyle(element, adapter) {
    if (!$580f7ed6bc170ae8$var$isDefaultStyle(element, adapter)) return false;
    const { warnings: warnings } = $580f7ed6bc170ae8$var$validateDefaultStyle(element, adapter);
    return warnings.length > 0;
}
function $580f7ed6bc170ae8$var$isInvalidContentType(element, adapter) {
    if (!$580f7ed6bc170ae8$var$isContentType(element, adapter)) return false;
    const { warnings: warnings } = $580f7ed6bc170ae8$var$validateContentType(element, adapter);
    return warnings.length > 0;
}
function $580f7ed6bc170ae8$var$isInvalidHttpEquiv(element, adapter) {
    if (!$580f7ed6bc170ae8$var$isHttpEquiv(element, adapter)) return false;
    const { warnings: warnings } = $580f7ed6bc170ae8$var$validateHttpEquiv(element, adapter);
    return warnings.length > 0;
}
function $580f7ed6bc170ae8$var$isInvalidMetaViewport(element, adapter) {
    if (!$580f7ed6bc170ae8$var$isMetaViewport(element, adapter)) return false;
    const { warnings: warnings } = $580f7ed6bc170ae8$var$validateMetaViewport(element, adapter);
    return warnings.length > 0;
}
function $580f7ed6bc170ae8$var$isUnnecessaryPreload(element, adapter, parentElement = null) {
    // Matches: link:is([rel="preload" i], [rel="modulepreload" i])
    const tagName = adapter.getTagName(element);
    if (tagName !== "link") return false;
    const rel = adapter.getAttribute(element, "rel");
    const relLower = rel?.toLowerCase();
    if (relLower !== "preload" && relLower !== "modulepreload") return false;
    const href = adapter.getAttribute(element, "href");
    if (!href) return false;
    const parent = parentElement || adapter.getParent(element);
    if (!parent) return false;
    const found = $580f7ed6bc170ae8$var$findElementWithSource(parent, href, element, adapter);
    return found != null;
}
function $580f7ed6bc170ae8$var$isInvalidFontPreload(element, adapter) {
    const tagName = adapter.getTagName(element);
    if (tagName !== "link") return false;
    const rel = adapter.getAttribute(element, "rel");
    if (rel?.toLowerCase() !== "preload") return false;
    const as = adapter.getAttribute(element, "as");
    if (as?.toLowerCase() !== "font") return false;
    // crossorigin must be present (even if empty, which means anonymous)
    return !adapter.hasAttribute(element, "crossorigin");
}
function $580f7ed6bc170ae8$var$validateInvalidFontPreload(element, adapter) {
    const warnings = [
        "Font preloads must have the crossorigin attribute set, even for same-origin fonts."
    ];
    return {
        ruleId: "valid-font-preload",
        warnings: warnings,
        payload: null
    };
}
/**
 * Find an element with matching source using adapter (non-browser)
 * @param {*} parent - Parent element to search within
 * @param {string} sourceUrl - URL to match
 * @param {*} excludeElement - Element to exclude from search (the preload itself)
 * @param {*} adapter - Adapter instance
 * @returns {*|null} - Matching element or null
 */ function $580f7ed6bc170ae8$var$findElementWithSource(parent, sourceUrl, excludeElement, adapter) {
    const children = adapter.getChildren(parent);
    for (const child of children){
        // Skip the preload element itself
        if (child === excludeElement) continue;
        const tagName = adapter.getTagName(child);
        // Check link elements (but not preload/modulepreload)
        if (tagName === "link") {
            const rel = adapter.getAttribute(child, "rel");
            if (rel && /\b(preload|modulepreload)\b/i.test(rel)) continue; // Skip other preloads
            const childHref = adapter.getAttribute(child, "href");
            if (childHref === sourceUrl) return child;
        }
        // Check script elements
        if (tagName === "script") {
            const src = adapter.getAttribute(child, "src");
            if (src === sourceUrl) return child;
        }
    }
    return null;
}
function $580f7ed6bc170ae8$var$absolutifyUrl(href) {
    // Browser-only function
    if (typeof document === "undefined" || !document.baseURI) // In non-browser context, return href as-is
    return href;
    return new URL(href, document.baseURI).href;
}
function $580f7ed6bc170ae8$var$validateDefaultStyle(element, adapter) {
    const warnings = [];
    let payload = null;
    // Check if the value points to an alternate stylesheet with that title
    const title = adapter.getAttribute(element, "content");
    // Browser-only validation
    if (element.parentElement && element.parentElement.querySelector) {
        const stylesheet = element.parentElement.querySelector(`link[rel~="alternate" i][rel~="stylesheet" i][title="${title}"]`);
        if (!title) warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
        else if (!stylesheet) {
            payload = {
                alternateStylesheets: Array.from(element.parentElement.querySelectorAll('link[rel~="alternate" i][rel~="stylesheet" i]'))
            };
            warnings.push(`This has no effect. No alternate stylesheet found having title="${title}".`);
        }
    } else if (!title) // In non-browser context, we can still check for missing title
    warnings.push("This has no effect. The content attribute must be set to a valid stylesheet title.");
    warnings.push("Even when used correctly, the default-style method of setting a preferred stylesheet results in a flash of unstyled content. Use modern CSS features like @media rules instead.");
    return {
        ruleId: "no-default-style",
        warnings: warnings,
        payload: payload
    };
}
function $580f7ed6bc170ae8$var$validateContentType(element, adapter) {
    const warnings = [];
    let payload = null;
    // https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration
    // Check if there exists both meta[http-equiv] and meta[chartset] variations
    // Check if this is a charset or content-type meta
    const isCharset = adapter.hasAttribute(element, "charset");
    const httpEquiv = adapter.getAttribute(element, "http-equiv");
    const isContentTypeMeta = httpEquiv?.toLowerCase() === "content-type";
    if (isCharset || isContentTypeMeta) {
        // Check for duplicate charset declarations among siblings
        const siblings = adapter.getSiblings(element);
        const hasDuplicateCharset = siblings.some((sibling)=>{
            if (adapter.getTagName(sibling) !== "meta") return false;
            // Check if sibling is also a charset declaration
            if (adapter.hasAttribute(sibling, "charset")) return true;
            const siblingHttpEquiv = adapter.getAttribute(sibling, "http-equiv");
            return siblingHttpEquiv?.toLowerCase() === "content-type";
        });
        if (hasDuplicateCharset) {
            const parent = adapter.getParent(element);
            if (parent) {
                const charsetElements = adapter.getChildren(parent).filter((child)=>{
                    if (adapter.getTagName(child) !== "meta") return false;
                    if (adapter.hasAttribute(child, "charset")) return true;
                    const childHttpEquiv = adapter.getAttribute(child, "http-equiv");
                    return childHttpEquiv?.toLowerCase() === "content-type";
                });
                // Find the first one (not this element)
                const encodingDeclaration = charsetElements.find((el)=>el !== element);
                if (encodingDeclaration) {
                    payload = payload ?? {};
                    payload.encodingDeclaration = encodingDeclaration;
                    warnings.push(`There can only be one meta-based character encoding declaration per document. Already found \`${adapter.stringify(encodingDeclaration)}\`.`);
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
            warnings.push(`The element containing the character encoding declaration must be serialized completely within the first 1024 bytes of the document. Found at byte ${charPos}.`);
        }
    }
    // Check that the character encoding is UTF-8
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
    if (warnings.length) // Append the spec source to the last warning
    warnings[warnings.length - 1] += "\nLearn more: https://html.spec.whatwg.org/multipage/semantics.html#character-encoding-declaration";
    return {
        ruleId: "valid-charset",
        warnings: warnings,
        payload: payload
    };
}
function $580f7ed6bc170ae8$var$validateHttpEquiv(element, adapter) {
    const warnings = [];
    const type = adapter.getAttribute(element, "http-equiv").toLowerCase();
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
        ruleId: "no-invalid-http-equiv",
        warnings: warnings
    };
}
function $580f7ed6bc170ae8$var$validateMetaViewport(element, adapter) {
    const warnings = [];
    let payload = null;
    // Redundant meta viewport validation.
    // Check if there are other viewport meta elements among siblings
    const siblings = adapter.getSiblings(element);
    const hasDuplicateViewport = siblings.some((sibling)=>{
        if (adapter.getTagName(sibling) !== "meta") return false;
        const name = adapter.getAttribute(sibling, "name");
        return name?.toLowerCase() === "viewport";
    });
    if (hasDuplicateViewport) {
        const parent = adapter.getParent(element);
        if (parent) {
            const viewportElements = adapter.getChildren(parent).filter((child)=>{
                if (adapter.getTagName(child) !== "meta") return false;
                const name = adapter.getAttribute(child, "name");
                return name?.toLowerCase() === "viewport";
            });
            // Find the first one (not this element)
            const firstMetaViewport = viewportElements.find((el)=>el !== element);
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
    // Additional validation performed only on the first meta viewport.
    const content = adapter.getAttribute(element, "content")?.toLowerCase();
    if (!content) {
        warnings.push("Invalid viewport. The content attribute must be set.");
        return {
            warnings: warnings,
            payload: payload
        };
    }
    const directives = Object.fromEntries(content.split(",").map((directive)=>{
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
        if (maxScale < 2) warnings.push(`Disabling zoom levels under 2x can cause accessibility issues. Found "${maxScale}".`);
    }
    if ("user-scalable" in directives) {
        const userScalable = directives["user-scalable"];
        if (userScalable == "no" || userScalable == "0") warnings.push(`Disabling zooming can cause accessibility issues to users with visual impairments. Found "${userScalable}".`);
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
        if (validDirectives.has(directive)) // The directive is valid.
        return false;
        if (directive == "shrink-to-fit") // shrink-to-fit is not valid, but we have a separate warning for it.
        return false;
        directive;
        return true;
    }).forEach((directive)=>{
        warnings.push(`Invalid viewport directive "${directive}".`);
    });
    return {
        ruleId: "valid-meta-viewport",
        warnings: warnings,
        payload: payload
    };
}
function $580f7ed6bc170ae8$var$validateUnnecessaryPreload(element, adapter, parentElement = null) {
    const href = adapter.getAttribute(element, "href");
    if (!href) return {
        ruleId: "no-unnecessary-preload",
        warnings: []
    };
    const parent = parentElement || adapter.getParent(element);
    if (!parent) return {
        ruleId: "no-unnecessary-preload",
        warnings: []
    };
    const preloadedElement = $580f7ed6bc170ae8$var$findElementWithSource(parent, href, element, adapter);
    if (!preloadedElement) return {
        ruleId: "no-unnecessary-preload",
        warnings: []
    };
    return {
        ruleId: "no-unnecessary-preload",
        warnings: [
            `This preload has little to no effect. ${href} is already discoverable by another ${adapter.getTagName(preloadedElement)} element.`
        ]
    };
}


/**
 * Capo.js v2.0 - DOM-agnostic HTML <head> analyzer
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
 * @module core/analyzer
 */ 

function $bd17f9af34b32e13$export$66aa292af6e88fd9(headNode, adapter, options = {}) {
    const { includeValidation: includeValidation = true, includeCustomValidations: includeCustomValidations = true } = options;
    // Pass 1: Compute weights for all elements
    const weights = $9c3989fcb9437829$export$5cc4a311ddbe699c(headNode, adapter);
    // Pass 2: Get document-level validation warnings
    const validationWarnings = includeValidation ? (0, $580f7ed6bc170ae8$export$b01ab94d0cd042a0)(headNode, adapter) : [];
    // Pass 3: Get element-level custom validations
    const customValidations = includeCustomValidations ? $bd17f9af34b32e13$var$getElementValidations(headNode, adapter) : [];
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
 * @param {Object} adapter - HTMLAdapter implementation
 * @returns {Array<CustomValidation>}
 * @private
 */ function $bd17f9af34b32e13$var$getElementValidations(headNode, adapter) {
    const customValidations = [];
    const children = adapter.getChildren(headNode);
    for (const element of children){
        const validation = (0, $580f7ed6bc170ae8$export$6c93e2175c028eeb)(element, adapter, headNode);
        if (validation && validation.warnings && validation.warnings.length > 0) customValidations.push({
            ruleId: validation.ruleId,
            element: element,
            warnings: validation.warnings,
            payload: validation.payload
        });
    }
    return customValidations;
}
function $bd17f9af34b32e13$export$a824357f4ceaf2cf(weight) {
    // Find the category that matches this weight
    for (const [category, value] of Object.entries($9c3989fcb9437829$export$881088883fcab450)){
        if (value === weight) return category;
    }
    return "UNKNOWN";
}
function $bd17f9af34b32e13$export$9d3d5cf01843f4a8(weights) {
    const violations = [];
    for(let i = 0; i < weights.length - 1; i++){
        const current = weights[i];
        const next = weights[i + 1];
        if (current.weight < next.weight) {
            const currentCategory = $bd17f9af34b32e13$export$a824357f4ceaf2cf(current.weight);
            const nextCategory = $bd17f9af34b32e13$export$a824357f4ceaf2cf(next.weight);
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
function $bd17f9af34b32e13$export$283ccd6e4ed2051d(headNode, adapter, options = {}) {
    const result = $bd17f9af34b32e13$export$66aa292af6e88fd9(headNode, adapter, options);
    const orderingViolations = $bd17f9af34b32e13$export$9d3d5cf01843f4a8(result.weights);
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
 * Browser DOM adapter
 * 
 * Wraps native DOM Element APIs for use with capo.js core logic.
 * 
 * @implements {HTMLAdapter}
 * @example
 * import { BrowserAdapter } from './adapters/browser.js';
 * import { analyzeHead } from './core/analyzer.js';
 * 
 * const adapter = new BrowserAdapter();
 * const head = document.querySelector('head');
 * const result = analyzeHead(head, adapter);
 */ class $10d6cd7f44dbcf39$export$e467cc3399500025 {
    /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */ isElement(node) {
        if (!node) return false;
        // Node.ELEMENT_NODE === 1
        return node.nodeType === 1;
    }
    /**
   * Get the tag name of an element (lowercase)
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */ getTagName(node) {
        if (!node || !node.tagName) return "";
        return node.tagName.toLowerCase();
    }
    /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */ getAttribute(node, attrName) {
        if (!node || typeof node.getAttribute !== "function") return null;
        return node.getAttribute(attrName);
    }
    /**
   * Check if element has a specific attribute
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */ hasAttribute(node, attrName) {
        if (!node || typeof node.hasAttribute !== "function") return false;
        return node.hasAttribute(attrName);
    }
    /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */ getAttributeNames(node) {
        if (!node || typeof node.getAttributeNames !== "function") return [];
        return node.getAttributeNames();
    }
    /**
   * Get text content of a node (for inline scripts/styles)
   * @param {any} node - Element node
   * @returns {string} - Text content
   */ getTextContent(node) {
        if (!node) return "";
        return node.textContent || "";
    }
    /**
   * Get child elements of a node
   * @param {any} node - Parent node
   * @returns {any[]} - Array of child element nodes (excluding text/comment nodes)
   */ getChildren(node) {
        if (!node || !node.children) return [];
        return Array.from(node.children);
    }
    /**
   * Get parent element of a node
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */ getParent(node) {
        if (!node) return null;
        return node.parentElement || null;
    }
    /**
   * Get sibling elements of a node
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
   * @param {any} node - Element node
   * @returns {null}
   */ getLocation(node) {
        // Not available in browser DOM
        return null;
    }
    /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */ stringify(node) {
        if (!node || !node.nodeName) return "[invalid node]";
        const tagName = this.getTagName(node);
        const attrNames = this.getAttributeNames(node);
        if (attrNames.length === 0) return `<${tagName}>`;
        // Build attribute string
        const attrs = attrNames.map((attr)=>{
            const value = this.getAttribute(node, attr);
            // Escape value for display
            const escapedValue = value ? value.replace(/"/g, "&quot;") : "";
            return `${attr}="${escapedValue}"`;
        }).join(" ");
        return `<${tagName} ${attrs}>`;
    }
}


/**
 * @file HTML ESLint Parser adapter for @html-eslint/parser AST nodes
 * 
 * This adapter works with AST nodes from @html-eslint/parser,
 * which is used by eslint-plugin-capo and other HTML linting tools.
 */ /**
 * HTML ESLint Parser adapter for @html-eslint/parser AST nodes
 * 
 * Compatible with eslint-plugin-capo's node structure.
 * 
 * @implements {HTMLAdapter}
 * @example
 * import { HtmlEslintAdapter } from './adapters/html-eslint.js';
 * import { analyzeHead } from './core/analyzer.js';
 * 
 * const adapter = new HtmlEslintAdapter();
 * const headNode = context.getSourceCode().ast; // ESLint context
 * const result = analyzeHead(headNode, adapter);
 */ class $0b98ddac847d4078$export$c4babe4201bf7f14 {
    /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */ isElement(node) {
        if (!node) return false;
        return node.type === "Tag" || node.type === "ScriptTag" || node.type === "StyleTag";
    }
    /**
   * Get the tag name of an element (lowercase)
   * @param {any} element - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */ getTagName(node) {
        if (!node) return "";
        // Special handling for ScriptTag and StyleTag which don't have a name property
        if (node.type === "ScriptTag") return "script";
        if (node.type === "StyleTag") return "style";
        // Regular Tag nodes have a name property
        // Ensure it's lowercase as per the JSDoc
        return node.name ? node.name.toLowerCase() : "";
    }
    /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */ getAttribute(node, attrName) {
        if (!node || !node.attributes) return null;
        const normalizedAttrName = attrName.toLowerCase();
        const attr = node.attributes.find((a)=>{
            const keyName = a.key?.value;
            return keyName?.toLowerCase() === normalizedAttrName;
        });
        if (!attr || !attr.value) return null;
        // Handle different value types
        if (attr.value.type === "AttributeValue") return attr.value.value;
        // For quoted values
        if (typeof attr.value.value === "string") return attr.value.value;
        return null;
    }
    /**
   * Check if element has a specific attribute
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */ hasAttribute(node, attrName) {
        if (!node || !node.attributes) return false;
        const normalizedAttrName = attrName.toLowerCase();
        return node.attributes.some((a)=>{
            const keyName = a.key?.value;
            return keyName?.toLowerCase() === normalizedAttrName;
        });
    }
    /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */ getAttributeNames(node) {
        if (!node || !node.attributes) return [];
        return node.attributes.map((a)=>a.key?.value).filter(Boolean);
    }
    /**
   * Get the direct children of an element
   * @param {any} node - Element node
   * @returns {any[]} - Array of child element nodes (excluding text nodes)
   */ getChildren(node) {
        if (!node || !node.children) return [];
        // Return only element children, exclude text nodes and comments
        return node.children.filter((child)=>this.isElement(child));
    }
    /**
   * Get the text content of an element
   * @param {any} node - Element node
   * @returns {string} - Text content
   */ getTextContent(node) {
        if (!node) return "";
        // Special handling for StyleTag and ScriptTag which have a value property
        if ((node.type === "StyleTag" || node.type === "ScriptTag") && node.value) return node.value.value || "";
        if (!node.children || node.children.length === 0) return "";
        // Concatenate all text nodes (both Text and VText types)
        return node.children.filter((child)=>child.type === "Text" || child.type === "VText").map((child)=>child.value).join("");
    }
    /**
   * Get parent element of a node
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */ getParent(node) {
        if (!node || !node.parent) return null;
        // Return parent if it's an element, otherwise null
        return this.isElement(node.parent) ? node.parent : null;
    }
    /**
   * Get sibling elements of a node
   * @param {any} node - Element node
   * @returns {any[]} - Array of sibling element nodes (excluding the node itself)
   */ getSiblings(node) {
        if (!node) return [];
        const parent = this.getParent(node);
        if (!parent) return [];
        return this.getChildren(parent).filter((child)=>child !== node);
    }
    /**
   * Get source location for a node (for linting)
   * @param {any} node - Element node
   * @returns {{ line: number, column: number, endLine?: number, endColumn?: number } | null}
   */ getLocation(node) {
        if (!node || !node.loc) return null;
        return {
            line: node.loc.start.line,
            column: node.loc.start.column,
            endLine: node.loc.end?.line,
            endColumn: node.loc.end?.column
        };
    }
    /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */ stringify(node) {
        if (!node) return "[invalid node]";
        const tagName = this.getTagName(node);
        const attrNames = this.getAttributeNames(node);
        if (attrNames.length === 0) return `<${tagName}>`;
        const attrs = attrNames.map((name)=>{
            const value = this.getAttribute(node, name);
            if (value === null) // Boolean attribute without value (e.g., async)
            return name;
            const escapedValue = value.replace(/"/g, '\\"');
            return `${name}="${escapedValue}"`;
        }).join(" ");
        return `<${tagName} ${attrs}>`;
    }
}


/**
 * @file Adapter Factory
 * 
 * Provides a registry-based factory for creating adapters.
 * Supports both explicit adapter creation by name and auto-detection
 * from node structure.
 */ 

/**
 * @file Base adapter interface for HTML tree operations
 * 
 * This file defines the contract that all adapters must implement.
 * Adapters abstract away environment-specific operations (browser DOM vs AST nodes)
 * to make capo.js core logic reusable across different contexts.
 * 
 * @interface HTMLAdapter
 */ /**
 * Base adapter interface (documentation only)
 * 
 * Actual adapters should implement all these methods.
 * This serves as both documentation and a reference implementation.
 * 
 * @example
 * import { BrowserAdapter } from './browser.js';
 * import { ParserAdapter } from './parser.js';
 * 
 * // For browser DOM:
 * const adapter = new BrowserAdapter();
 * 
 * // For ESLint HTML parser AST:
 * const adapter = new ParserAdapter();
 */ const $4ae01fe0634f995d$export$d1d100ae3c773a95 = {
    /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */ isElement (node) {
        throw new Error("isElement() not implemented");
    },
    /**
   * Get the tag name of an element (lowercase)
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */ getTagName (node) {
        throw new Error("getTagName() not implemented");
    },
    /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */ getAttribute (node, attrName) {
        throw new Error("getAttribute() not implemented");
    },
    /**
   * Check if element has a specific attribute
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */ hasAttribute (node, attrName) {
        throw new Error("hasAttribute() not implemented");
    },
    /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */ getAttributeNames (node) {
        throw new Error("getAttributeNames() not implemented");
    },
    /**
   * Get text content of a node (for inline scripts/styles)
   * @param {any} node - Element node
   * @returns {string} - Text content
   */ getTextContent (node) {
        throw new Error("getTextContent() not implemented");
    },
    /**
   * Get child elements of a node
   * @param {any} node - Parent node
   * @returns {any[]} - Array of child element nodes (excluding text/comment nodes)
   */ getChildren (node) {
        throw new Error("getChildren() not implemented");
    },
    /**
   * Get parent element of a node
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */ getParent (node) {
        throw new Error("getParent() not implemented");
    },
    /**
   * Get sibling elements of a node
   * @param {any} node - Element node
   * @returns {any[]} - Array of sibling element nodes (excluding the node itself)
   */ getSiblings (node) {
        throw new Error("getSiblings() not implemented");
    },
    /**
   * Get source location for a node (optional, for linting)
   * @param {any} node - Element node
   * @returns {{ line: number, column: number, endLine?: number, endColumn?: number } | null}
   */ getLocation (node) {
        throw new Error("getLocation() not implemented");
    },
    /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */ stringify (node) {
        throw new Error("stringify() not implemented");
    }
};
function $4ae01fe0634f995d$export$8b0c6d51edeaa8b(adapter) {
    const requiredMethods = [
        "isElement",
        "getTagName",
        "getAttribute",
        "hasAttribute",
        "getAttributeNames",
        "getTextContent",
        "getChildren",
        "getParent",
        "getSiblings",
        "getLocation",
        "stringify"
    ];
    for (const method of requiredMethods){
        if (typeof adapter[method] !== "function") throw new Error(`Adapter missing required method: ${method}()`);
    }
}


/**
 * Registry of available adapters
 * Maps adapter names to their constructor classes
 */ const $1d0a3b21ce44e856$var$registry = new Map([
    [
        "browser",
        (0, $10d6cd7f44dbcf39$export$e467cc3399500025)
    ],
    [
        "html-eslint",
        (0, $0b98ddac847d4078$export$c4babe4201bf7f14)
    ],
    [
        "@html-eslint/parser",
        (0, $0b98ddac847d4078$export$c4babe4201bf7f14)
    ]
]);
class $1d0a3b21ce44e856$export$4f24674036ad9ae3 {
    /**
   * Create an adapter by name or auto-detect from node
   * 
   * @param {string|any} nameOrNode - Adapter name string or node to detect from
   * @returns {BrowserAdapter|HtmlEslintAdapter} Adapter instance
   * @throws {Error} If adapter name is unknown or node type cannot be detected
   */ static create(nameOrNode) {
        // If string name provided, look up in registry
        if (typeof nameOrNode === "string") return this.createByName(nameOrNode);
        // Otherwise auto-detect from node structure
        return this.detect(nameOrNode);
    }
    /**
   * Create an adapter by registered name
   * 
   * @param {string} name - Adapter name ('browser', 'html-eslint', etc.)
   * @returns {BrowserAdapter|HtmlEslintAdapter} Adapter instance
   * @throws {Error} If adapter name is not registered
   */ static createByName(name) {
        const AdapterClass = $1d0a3b21ce44e856$var$registry.get(name);
        if (!AdapterClass) {
            const available = Array.from($1d0a3b21ce44e856$var$registry.keys()).join(", ");
            throw new Error(`Unknown adapter: "${name}". Available adapters: ${available}`);
        }
        const adapter = new AdapterClass();
        // Validate that adapter implements the interface correctly
        try {
            (0, $4ae01fe0634f995d$export$8b0c6d51edeaa8b)(adapter);
        } catch (error) {
            throw new Error(`Adapter "${name}" failed validation: ${error.message}`);
        }
        return adapter;
    }
    /**
   * Auto-detect adapter from node structure
   * 
   * Examines the node to determine which adapter should be used.
   * 
   * @param {any} node - Node to examine
   * @returns {BrowserAdapter|HtmlEslintAdapter} Detected adapter
   * @throws {Error} If node type cannot be detected
   */ static detect(node) {
        if (!node) throw new Error("Cannot detect adapter: node is null or undefined");
        // Browser DOM Element
        // Check for nodeType property (standard DOM API)
        if (typeof node.nodeType === "number" && node.nodeType === 1) return new (0, $10d6cd7f44dbcf39$export$e467cc3399500025)();
        // @html-eslint/parser AST node
        // Check for type property with Tag/ScriptTag/StyleTag values
        if (node.type === "Tag" || node.type === "ScriptTag" || node.type === "StyleTag") return new (0, $0b98ddac847d4078$export$c4babe4201bf7f14)();
        // Future: JSX AST node detection
        // if (node.type === 'JSXElement') {
        //   return new JsxAdapter();
        // }
        // Unknown node type
        const nodeInfo = node.type ? `type="${node.type}"` : `nodeType=${node.nodeType}`;
        throw new Error(`Cannot detect adapter for node with ${nodeInfo}. ` + "Supported types: Browser DOM Element (nodeType=1), " + '@html-eslint/parser AST (type="Tag"|"ScriptTag"|"StyleTag")');
    }
    /**
   * Register a new adapter
   * 
   * Allows external code to register custom adapters for new parser types.
   * 
   * @param {string} name - Name to register adapter under
   * @param {Function} AdapterClass - Adapter constructor class
   * @throws {Error} If AdapterClass is not a constructor
   * 
   * @example
   * import { JsxAdapter } from './my-jsx-adapter.js';
   * AdapterFactory.register('jsx', JsxAdapter);
   * const adapter = AdapterFactory.create('jsx');
   */ static register(name, AdapterClass) {
        if (typeof AdapterClass !== "function") throw new Error(`Cannot register adapter "${name}": AdapterClass must be a constructor function`);
        // Test that the adapter can be instantiated
        try {
            const testInstance = new AdapterClass();
            (0, $4ae01fe0634f995d$export$8b0c6d51edeaa8b)(testInstance);
        } catch (error) {
            throw new Error(`Cannot register adapter "${name}": ${error.message}`);
        }
        $1d0a3b21ce44e856$var$registry.set(name, AdapterClass);
    }
    /**
   * List all registered adapter names
   * 
   * @returns {string[]} Array of registered adapter names
   */ static list() {
        return Array.from($1d0a3b21ce44e856$var$registry.keys());
    }
    /**
   * Check if an adapter is registered
   * 
   * @param {string} name - Adapter name to check
   * @returns {boolean} True if adapter is registered
   */ static has(name) {
        return $1d0a3b21ce44e856$var$registry.has(name);
    }
    /**
   * Unregister an adapter
   * 
   * Useful for testing or removing custom adapters.
   * Cannot remove built-in adapters (browser, html-eslint).
   * 
   * @param {string} name - Adapter name to remove
   * @returns {boolean} True if adapter was removed
   */ static unregister(name) {
        // Protect built-in adapters
        if (name === "browser" || name === "html-eslint" || name === "@html-eslint/parser") throw new Error(`Cannot unregister built-in adapter: "${name}"`);
        return $1d0a3b21ce44e856$var$registry.delete(name);
    }
}



 // Test utilities for custom adapters
 // These are exported via package.json for node usage only
 // to avoid bundling node:test in the browser.





function $0eec6c831ab0f90a$export$de6367c57cc1a573(io) {
    const adapter = new (0, $10d6cd7f44dbcf39$export$e467cc3399500025)();
    const headElement = io.getHead();
    const { weights: weights, validationWarnings: validationWarnings, orderingViolations: orderingViolations, customValidations: customValidations } = (0, $bd17f9af34b32e13$export$283ccd6e4ed2051d)(headElement, adapter);
    // Log validation warnings
    const originTrialWarnings = customValidations.filter((cv)=>cv.ruleId === "no-invalid-origin-trial").map((cv)=>({
            warning: `Invalid origin trial token: ${cv.warnings[0]}`,
            elements: [
                cv.element
            ],
            element: cv.payload
        }));
    io.logValidationWarnings([
        ...validationWarnings,
        ...originTrialWarnings
    ]);
    const customValidationsMap = new Map(customValidations.map((cv)=>[
            cv.element,
            cv
        ]));
    // Prepare weights for visualization
    const headWeights = weights.map(({ element: element, weight: weight })=>{
        const cv = customValidationsMap.get(element);
        return {
            weight: weight,
            element: io.getLoggableElement(element),
            isValid: !(0, $580f7ed6bc170ae8$export$eeefd08c3a6f8db7)(element, adapter),
            customValidations: cv ? {
                warnings: cv.warnings,
                ruleId: cv.ruleId
            } : {}
        };
    });
    io.visualizeHead("Actual", headElement, headWeights);
    const sortedWeights = Array.from(headWeights).sort((a, b)=>b.weight - a.weight);
    const sortedHead = document.createElement("head");
    sortedWeights.forEach(({ element: element })=>{
        sortedHead.appendChild(element.cloneNode(true));
    });
    io.visualizeHead("Sorted", sortedHead, sortedWeights);
    return headWeights;
}


const $fd3091053c5dfffc$var$CAPO_GLOBAL = "__CAPO__";
async function $fd3091053c5dfffc$var$run() {
    const options = new $5b739339de321a37$exports.Options(self[$fd3091053c5dfffc$var$CAPO_GLOBAL]);
    const io = new $d410929ede0a2ee4$exports.IO(document, options);
    await io.init();
    $0eec6c831ab0f90a$export$de6367c57cc1a573(io);
}
$fd3091053c5dfffc$var$run();

})();
