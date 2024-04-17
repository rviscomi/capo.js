function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
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
        "#ccc"
    ];
}
const $47602b39438c5a8c$export$e6952b12ade67489 = [
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
const $47602b39438c5a8c$export$d68d0fda4a10dbc2 = $47602b39438c5a8c$export$921514c0345db5eb($47602b39438c5a8c$var$Hues.PINK);
const $47602b39438c5a8c$export$738c3b9a44c87ecc = $47602b39438c5a8c$export$921514c0345db5eb($47602b39438c5a8c$var$Hues.BLUE);
const $47602b39438c5a8c$export$9a82c28ef488e918 = {
    DEFAULT: $47602b39438c5a8c$export$e6952b12ade67489,
    PINK: $47602b39438c5a8c$export$d68d0fda4a10dbc2,
    BLUE: $47602b39438c5a8c$export$738c3b9a44c87ecc
};
function $47602b39438c5a8c$export$18c940335d915715(elementColor) {
    let invalidColor = "#cccccc";
    if (elementColor == invalidColor) invalidColor = "red";
    return `repeating-linear-gradient(45deg, ${elementColor}, ${elementColor} 3px, ${invalidColor} 3px, ${invalidColor} 6px)`;
}


var $33f7359dc421be0c$exports = {};

$parcel$export($33f7359dc421be0c$exports, "IO", () => $33f7359dc421be0c$export$8f8422ac5947a789);

class $33f7359dc421be0c$export$8f8422ac5947a789 {
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
        const viz = this.getElementVisualization(weight);
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
    logElement({ viz: viz, weight: weight, element: element, isValid: isValid, customValidations: customValidations, omitPrefix: omitPrefix = false }) {
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
            warnings.forEach((warning)=>args.push(`❌ ${warning}`));
        } else if (!isValid && (this.options.prefersDynamicAssessment() || this.isStaticHead)) {
            // General warnings.
            loggingLevel = "warn";
            args.push(`❌ invalid element (${element.tagName})`);
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
            else style += `background-image: ${(0, $47602b39438c5a8c$export$18c940335d915715)(color)}`;
            styles.push(style);
        });
        return {
            visual: visual,
            styles: styles
        };
    }
    getElementVisualization(weight) {
        const visual = `%c${new Array(weight + 1).fill("█").join("")}`;
        const color = this.getColor(weight);
        const style = `color: ${color}`;
        return {
            visual: visual,
            style: style
        };
    }
    visualizeHead(groupName, headElement, headWeights) {
        const headViz = this.getHeadVisualization(headWeights);
        this.console.groupCollapsed(`${this.options.loggingPrefix}${groupName} %chead%c order\n${headViz.visual}`, "font-family: monospace", "font-family: inherit", ...headViz.styles);
        headWeights.forEach(({ weight: weight, element: element, isValid: isValid, customValidations: customValidations })=>{
            const viz = this.getElementVisualization(weight);
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


var $5daa40bf356478d7$exports = {};

$parcel$export($5daa40bf356478d7$exports, "Options", () => $5daa40bf356478d7$export$c019608e5b5bb4cb);

class $5daa40bf356478d7$export$c019608e5b5bb4cb {
    constructor({ preferredAssessmentMode: preferredAssessmentMode = $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.STATIC, validation: validation = true, palette: palette = $47602b39438c5a8c$export$e6952b12ade67489, loggingPrefix: loggingPrefix = "Capo: " } = {}){
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
        return $47602b39438c5a8c$export$9a82c28ef488e918;
    }
    prefersStaticAssessment() {
        return this.preferredAssessmentMode === $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.STATIC;
    }
    prefersDynamicAssessment() {
        return this.preferredAssessmentMode === $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.DYNAMIC;
    }
    isValidationEnabled() {
        return this.validation;
    }
    setPreferredAssessmentMode(preferredAssessmentMode) {
        if (!this.isValidAssessmentMode(preferredAssessmentMode)) throw new Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`);
        this.preferredAssessmentMode = preferredAssessmentMode;
    }
    setPreferredAssessmentModeToStatic(prefersStatic) {
        let mode = $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.STATIC;
        if (!prefersStatic) mode = $5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode.DYNAMIC;
        this.setPreferredAssessmentMode(mode);
    }
    setValidation(validation) {
        if (!this.isValidValidation(validation)) throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
        this.validation = validation;
    }
    setPalette(palette) {
        if (!this.isValidPalette(palette)) throw new Error(`Invalid option: palette, expected [${Object.keys($47602b39438c5a8c$export$9a82c28ef488e918).join("|")}] or an array of colors, got "${palette}".`);
        if (typeof palette === "string") {
            this.palette = $47602b39438c5a8c$export$9a82c28ef488e918[palette];
            return;
        }
        this.palette = palette;
    }
    setLoggingPrefix(loggingPrefix) {
        if (!this.isValidLoggingPrefix(loggingPrefix)) throw new Error(`Invalid option: logging prefix, expected string, got "${loggingPrefix}".`);
        this.loggingPrefix = loggingPrefix;
    }
    isValidAssessmentMode(assessmentMode) {
        return Object.values($5daa40bf356478d7$export$c019608e5b5bb4cb.AssessmentMode).includes(assessmentMode);
    }
    isValidValidation(validation) {
        return typeof validation === "boolean";
    }
    isValidPalette(palette) {
        if (typeof palette === "string") return Object.keys($47602b39438c5a8c$export$9a82c28ef488e918).includes(palette);
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


var $ee7e0c73e51ebfda$exports = {};

$parcel$export($ee7e0c73e51ebfda$exports, "ElementWeights", () => $ee7e0c73e51ebfda$export$881088883fcab450);
$parcel$export($ee7e0c73e51ebfda$exports, "ElementDetectors", () => $ee7e0c73e51ebfda$export$6ade8bb3620eb74b);
$parcel$export($ee7e0c73e51ebfda$exports, "isMeta", () => $ee7e0c73e51ebfda$export$daeb0db0c224decd);
$parcel$export($ee7e0c73e51ebfda$exports, "isTitle", () => $ee7e0c73e51ebfda$export$e55aad21605f020a);
$parcel$export($ee7e0c73e51ebfda$exports, "isPreconnect", () => $ee7e0c73e51ebfda$export$a3316bd0a640eb8b);
$parcel$export($ee7e0c73e51ebfda$exports, "isAsyncScript", () => $ee7e0c73e51ebfda$export$20e2051ffd813ee3);
$parcel$export($ee7e0c73e51ebfda$exports, "isImportStyles", () => $ee7e0c73e51ebfda$export$be443fc6335656f0);
$parcel$export($ee7e0c73e51ebfda$exports, "isSyncScript", () => $ee7e0c73e51ebfda$export$65983fc0a5543400);
$parcel$export($ee7e0c73e51ebfda$exports, "isSyncStyles", () => $ee7e0c73e51ebfda$export$9d6cdbffb13bee21);
$parcel$export($ee7e0c73e51ebfda$exports, "isPreload", () => $ee7e0c73e51ebfda$export$226ad5ba23be83f0);
$parcel$export($ee7e0c73e51ebfda$exports, "isDeferScript", () => $ee7e0c73e51ebfda$export$3d269f86e8bd1d24);
$parcel$export($ee7e0c73e51ebfda$exports, "isPrefetchPrerender", () => $ee7e0c73e51ebfda$export$4d2ed086e1fec499);
$parcel$export($ee7e0c73e51ebfda$exports, "META_HTTP_EQUIV_KEYWORDS", () => $ee7e0c73e51ebfda$export$b7417cf4a2235f73);
$parcel$export($ee7e0c73e51ebfda$exports, "isOriginTrial", () => $ee7e0c73e51ebfda$export$38a04d482ec50f88);
$parcel$export($ee7e0c73e51ebfda$exports, "isMetaCSP", () => $ee7e0c73e51ebfda$export$14b1a2f64a600585);
$parcel$export($ee7e0c73e51ebfda$exports, "getWeight", () => $ee7e0c73e51ebfda$export$de32fe5d64aee40c);
$parcel$export($ee7e0c73e51ebfda$exports, "getHeadWeights", () => $ee7e0c73e51ebfda$export$5cc4a311ddbe699c);
const $ee7e0c73e51ebfda$export$881088883fcab450 = {
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
const $ee7e0c73e51ebfda$export$b7417cf4a2235f73 = [
    "accept-ch",
    "content-security-policy",
    "content-type",
    "default-style",
    "delegate-ch",
    "origin-trial",
    "x-dns-prefetch-control"
];
function $ee7e0c73e51ebfda$export$daeb0db0c224decd(element) {
    const httpEquivSelector = $ee7e0c73e51ebfda$export$b7417cf4a2235f73.map((keyword)=>{
        return `[http-equiv="${keyword}" i]`;
    }).join(", ");
    return element.matches(`meta:is([charset], ${httpEquivSelector}, [name=viewport]), base`);
}
function $ee7e0c73e51ebfda$export$e55aad21605f020a(element) {
    return element.matches("title");
}
function $ee7e0c73e51ebfda$export$a3316bd0a640eb8b(element) {
    return element.matches("link[rel=preconnect]");
}
function $ee7e0c73e51ebfda$export$20e2051ffd813ee3(element) {
    return element.matches("script[src][async]");
}
function $ee7e0c73e51ebfda$export$be443fc6335656f0(element) {
    const importRe = /@import/;
    if (element.matches("style")) return importRe.test(element.textContent);
    /* TODO: Support external stylesheets.
  if (element.matches('link[rel=stylesheet][href]')) {
    let response = fetch(element.href);
    response = response.text();
    return importRe.test(response);
  } */ return false;
}
function $ee7e0c73e51ebfda$export$65983fc0a5543400(element) {
    return element.matches("script:not([src][defer],[src][type=module],[src][async],[type*=json])");
}
function $ee7e0c73e51ebfda$export$9d6cdbffb13bee21(element) {
    return element.matches("link[rel=stylesheet],style");
}
function $ee7e0c73e51ebfda$export$226ad5ba23be83f0(element) {
    return element.matches("link:is([rel=preload], [rel=modulepreload])");
}
function $ee7e0c73e51ebfda$export$3d269f86e8bd1d24(element) {
    return element.matches("script[src][defer], script:not([src][async])[src][type=module]");
}
function $ee7e0c73e51ebfda$export$4d2ed086e1fec499(element) {
    return element.matches("link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])");
}
function $ee7e0c73e51ebfda$export$38a04d482ec50f88(element) {
    return element.matches('meta[http-equiv="origin-trial"i]');
}
function $ee7e0c73e51ebfda$export$14b1a2f64a600585(element) {
    return element.matches('meta[http-equiv="Content-Security-Policy" i], meta[http-equiv="Content-Security-Policy-Report-Only" i]');
}
function $ee7e0c73e51ebfda$export$de32fe5d64aee40c(element) {
    for (let [id, detector] of Object.entries($ee7e0c73e51ebfda$export$6ade8bb3620eb74b)){
        if (detector(element)) return $ee7e0c73e51ebfda$export$881088883fcab450[id];
    }
    return $ee7e0c73e51ebfda$export$881088883fcab450.OTHER;
}
function $ee7e0c73e51ebfda$export$5cc4a311ddbe699c(head) {
    const headChildren = Array.from(head.children);
    return headChildren.map((element)=>{
        return {
            element: element,
            weight: $ee7e0c73e51ebfda$export$de32fe5d64aee40c(element)
        };
    });
}


var $c322f9a5057eaf5c$exports = {};

$parcel$export($c322f9a5057eaf5c$exports, "VALID_HEAD_ELEMENTS", () => $c322f9a5057eaf5c$export$79e124b7caef7aa9);
$parcel$export($c322f9a5057eaf5c$exports, "PRELOAD_SELECTOR", () => $c322f9a5057eaf5c$export$5540ac2a18901364);
$parcel$export($c322f9a5057eaf5c$exports, "isValidElement", () => $c322f9a5057eaf5c$export$a8257692ac88316c);
$parcel$export($c322f9a5057eaf5c$exports, "hasValidationWarning", () => $c322f9a5057eaf5c$export$eeefd08c3a6f8db7);
$parcel$export($c322f9a5057eaf5c$exports, "getValidationWarnings", () => $c322f9a5057eaf5c$export$b01ab94d0cd042a0);
$parcel$export($c322f9a5057eaf5c$exports, "getCustomValidations", () => $c322f9a5057eaf5c$export$6c93e2175c028eeb);

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
const $c322f9a5057eaf5c$export$5540ac2a18901364 = 'link:is([rel="preload" i], [rel="modulepreload" i])';
function $c322f9a5057eaf5c$export$a8257692ac88316c(element) {
    return $c322f9a5057eaf5c$export$79e124b7caef7aa9.has(element.tagName.toLowerCase());
}
function $c322f9a5057eaf5c$export$eeefd08c3a6f8db7(element) {
    // Element itself is not valid.
    if (!$c322f9a5057eaf5c$export$a8257692ac88316c(element)) return true;
    // Children are not valid.
    if (element.matches(`:has(:not(${Array.from($c322f9a5057eaf5c$export$79e124b7caef7aa9).join(", ")}))`)) return true;
    // <title> is not the first of its type.
    if (element.matches("title:is(:nth-of-type(n+2))")) return true;
    // <base> is not the first of its type.
    if (element.matches("base:has(~ base), base ~ base")) return true;
    // CSP meta tag anywhere.
    if ((0, $ee7e0c73e51ebfda$export$14b1a2f64a600585)(element)) return true;
    // Origin trial expired or cross-origin.
    if ($c322f9a5057eaf5c$var$isInvalidOriginTrial(element)) return true;
    // Preload is unnecessary.
    if ($c322f9a5057eaf5c$var$isUnnecessaryPreload(element)) return true;
    return false;
}
function $c322f9a5057eaf5c$export$b01ab94d0cd042a0(head) {
    const validationWarnings = [];
    const titleElements = Array.from(head.querySelectorAll("title"));
    const titleElementCount = titleElements.length;
    if (titleElementCount != 1) validationWarnings.push({
        warning: `Expected exactly 1 <title> element, found ${titleElementCount}`,
        elements: titleElements
    });
    const baseElements = Array.from(head.querySelectorAll("base"));
    const baseElementCount = baseElements.length;
    if (baseElementCount > 1) validationWarnings.push({
        warning: `Expected at most 1 <base> element, found ${baseElementCount}`,
        elements: baseElements
    });
    const metaCSP = head.querySelector('meta[http-equiv="Content-Security-Policy" i]');
    if (metaCSP) validationWarnings.push({
        warning: "CSP meta tags disable the preload scanner due to a bug in Chrome. Use the CSP header instead. Learn more: https://crbug.com/1458493",
        element: metaCSP
    });
    head.querySelectorAll("*").forEach((element)=>{
        if ($c322f9a5057eaf5c$export$a8257692ac88316c(element)) return;
        let root = element;
        while(root.parentElement != head)root = root.parentElement;
        validationWarnings.push({
            warning: `${element.tagName} elements are not allowed in the <head>`,
            element: root
        });
    });
    const originTrials = Array.from(head.querySelectorAll('meta[http-equiv="Origin-Trial" i]'));
    originTrials.forEach((element)=>{
        const metadata = $c322f9a5057eaf5c$var$validateOriginTrial(element);
        if (metadata.warnings.length == 0) return;
        validationWarnings.push({
            warning: `Invalid origin trial token: ${metadata.warnings.join(", ")}`,
            elements: [
                element
            ],
            element: metadata.payload
        });
    });
    return validationWarnings;
}
function $c322f9a5057eaf5c$export$6c93e2175c028eeb(element) {
    if ((0, $ee7e0c73e51ebfda$export$38a04d482ec50f88)(element)) return $c322f9a5057eaf5c$var$validateOriginTrial(element);
    if ((0, $ee7e0c73e51ebfda$export$14b1a2f64a600585)(element)) return $c322f9a5057eaf5c$var$validateCSP(element);
    if ($c322f9a5057eaf5c$var$isUnnecessaryPreload(element)) return $c322f9a5057eaf5c$var$validateUnnecessaryPreload(element);
    return {};
}
function $c322f9a5057eaf5c$var$validateCSP(element) {
    const warnings = [];
    if (element.matches('meta[http-equiv="Content-Security-Policy-Report-Only" i]')) //https://w3c.github.io/webappsec-csp/#meta-element
    warnings.push("CSP Report-Only is forbidden in meta tags");
    else if (element.matches('meta[http-equiv="Content-Security-Policy" i]')) warnings.push("meta CSP discouraged. See https://crbug.com/1458493.");
    return {
        warnings: warnings
    };
}
function $c322f9a5057eaf5c$var$isInvalidOriginTrial(element) {
    if (!(0, $ee7e0c73e51ebfda$export$38a04d482ec50f88)(element)) return false;
    const { warnings: warnings } = $c322f9a5057eaf5c$var$validateOriginTrial(element);
    return warnings.length > 0;
}
function $c322f9a5057eaf5c$var$validateOriginTrial(element) {
    const metadata = {
        payload: null,
        warnings: []
    };
    const token = element.getAttribute("content");
    try {
        metadata.payload = $c322f9a5057eaf5c$var$decodeOriginTrialToken(token);
    } catch  {
        metadata.warnings.push("invalid token");
        return metadata;
    }
    if (metadata.payload.expiry < new Date()) metadata.warnings.push("expired");
    if (!$c322f9a5057eaf5c$var$isSameOrigin(metadata.payload.origin, document.location.href)) {
        const subdomain = $c322f9a5057eaf5c$var$isSubdomain(metadata.payload.origin, document.location.href);
        if (subdomain && !metadata.payload.isSubdomain) metadata.warnings.push("invalid subdomain");
        else if (!subdomain && !metadata.payload.isThirdParty) metadata.warnings.push("invalid origin");
    }
    return metadata;
}
// Adapted from https://glitch.com/~ot-decode.
function $c322f9a5057eaf5c$var$decodeOriginTrialToken(token) {
    const buffer = new Uint8Array([
        ...atob(token)
    ].map((a)=>a.charCodeAt(0)));
    const view = new DataView(buffer.buffer);
    const length = view.getUint32(65, false);
    const payload = JSON.parse(new TextDecoder().decode(buffer.slice(69, 69 + length)));
    payload.expiry = new Date(payload.expiry * 1000);
    return payload;
}
function $c322f9a5057eaf5c$var$isSameOrigin(a, b) {
    return new URL(a).origin === new URL(b).origin;
}
// Whether b is a subdomain of a
function $c322f9a5057eaf5c$var$isSubdomain(a, b) {
    // www.example.com ends with .example.com
    a = new URL(a);
    b = new URL(b);
    return b.host.endsWith(`.${a.host}`);
}
function $c322f9a5057eaf5c$var$isUnnecessaryPreload(element) {
    if (!element.matches($c322f9a5057eaf5c$export$5540ac2a18901364)) return false;
    const href = element.getAttribute("href");
    if (!href) return false;
    const preloadedUrl = $c322f9a5057eaf5c$var$absolutifyUrl(href);
    return $c322f9a5057eaf5c$var$findElementWithSource(element.parentElement, preloadedUrl) != null;
}
function $c322f9a5057eaf5c$var$findElementWithSource(root, sourceUrl) {
    const linksAndScripts = Array.from(root.querySelectorAll(`link:not(${$c322f9a5057eaf5c$export$5540ac2a18901364}), script`));
    return linksAndScripts.find((e)=>{
        const src = e.getAttribute("href") || e.getAttribute("src");
        if (!src) return false;
        return sourceUrl == $c322f9a5057eaf5c$var$absolutifyUrl(src);
    });
}
function $c322f9a5057eaf5c$var$absolutifyUrl(href) {
    return new URL(href, document.baseURI).href;
}
function $c322f9a5057eaf5c$var$validateUnnecessaryPreload(element) {
    const href = element.getAttribute("href");
    const preloadedUrl = $c322f9a5057eaf5c$var$absolutifyUrl(href);
    const preloadedElement = $c322f9a5057eaf5c$var$findElementWithSource(element.parentElement, preloadedUrl);
    if (!preloadedElement) throw new Error("Expected an invalid preload, but none found.");
    return {
        warnings: [
            `This preload has little to no effect. ${href} is already discoverable by another ${preloadedElement.tagName} element.`
        ]
    };
}




function $b9ac488c89f25519$export$8679af897d1c058e(io, validation) {
    const validationWarnings = validation.getValidationWarnings(io.getHead());
    io.logValidationWarnings(validationWarnings);
}
function $b9ac488c89f25519$export$b65597cffe09aebc(io, validation, rules) {
    const headElement = io.getHead();
    const headWeights = rules.getHeadWeights(headElement).map(({ element: element, weight: weight })=>{
        return {
            weight: weight,
            element: io.getLoggableElement(element),
            isValid: !validation.hasValidationWarning(element),
            customValidations: validation.getCustomValidations(element)
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


const $3536df9ffc9a62b8$var$FORCED_OPTIONS = {
    preferredAssessmentMode: $5daa40bf356478d7$exports.Options.AssessmentMode.DYNAMIC
};
function $3536df9ffc9a62b8$export$889ea624f2cb2c57(input, output, userOptions = {}) {
    userOptions = Object.assign(userOptions, $3536df9ffc9a62b8$var$FORCED_OPTIONS);
    const staticDoc = document.implementation.createHTMLDocument("New Document");
    staticDoc.documentElement.innerHTML = input;
    const options = new $5daa40bf356478d7$exports.Options(userOptions);
    const io = new $33f7359dc421be0c$exports.IO(staticDoc.documentElement, options, output);
    io.init();
    $b9ac488c89f25519$export$8679af897d1c058e(io, $c322f9a5057eaf5c$exports);
    $b9ac488c89f25519$export$b65597cffe09aebc(io, $c322f9a5057eaf5c$exports, $ee7e0c73e51ebfda$exports);
}


export {$3536df9ffc9a62b8$export$889ea624f2cb2c57 as run};
