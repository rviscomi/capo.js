(() => {
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
var $parcel$global =
typeof globalThis !== 'undefined'
  ? globalThis
  : typeof self !== 'undefined'
  ? self
  : typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
  ? global
  : {};
var $parcel$modules = {};
var $parcel$inits = {};

var parcelRequire = $parcel$global["parcelRequire3a0c"];
if (parcelRequire == null) {
  parcelRequire = function(id) {
    if (id in $parcel$modules) {
      return $parcel$modules[id].exports;
    }
    if (id in $parcel$inits) {
      var init = $parcel$inits[id];
      delete $parcel$inits[id];
      var module = {id: id, exports: {}};
      $parcel$modules[id] = module;
      init.call(module.exports, module, module.exports);
      return module.exports;
    }
    var err = new Error("Cannot find module '" + id + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  };

  parcelRequire.register = function register(id, init) {
    $parcel$inits[id] = init;
  };

  $parcel$global["parcelRequire3a0c"] = parcelRequire;
}
parcelRequire.register("hCxrH", function(module, exports) {

var $1hr89 = parcelRequire("1hr89");

var $icOzf = parcelRequire("icOzf");

var $7QNe9 = parcelRequire("7QNe9");

var $dpA0m = parcelRequire("dpA0m");

var $7yK8r = parcelRequire("7yK8r");
async function run() {
    const options = new (0, $7QNe9.Options)(self?.CapoOptions);
    const io = new (0, $icOzf.IO)(document, options);
    await io.init();
    $1hr89.validateHead(io, $7yK8r);
    $1hr89.logWeights(io, $7yK8r, $dpA0m);
    const headWeights = $dpA0m.getHeadWeights(io.getHead());
    console.log("headWeights", headWeights);
    return JSON.stringify({
        actual: headWeights.map(({ element, weight })=>({
                weight: weight,
                selector: io.stringifyElement(element),
                innerHTML: element.innerHTML,
                isValid: !$7yK8r.hasValidationWarning(element)
            }))
    });
}
return run();

});
parcelRequire.register("1hr89", function(module, exports) {

$parcel$export(module.exports, "validateHead", () => $0eec6c831ab0f90a$export$8679af897d1c058e);
$parcel$export(module.exports, "logWeights", () => $0eec6c831ab0f90a$export$b65597cffe09aebc);
function $0eec6c831ab0f90a$export$8679af897d1c058e(io, validation) {
    const validationWarnings = validation.getValidationWarnings(io.getHead());
    io.logValidationWarnings(validationWarnings);
}
function $0eec6c831ab0f90a$export$b65597cffe09aebc(io, validation, rules) {
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
    const sortedWeights = headWeights.sort((a, b)=>b.weight - a.weight);
    const sortedHead = document.createElement("head");
    sortedWeights.forEach(({ element: element })=>{
        sortedHead.appendChild(element.cloneNode(true));
    });
    io.visualizeHead("Sorted", sortedHead, sortedWeights);
}

});

parcelRequire.register("icOzf", function(module, exports) {

$parcel$export(module.exports, "IO", () => $d410929ede0a2ee4$export$8f8422ac5947a789);
class $d410929ede0a2ee4$export$8f8422ac5947a789 {
    constructor(document, options){
        this.document = document;
        this.options = options;
        this.isStaticHead = false;
        this.head = null;
    }
    async init() {
        if (this.head) return;
        if (this.options.prefersDynamicAssessment()) {
            this.head = this.document.head;
            return;
        }
        try {
            let html = await this.getStaticHTML();
            html = html.replace(/(\<\/?)(head)/ig, "$1static-head");
            const staticDoc = this.document.implementation.createHTMLDocument("New Document");
            staticDoc.documentElement.innerHTML = html;
            this.head = staticDoc.querySelector("static-head");
            if (this.head) this.isStaticHead = true;
            else this.head = this.document.head;
        } catch (e) {
            console.error(`${this.options.loggingPrefix}An exception occurred while getting the static <head>:`, e);
            this.head = this.document.head;
        }
        if (!this.isStaticHead) console.warn(`${this.options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`, this.head);
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
        return element.getAttributeNames().reduce((id, attr)=>id += `[${attr}=${JSON.stringify(element.getAttribute(attr))}]`, element.nodeName);
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
            console[loggingLevel](...args);
            return;
        }
        const { payload: payload, warnings: warnings } = customValidations;
        if (payload) args.push(payload);
        if (warnings?.length) {
            // Element-specific warnings.
            loggingLevel = "warn";
            warnings.forEach((warning)=>args.push(`❌ ${warning}`));
        } else if (!isValid && (this.options.prefersDynamicAssessment() || this.isStaticHead)) {
            // General warnings.
            loggingLevel = "warn";
            args.push(`❌ invalid element (${element.tagName})`);
        }
        console[loggingLevel](...args);
    }
    logValidationWarnings(warnings) {
        if (!this.options.isValidationEnabled()) return;
        warnings.forEach(({ warning: warning, elements: elements = [], element: element })=>{
            elements = elements.map(this.getLoggableElement.bind(this));
            console.warn(`${this.options.loggingPrefix}${warning}`, ...elements, element);
        });
    }
    getHeadVisualization(weights) {
        const visual = weights.map((_)=>"%c ").join("");
        const styles = weights.map((weight)=>{
            const color = this.options.palette[10 - weight];
            return `background-color: ${color}; padding: 5px; margin: 0 -1px;`;
        });
        return {
            visual: visual,
            styles: styles
        };
    }
    getElementVisualization(weight) {
        const visual = `%c${new Array(weight + 1).fill("█").join("")}`;
        const style = `color: ${this.options.palette[10 - weight]}`;
        return {
            visual: visual,
            style: style
        };
    }
    visualizeHead(groupName, headElement, headWeights) {
        const headViz = this.getHeadVisualization(headWeights.map(({ weight: weight })=>weight));
        console.groupCollapsed(`${this.options.loggingPrefix}${groupName} %chead%c order\n${headViz.visual}`, "font-family: monospace", "font-family: inherit", ...headViz.styles);
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
        console.log(`${groupName} %chead%c element`, "font-family: monospace", "font-family: inherit", headElement);
        console.groupEnd();
    }
}

});

parcelRequire.register("7QNe9", function(module, exports) {

$parcel$export(module.exports, "Options", () => $5b739339de321a37$export$c019608e5b5bb4cb);

var $kcOfu = parcelRequire("kcOfu");
class $5b739339de321a37$export$c019608e5b5bb4cb {
    constructor({ preferredAssessmentMode: preferredAssessmentMode = $5b739339de321a37$export$c019608e5b5bb4cb.AssessmentMode.STATIC, validation: validation = true, palette: palette = $kcOfu.DEFAULT, loggingPrefix: loggingPrefix = "Capo: " } = {}){
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
    setValidation(validation) {
        if (!this.isValidValidation(validation)) throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
        this.validation = validation;
    }
    setPalette(palette) {
        if (!this.isValidPalette(palette)) throw new Error(`Invalid option: palette, expected [${Object.keys($kcOfu.Palettes).join("|")}] or an array of colors, got "${palette}".`);
        if (typeof palette === "string") {
            this.palette = $kcOfu.Palettes[palette];
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
        if (typeof palette === "string") return Object.keys($kcOfu.Palettes).includes(palette);
        if (!Array.isArray(palette)) return false;
        return palette.length === 11 && palette.every((color)=>typeof color === "string");
    }
    isValidLoggingPrefix(loggingPrefix) {
        return typeof loggingPrefix === "string";
    }
}

});
parcelRequire.register("kcOfu", function(module, exports) {

$parcel$export(module.exports, "DEFAULT", () => $eb5be8077a65b10b$export$e6952b12ade67489);
$parcel$export(module.exports, "Palettes", () => $eb5be8077a65b10b$export$9a82c28ef488e918);
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
        `oklch(99% .0.5 ${hue})`,
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

});


parcelRequire.register("dpA0m", function(module, exports) {

$parcel$export(module.exports, "isOriginTrial", () => $9c3989fcb9437829$export$38a04d482ec50f88);
$parcel$export(module.exports, "isMetaCSP", () => $9c3989fcb9437829$export$14b1a2f64a600585);
$parcel$export(module.exports, "getHeadWeights", () => $9c3989fcb9437829$export$5cc4a311ddbe699c);
const $9c3989fcb9437829$var$ElementWeights = {
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
const $9c3989fcb9437829$var$ElementDetectors = {
    META: $9c3989fcb9437829$var$isMeta,
    TITLE: $9c3989fcb9437829$var$isTitle,
    PRECONNECT: $9c3989fcb9437829$var$isPreconnect,
    ASYNC_SCRIPT: $9c3989fcb9437829$var$isAsyncScript,
    IMPORT_STYLES: $9c3989fcb9437829$var$isImportStyles,
    SYNC_SCRIPT: $9c3989fcb9437829$var$isSyncScript,
    SYNC_STYLES: $9c3989fcb9437829$var$isSyncStyles,
    PRELOAD: $9c3989fcb9437829$var$isPreload,
    DEFER_SCRIPT: $9c3989fcb9437829$var$isDeferScript,
    PREFETCH_PRERENDER: $9c3989fcb9437829$var$isPrefetchPrerender
};
function $9c3989fcb9437829$var$isMeta(element) {
    return element.matches("meta:is([charset], [http-equiv], [name=viewport]), base");
}
function $9c3989fcb9437829$var$isTitle(element) {
    return element.matches("title");
}
function $9c3989fcb9437829$var$isPreconnect(element) {
    return element.matches("link[rel=preconnect]");
}
function $9c3989fcb9437829$var$isAsyncScript(element) {
    return element.matches("script[src][async]");
}
function $9c3989fcb9437829$var$isImportStyles(element) {
    const importRe = /@import/;
    if (element.matches("style")) return importRe.test(element.textContent);
    /* TODO: Support external stylesheets.
  if (element.matches('link[rel=stylesheet][href]')) {
    let response = fetch(element.href);
    response = response.text();
    return importRe.test(response);
  } */ return false;
}
function $9c3989fcb9437829$var$isSyncScript(element) {
    return element.matches("script:not([src][defer],[src][type=module],[src][async],[type*=json])");
}
function $9c3989fcb9437829$var$isSyncStyles(element) {
    return element.matches("link[rel=stylesheet],style");
}
function $9c3989fcb9437829$var$isPreload(element) {
    return element.matches("link:is([rel=preload], [rel=modulepreload])");
}
function $9c3989fcb9437829$var$isDeferScript(element) {
    return element.matches("script[src][defer], script:not([src][async])[src][type=module]");
}
function $9c3989fcb9437829$var$isPrefetchPrerender(element) {
    return element.matches("link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])");
}
function $9c3989fcb9437829$export$38a04d482ec50f88(element) {
    return element.matches('meta[http-equiv="origin-trial"i]');
}
function $9c3989fcb9437829$export$14b1a2f64a600585(element) {
    return element.matches('meta[http-equiv="Content-Security-Policy" i]');
}
function $9c3989fcb9437829$var$getWeight(element) {
    for ([id, detector] of Object.entries($9c3989fcb9437829$var$ElementDetectors)){
        if (detector(element)) return $9c3989fcb9437829$var$ElementWeights[id];
    }
    return $9c3989fcb9437829$var$ElementWeights.OTHER;
}
function $9c3989fcb9437829$export$5cc4a311ddbe699c(head) {
    const headChildren = Array.from(head.children);
    return headChildren.map((element)=>{
        return {
            element: element,
            weight: $9c3989fcb9437829$var$getWeight(element)
        };
    });
}

});

parcelRequire.register("7yK8r", function(module, exports) {

$parcel$export(module.exports, "isValidElement", () => $580f7ed6bc170ae8$export$a8257692ac88316c);
$parcel$export(module.exports, "hasValidationWarning", () => $580f7ed6bc170ae8$export$eeefd08c3a6f8db7);
$parcel$export(module.exports, "getValidationWarnings", () => $580f7ed6bc170ae8$export$b01ab94d0cd042a0);
$parcel$export(module.exports, "getCustomValidations", () => $580f7ed6bc170ae8$export$6c93e2175c028eeb);

var $dpA0m = parcelRequire("dpA0m");
const $580f7ed6bc170ae8$var$VALID_HEAD_ELEMENTS = new Set([
    "base",
    "link",
    "meta",
    "noscript",
    "script",
    "style",
    "template",
    "title"
]);
function $580f7ed6bc170ae8$export$a8257692ac88316c(element) {
    return $580f7ed6bc170ae8$var$VALID_HEAD_ELEMENTS.has(element.tagName.toLowerCase());
}
function $580f7ed6bc170ae8$export$eeefd08c3a6f8db7(element) {
    // Element itself is not valid.
    if (!$580f7ed6bc170ae8$export$a8257692ac88316c(element)) return true;
    // Children are not valid.
    if (element.matches(`:has(:not(${Array.from($580f7ed6bc170ae8$var$VALID_HEAD_ELEMENTS).join(", ")}))`)) return true;
    // <title> is not the first of its type.
    if (element.matches("title:is(:nth-of-type(n+2))")) return true;
    // <base> is not the first of its type.
    if (element.matches("base:is(:nth-of-type(n+2))")) return true;
    // CSP meta tag anywhere.
    if ((0, $dpA0m.isMetaCSP)(element)) return true;
    return false;
}
function $580f7ed6bc170ae8$export$b01ab94d0cd042a0(head) {
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
        if ($580f7ed6bc170ae8$export$a8257692ac88316c(element)) return;
        let root = element;
        while(root.parentElement != head)root = root.parentElement;
        validationWarnings.push({
            warning: `${element.tagName} elements are not allowed in the <head>`,
            element: root
        });
    });
    return validationWarnings;
}
function $580f7ed6bc170ae8$export$6c93e2175c028eeb(element) {
    if ((0, $dpA0m.isOriginTrial)(element)) return $580f7ed6bc170ae8$var$validateOriginTrial(element);
    if ((0, $dpA0m.isMetaCSP)(element)) return $580f7ed6bc170ae8$var$validateCSP(element);
    return {};
}
function $580f7ed6bc170ae8$var$validateCSP(element) {
    return {
        warnings: [
            "meta CSP discouraged. See https://crbug.com/1458493."
        ]
    };
}
function $580f7ed6bc170ae8$var$validateOriginTrial(element) {
    const metadata = {
        payload: null,
        warnings: []
    };
    const token = element.getAttribute("content");
    try {
        metadata.payload = $580f7ed6bc170ae8$var$decodeOriginTrialToken(token);
        if (metadata.payload.expiry < new Date()) metadata.warnings.push("expired");
        if (!metadata.payload.isThirdParty && !$580f7ed6bc170ae8$var$isSameOrigin(metadata.payload.origin, document.location.href)) metadata.warnings.push("invalid origin");
    } catch  {
        metadata.warnings.push("invalid token");
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

});



parcelRequire("hCxrH");
})();
