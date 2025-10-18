# Capo.js DOM-Agnostic Refactor Migration Plan

**Version:** 1.0  
**Date:** October 17, 2025  
**Status:** Planning  
**Target Version:** 2.0.0 (Major)

## Executive Summary

This document outlines a migration plan to refactor `capo.js` into a DOM-agnostic core library that can be consumed by both browser runtime environments and Node.js-based tools (like `eslint-plugin-capo`). The core logic will be abstracted behind an **Adapter interface** to support multiple HTML tree representations.

### Goals
1. ✅ Make capo.js core logic reusable across browser DOM and Node.js HTML parser environments
2. ✅ Enable `eslint-plugin-capo` to depend on core `capo.js` logic instead of duplicating it
3. ✅ Maintain backward compatibility through shims (one major release deprecation period)
4. ✅ Provide clear migration path for existing consumers
5. ✅ Single-package distribution with clean exports

### Key Decisions
- **Packaging:** Single package with multiple exports (no monorepo split initially)
- **Parser:** Reuse `@html-eslint/parser` ecosystem (compatible AST nodes)
- **Versioning:** Major version bump (2.0.0) with deprecation shims
- **Timeline:** Coordinated PRs (capo.js first, then eslint-plugin-capo)

---

## 1. Adapter Interface Design

### 1.1 Core Adapter Contract

The adapter interface abstracts all environment-specific operations. Below is the TypeScript/JSDoc definition:

```typescript
/**
 * Adapter interface for abstracting HTML tree operations
 * @interface HTMLAdapter
 */
interface HTMLAdapter {
  /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */
  isElement(node: any): boolean;

  /**
   * Get the tag name of an element (lowercase)
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */
  getTagName(node: any): string;

  /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null}
   */
  getAttribute(node: any, attrName: string): string | null;

  /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]}
   */
  getAttributeNames(node: any): string[];

  /**
   * Get text content of a node (for inline scripts/styles)
   * @param {any} node - Element node
   * @returns {string}
   */
  getTextContent(node: any): string;

  /**
   * Get child elements of a node
   * @param {any} node - Parent node
   * @returns {any[]} - Array of child nodes
   */
  getChildren(node: any): any[];

  /**
   * Check if element matches a simple selector pattern
   * @param {any} node - Element node
   * @param {string} selector - Simple selector (tag[attr="value"])
   * @returns {boolean}
   */
  matches(node: any, selector: string): boolean;

  /**
   * Get source location for a node (optional, for linting)
   * @param {any} node - Element node
   * @returns {{ line: number, column: number, endLine?: number, endColumn?: number } | null}
   */
  getLocation(node: any): { line: number; column: number; endLine?: number; endColumn?: number } | null;

  /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string}
   */
  stringify(node: any): string;
}
```

### 1.2 Core Analysis API

```typescript
/**
 * Finding from capo analysis
 */
interface CapoFinding {
  ruleId: string;          // e.g., 'no-meta-csp', 'require-order', 'no-duplicate-title'
  message: string;         // Human-readable message
  node: any;               // Reference to the node (adapter-specific)
  location?: {             // Optional location info for linting
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
  };
  severity: 'error' | 'warning' | 'info';
  data?: Record<string, any>;  // Additional metadata
}

/**
 * Weight information for an element
 */
interface ElementWeight {
  node: any;
  weight: number;          // 0-11, higher = should come earlier
  category: string;        // 'META', 'TITLE', 'PRECONNECT', etc.
  isValid: boolean;        // Whether element passes validation
  warnings: string[];      // Element-specific warnings
}

/**
 * Analysis results
 * Contains ALL findings from a single analysis pass
 */
interface AnalysisResult {
  weights: ElementWeight[];      // Weight info for every child element
  findings: CapoFinding[];       // All rule violations found
  headElement: any;              // The <head> node itself
}

/**
 * Main analysis entry point
 * Performs a single-pass analysis and returns all findings for all rules.
 * Designed to be called once and cached (e.g., in ESLint plugin context).
 * 
 * @param {any} headNode - The <head> element node
 * @param {HTMLAdapter} adapter - Adapter for tree operations
 * @param {object} options - Analysis options
 * @returns {AnalysisResult}
 * 
 * @example
 * const result = analyzeHead(headNode, adapter);
 * // result.findings contains violations for ALL capo rules
 * const orderingIssues = result.findings.filter(f => f.ruleId === 'require-order');
 * const cspIssues = result.findings.filter(f => f.ruleId === 'no-meta-csp');
 */
function analyzeHead(headNode: any, adapter: HTMLAdapter, options?: object): AnalysisResult;
```

**Design Principle:** `analyzeHead()` runs **all** capo.js rules in a single pass and returns all findings. Consumers (like ESLint plugin) should:
1. Call `analyzeHead()` once per `<head>` element
2. Cache the result
3. Filter findings by `ruleId` in individual rules

---

## 2. DOM Usage Inventory & Per-Detector Mapping

### 2.1 Current DOM Dependencies in `src/lib/rules.js`

| Function | Current DOM API | Adapter Replacement |
|----------|----------------|---------------------|
| `isMeta(element)` | `element.matches(selector)` | `adapter.matches(node, selector)` or custom logic |
| `isTitle(element)` | `element.matches('title')` | `adapter.getTagName(node) === 'title'` |
| `isPreconnect(element)` | `element.matches('link[rel=preconnect]')` | `adapter.getTagName(node) === 'link' && adapter.getAttribute(node, 'rel') === 'preconnect'` |
| `isAsyncScript(element)` | `element.matches('script[src][async]')` | Custom check using `getTagName`, `getAttribute` |
| `isImportStyles(element)` | `element.matches('style')`, `element.textContent` | `adapter.getTagName(node) === 'style'`, `adapter.getTextContent(node)` |
| `isSyncScript(element)` | `element.matches('script:not(...)')` | Custom logic with `getTagName`, `getAttribute` |
| `isSyncStyles(element)` | `element.matches('link[rel=stylesheet],style')` | Custom check |
| `isPreload(element)` | `element.matches('link:is([rel=preload], ...)')` | Custom check |
| `isDeferScript(element)` | `element.matches('script[src][defer], ...')` | Custom check |
| `isPrefetchPrerender(element)` | `element.matches('link:is([rel=prefetch], ...)')` | Custom check |
| `getHeadWeights(head)` | `Array.from(head.children)` | `adapter.getChildren(headNode)` |

### 2.2 Current DOM Dependencies in `src/lib/io.js`

| Operation | Current Implementation | Refactor Strategy |
|-----------|----------------------|-------------------|
| Get head element | `document.querySelector("head")` | Pass `headNode` as parameter |
| Parse static HTML | `document.implementation.createHTMLDocument()` | Use adapter-provided parser in Node adapter |
| Fetch static HTML | `fetch(document.location.href)` | Pass HTML string or make fetch optional/configurable |
| Stringify element | `element.getAttributeNames()`, `element.getAttribute()` | Use `adapter.stringify(node)` or `adapter.getAttributeNames/getAttribute` |
| Query selectors | `document.head.querySelectorAll(selector)` | Not needed in core; logging-only feature |
| Element creation | `document.createElement()` | Logging-only; keep in browser-specific logging module |
| Console output | `window.console` | Pass console as parameter or use options |

**Strategy:** Split `io.js` into:
- `src/lib/logging.js` — Browser-specific logging/visualization (depends on DOM, console, CSS)
- Core analysis functions — DOM-agnostic, use adapter only

---

## 3. File-by-File Refactor Roadmap

### Phase 1: Foundation (Week 1)

#### 3.1 Create Adapter Interface
**File:** `src/adapters/adapter.js`
```javascript
/**
 * Base adapter interface (documentation only)
 * Actual adapters should implement these methods
 */
export const AdapterInterface = {
  isElement: (node) => { throw new Error('Not implemented'); },
  getTagName: (node) => { throw new Error('Not implemented'); },
  getAttribute: (node, attrName) => { throw new Error('Not implemented'); },
  getAttributeNames: (node) => { throw new Error('Not implementedд'); },
  getTextContent: (node) => { throw new Error('Not implemented'); },
  getChildren: (node) => { throw new Error('Not implemented'); },
  matches: (node, selector) => { throw new Error('Not implemented'); },
  getLocation: (node) => { throw new Error('Not implemented'); },
  stringify: (node) => { throw new Error('Not implemented'); },
};
```

**Effort:** 0.5 day

#### 3.2 Implement BrowserAdapter
**File:** `src/adapters/browser.js`
```javascript
/**
 * Browser DOM adapter
 * Wraps native DOM Element APIs
 */
export class BrowserAdapter {
  isElement(node) {
    return node && node.nodeType === Node.ELEMENT_NODE;
  }

  getTagName(node) {
    return node.tagName?.toLowerCase() || '';
  }

  getAttribute(node, attrName) {
    return node.getAttribute(attrName);
  }

  getAttributeNames(node) {
    return node.getAttributeNames ? node.getAttributeNames() : [];
  }

  getTextContent(node) {
    return node.textContent || '';
  }

  getChildren(node) {
    return Array.from(node.children || []);
  }

  matches(node, selector) {
    return node.matches ? node.matches(selector) : false;
  }

  getLocation(node) {
    // Not available in browser DOM
    return null;
  }

  stringify(node) {
    const attrs = this.getAttributeNames(node)
      .map(attr => `[${CSS.escape(attr)}="${node.getAttribute(attr)}"]`)
      .join('');
    return `${node.nodeName}${attrs}`;
  }
}
```

**Effort:** 0.5 day

#### 3.3 Implement ParserAdapter (for @html-eslint/parser nodes)
**File:** `src/adapters/parser.js`
```javascript
/**
 * HTML Parser adapter for @html-eslint/parser AST nodes
 * Compatible with eslint-plugin-capo's node structure
 */
export class ParserAdapter {
  isElement(node) {
    return node && (node.type === 'Tag' || node.type === 'ScriptTag' || node.type === 'StyleTag');
  }

  getTagName(node) {
    return node.name?.toLowerCase() || '';
  }

  getAttribute(node, attrName) {
    if (!node.attributes) return null;
    const attr = node.attributes.find(a => {
      const keyName = a.key?.value;
      return keyName?.toLowerCase() === attrName.toLowerCase();
    });
    if (!attr?.value) return null;
    if (attr.value.type === 'AttributeValue') {
      return attr.value.value;
    }
    return null;
  }

  getAttributeNames(node) {
    if (!node.attributes) return [];
    return node.attributes
      .map(a => a.key?.value)
      .filter(Boolean);
  }

  getTextContent(node) {
    if (!node.children) return '';
    return node.children
      .filter(child => child.type === 'VText')
      .map(child => child.value)
      .join('');
  }

  getChildren(node) {
    return node.children?.filter(child => this.isElement(child)) || [];
  }

  matches(node, selector) {
    // Implement simple selector matching for common patterns
    // For now, delegate to helper that uses getTagName/getAttribute
    return matchesSelector(node, selector, this);
  }

  getLocation(node) {
    if (!node.loc) return null;
    return {
      line: node.loc.start.line,
      column: node.loc.start.column,
      endLine: node.loc.end?.line,
      endColumn: node.loc.end?.column,
    };
  }

  stringify(node) {
    const tagName = this.getTagName(node);
    const attrs = this.getAttributeNames(node)
      .map(name => {
        const value = this.getAttribute(node, name);
        return `${name}="${value}"`;
      })
      .join(' ');
    return attrs ? `${tagName}[${attrs}]` : tagName;
  }
}

/**
 * Simple selector matcher helper (supports tag[attr="value"] patterns)
 */
function matchesSelector(node, selector, adapter) {
  // Parse simple selector: tag, tag[attr], tag[attr="value"], etc.
  // This is a lightweight implementation for capo's needs
  
  // Example: 'meta[http-equiv="content-type" i]'
  const tagMatch = selector.match(/^([a-z]+)/i);
  const requiredTag = tagMatch ? tagMatch[1].toLowerCase() : null;
  
  if (requiredTag && adapter.getTagName(node) !== requiredTag) {
    return false;
  }

  // Extract attribute requirements [attr="value"]
  const attrPattern = /\[([a-z-]+)(?:="([^"]*)")?(?:\s+i)?\]/gi;
  let match;
  while ((match = attrPattern.exec(selector)) !== null) {
    const [, attrName, attrValue] = match;
    const actualValue = adapter.getAttribute(node, attrName);
    
    if (attrValue === undefined) {
      // Just check attribute exists
      if (actualValue === null) return false;
    } else {
      // Check attribute value (case-insensitive if 'i' flag)
      const isCaseInsensitive = selector.includes(' i]');
      const expected = isCaseInsensitive ? attrValue.toLowerCase() : attrValue;
      const actual = isCaseInsensitive ? actualValue?.toLowerCase() : actualValue;
      if (actual !== expected) return false;
    }
  }

  return true;
}
```

**Effort:** 1 day (includes selector matcher helper)

**Note:** For production, consider using a lightweight selector library like `css-select` if complex selectors are needed. For capo's current needs, the simple matcher above should suffice.

#### 3.4 Refactor `src/lib/rules.js` to Use Adapter
**File:** `src/lib/rules.js`

**Changes:**
- Update all detector functions to accept `(node, adapter)` instead of `(element)`
- Replace `element.matches()` with `adapter.matches()` or direct attribute checks
- Replace `element.textContent` with `adapter.getTextContent(node)`
- Replace `Array.from(head.children)` with `adapter.getChildren(headNode)`

**Example refactor (before/after):**

Before:
```javascript
export function isMeta(element) {
  const httpEquivSelector = META_HTTP_EQUIV_KEYWORDS.map(keyword => {
    return `[http-equiv="${keyword}" i]`;
  }).join(', ');
  
  return element.matches(`meta:is([charset], ${httpEquivSelector}, [name=viewport]), base`);
}
```

After:
```javascript
export function isMeta(node, adapter) {
  const tagName = adapter.getTagName(node);
  
  // Check for base tag
  if (tagName === 'base') return true;
  if (tagName !== 'meta') return false;

  // Check for charset attribute
  const hasCharset = adapter.getAttributeNames(node)
    .some(attr => attr.toLowerCase() === 'charset');
  if (hasCharset) return true;

  // Check for viewport
  const name = adapter.getAttribute(node, 'name');
  if (name?.toLowerCase() === 'viewport') return true;

  // Check for important http-equiv values
  const httpEquiv = adapter.getAttribute(node, 'http-equiv');
  if (httpEquiv) {
    const httpEquivLower = httpEquiv.toLowerCase();
    return META_HTTP_EQUIV_KEYWORDS.some(keyword => httpEquivLower === keyword.toLowerCase());
  }

  return false;
}

export function getHeadWeights(headNode, adapter) {
  const headChildren = adapter.getChildren(headNode);
  return headChildren.map(node => {
    return {
      node,
      weight: getWeight(node, adapter)
    };
  });
}

export function getWeight(node, adapter) {
  for (let [id, detector] of Object.entries(ElementDetectors)) {
    if (detector(node, adapter)) {
      return ElementWeights[id];
    }
  }
  return ElementWeights.OTHER;
}
```

**Effort:** 1.5 days (refactor all detectors + update tests)

### Phase 2: Core Extraction (Week 2)

#### 3.5 Extract Core Analysis Logic
**File:** `src/core/analyzer.js`

Create a new DOM-agnostic core module that runs **all** capo rules in a single pass:

```javascript
import * as rules from '../lib/rules.js';
import * as validation from '../lib/validation.js';

/**
 * Analyze a <head> element and return ALL findings from ALL rules
 * This is designed to be called once and cached by consumers
 * 
 * @param {any} headNode - The <head> element
 * @param {object} adapter - HTMLAdapter implementation
 * @param {object} options - Analysis options
 * @returns {AnalysisResult}
 */
export function analyzeHead(headNode, adapter, options = {}) {
  const children = adapter.getChildren(headNode);
  const findings = [];
  const weights = [];

  // === Pass 1: Compute weights and validate each element ===
  for (const node of children) {
    const weight = rules.getWeight(node, adapter);
    const category = rules.getWeightCategory(weight);
    
    // Run element-level validation (charset, viewport, CSP, http-equiv, etc.)
    const validationResult = validation.validateElement(node, adapter, options);
    
    weights.push({
      node,
      weight,
      category,
      isValid: validationResult.isValid,
      warnings: validationResult.warnings,
    });

    // Collect validation findings
    for (const warning of validationResult.warnings) {
      findings.push({
        ruleId: validationResult.ruleId || 'validation',
        message: warning,
        node,
        location: adapter.getLocation(node),
        severity: 'warning',
      });
    }
  }

  // === Pass 2: Check ordering (require-order rule) ===
  const orderingFindings = checkOrdering(children, weights, adapter, options);
  findings.push(...orderingFindings);

  // === Pass 3: Check for duplicates ===
  const duplicateFindings = checkDuplicates(children, adapter, options);
  findings.push(...duplicateFindings);

  // === Pass 4: Check for required elements ===
  const requiredFindings = checkRequiredElements(children, adapter, options);
  findings.push(...requiredFindings);

  // === Pass 5: Check for unnecessary elements ===
  const unnecessaryFindings = checkUnnecessaryElements(children, adapter, options);
  findings.push(...unnecessaryFindings);

  return {
    weights,
    findings,  // Contains findings for ALL rules
    headElement: headNode,
  };
}

/**
 * Check element ordering (require-order rule)
 */
function checkOrdering(children, weights, adapter, options) {
  const findings = [];
  
  for (let i = 0; i < children.length - 1; i++) {
    const current = children[i];
    const next = children[i + 1];
    
    const currentWeight = weights[i].weight;
    const nextWeight = weights[i + 1].weight;
    
    if (currentWeight < nextWeight) {
      const currentCategory = weights[i].category;
      const nextCategory = weights[i + 1].category;
      
      findings.push({
        ruleId: 'require-order',
        message: `${nextCategory} element should come before ${currentCategory} element`,
        node: next,
        location: adapter.getLocation(next),
        severity: 'warning',
        data: {
          currentWeight,
          nextWeight,
          currentCategory,
          nextCategory,
        },
      });
    }
  }
  
  return findings;
}

/**
 * Check for duplicate elements (no-duplicate-* rules)
 */
function checkDuplicates(children, adapter, options) {
  const findings = [];
  const seen = {
    title: null,
    base: null,
    charset: null,
  };

  for (const node of children) {
    const tagName = adapter.getTagName(node);

    // no-duplicate-title
    if (tagName === 'title') {
      if (seen.title) {
        findings.push({
          ruleId: 'no-duplicate-title',
          message: 'Only one <title> element is allowed per document',
          node,
          location: adapter.getLocation(node),
          severity: 'error',
        });
      }
      seen.title = node;
    }

    // no-duplicate-base
    if (tagName === 'base') {
      if (seen.base) {
        findings.push({
          ruleId: 'no-duplicate-base',
          message: 'Only one <base> element is allowed per document',
          node,
          location: adapter.getLocation(node),
          severity: 'error',
        });
      }
      seen.base = node;
    }

    // no-duplicate-charset
    if (tagName === 'meta') {
      const hasCharset = adapter.getAttribute(node, 'charset') !== null;
      const httpEquiv = adapter.getAttribute(node, 'http-equiv');
      const isContentType = httpEquiv?.toLowerCase() === 'content-type';
      
      if (hasCharset || isContentType) {
        if (seen.charset) {
          findings.push({
            ruleId: 'valid-charset',
            message: 'Only one character encoding declaration is allowed per document',
            node,
            location: adapter.getLocation(node),
            severity: 'error',
          });
        }
        seen.charset = node;
      }
    }
  }

  return findings;
}

/**
 * Check for required elements (require-* rules)
 */
function checkRequiredElements(children, adapter, options) {
  const findings = [];
  const has = {
    title: false,
    metaViewport: false,
  };

  for (const node of children) {
    const tagName = adapter.getTagName(node);
    
    if (tagName === 'title') {
      has.title = true;
    }
    
    if (tagName === 'meta') {
      const name = adapter.getAttribute(node, 'name');
      if (name?.toLowerCase() === 'viewport') {
        has.metaViewport = true;
      }
    }
  }

  // require-title
  if (!has.title) {
    findings.push({
      ruleId: 'require-title',
      message: 'Document must have a <title> element',
      node: null, // No specific node, applies to <head>
      location: null,
      severity: 'error',
    });
  }

  // require-meta-viewport (optional, configurable)
  if (!has.metaViewport && options.requireMetaViewport) {
    findings.push({
      ruleId: 'require-meta-viewport',
      message: 'Document should have a <meta name="viewport"> element',
      node: null,
      location: null,
      severity: 'warning',
    });
  }

  return findings;
}

/**
 * Check for unnecessary elements (no-unnecessary-* rules)
 */
function checkUnnecessaryElements(children, adapter, options) {
  const findings = [];
  const preloadLinks = [];
  const resourceElements = [];

  // Collect preloads and resource-loading elements
  for (const node of children) {
    const tagName = adapter.getTagName(node);

    if (tagName === 'link') {
      const rel = adapter.getAttribute(node, 'rel')?.toLowerCase();
      if (rel === 'preload' || rel === 'modulepreload') {
        preloadLinks.push(node);
      } else if (rel === 'stylesheet') {
        resourceElements.push({ node, type: 'stylesheet' });
      }
    }

    if (tagName === 'script') {
      resourceElements.push({ node, type: 'script' });
    }
  }

  // Check each preload for unnecessary duplication (no-unnecessary-preload)
  for (const preloadNode of preloadLinks) {
    const preloadHref = adapter.getAttribute(preloadNode, 'href');
    if (!preloadHref) continue;

    const normalizedPreloadUrl = normalizeUrl(preloadHref);
    if (!normalizedPreloadUrl) continue;

    // Check if this URL is already loaded by another element
    const matchingElement = resourceElements.find(({ node }) => {
      const tagName = adapter.getTagName(node);
      let resourceUrl = null;

      if (tagName === 'script') {
        resourceUrl = adapter.getAttribute(node, 'src');
      } else if (tagName === 'link') {
        resourceUrl = adapter.getAttribute(node, 'href');
      }

      if (!resourceUrl) return false;

      const normalizedResourceUrl = normalizeUrl(resourceUrl);
      return normalizedResourceUrl === normalizedPreloadUrl;
    });

    if (matchingElement) {
      const matchingTagName = adapter.getTagName(matchingElement.node);
      findings.push({
        ruleId: 'no-unnecessary-preload',
        message: `This preload has little to no effect. "${preloadHref}" is already discoverable by a <${matchingTagName}> element`,
        node: preloadNode,
        location: adapter.getLocation(preloadNode),
        severity: 'warning',
        data: {
          href: preloadHref,
          tagName: matchingTagName,
        },
      });
    }
  }

  return findings;
}

/**
 * Normalize URL for comparison (helper)
 */
function normalizeUrl(url) {
  if (!url) return null;
  // Remove leading ./ and normalize path
  let normalized = url.replace(/^\.\//, '');
  // Remove query strings and hashes for comparison
  normalized = normalized.split('?')[0].split('#')[0];
  return normalized;
}
```

**Key Design Points:**
- ✅ Single entry point `analyzeHead()` runs **all** capo rules
- ✅ Multiple passes for different rule categories (ordering, duplicates, required, unnecessary)
- ✅ All findings returned in single `AnalysisResult.findings` array
- ✅ Each finding tagged with `ruleId` for filtering by consumers
- ✅ Efficient: each element visited once per pass
- ✅ ESLint plugin can cache this result and filter by `ruleId` per rule

**Effort:** 3 days (includes extracting all validation logic and implementing all rule checks)

#### 3.6 Split IO into Logging and Core
**Current:** `src/lib/io.js` mixes DOM operations, logging, and visualization

**New structure:**
- `src/lib/logging.js` — Browser-specific console logging, visualization, DOM-based helpers
- `src/core/analyzer.js` — Core analysis (created in 3.5)

**Logging stays browser-only:**
```javascript
// src/lib/logging.js
import { BrowserAdapter } from '../adapters/browser.js';
import { analyzeHead } from '../core/analyzer.js';

export class Logger {
  constructor(document, options, output = window.console) {
    this.document = document;
    this.options = options;
    this.console = output;
    this.adapter = new BrowserAdapter();
  }

  async init() {
    // Existing head detection logic (uses document.querySelector, fetch, etc.)
    // This is OK because logging is browser-only
  }

  async run() {
    await this.init();
    const head = this.getHead();
    
    // Use core analyzer
    const results = analyzeHead(head, this.adapter, this.options);
    
    // Visualize results
    this.visualizeHead(results);
  }

  // Keep all existing visualization methods
  visualizeHead(results) { /* ... */ }
  logElement(...) { /* ... */ }
  getElementVisualization(...) { /* ... */ }
}
```

**Effort:** 1 day

### Phase 3: Convenience APIs & Compatibility (Week 3)

#### 3.7 Add Convenience Entry Points
**File:** `src/index.js` (update exports)

```javascript
// Core exports
export { analyzeHead } from './core/analyzer.js';
export * as rules from './lib/rules.js';
export * as validation from './lib/validation.js';

// Adapter exports
export { BrowserAdapter } from './adapters/browser.js';
export { ParserAdapter } from './adapters/parser.js';

// Convenience functions
export { analyzeDocument, analyzeHtmlString } from './convenience.js';

// Legacy exports (with deprecation warnings)
export { Logger as IO } from './lib/logging.js';
export * as io from './lib/logging.js';
export { Options } from './lib/options.js';
export * as options from './lib/options.js';
```

**File:** `src/convenience.js`
```javascript
import { BrowserAdapter } from './adapters/browser.js';
import { ParserAdapter } from './adapters/parser.js';
import { analyzeHead } from './core/analyzer.js';

/**
 * Analyze a browser document
 * @param {Document} document - Browser document object
 * @param {object} options - Analysis options
 * @returns {AnalysisResult}
 */
export function analyzeDocument(document, options = {}) {
  const adapter = new BrowserAdapter();
  const head = document.querySelector('head');
  if (!head) {
    throw new Error('No <head> element found in document');
  }
  return analyzeHead(head, adapter, options);
}

/**
 * Analyze an HTML string (Node.js environment)
 * @param {string} htmlString - HTML string to analyze
 * @param {object} options - Analysis options
 * @returns {AnalysisResult}
 */
export function analyzeHtmlString(htmlString, options = {}) {
  // Import parser dynamically to avoid browser bundle bloat
  // For now, consumers must provide parsed tree
  throw new Error(
    'analyzeHtmlString requires pre-parsed AST. ' +
    'Parse your HTML with @html-eslint/parser and use analyzeHead(headNode, new ParserAdapter(), options)'
  );
  
  // Alternative: if we bundle a parser
  // const parser = require('@html-eslint/parser');
  // const ast = parser.parse(htmlString);
  // const headNode = findHeadNode(ast);
  // return analyzeHead(headNode, new ParserAdapter(), options);
}
```

**Effort:** 0.5 day

#### 3.8 Add Deprecation Shims
**File:** `src/lib/logging.js` (update constructor)

```javascript
export class Logger {
  constructor(document, options, output = window.console) {
    console.warn(
      '[Capo.js Deprecation] Direct use of IO/Logger class will be deprecated in v3.0. ' +
      'Use analyzeDocument() or analyzeHead() with adapters instead. ' +
      'See migration guide: https://capo.js.org/migration'
    );
    
    this.document = document;
    this.options = options;
    this.console = output;
    this.adapter = new BrowserAdapter();
  }
  // ... rest of implementation
}
```

**Effort:** 0.5 day

### Phase 4: Testing (Week 3-4)

#### 3.9 Unit Tests for Adapters
**File:** `tests/adapters/browser.test.js`
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { BrowserAdapter } from '../../src/adapters/browser.js';

describe('BrowserAdapter', () => {
  it('should identify element nodes', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><head><meta charset="utf-8"></head></html>');
    const meta = dom.window.document.querySelector('meta');
    const adapter = new BrowserAdapter();
    
    assert.strictEqual(adapter.isElement(meta), true);
    assert.strictEqual(adapter.getTagName(meta), 'meta');
    assert.strictEqual(adapter.getAttribute(meta, 'charset'), 'utf-8');
  });

  it('should get children', () => {
    const dom = new JSDOM('<head><meta charset="utf-8"><title>Test</title></head>');
    const head = dom.window.document.querySelector('head');
    const adapter = new BrowserAdapter();
    
    const children = adapter.getChildren(head);
    assert.strictEqual(children.length, 2);
    assert.strictEqual(adapter.getTagName(children[0]), 'meta');
    assert.strictEqual(adapter.getTagName(children[1]), 'title');
  });

  // More tests...
});
```

**File:** `tests/adapters/parser.test.js`
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import htmlParser from '@html-eslint/parser';
import { ParserAdapter } from '../../src/adapters/parser.js';

describe('ParserAdapter', () => {
  it('should identify element nodes from AST', () => {
    const html = '<head><meta charset="utf-8"></head>';
    const ast = htmlParser.parse(html, { sourceType: 'module' });
    // Find head node in AST
    const headNode = ast.body.find(node => node.name === 'head');
    const adapter = new ParserAdapter();
    
    assert.strictEqual(adapter.isElement(headNode), true);
    assert.strictEqual(adapter.getTagName(headNode), 'head');
  });

  // More tests...
});
```

**Effort:** 2 days (comprehensive adapter tests)

#### 3.10 Core Analyzer Tests
**File:** `tests/core/analyzer.test.js`

Use mock adapter to test core logic:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeHead } from '../../src/core/analyzer.js';

// Mock adapter for testing
class MockAdapter {
  constructor(nodes) {
    this.nodes = nodes;
  }

  isElement(node) { return node.type === 'element'; }
  getTagName(node) { return node.tag; }
  getAttribute(node, name) { return node.attrs?.[name] || null; }
  getAttributeNames(node) { return Object.keys(node.attrs || {}); }
  getTextContent(node) { return node.text || ''; }
  getChildren(node) { return node.children || []; }
  matches(node, selector) { /* simple implementation */ }
  getLocation(node) { return node.loc || null; }
  stringify(node) { return node.tag; }
}

describe('analyzeHead', () => {
  it('should analyze head and return weights', () => {
    const headNode = {
      type: 'element',
      tag: 'head',
      children: [
        { type: 'element', tag: 'meta', attrs: { charset: 'utf-8' } },
        { type: 'element', tag: 'title', children: [] },
        { type: 'element', tag: 'script', attrs: { src: 'app.js' } },
      ],
    };
    
    const adapter = new MockAdapter();
    const result = analyzeHead(headNode, adapter);
    
    assert.strictEqual(result.weights.length, 3);
    assert.strictEqual(result.weights[0].category, 'META');
    assert.strictEqual(result.weights[1].category, 'TITLE');
  });

  // More tests...
});
```

**Effort:** 2 days

#### 3.11 Integration Tests
**File:** `tests/integration/browser.test.js` (using jsdom)
**File:** `tests/integration/parser.test.js` (using @html-eslint/parser)

**Effort:** 1 day

#### 3.12 Update Existing Tests
Update all existing rule/validation tests to pass adapter:

```javascript
// Before
const weight = rules.getWeight(element);

// After
const adapter = new BrowserAdapter(); // or ParserAdapter in Node tests
const weight = rules.getWeight(node, adapter);
```

**Effort:** 1 day

---

## 4. ESLint Plugin Migration

### 4.1 Update Plugin Dependencies
**File:** `eslint-plugin-capo/package.json`

Add capo.js dependency:
```json
{
  "dependencies": {
    "capo.js": "^2.0.0"
  }
}
```

### 4.2 Refactor Plugin Rules to Use Core

**Problem:** Naively calling `analyzeHead()` in each rule would analyze the same `<head>` multiple times (once per enabled rule), which is wasteful.

**Solution:** Use a **shared analysis cache** at the plugin level. Analyze once per `<head>`, store results in context, and let each rule retrieve its specific findings.

#### 4.2.1 Shared Analysis Utility

**File:** `eslint-plugin-capo/src/utils/capo-analyzer.js`

```javascript
import { analyzeHead, ParserAdapter } from 'capo.js';

const ANALYSIS_CACHE = new WeakMap();
const adapter = new ParserAdapter();

/**
 * Get capo analysis for a head node, using cache to avoid re-analysis
 * @param {object} headNode - The <head> AST node
 * @param {object} context - ESLint context (for source code access if needed)
 * @returns {AnalysisResult}
 */
export function getCapoAnalysis(headNode, context) {
  // Check cache first
  if (ANALYSIS_CACHE.has(headNode)) {
    return ANALYSIS_CACHE.get(headNode);
  }

  // Analyze once
  const result = analyzeHead(headNode, adapter, {
    validationEnabled: true,
  });

  // Cache for other rules
  ANALYSIS_CACHE.set(headNode, result);

  return result;
}

/**
 * Get findings for a specific rule ID
 * @param {object} headNode - The <head> AST node
 * @param {object} context - ESLint context
 * @param {string} ruleId - Capo rule ID (e.g., 'require-order')
 * @returns {CapoFinding[]}
 */
export function getFindingsForRule(headNode, context, ruleId) {
  const analysis = getCapoAnalysis(headNode, context);
  return analysis.findings.filter(f => f.ruleId === ruleId);
}

/**
 * Get element weights (for ordering-related rules)
 * @param {object} headNode - The <head> AST node
 * @param {object} context - ESLint context
 * @returns {ElementWeight[]}
 */
export function getElementWeights(headNode, context) {
  const analysis = getCapoAnalysis(headNode, context);
  return analysis.weights;
}
```

#### 4.2.2 Updated Rule Implementation

**Example:** `eslint-plugin-capo/src/rules/require-order.js`

Before (duplicated logic):
```javascript
import { getWeight, shouldComeBefore } from '../utils/element-ordering.js';

export default {
  create(context) {
    return {
      'Tag[name="head"]'(headNode) {
        const children = headNode.children?.filter(/* ... */);
        
        for (let i = 0; i < children.length - 1; i++) {
          const current = children[i];
          const next = children[i + 1];
          
          if (shouldComeBefore(next, current)) {
            context.report({
              node: next,
              messageId: 'incorrectOrder',
              data: { /* ... */ }
            });
          }
        }
      }
    };
  }
};
```

After (using capo.js core with caching):
```javascript
import { getFindingsForRule } from '../utils/capo-analyzer.js';

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce optimal ordering of elements in <head>',
    },
    messages: {
      incorrectOrder: 'Element should come before higher priority elements ({{details}})',
    },
  },

  create(context) {
    return {
      'Tag[name="head"]'(headNode) {
        // Get findings from shared analysis (cached)
        const findings = getFindingsForRule(headNode, context, 'require-order');
        
        // Report each finding
        findings.forEach(finding => {
          context.report({
            node: finding.node,
            loc: finding.location,
            messageId: 'incorrectOrder',
            data: {
              details: finding.message,
              ...finding.data,
            },
          });
        });
      }
    };
  }
};
```

#### 4.2.3 Alternative: Rule-Specific Getters

For rules that need custom logic beyond capo's findings:

```javascript
import { getElementWeights } from '../utils/capo-analyzer.js';

export default {
  create(context) {
    return {
      'Tag[name="head"]'(headNode) {
        // Get weights from shared analysis
        const weights = getElementWeights(headNode, context);
        
        // Custom rule logic using weights
        weights.forEach(({ node, weight, category, warnings }) => {
          if (warnings.length > 0) {
            warnings.forEach(warning => {
              context.report({
                node,
                messageId: 'elementWarning',
                data: { warning, category },
              });
            });
          }
        });
      }
    };
  }
};
```

**Benefits:**
- ✅ Analyze `<head>` only **once** per file, regardless of number of enabled rules
- ✅ No duplicated detector logic
- ✅ Automatic updates when capo.js rules change
- ✅ Consistent behavior between browser and linting
- ✅ WeakMap ensures cache cleanup when AST nodes are garbage collected
- ✅ Each rule can still add custom logic if needed

### 4.3 Remove Duplicated Utilities
Delete or deprecate:
- `eslint-plugin-capo/src/utils/element-ordering.js` (use capo.js rules)
- Parts of `eslint-plugin-capo/src/utils/validation-helpers.js` (use capo.js validation)

Keep plugin-specific helpers:
- ESLint context utilities
- Rule message formatting
- Plugin configuration

**Effort for plugin migration:** 3-5 days (refactor all rules + update tests)

---

## 5. Documentation & Types

### 5.1 TypeScript Declaration Files
**File:** `src/index.d.ts`

```typescript
export interface HTMLAdapter {
  isElement(node: any): boolean;
  getTagName(node: any): string;
  getAttribute(node: any, attrName: string): string | null;
  getAttributeNames(node: any): string[];
  getTextContent(node: any): string;
  getChildren(node: any): any[];
  matches(node: any, selector: string): boolean;
  getLocation(node: any): { line: number; column: number; endLine?: number; endColumn?: number } | null;
  stringify(node: any): string;
}

export interface CapoFinding {
  ruleId: string;
  message: string;
  node: any;
  location?: { line: number; column: number; endLine?: number; endColumn?: number };
  severity: 'error' | 'warning' | 'info';
  data?: Record<string, any>;
}

export interface ElementWeight {
  node: any;
  weight: number;
  category: string;
  isValid: boolean;
  warnings: string[];
}

export interface AnalysisResult {
  weights: ElementWeight[];
  findings: CapoFinding[];
  headElement: any;
}

export function analyzeHead(headNode: any, adapter: HTMLAdapter, options?: any): AnalysisResult;
export function analyzeDocument(document: Document, options?: any): AnalysisResult;

export class BrowserAdapter implements HTMLAdapter {
  isElement(node: any): boolean;
  getTagName(node: any): string;
  getAttribute(node: any, attrName: string): string | null;
  getAttributeNames(node: any): string[];
  getTextContent(node: any): string;
  getChildren(node: any): any[];
  matches(node: any, selector: string): boolean;
  getLocation(node: any): { line: number; column: number; endLine?: number; endColumn?: number } | null;
  stringify(node: any): string;
}

export class ParserAdapter implements HTMLAdapter {
  isElement(node: any): boolean;
  getTagName(node: any): string;
  getAttribute(node: any, attrName: string): string | null;
  getAttributeNames(node: any): string[];
  getTextContent(node: any): string;
  getChildren(node: any): any[];
  matches(node: any, selector: string): boolean;
  getLocation(node: any): { line: number; column: number; endLine?: number; endColumn?: number } | null;
  stringify(node: any): string;
}

// Legacy exports (deprecated)
/** @deprecated Use analyzeDocument or analyzeHead with BrowserAdapter */
export class Logger {
  constructor(document: Document, options: any, output?: Console);
  init(): Promise<void>;
  run(): Promise<void>;
}
```

### 5.2 Migration Guide
**File:** `docs/MIGRATION_V2.md`

```markdown
# Migration Guide: Capo.js v1.x → v2.0

## Breaking Changes

### 1. Rule Detectors Now Require Adapter

**Before (v1.x):**
```javascript
import { isMeta, getWeight } from 'capo.js';

const element = document.querySelector('meta');
const weight = getWeight(element);
```

**After (v2.0):**
```javascript
import { isMeta, getWeight, BrowserAdapter } from 'capo.js';

const adapter = new BrowserAdapter();
const element = document.querySelector('meta');
const weight = getWeight(element, adapter);
```

### 2. New Recommended API: analyzeHead()

**Before (v1.x):**
```javascript
import { IO, Options } from 'capo.js';

const options = new Options();
const io = new IO(document, options);
await io.init();
// ... logging-specific usage
```

**After (v2.0 - recommended):**
```javascript
import { analyzeDocument } from 'capo.js';

const result = analyzeDocument(document);
console.log('Findings:', result.findings);
console.log('Weights:', result.weights);
```

### 3. Node.js Usage (New in v2.0)

```javascript
import { analyzeHead, ParserAdapter } from 'capo.js';
import htmlParser from '@html-eslint/parser';

const html = '<head><meta charset="utf-8"><title>Test</title></head>';
const ast = htmlParser.parse(html);
const headNode = ast.body.find(node => node.name === 'head');

const adapter = new ParserAdapter();
const result = analyzeHead(headNode, adapter);

result.findings.forEach(finding => {
  console.log(`${finding.severity}: ${finding.message} at line ${finding.location?.line}`);
});
```

## Deprecations

- `IO` class → Use `analyzeDocument()` or `analyzeHead()` with adapters
- Direct use of rule detectors without adapter → All detectors now require adapter parameter

## Timeline

- v2.0: New APIs introduced, deprecation warnings added
- v3.0: Deprecated APIs removed (estimated: 6-12 months)
```

### 5.3 README Updates
Update main README.md with:
- New installation instructions
- Quick start for browser usage
- Quick start for Node.js usage
- Link to migration guide

**Effort for docs:** 2 days

---

## 6. Release & Versioning Plan

### 6.1 Version Strategy

**Target:** v2.0.0 (Major version bump)

**Semantic Versioning Justification:**
- Breaking change: All rule detector functions now require `adapter` parameter
- New public API: `analyzeHead()`, `analyzeDocument()`, adapter classes
- Deprecations: `IO` class, old import paths

### 6.2 Release Checklist

#### Pre-release
- [ ] Complete all refactoring (Phase 1-3)
- [ ] Pass all tests (100% of existing tests + new adapter/core tests)
- [ ] Update package.json version to 2.0.0
- [ ] Update CHANGELOG.md with breaking changes and new features
- [ ] Add MIGRATION_V2.md guide
- [ ] Update README.md with new API examples
- [ ] Add TypeScript declaration files
- [ ] Run performance benchmarks (ensure no regressions)

#### Release
- [ ] Create release branch: `release/v2.0.0`
- [ ] Publish beta: `npm publish --tag beta` → v2.0.0-beta.1
- [ ] Test beta in eslint-plugin-capo (separate PR)
- [ ] Collect feedback (1-2 weeks)
- [ ] Fix any issues → v2.0.0-beta.2, etc.
- [ ] Final release: `npm publish` → v2.0.0
- [ ] Create GitHub release with changelog
- [ ] Tag: `git tag v2.0.0`

#### Post-release
- [ ] Update eslint-plugin-capo to use capo.js v2.0 (separate PR)
- [ ] Update docs site with new API docs
- [ ] Announce on Twitter, Discord, etc.
- [ ] Monitor issues for migration problems

### 6.3 Compatibility Shim Period

**v2.x series:** Deprecation warnings logged for old APIs
**v3.0 (future):** Remove deprecated APIs entirely

**Timeline:** 6-12 months between v2.0 and v3.0 to give consumers time to migrate

### 6.4 CHANGELOG.md Entry

```markdown
## [2.0.0] - 2025-XX-XX

### Breaking Changes

- **Rule detectors now require adapter parameter:** All functions in `src/lib/rules.js` (e.g., `isMeta`, `getWeight`) now require an adapter as the second parameter. Use `BrowserAdapter` for DOM elements or `ParserAdapter` for HTML parser AST nodes.
  
  ```javascript
  // Before
  const weight = getWeight(element);
  
  // After
  const adapter = new BrowserAdapter();
  const weight = getWeight(element, adapter);
  ```

- **IO class is deprecated:** Use `analyzeDocument()` or `analyzeHead()` with adapters instead. The `IO` class will be removed in v3.0.

### New Features

- **DOM-agnostic core:** Capo.js can now analyze HTML in Node.js environments using the `ParserAdapter` with `@html-eslint/parser` AST nodes
- **New API: `analyzeHead(headNode, adapter, options)`:** Core analysis function that returns structured findings and weights
- **New API: `analyzeDocument(document, options)`:** Convenience function for browser usage
- **Adapter system:** `BrowserAdapter` for DOM elements, `ParserAdapter` for HTML parser nodes
- **TypeScript declarations:** Added `.d.ts` files for better IDE support
- **Better ESLint integration:** The `eslint-plugin-capo` package can now depend on capo.js core logic

### Migration

See [MIGRATION_V2.md](./docs/MIGRATION_V2.md) for detailed migration instructions.

### Deprecated

- `IO` class (use `analyzeDocument()` or `analyzeHead()` instead)
- Direct use of rule detectors without adapter parameter

```

---

## 7. Testing Strategy

### 7.1 Test Coverage Goals

- **Adapter tests:** 100% coverage of adapter methods
- **Core analyzer tests:** 100% coverage using mock adapters
- **Integration tests:** Browser (jsdom) and Node (parser) environments
- **Regression tests:** All existing v1.x behavior preserved (via shims)
- **Performance tests:** Ensure no significant slowdown (< 10% overhead)

### 7.2 CI/CD Updates

**File:** `.github/workflows/test.yml`

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
      - run: npm run test:adapters
      - run: npm run test:integration
      - run: npm run test:coverage
  
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20.x
      - run: npm ci
      - run: npm run lint
```

### 7.3 Test Commands

**File:** `package.json` (add test scripts)

```json
{
  "scripts": {
    "test": "node --test tests/**/*.test.js",
    "test:adapters": "node --test tests/adapters/*.test.js",
    "test:core": "node --test tests/core/*.test.js",
    "test:integration": "node --test tests/integration/*.test.js",
    "test:coverage": "node --test --experimental-test-coverage tests/**/*.test.js"
  }
}
```

---

## 8. Risk Assessment & Mitigation

### Risk 1: Performance Regression
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Benchmark before/after with large HTML documents
- Optimize adapter methods (especially `matches` and `getChildren`)
- Profile hot paths and optimize if needed
- Target: < 10% performance overhead vs v1.x

### Risk 2: Incomplete Selector Matching
**Probability:** Medium  
**Impact:** Low  
**Mitigation:**
- Implement simple selector matcher for capo's needs (tag, attributes)
- Document supported selector patterns
- Consider adding `css-select` dependency if complex selectors needed
- Provide adapter override option for custom matcher

### Risk 3: Breaking Changes Impact on Ecosystem
**Probability:** High  
**Impact:** High  
**Mitigation:**
- Provide deprecation shims for one major release
- Clear migration guide with examples
- Beta release period (1-2 weeks) for early feedback
- Version all examples and docs
- Communicate changes via blog post, changelog, GitHub discussions

### Risk 4: Parser Incompatibilities
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Test with multiple parsers (@html-eslint/parser, parse5, htmlparser2)
- Document which parsers are officially supported
- Provide adapter extension guide for custom parsers
- Keep adapter interface minimal to ease implementation

### Risk 5: Location Info Missing in Some Parsers
**Probability:** Medium  
**Impact:** Low  
**Mitigation:**
- Make `getLocation()` optional (return null if unavailable)
- ESLint plugin can fall back to node ranges if adapter location is null
- Document which parsers support location info

---

## 9. Effort Estimation & Timeline

### Summary by Phase

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| Phase 1: Foundation | Adapter interface + implementations + rules.js refactor | 3.5 days |
| Phase 2: Core Extraction | Core analyzer + split IO/logging | 3 days |
| Phase 3: Convenience APIs | Entry points + shims + docs | 1.5 days |
| Phase 4: Testing | Unit + integration + update existing tests | 6 days |
| **Total (capo.js)** | | **14 days (2.8 weeks)** |
| **ESLint Plugin Migration** | Update plugin to use core | **3-5 days** |
| **Documentation & Release** | Docs, types, migration guide, release prep | **2 days** |
| **Grand Total** | | **19-21 developer days (~4 weeks)** |

### Recommended Timeline

- **Week 1:** Phase 1 (Foundation)
- **Week 2:** Phase 2 (Core Extraction)
- **Week 3:** Phase 3 (Convenience APIs) + Phase 4 (Testing - part 1)
- **Week 4:** Phase 4 (Testing - part 2) + Documentation + Beta release
- **Week 5:** Beta feedback, fixes, final release
- **Week 6:** ESLint plugin migration

**Total calendar time:** 6 weeks (with buffer)

---

## 10. Example Code Snippets

### 10.1 Browser Usage (v2.0)

```javascript
import { analyzeDocument } from 'capo.js';

// Simple analysis
const result = analyzeDocument(document);

console.log('Findings:', result.findings);
console.log('Weights:', result.weights);

// With options
const resultWithOptions = analyzeDocument(document, {
  validationEnabled: true,
  loggingPrefix: '[Capo] ',
});

// Manual adapter usage
import { analyzeHead, BrowserAdapter } from 'capo.js';

const head = document.querySelector('head');
const adapter = new BrowserAdapter();
const result = analyzeHead(head, adapter);
```

### 10.2 Node.js Usage (v2.0)

```javascript
import { analyzeHead, ParserAdapter } from 'capo.js';
import htmlParser from '@html-eslint/parser';

const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Test Page</title>
    <script src="app.js"></script>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>...</body>
</html>
`;

// Parse HTML
const ast = htmlParser.parse(html, { loc: true });

// Find <head> node
const headNode = ast.body.find(node => node.name === 'head');

// Analyze
const adapter = new ParserAdapter();
const result = analyzeHead(headNode, adapter);

// Process findings
result.findings.forEach(finding => {
  console.log(`[${finding.severity}] ${finding.message}`);
  if (finding.location) {
    console.log(`  at line ${finding.location.line}, column ${finding.location.column}`);
  }
});

// Process weights
result.weights.forEach(({ weight, category, node }) => {
  const adapter = new ParserAdapter();
  console.log(`${adapter.stringify(node)}: weight=${weight}, category=${category}`);
});
```

### 10.3 ESLint Plugin Usage (v2.0)

#### Option 1: Using Shared Analyzer (Recommended)

```javascript
// eslint-plugin-capo/src/utils/capo-analyzer.js
import { analyzeHead, ParserAdapter } from 'capo.js';

const ANALYSIS_CACHE = new WeakMap();
const adapter = new ParserAdapter();

export function getCapoAnalysis(headNode, context) {
  if (ANALYSIS_CACHE.has(headNode)) {
    return ANALYSIS_CACHE.get(headNode);
  }
  
  const result = analyzeHead(headNode, adapter, {
    validationEnabled: true,
  });
  
  ANALYSIS_CACHE.set(headNode, result);
  return result;
}

export function getFindingsForRule(headNode, context, ruleId) {
  const analysis = getCapoAnalysis(headNode, context);
  return analysis.findings.filter(f => f.ruleId === ruleId);
}
```

```javascript
// eslint-plugin-capo/src/rules/require-order.js
import { getFindingsForRule } from '../utils/capo-analyzer.js';

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce optimal ordering of elements in <head>',
    },
    messages: {
      incorrectOrder: '{{message}}',
    },
  },

  create(context) {
    return {
      'Tag[name="head"]'(headNode) {
        // Get findings from shared analysis (cached, runs once per file)
        const findings = getFindingsForRule(headNode, context, 'require-order');
        
        findings.forEach(finding => {
          context.report({
            node: finding.node,
            loc: finding.location,
            messageId: 'incorrectOrder',
            data: {
              message: finding.message,
              ...finding.data,
            },
          });
        });
      }
    };
  }
};
```

#### Option 2: Direct Usage (for single-rule scenarios)

```javascript
// eslint-plugin-capo/src/rules/no-duplicate-title.js
import { analyzeHead, ParserAdapter } from 'capo.js';

const adapter = new ParserAdapter();

export default {
  meta: {
    type: 'error',
    docs: {
      description: 'Disallow duplicate <title> elements',
    },
    messages: {
      duplicateTitle: 'Only one <title> element is allowed per document',
    },
  },

  create(context) {
    return {
      'Tag[name="head"]'(headNode) {
        // For single-rule usage, direct call is fine
        const result = analyzeHead(headNode, adapter);
        
        const duplicateTitleFindings = result.findings.filter(
          f => f.ruleId === 'no-duplicate-title'
        );
        
        duplicateTitleFindings.forEach(finding => {
          context.report({
            node: finding.node,
            loc: finding.location,
            messageId: 'duplicateTitle',
          });
        });
      }
    };
  }
};
```

**Performance Note:** With the shared analyzer pattern (Option 1), analyzing a `<head>` with 20 elements and 10 enabled capo rules:
- ❌ Naive approach: 10 full analyses (200 element visits)
- ✅ Cached approach: 1 analysis, 9 cache hits (20 element visits)

This represents a **10x reduction** in analysis overhead.

### 10.4 Custom Adapter Example

```javascript
// Example: Adapter for a different parser
export class CustomParserAdapter {
  constructor(parserOptions = {}) {
    this.options = parserOptions;
  }

  isElement(node) {
    return node.nodeType === 'element';
  }

  getTagName(node) {
    return node.tagName?.toLowerCase() || '';
  }

  getAttribute(node, attrName) {
    return node.attributes?.[attrName] || null;
  }

  getAttributeNames(node) {
    return Object.keys(node.attributes || {});
  }

  getTextContent(node) {
    return node.textContent || '';
  }

  getChildren(node) {
    return (node.childNodes || []).filter(n => this.isElement(n));
  }

  matches(node, selector) {
    // Custom selector matching logic
    // Or use a library like css-select
    return false;
  }

  getLocation(node) {
    return node.sourceLocation ? {
      line: node.sourceLocation.startLine,
      column: node.sourceLocation.startColumn,
      endLine: node.sourceLocation.endLine,
      endColumn: node.sourceLocation.endColumn,
    } : null;
  }

  stringify(node) {
    return `${this.getTagName(node)}[${this.getAttributeNames(node).join(',')}]`;
  }
}
```

---

## 11. Success Criteria

### Must Have (v2.0.0 Release)
- ✅ All existing tests pass
- ✅ New adapter tests with 100% coverage
- ✅ Core analyzer tests with mock adapters
- ✅ BrowserAdapter implemented and tested
- ✅ ParserAdapter implemented and tested
- ✅ `analyzeHead()` API documented
- ✅ `analyzeDocument()` convenience API
- ✅ TypeScript declaration files
- ✅ Migration guide published
- ✅ Deprecation warnings in place
- ✅ No performance regression > 10%

### Should Have (v2.0.x Patches)
- ✅ Integration tests with real HTML corpus
- ✅ Performance benchmarks
- ✅ Updated docs site with examples
- ✅ Blog post announcing v2.0

### Nice to Have (v2.1+)
- ⭕ `analyzeHtmlString()` with bundled parser
- ⭕ CLI tool for analyzing HTML files
- ⭕ Webpack/Rollup plugins
- ⭕ Advanced selector support via css-select

---

## 12. Follow-up Work (Post v2.0)

### v2.1: Enhanced Node.js Support
- Bundle a default parser for `analyzeHtmlString()`
- Add CLI tool: `capo analyze <file.html>`
- Add streaming support for large HTML files

### v2.2: Performance Optimizations
- Lazy adapter initialization
- Cached selector matching
- Parallel validation for large DOMs

### v3.0: Remove Deprecations
- Remove `IO` class
- Remove legacy exports
- Clean up codebase

### Future: Monorepo Split (Optional)
If the single-package approach becomes unwieldy:
- `@capo/core` — Core analysis logic
- `@capo/adapter-browser` — Browser adapter
- `@capo/adapter-parser` — Parser adapter
- `capo.js` — Meta-package that exports all

---

## 13. Communication Plan

### Internal
- Share this RFC with team for review
- Create GitHub project board with tasks
- Schedule kickoff meeting
- Weekly progress updates

### External
- Announce v2.0 beta on Twitter, Discord, GitHub Discussions
- Request beta testers from community
- Publish migration guide 1 week before release
- Blog post on release day
- Update capo.js website with new docs

### Support
- Monitor GitHub issues for migration problems
- Update FAQ with common migration questions
- Provide code examples in issue responses
- Consider migration workshop or video tutorial

---

## Appendix A: File Structure (Post-Migration)

```
capo.js/
├── src/
│   ├── index.js                    # Main exports
│   ├── convenience.js              # analyzeDocument, analyzeHtmlString
│   ├── index.d.ts                  # TypeScript declarations
│   ├── core/
│   │   └── analyzer.js             # DOM-agnostic core logic
│   ├── adapters/
│   │   ├── adapter.js              # Interface documentation
│   │   ├── browser.js              # BrowserAdapter
│   │   └── parser.js               # ParserAdapter
│   ├── lib/
│   │   ├── rules.js                # Rule detectors (refactored)
│   │   ├── validation.js           # Validation logic (refactored)
│   │   ├── logging.js              # Browser logging/visualization
│   │   ├── colors.js               # Color utilities
│   │   └── options.js              # Options class
│   ├── snippet/
│   │   └── capo.js                 # Browser snippet (uses new API)
│   └── web/
│       └── capo.js                 # Web bundle
├── tests/
│   ├── adapters/
│   │   ├── browser.test.js
│   │   └── parser.test.js
│   ├── core/
│   │   └── analyzer.test.js
│   ├── integration/
│   │   ├── browser.test.js
│   │   └── parser.test.js
│   └── lib/
│       ├── rules.test.js           # Updated tests
│       └── validation.test.js      # Updated tests
├── docs/
│   ├── MIGRATION_V2.md             # Migration guide
│   └── API.md                      # API reference
├── CHANGELOG.md
├── MIGRATION_PLAN.md               # This document
└── package.json
```

---

## Appendix B: Selector Patterns Used in Capo.js

Current selectors used in `src/lib/rules.js`:

1. `meta:is([charset], [http-equiv="..."], [name=viewport])`
2. `title`
3. `link[rel=preconnect]`
4. `script[src][async]`
5. `style`
6. `link[rel=stylesheet]`
7. `script:not([src][defer],[src][type=module],[src][async],[type*=json])`
8. `link:is([rel=preload], [rel=modulepreload])`
9. `script[src][defer], script:not([src][async])[src][type=module]`
10. `link:is([rel=prefetch], [rel=dns-prefetch], [rel=prerender])`
11. `meta[http-equiv="origin-trial"i]`
12. `meta[http-equiv="Content-Security-Policy" i]`

**Complexity analysis:**
- Simple tag selectors: Easy
- Attribute selectors: `[attr]`, `[attr="value"]` — Easy
- `:is()` pseudo-class: Can be expanded to OR conditions
- `:not()` pseudo-class: Inverse logic
- `[attr*=value]` substring match: Moderate
- Case-insensitive `i` flag: Easy (toLowerCase)

**Implementation strategy:**
- Replace complex selectors with direct attribute checks in detector functions
- Simple `matches()` implementation in adapters handles basic patterns
- No need for full CSS selector engine

---

## Appendix C: Questions & Answers

**Q: Why not use a full CSS selector library like css-select?**  
A: Capo's selectors are simple enough that a lightweight matcher suffices. Adding a dependency increases bundle size and complexity. If complex selectors are needed later, we can add css-select as an optional peer dependency.

**Q: Will this work with other HTML parsers (parse5, htmlparser2, cheerio)?**  
A: Yes, by implementing a custom adapter. The adapter interface is minimal and should work with most parsers. We'll document adapter implementation guide.

**Q: What about source maps for minified HTML?**  
A: Out of scope for v2.0. Adapters return raw location info from parser; consumers can map to source if needed.

**Q: Can I use capo.js in a webpack plugin or build tool?**  
A: Yes, import `analyzeHead` with `ParserAdapter`. Future work: dedicated build tool integrations.

**Q: Will the browser bundle size increase?**  
A: Slightly (estimated +2-5KB minified) due to adapter abstraction. We'll optimize hot paths and tree-shake unused code.

**Q: What about Web Components / Shadow DOM?**  
A: Out of scope for v2.0. Future enhancement: adapter method for shadow root traversal.

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-17 | Initial RFC | GitHub Copilot |

---

**End of Migration Plan**
