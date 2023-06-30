(() => {
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


class $572ba3e4dcd864b9$export$e93312b7773dfcac {
    constructor(document, options){
        this.document = document;
        this.options = options;
        this.isStatic = false;
        this.head = null;
    }
    getElement() {
        return this.head;
    }
    async getStaticHTML() {
        const url = this.document.location.href;
        const response = await fetch(url);
        return await response.text();
    }
    async getStaticOrDynamicHead() {
        if (this.head) return this.head;
        if (this.options.prefersDynamicAssessment()) {
            this.head = this.document.head;
            return this.head;
        }
        try {
            let html = await this.getStaticHTML();
            html = html.replace(/(<\/?)(head)/ig, "$1static-head");
            const staticDoc = this.document.implementation.createHTMLDocument("New Document");
            staticDoc.documentElement.innerHTML = html;
            this.head = staticDoc.querySelector("static-head");
            if (this.head) this.isStatic = true;
            else this.head = this.document.head;
        } catch  {
            this.head = this.document.head;
        }
        return this.head;
    }
}


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


const $5b739339de321a37$export$822eeec733be27fd = {
    STATIC: "static",
    DYNAMIC: "dynamic"
};
class $5b739339de321a37$export$c019608e5b5bb4cb {
    constructor({ preferredAssessmentMode: preferredAssessmentMode = $5b739339de321a37$export$822eeec733be27fd.STATIC, validation: validation = true }){
        if (!this.isValidAssessmentMode(preferredAssessmentMode)) throw new Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`);
        if (!this.isValidValidation(validation)) throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
        this.preferredAssessmentMode = preferredAssessmentMode;
        this.validation = validation;
    }
    isValidAssessmentMode(assessmentMode) {
        return Object.values($5b739339de321a37$export$822eeec733be27fd).includes(assessmentMode);
    }
    isValidValidation(validation) {
        return typeof validation === "boolean";
    }
    prefersStaticAssessment() {
        return this.preferredAssessmentMode === $5b739339de321a37$export$822eeec733be27fd.STATIC;
    }
    prefersDynamicAssessment() {
        return this.preferredAssessmentMode === $5b739339de321a37$export$822eeec733be27fd.DYNAMIC;
    }
    isValidationEnabled() {
        return this.validation;
    }
}



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
    if ((0, $9c3989fcb9437829$export$14b1a2f64a600585)(element)) return true;
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
    if ((0, $9c3989fcb9437829$export$38a04d482ec50f88)(element)) return $580f7ed6bc170ae8$var$validateOriginTrial(element);
    if ((0, $9c3989fcb9437829$export$14b1a2f64a600585)(element)) return $580f7ed6bc170ae8$var$validateCSP(element);
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


const $fd3091053c5dfffc$var$options = new (0, $5b739339de321a37$export$c019608e5b5bb4cb)({
    // [ STATIC | DYNAMIC ]
    preferredAssessmentMode: (0, $5b739339de321a37$export$822eeec733be27fd).DYNAMIC,
    // [ true | false ]
    validation: true
});
// [ DEFAULT | PINK | BLUE | generateSwatches(<hue>) ]
const $fd3091053c5dfffc$var$WEIGHT_COLORS = $eb5be8077a65b10b$export$e6952b12ade67489;
const $fd3091053c5dfffc$var$head = new (0, $572ba3e4dcd864b9$export$e93312b7773dfcac)(document, $fd3091053c5dfffc$var$options);
const $fd3091053c5dfffc$var$LOGGING_PREFIX = "Capo: ";
function $fd3091053c5dfffc$var$visualizeWeights(weights) {
    const visual = weights.map((_)=>"%c ").join("");
    const styles = weights.map((weight)=>{
        const color = $fd3091053c5dfffc$var$WEIGHT_COLORS[10 - weight];
        return `background-color: ${color}; padding: 5px; margin: 0 -1px;`;
    });
    return {
        visual: visual,
        styles: styles
    };
}
function $fd3091053c5dfffc$var$visualizeWeight(weight) {
    const visual = `%c${new Array(weight + 1).fill("█").join("")}`;
    const style = `color: ${$fd3091053c5dfffc$var$WEIGHT_COLORS[10 - weight]}`;
    return {
        visual: visual,
        style: style
    };
}
function $fd3091053c5dfffc$var$stringifyElement(element) {
    return element.getAttributeNames().reduce((id, attr)=>id += `[${attr}=${JSON.stringify(element.getAttribute(attr))}]`, element.nodeName);
}
function $fd3091053c5dfffc$var$getLoggableElement(element) {
    if (!$fd3091053c5dfffc$var$head.isStatic) return element;
    const selector = $fd3091053c5dfffc$var$stringifyElement(element);
    const candidates = Array.from(document.head.querySelectorAll(selector));
    if (candidates.length == 0) return element;
    if (candidates.length == 1) return candidates[0];
    // The way the static elements are parsed makes their innerHTML different.
    // Recreate the element in DOM and compare its innerHTML with those of the candidates.
    // This ensures a consistent parsing and positive string matches.
    const candidateWrapper = document.createElement("div");
    const elementWrapper = document.createElement("div");
    elementWrapper.innerHTML = element.innerHTML;
    const candidate = candidates.find((c)=>{
        candidateWrapper.innerHTML = c.innerHTML;
        return candidateWrapper.innerHTML == elementWrapper.innerHTML;
    });
    if (candidate) return candidate;
    return element;
}
function $fd3091053c5dfffc$var$logElement({ viz: viz, weight: weight, element: element, isValid: isValid, omitPrefix: omitPrefix = false }) {
    if (!omitPrefix) viz.visual = `${$fd3091053c5dfffc$var$LOGGING_PREFIX}${viz.visual}`;
    let loggingLevel = "log";
    const args = [
        viz.visual,
        viz.style,
        weight + 1,
        element
    ];
    if (!$fd3091053c5dfffc$var$options.isValidationEnabled()) {
        console[loggingLevel](...args);
        return;
    }
    const { payload: payload, warnings: warnings } = $580f7ed6bc170ae8$export$6c93e2175c028eeb(element);
    if (payload) args.push(payload);
    if (warnings?.length) {
        // Element-specific warnings.
        loggingLevel = "warn";
        warnings.forEach((warning)=>args.push(`❌ ${warning}`));
    } else if (!isValid && ($fd3091053c5dfffc$var$options.prefersDynamicAssessment() || $fd3091053c5dfffc$var$head.isStatic)) {
        // General warnings.
        loggingLevel = "warn";
        args.push(`❌ invalid element (${element.tagName})`);
    }
    console[loggingLevel](...args);
}
function $fd3091053c5dfffc$var$logWeights() {
    const headElement = $fd3091053c5dfffc$var$head.getElement();
    const headWeights = $9c3989fcb9437829$export$5cc4a311ddbe699c(headElement).map(({ element: element, weight: weight })=>{
        return [
            $fd3091053c5dfffc$var$getLoggableElement(element),
            weight,
            $fd3091053c5dfffc$var$isValidElement(element)
        ];
    });
    const actualViz = $fd3091053c5dfffc$var$visualizeWeights(headWeights.map(([_, weight])=>weight));
    if (!$fd3091053c5dfffc$var$head.isStatic && $fd3091053c5dfffc$var$options.prefersStaticAssessment()) console.warn(`${$fd3091053c5dfffc$var$LOGGING_PREFIX}Unable to parse the static (server-rendered) <head>. Falling back to document.head`, headElement);
    console.groupCollapsed(`${$fd3091053c5dfffc$var$LOGGING_PREFIX}Actual %c<head>%c order\n${actualViz.visual}`, "font-family: monospace", "font-family: inherit", ...actualViz.styles);
    headWeights.forEach(([element, weight, isValid])=>{
        const viz = $fd3091053c5dfffc$var$visualizeWeight(weight);
        $fd3091053c5dfffc$var$logElement({
            viz: viz,
            weight: weight,
            element: element,
            isValid: isValid,
            omitPrefix: true
        });
    });
    console.log("Actual %c<head>%c element", "font-family: monospace", "font-family: inherit", headElement);
    console.groupEnd();
    const sortedWeights = headWeights.sort((a, b)=>{
        return b[1] - a[1];
    });
    const sortedViz = $fd3091053c5dfffc$var$visualizeWeights(sortedWeights.map(([_, weight])=>weight));
    console.groupCollapsed(`${$fd3091053c5dfffc$var$LOGGING_PREFIX}Sorted %c<head>%c order\n${sortedViz.visual}`, "font-family: monospace", "font-family: inherit", ...sortedViz.styles);
    const sortedHead = document.createElement("head");
    sortedWeights.forEach(([element, weight, isValid])=>{
        const viz = $fd3091053c5dfffc$var$visualizeWeight(weight);
        $fd3091053c5dfffc$var$logElement({
            viz: viz,
            weight: weight,
            element: element,
            isValid: isValid,
            omitPrefix: true
        });
        sortedHead.appendChild(element.cloneNode(true));
    });
    console.log("Sorted %c<head>%c element", "font-family: monospace", "font-family: inherit", sortedHead);
    console.groupEnd();
}
function $fd3091053c5dfffc$var$isValidElement(element) {
    if (!$fd3091053c5dfffc$var$options.isValidationEnabled()) return true;
    return !$580f7ed6bc170ae8$export$eeefd08c3a6f8db7(element);
}
function $fd3091053c5dfffc$var$validateHead() {
    if (!$fd3091053c5dfffc$var$options.isValidationEnabled()) return;
    const validationWarnings = $580f7ed6bc170ae8$export$b01ab94d0cd042a0($fd3091053c5dfffc$var$head.getElement());
    validationWarnings.forEach(({ warning: warning, elements: elements = [], element: element })=>{
        elements = elements.map($fd3091053c5dfffc$var$getLoggableElement);
        console.warn(`${$fd3091053c5dfffc$var$LOGGING_PREFIX}${warning}`, ...elements, element);
    });
}
(async ()=>{
    await $fd3091053c5dfffc$var$head.getStaticOrDynamicHead();
    $fd3091053c5dfffc$var$validateHead();
    $fd3091053c5dfffc$var$logWeights();
})();

})();
