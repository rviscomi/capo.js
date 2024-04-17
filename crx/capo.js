(()=>{function e(e,t,i,n){Object.defineProperty(e,t,{get:i,set:n,enumerable:!0,configurable:!0})}function t(e){return[`oklch(5% .1 ${e})`,`oklch(13% .2 ${e})`,`oklch(25% .2 ${e})`,`oklch(35% .25 ${e})`,`oklch(50% .27 ${e})`,`oklch(67% .31 ${e})`,`oklch(72% .25 ${e})`,`oklch(80% .2 ${e})`,`oklch(90% .1 ${e})`,`oklch(99% .05 ${e})`,"#ccc"]}let i=["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2","#cccccc"],n=t(320),r=t(200),s={DEFAULT:i,PINK:n,BLUE:r};var a={};e(a,"IO",()=>o);class o{constructor(e,t,i=window.console){this.document=e,this.options=t,this.console=i,this.isStaticHead=!1,this.head=null}async init(){if(!this.head){if(this.options.prefersDynamicAssessment()){this.head=this.document.querySelector("head");return}try{let e=await this.getStaticHTML();e=e.replace(/(\<\/?)(head)/gi,"$1static-head");let t=this.document.implementation.createHTMLDocument("New Document");t.documentElement.innerHTML=e,this.head=t.querySelector("static-head"),this.head?this.isStaticHead=!0:this.head=this.document.head}catch(e){this.console.error(`${this.options.loggingPrefix}An exception occurred while getting the static <head>:`,e),this.head=this.document.head}this.isStaticHead||this.console.warn(`${this.options.loggingPrefix}Unable to parse the static (server-rendered) <head>. Falling back to document.head`,this.head)}}async getStaticHTML(){let e=this.document.location.href,t=await fetch(e);return await t.text()}getHead(){return this.head}stringifyElement(e){return e.getAttributeNames().reduce((t,i)=>t+=`[${CSS.escape(i)}=${JSON.stringify(e.getAttribute(i))}]`,e.nodeName)}getLoggableElement(e){if(!this.isStaticHead)return e;let t=this.stringifyElement(e),i=Array.from(this.document.head.querySelectorAll(t));if(0==i.length)return e;if(1==i.length)return i[0];let n=this.document.createElement("div"),r=this.document.createElement("div");r.innerHTML=e.innerHTML;let s=i.find(e=>(n.innerHTML=e.innerHTML,n.innerHTML==r.innerHTML));return s||e}createElementFromSelector(e){let t=e.match(/^[A-Za-z]+/)[0];if(!t)return;let i=document.createElement(t),n=e.match(/\[([A-Za-z-]+)="([^"]+)"\]/g)||[];return n.forEach(e=>{e=e.slice(1,-1);let t=e.indexOf("="),n=e.slice(0,t),r=e.slice(t+1).slice(1,-1);i.setAttribute(n,r)}),i}logElementFromSelector({weight:e,selector:t,innerHTML:i,isValid:n,customValidations:r={}}){e=+e;let s=this.getElementVisualization(e),a=this.createElementFromSelector(t);a.innerHTML=i,a=this.getLoggableElement(a),this.logElement({viz:s,weight:e,element:a,isValid:n,customValidations:r})}logElement({viz:e,weight:t,element:i,isValid:n,customValidations:r,omitPrefix:s=!1}){s||(e.visual=`${this.options.loggingPrefix}${e.visual}`);let a="log",o=[e.visual,e.style,t+1,i];if(!this.options.isValidationEnabled()){this.console[a](...o);return}let{payload:l,warnings:c}=r;l&&("string"==typeof l.expiry&&(l.expiry=new Date(l.expiry)),o.push(l)),c?.length?(a="warn",c.forEach(e=>o.push(`❌ ${e}`))):!n&&(this.options.prefersDynamicAssessment()||this.isStaticHead)&&(a="warn",o.push(`❌ invalid element (${i.tagName})`)),this.console[a](...o)}logValidationWarnings(e){this.options.isValidationEnabled()&&e.forEach(({warning:e,elements:t=[],element:i})=>{t=t.map(this.getLoggableElement.bind(this)),this.console.warn(`${this.options.loggingPrefix}${e}`,...t,i||"")})}getColor(e){return this.options.palette[10-e]}getHeadVisualization(e){let t="",i=[];return e.forEach(({weight:e,isValid:n})=>{t+="%c ";let r=this.getColor(e),s="padding: 5px; margin: 0 -1px; ";if(n)s+=`background-color: ${r};`;else{let e;s+=`background-image: ${r==(e="#cccccc")&&(e="red"),`repeating-linear-gradient(45deg, ${r}, ${r} 3px, ${e} 3px, ${e} 6px)`}`}i.push(s)}),{visual:t,styles:i}}getElementVisualization(e){let t=`%c${Array(e+1).fill("█").join("")}`,i=this.getColor(e),n=`color: ${i}`;return{visual:t,style:n}}visualizeHead(e,t,i){let n=this.getHeadVisualization(i);this.console.groupCollapsed(`${this.options.loggingPrefix}${e} %chead%c order
${n.visual}`,"font-family: monospace","font-family: inherit",...n.styles),i.forEach(({weight:e,element:t,isValid:i,customValidations:n})=>{let r=this.getElementVisualization(e);this.logElement({viz:r,weight:e,element:t,isValid:i,customValidations:n,omitPrefix:!0})}),this.console.log(`${e} %chead%c element`,"font-family: monospace","font-family: inherit",t),this.console.groupEnd()}}var l={};e(l,"Options",()=>c);class c{constructor({preferredAssessmentMode:e=c.AssessmentMode.STATIC,validation:t=!0,palette:n=i,loggingPrefix:r="Capo: "}={}){this.setPreferredAssessmentMode(e),this.setValidation(t),this.setPalette(n),this.setLoggingPrefix(r)}static get AssessmentMode(){return{STATIC:"static",DYNAMIC:"dynamic"}}static get Palettes(){return s}prefersStaticAssessment(){return this.preferredAssessmentMode===c.AssessmentMode.STATIC}prefersDynamicAssessment(){return this.preferredAssessmentMode===c.AssessmentMode.DYNAMIC}isValidationEnabled(){return this.validation}setPreferredAssessmentMode(e){if(!this.isValidAssessmentMode(e))throw Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${e}".`);this.preferredAssessmentMode=e}setPreferredAssessmentModeToStatic(e){let t=c.AssessmentMode.STATIC;e||(t=c.AssessmentMode.DYNAMIC),this.setPreferredAssessmentMode(t)}setValidation(e){if(!this.isValidValidation(e))throw Error(`Invalid option: validation, expected boolean, got "${e}".`);this.validation=e}setPalette(e){if(!this.isValidPalette(e))throw Error(`Invalid option: palette, expected [${Object.keys(s).join("|")}] or an array of colors, got "${e}".`);if("string"==typeof e){this.palette=s[e];return}this.palette=e}setLoggingPrefix(e){if(!this.isValidLoggingPrefix(e))throw Error(`Invalid option: logging prefix, expected string, got "${e}".`);this.loggingPrefix=e}isValidAssessmentMode(e){return Object.values(c.AssessmentMode).includes(e)}isValidValidation(e){return"boolean"==typeof e}isValidPalette(e){return"string"==typeof e?Object.keys(s).includes(e):!!Array.isArray(e)&&11===e.length&&e.every(e=>"string"==typeof e)}isValidLoggingPrefix(e){return"string"==typeof e}isPreferredPalette(e){return JSON.stringify(this.palette)==JSON.stringify(e)}valueOf(){return{preferredAssessmentMode:this.preferredAssessmentMode,validation:this.validation,palette:this.palette,loggingPrefix:this.loggingPrefix}}}var d={};e(d,"ElementWeights",()=>h),e(d,"ElementDetectors",()=>u),e(d,"isMeta",()=>m),e(d,"isTitle",()=>p),e(d,"isPreconnect",()=>f),e(d,"isAsyncScript",()=>y),e(d,"isImportStyles",()=>E),e(d,"isSyncScript",()=>S),e(d,"isSyncStyles",()=>A),e(d,"isPreload",()=>w),e(d,"isDeferScript",()=>P),e(d,"isPrefetchPrerender",()=>T),e(d,"META_HTTP_EQUIV_KEYWORDS",()=>g),e(d,"isOriginTrial",()=>C),e(d,"isMetaCSP",()=>b),e(d,"getWeight",()=>v),e(d,"getHeadWeights",()=>V);let h={META:10,TITLE:9,PRECONNECT:8,ASYNC_SCRIPT:7,IMPORT_STYLES:6,SYNC_SCRIPT:5,SYNC_STYLES:4,PRELOAD:3,DEFER_SCRIPT:2,PREFETCH_PRERENDER:1,OTHER:0},u={META:m,TITLE:p,PRECONNECT:f,ASYNC_SCRIPT:y,IMPORT_STYLES:E,SYNC_SCRIPT:S,SYNC_STYLES:A,PRELOAD:w,DEFER_SCRIPT:P,PREFETCH_PRERENDER:T},g=["accept-ch","content-security-policy","content-type","default-style","delegate-ch","origin-trial","x-dns-prefetch-control"];function m(e){let t=g.map(e=>`[http-equiv="${e}" i]`).join(", ");return e.matches(`meta:is([charset], ${t}, [name=viewport]), base`)}function p(e){return e.matches("title")}function f(e){return e.matches("link[rel=preconnect]")}function y(e){return e.matches("script[src][async]")}function E(e){return!!e.matches("style")&&/@import/.test(e.textContent)}function S(e){return e.matches("script:not([src][defer],[src][type=module],[src][async],[type*=json])")}function A(e){return e.matches("link[rel=stylesheet],style")}function w(e){return e.matches("link:is([rel=preload], [rel=modulepreload])")}function P(e){return e.matches("script[src][defer], script:not([src][async])[src][type=module]")}function T(e){return e.matches("link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])")}function C(e){return e.matches('meta[http-equiv="origin-trial"i]')}function b(e){return e.matches('meta[http-equiv="Content-Security-Policy" i], meta[http-equiv="Content-Security-Policy-Report-Only" i]')}function v(e){for(let[t,i]of Object.entries(u))if(i(e))return h[t];return h.OTHER}function V(e){let t=Array.from(e.children);return t.map(e=>({element:e,weight:v(e)}))}var $={};e($,"VALID_HEAD_ELEMENTS",()=>M),e($,"PRELOAD_SELECTOR",()=>x),e($,"isValidElement",()=>L),e($,"hasValidationWarning",()=>H),e($,"getValidationWarnings",()=>R),e($,"getCustomValidations",()=>O);let M=new Set(["base","link","meta","noscript","script","style","template","title"]),x='link:is([rel="preload" i], [rel="modulepreload" i])';function L(e){return M.has(e.tagName.toLowerCase())}function H(e){return!!(!L(e)||e.matches(`:has(:not(${Array.from(M).join(", ")}))`)||e.matches("title:is(:nth-of-type(n+2))")||e.matches("base:has(~ base), base ~ base")||b(e)||function(e){if(!C(e))return!1;let{warnings:t}=I(e);return t.length>0}(e)||N(e))}function R(e){let t=[],i=Array.from(e.querySelectorAll("title")),n=i.length;1!=n&&t.push({warning:`Expected exactly 1 <title> element, found ${n}`,elements:i});let r=Array.from(e.querySelectorAll("base")),s=r.length;s>1&&t.push({warning:`Expected at most 1 <base> element, found ${s}`,elements:r});let a=e.querySelector('meta[http-equiv="Content-Security-Policy" i]');a&&t.push({warning:"CSP meta tags disable the preload scanner due to a bug in Chrome. Use the CSP header instead. Learn more: https://crbug.com/1458493",element:a}),e.querySelectorAll("*").forEach(i=>{if(L(i))return;let n=i;for(;n.parentElement!=e;)n=n.parentElement;t.push({warning:`${i.tagName} elements are not allowed in the <head>`,element:n})});let o=Array.from(e.querySelectorAll('meta[http-equiv="Origin-Trial" i]'));return o.forEach(e=>{let i=I(e);0!=i.warnings.length&&t.push({warning:`Invalid origin trial token: ${i.warnings.join(", ")}`,elements:[e],element:i.payload})}),t}function O(e){return C(e)?I(e):b(e)?function(e){let t=[];return e.matches('meta[http-equiv="Content-Security-Policy-Report-Only" i]')?t.push("CSP Report-Only is forbidden in meta tags"):e.matches('meta[http-equiv="Content-Security-Policy" i]')&&t.push("meta CSP discouraged. See https://crbug.com/1458493."),{warnings:t}}(e):N(e)?function(e){let t=e.getAttribute("href"),i=D(t),n=k(e.parentElement,i);if(!n)throw Error("Expected an invalid preload, but none found.");return{warnings:[`This preload has little to no effect. ${t} is already discoverable by another ${n.tagName} element.`]}}(e):{}}function I(e){let t={payload:null,warnings:[]},i=e.getAttribute("content");try{var n,r;t.payload=function(e){let t=new Uint8Array([...atob(e)].map(e=>e.charCodeAt(0))),i=new DataView(t.buffer),n=i.getUint32(65,!1),r=JSON.parse(new TextDecoder().decode(t.slice(69,69+n)));return r.expiry=new Date(1e3*r.expiry),r}(i),t.payload.expiry<new Date&&t.warnings.push("expired"),t.payload.isThirdParty||(n=t.payload.origin,r=document.location.href,new URL(n).origin===new URL(r).origin)||t.warnings.push("invalid origin")}catch{t.warnings.push("invalid token")}return t}function N(e){if(!e.matches(x))return!1;let t=e.getAttribute("href");if(!t)return!1;let i=D(t);return null!=k(e.parentElement,i)}function k(e,t){let i=Array.from(e.querySelectorAll(`link:not(${x}), script`));return i.find(e=>{let i=e.getAttribute("href")||e.getAttribute("src");return!!i&&t==D(i)})}function D(e){return new URL(e,document.baseURI).href}async function _(e){await e.init(),function(e,t){let i=t.getValidationWarnings(e.getHead());e.logValidationWarnings(i)}(e,$);let t=function(e,t,i){let n=e.getHead(),r=i.getHeadWeights(n).map(({element:i,weight:n})=>({weight:n,element:e.getLoggableElement(i),isValid:!t.hasValidationWarning(i),customValidations:t.getCustomValidations(i)}));e.visualizeHead("Actual",n,r);let s=Array.from(r).sort((e,t)=>t.weight-e.weight),a=document.createElement("head");return s.forEach(({element:e})=>{a.appendChild(e.cloneNode(!0))}),e.visualizeHead("Sorted",a,s),r}(e,$,d);return{actual:t.map(({element:t,weight:i,isValid:n,customValidations:r})=>(r?.payload?.expiry&&(r.payload.expiry=r.payload.expiry.toString()),{weight:i,color:e.getColor(i),selector:e.stringifyElement(t),innerHTML:t.innerHTML,isValid:n,customValidations:r}))}}async function q(){let{options:e}=await chrome.storage.sync.get("options");return new l.Options(e)}!async function(){let e=await q(),t=new a.IO(document,e),{click:i}=await chrome.storage.local.get("click");if(i)t.logElementFromSelector(JSON.parse(i)),await chrome.storage.local.remove("click");else{let e=await _(t);await chrome.storage.local.set({data:e})}}()})();