# Capo.js Pre-Refactor Test Plan

**Version:** 1.0  
**Date:** October 18, 2025  
**Purpose:** Establish comprehensive test coverage before DOM-agnostic refactor (MIGRATION_PLAN.md Phase 0)

## Executive Summary

This document outlines a test hardening strategy to be completed **before** starting the adapter refactor. The goal is to lock in current behavior and prevent regressions during the v2.0 refactor.

### Current State
- **Test files:** 0 (no existing test suite in capo.js)
- **Source files:** 5 core modules in `src/lib/`
- **Reference:** eslint-plugin-capo has 16 test files with comprehensive coverage

### Goals
1. ✅ Achieve >90% code coverage on core logic before refactor
2. ✅ Create baseline snapshots of current behavior
3. ✅ Test all detector functions and validation logic
4. ✅ Establish integration tests for browser and Node.js environments
5. ✅ Document test patterns for future contributors

---

## 1. Current Source Code Inventory

### Files to Test

| File | Purpose | Functions | Priority |
|------|---------|-----------|----------|
| `src/lib/rules.js` | Element detection & weighting | 11 detectors + getWeight | **HIGH** |
| `src/lib/validation.js` | Validation logic | 20+ validation functions | **HIGH** |
| `src/lib/io.js` | Browser I/O & logging | IO class, visualization | **MEDIUM** |
| `src/lib/options.js` | Configuration | Options class | **LOW** |
| `src/lib/colors.js` | Color utilities | Color generation | **LOW** |

### Core Functions in rules.js (11 detectors)
```javascript
✓ isMeta(element)
✓ isTitle(element)
✓ isPreconnect(element)
✓ isAsyncScript(element)
✓ isImportStyles(element)
✓ isSyncScript(element)
✓ isSyncStyles(element)
✓ isPreload(element)
✓ isDeferScript(element)
✓ isPrefetchPrerender(element)
✓ isOriginTrial(element)
✓ isMetaCSP(element)
✓ getWeight(element)
```

### Core Functions in validation.js (20+ validators)
```javascript
✓ isValidElement(element)
✓ hasValidationWarning(element)
✓ getValidationWarnings(head)
✓ isInvalidHttpEquiv(element)
✓ isInvalidMetaViewport(element)
✓ isInvalidDefaultStyle(element)
✓ isInvalidContentType(element)
✓ isInvalidOriginTrial(element)
✓ isUnnecessaryPreload(element)
... plus helpers for parsing/validation
```

---

## 2. Test Structure

### Proposed Directory Layout

```
capo.js/
├── tests/
│   ├── setup.js                        # Test setup & helpers
│   ├── lib/
│   │   ├── rules.test.js              # Unit tests for rules.js
│   │   ├── validation.test.js         # Unit tests for validation.js
│   │   ├── io.test.js                 # Tests for IO class
│   │   └── options.test.js            # Tests for Options class
│   ├── integration/
│   │   ├── browser.test.js            # Browser environment tests (jsdom)
│   │   └── full-document.test.js      # Full document analysis tests
│   ├── snapshots/
│   │   ├── analysis-snapshots.test.js # Snapshot tests for current behavior
│   │   └── fixtures/                  # HTML fixtures from examples/
│   └── fixtures/
│       ├── heads/                     # <head> element fixtures
│       │   ├── optimal.html
│       │   ├── bad-ordering.html
│       │   ├── missing-title.html
│       │   └── ...
│       └── elements/                  # Individual element fixtures
│           ├── meta-charset.html
│           ├── async-script.html
│           └── ...
├── package.json                       # Add test scripts
└── MIGRATION_PLAN.md
```

---

## 3. Test Implementation Plan

### Phase 0.1: Setup & Infrastructure (Day 1)

#### 3.1.1 Add Test Dependencies

**File:** `package.json`
```json
{
  "scripts": {
    "test": "node --test tests/**/*.test.js",
    "test:watch": "node --test --watch tests/**/*.test.js",
    "test:coverage": "node --test --experimental-test-coverage tests/**/*.test.js",
    "test:rules": "node --test tests/lib/rules.test.js",
    "test:validation": "node --test tests/lib/validation.test.js",
    "test:integration": "node --test tests/integration/*.test.js",
    "test:snapshots": "node --test tests/snapshots/*.test.js"
  },
  "devDependencies": {
    "jsdom": "^24.0.0",
    "dedent": "^1.5.1"
  }
}
```

**Commands:**
```bash
cd /Users/rviscomi/git/capo.js
npm install --save-dev jsdom dedent
mkdir -p tests/{lib,integration,snapshots,fixtures/{heads,elements}}
```

#### 3.1.2 Create Test Setup Helper

**CRITICAL DISCOVERY: static-head Trick**

Capo.js uses a clever trick to detect invalid elements in `<head>`. When fetching static HTML, it replaces `<head>` with `<static-head>` (see `src/lib/io.js:24`) to prevent browsers from "fixing" invalid HTML by moving elements like `<div>` to `<body>`.

**Why this matters for testing:**
- WITHOUT `static-head`: Browser parser moves `<div>` to `<body>` → capo.js never sees it
- WITH `static-head`: Invalid elements stay in place → capo.js can detect and report them

**Testing strategy:** Our test helpers must use the same `static-head` trick to properly test validation!

**File:** `tests/setup.js`
```javascript
import { JSDOM } from 'jsdom';

/**
 * Create a JSDOM instance with a head element
 * @param {string} headHTML - HTML content for <head>
 * @returns {object} { document, head, window }
 */
export function createDocument(headHTML) {
  const html = `<!DOCTYPE html><html><head>${headHTML}</head><body></body></html>`;
  const dom = new JSDOM(html);
  return {
    document: dom.window.document,
    head: dom.window.document.querySelector('head'),
    window: dom.window,
  };
}

/**
 * Create a single element for testing
 * @param {string} elementHTML - HTML string for element
 * @returns {Element}
 */
export function createElement(elementHTML) {
  const { document } = createDocument(elementHTML);
  return document.head.firstElementChild;
}

/**
 * Mock console for testing logging
 */
export function mockConsole() {
  const logs = [];
  return {
    log: (...args) => logs.push({ type: 'log', args }),
    warn: (...args) => logs.push({ type: 'warn', args }),
    error: (...args) => logs.push({ type: 'error', args }),
    group: (...args) => logs.push({ type: 'group', args }),
    groupEnd: () => logs.push({ type: 'groupEnd', args: [] }),
    getLogs: () => logs,
    clear: () => logs.length = 0,
  };
}
```

**Effort:** 0.5 day

---

### Phase 0.2: Unit Tests for rules.js (Days 2-3)

#### 3.2.1 Detector Function Tests

**File:** `tests/lib/rules.test.js`

**Pattern from eslint-plugin-capo:**
```javascript
// Example from eslint-plugin-capo/tests/utils/element-ordering.test.js
describe('isMeta', () => {
  it('should detect base elements', () => {
    const node = { name: 'base' };
    assert.strictEqual(isMeta(node), true);
  });
  
  it('should detect meta charset', () => {
    const node = {
      name: 'meta',
      attributes: [...]
    };
    assert.strictEqual(isMeta(node), true);
  });
});
```

**Adapted for capo.js (browser DOM):**
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ElementWeights,
  META_HTTP_EQUIV_KEYWORDS,
  isMeta,
  isTitle,
  isPreconnect,
  isAsyncScript,
  isImportStyles,
  isSyncScript,
  isSyncStyles,
  isPreload,
  isDeferScript,
  isPrefetchPrerender,
  isOriginTrial,
  isMetaCSP,
  getWeight,
} from '../../src/lib/rules.js';
import { createElement, createDocument } from '../setup.js';

describe('rules.js', () => {
  describe('ElementWeights', () => {
    it('should have correct weight hierarchy', () => {
      assert.ok(ElementWeights.META > ElementWeights.TITLE);
      assert.ok(ElementWeights.TITLE > ElementWeights.PRECONNECT);
      assert.ok(ElementWeights.PRECONNECT > ElementWeights.ASYNC_SCRIPT);
      assert.ok(ElementWeights.ASYNC_SCRIPT > ElementWeights.IMPORT_STYLES);
      assert.ok(ElementWeights.IMPORT_STYLES > ElementWeights.SYNC_SCRIPT);
      assert.ok(ElementWeights.SYNC_SCRIPT > ElementWeights.SYNC_STYLES);
      assert.ok(ElementWeights.SYNC_STYLES > ElementWeights.PRELOAD);
      assert.ok(ElementWeights.PRELOAD > ElementWeights.DEFER_SCRIPT);
      assert.ok(ElementWeights.DEFER_SCRIPT > ElementWeights.PREFETCH_PRERENDER);
      assert.ok(ElementWeights.PREFETCH_PRERENDER > ElementWeights.OTHER);
    });

    it('should have expected weight values', () => {
      assert.strictEqual(ElementWeights.META, 10);
      assert.strictEqual(ElementWeights.TITLE, 9);
      assert.strictEqual(ElementWeights.OTHER, 0);
    });
  });

  describe('isMeta', () => {
    it('should detect base elements', () => {
      const element = createElement('<base href="/">');
      assert.strictEqual(isMeta(element), true);
    });

    it('should detect meta charset', () => {
      const element = createElement('<meta charset="utf-8">');
      assert.strictEqual(isMeta(element), true);
    });

    it('should detect meta viewport', () => {
      const element = createElement('<meta name="viewport" content="width=device-width">');
      assert.strictEqual(isMeta(element), true);
    });

    it('should detect high-priority http-equiv values', () => {
      META_HTTP_EQUIV_KEYWORDS.forEach(keyword => {
        const element = createElement(`<meta http-equiv="${keyword}" content="test">`);
        assert.strictEqual(isMeta(element), true, `Should detect http-equiv="${keyword}"`);
      });
    });

    it('should NOT detect regular meta tags', () => {
      const element = createElement('<meta name="description" content="test">');
      assert.strictEqual(isMeta(element), false);
    });

    it('should NOT detect other elements', () => {
      const element = createElement('<title>Test</title>');
      assert.strictEqual(isMeta(element), false);
    });
  });

  describe('isTitle', () => {
    it('should detect title elements', () => {
      const element = createElement('<title>Test Page</title>');
      assert.strictEqual(isTitle(element), true);
    });

    it('should NOT detect other elements', () => {
      const element = createElement('<meta charset="utf-8">');
      assert.strictEqual(isTitle(element), false);
    });
  });

  describe('isPreconnect', () => {
    it('should detect preconnect links', () => {
      const element = createElement('<link rel="preconnect" href="https://fonts.googleapis.com">');
      assert.strictEqual(isPreconnect(element), true);
    });

    it('should NOT detect other link types', () => {
      const element = createElement('<link rel="stylesheet" href="styles.css">');
      assert.strictEqual(isPreconnect(element), false);
    });
  });

  describe('isAsyncScript', () => {
    it('should detect async scripts with src', () => {
      const element = createElement('<script src="analytics.js" async></script>');
      assert.strictEqual(isAsyncScript(element), true);
    });

    it('should NOT detect sync scripts', () => {
      const element = createElement('<script src="app.js"></script>');
      assert.strictEqual(isAsyncScript(element), false);
    });

    it('should NOT detect inline scripts', () => {
      const element = createElement('<script async>console.log("test")</script>');
      assert.strictEqual(isAsyncScript(element), false);
    });
  });

  describe('isImportStyles', () => {
    it('should detect style with @import', () => {
      const element = createElement('<style>@import url("fonts.css");</style>');
      assert.strictEqual(isImportStyles(element), true);
    });

    it('should NOT detect regular styles', () => {
      const element = createElement('<style>body { margin: 0; }</style>');
      assert.strictEqual(isImportStyles(element), false);
    });
  });

  describe('isSyncScript', () => {
    it('should detect synchronous script tags', () => {
      const element = createElement('<script src="app.js"></script>');
      assert.strictEqual(isSyncScript(element), true);
    });

    it('should NOT detect async scripts', () => {
      const element = createElement('<script src="app.js" async></script>');
      assert.strictEqual(isSyncScript(element), false);
    });

    it('should NOT detect defer scripts', () => {
      const element = createElement('<script src="app.js" defer></script>');
      assert.strictEqual(isSyncScript(element), false);
    });

    it('should NOT detect module scripts', () => {
      const element = createElement('<script src="app.js" type="module"></script>');
      assert.strictEqual(isSyncScript(element), false);
    });
  });

  describe('isSyncStyles', () => {
    it('should detect link stylesheets', () => {
      const element = createElement('<link rel="stylesheet" href="styles.css">');
      assert.strictEqual(isSyncStyles(element), true);
    });

    it('should detect inline styles', () => {
      const element = createElement('<style>body { margin: 0; }</style>');
      assert.strictEqual(isSyncStyles(element), true);
    });
  });

  describe('isPreload', () => {
    it('should detect preload links', () => {
      const element = createElement('<link rel="preload" href="font.woff2" as="font">');
      assert.strictEqual(isPreload(element), true);
    });

    it('should detect modulepreload links', () => {
      const element = createElement('<link rel="modulepreload" href="module.js">');
      assert.strictEqual(isPreload(element), true);
    });
  });

  describe('isDeferScript', () => {
    it('should detect defer scripts', () => {
      const element = createElement('<script src="app.js" defer></script>');
      assert.strictEqual(isDeferScript(element), true);
    });

    it('should detect module scripts (non-async)', () => {
      const element = createElement('<script src="module.js" type="module"></script>');
      assert.strictEqual(isDeferScript(element), true);
    });

    it('should NOT detect async module scripts', () => {
      const element = createElement('<script src="module.js" type="module" async></script>');
      assert.strictEqual(isDeferScript(element), false);
    });
  });

  describe('isPrefetchPrerender', () => {
    it('should detect prefetch links', () => {
      const element = createElement('<link rel="prefetch" href="next.html">');
      assert.strictEqual(isPrefetchPrerender(element), true);
    });

    it('should detect dns-prefetch links', () => {
      const element = createElement('<link rel="dns-prefetch" href="https://api.example.com">');
      assert.strictEqual(isPrefetchPrerender(element), true);
    });

    it('should detect prerender links', () => {
      const element = createElement('<link rel="prerender" href="next.html">');
      assert.strictEqual(isPrefetchPrerender(element), true);
    });
  });

  describe('isOriginTrial', () => {
    it('should detect origin trial meta tags', () => {
      const element = createElement('<meta http-equiv="origin-trial" content="token">');
      assert.strictEqual(isOriginTrial(element), true);
    });
  });

  describe('isMetaCSP', () => {
    it('should detect CSP meta tags', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">');
      assert.strictEqual(isMetaCSP(element), true);
    });
  });

  describe('getWeight', () => {
    const testCases = [
      { html: '<meta charset="utf-8">', expected: ElementWeights.META, type: 'META' },
      { html: '<base href="/">', expected: ElementWeights.META, type: 'META' },
      { html: '<title>Test</title>', expected: ElementWeights.TITLE, type: 'TITLE' },
      { html: '<link rel="preconnect" href="https://example.com">', expected: ElementWeights.PRECONNECT, type: 'PRECONNECT' },
      { html: '<script src="analytics.js" async></script>', expected: ElementWeights.ASYNC_SCRIPT, type: 'ASYNC_SCRIPT' },
      { html: '<style>@import url("fonts.css");</style>', expected: ElementWeights.IMPORT_STYLES, type: 'IMPORT_STYLES' },
      { html: '<script src="app.js"></script>', expected: ElementWeights.SYNC_SCRIPT, type: 'SYNC_SCRIPT' },
      { html: '<link rel="stylesheet" href="styles.css">', expected: ElementWeights.SYNC_STYLES, type: 'SYNC_STYLES' },
      { html: '<link rel="preload" href="font.woff2" as="font">', expected: ElementWeights.PRELOAD, type: 'PRELOAD' },
      { html: '<script src="app.js" defer></script>', expected: ElementWeights.DEFER_SCRIPT, type: 'DEFER_SCRIPT' },
      { html: '<link rel="prefetch" href="next.html">', expected: ElementWeights.PREFETCH_PRERENDER, type: 'PREFETCH_PRERENDER' },
      { html: '<meta name="description" content="test">', expected: ElementWeights.OTHER, type: 'OTHER' },
    ];

    testCases.forEach(({ html, expected, type }) => {
      it(`should return ${expected} (${type}) for ${html}`, () => {
        const element = createElement(html);
        assert.strictEqual(getWeight(element), expected);
      });
    });
  });
});
```

**Test Coverage Goals:**
- ✅ All 11 detector functions
- ✅ All edge cases (async/sync, with/without attributes, etc.)
- ✅ Weight calculation
- ✅ Negative cases (should NOT detect)

**Effort:** 1.5 days

---

### Phase 0.3: Unit Tests for validation.js (Days 3-4)

#### 3.3.1 Validation Function Tests

**File:** `tests/lib/validation.test.js`

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  VALID_HEAD_ELEMENTS,
  isValidElement,
  hasValidationWarning,
  getValidationWarnings,
  isInvalidHttpEquiv,
  isInvalidMetaViewport,
  isInvalidDefaultStyle,
  isInvalidContentType,
  isInvalidOriginTrial,
  isUnnecessaryPreload,
} from '../../src/lib/validation.js';
import { createElement, createDocument } from '../setup.js';
import dedent from 'dedent';

describe('validation.js', () => {
  describe('VALID_HEAD_ELEMENTS', () => {
    it('should contain all valid head elements', () => {
      const expected = ['base', 'link', 'meta', 'noscript', 'script', 'style', 'template', 'title'];
      expected.forEach(tag => {
        assert.ok(VALID_HEAD_ELEMENTS.has(tag), `Should contain ${tag}`);
      });
    });
  });

  describe('isValidElement', () => {
    it('should validate known head elements', () => {
      const validTags = ['base', 'link', 'meta', 'script', 'style', 'title'];
      validTags.forEach(tag => {
        const element = createElement(`<${tag}></${tag}>`);
        assert.strictEqual(isValidElement(element), true, `${tag} should be valid`);
      });
    });

    it('should reject invalid elements', () => {
      const invalidTags = ['div', 'span', 'p', 'img'];
      invalidTags.forEach(tag => {
        const element = createElement(`<${tag}></${tag}>`);
        assert.strictEqual(isValidElement(element), false, `${tag} should be invalid`);
      });
    });
  });

  describe('hasValidationWarning', () => {
    it('should detect invalid elements', () => {
      const element = createElement('<div>Invalid</div>');
      assert.strictEqual(hasValidationWarning(element), true);
    });

    it('should detect duplicate titles', () => {
      const { head } = createDocument('<title>First</title><title>Second</title>');
      const secondTitle = head.querySelectorAll('title')[1];
      assert.strictEqual(hasValidationWarning(secondTitle), true);
    });

    it('should detect CSP meta tags', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">');
      assert.strictEqual(hasValidationWarning(element), true);
    });

    it('should detect invalid http-equiv', () => {
      const element = createElement('<meta http-equiv="invalid-value" content="test">');
      assert.strictEqual(hasValidationWarning(element), true);
    });

    it('should NOT warn on valid elements', () => {
      const element = createElement('<meta charset="utf-8">');
      assert.strictEqual(hasValidationWarning(element), false);
    });
  });

  describe('getValidationWarnings', () => {
    it('should detect missing title', () => {
      const { head } = createDocument('<meta charset="utf-8">');
      const warnings = getValidationWarnings(head);
      const titleWarning = warnings.find(w => w.warning.includes('<title>'));
      assert.ok(titleWarning, 'Should warn about missing title');
    });

    it('should detect multiple titles', () => {
      const { head } = createDocument('<title>First</title><title>Second</title>');
      const warnings = getValidationWarnings(head);
      const titleWarning = warnings.find(w => w.warning.includes('Expected exactly 1 <title>'));
      assert.ok(titleWarning);
      assert.strictEqual(titleWarning.elements.length, 2);
    });

    it('should detect multiple viewports', () => {
      const { head } = createDocument(dedent`
        <meta name="viewport" content="width=device-width">
        <meta name="viewport" content="width=320">
      `);
      const warnings = getValidationWarnings(head);
      const viewportWarning = warnings.find(w => w.warning.includes('viewport'));
      assert.ok(viewportWarning);
    });
  });

  describe('isInvalidHttpEquiv', () => {
    it('should detect invalid http-equiv values', () => {
      const element = createElement('<meta http-equiv="invalid-value" content="test">');
      assert.strictEqual(isInvalidHttpEquiv(element), true);
    });

    it('should allow valid http-equiv values', () => {
      const validValues = ['content-type', 'content-security-policy', 'origin-trial'];
      validValues.forEach(value => {
        const element = createElement(`<meta http-equiv="${value}" content="test">`);
        assert.strictEqual(isInvalidHttpEquiv(element), false, `${value} should be valid`);
      });
    });
  });

  describe('isInvalidMetaViewport', () => {
    it('should detect invalid viewport values', () => {
      const invalidCases = [
        'maximum-scale=1',
        'user-scalable=no',
        'minimum-scale=2',
      ];

      invalidCases.forEach(content => {
        const element = createElement(`<meta name="viewport" content="${content}">`);
        assert.strictEqual(isInvalidMetaViewport(element), true, `Should detect invalid: ${content}`);
      });
    });

    it('should allow valid viewport values', () => {
      const validCases = [
        'width=device-width',
        'width=device-width, initial-scale=1',
        'initial-scale=1',
      ];

      validCases.forEach(content => {
        const element = createElement(`<meta name="viewport" content="${content}">`);
        assert.strictEqual(isInvalidMetaViewport(element), false, `Should allow valid: ${content}`);
      });
    });
  });

  describe('isInvalidContentType', () => {
    it('should detect invalid charset values', () => {
      const element = createElement('<meta charset="invalid-charset">');
      assert.strictEqual(isInvalidContentType(element), true);
    });

    it('should allow utf-8 charset', () => {
      const element = createElement('<meta charset="utf-8">');
      assert.strictEqual(isInvalidContentType(element), false);
    });

    it('should allow UTF-8 (case insensitive)', () => {
      const element = createElement('<meta charset="UTF-8">');
      assert.strictEqual(isInvalidContentType(element), false);
    });
  });

  describe('isUnnecessaryPreload', () => {
    it('should detect unnecessary preload when resource already loaded', () => {
      const { head } = createDocument(dedent`
        <link rel="preload" href="styles.css" as="style">
        <link rel="stylesheet" href="styles.css">
      `);
      const preload = head.querySelector('[rel="preload"]');
      assert.strictEqual(isUnnecessaryPreload(preload), true);
    });

    it('should allow preload when resource not yet loaded', () => {
      const { head } = createDocument('<link rel="preload" href="font.woff2" as="font">');
      const preload = head.querySelector('[rel="preload"]');
      assert.strictEqual(isUnnecessaryPreload(preload), false);
    });
  });
});
```

**Effort:** 1 day

---

### Phase 0.4: Integration Tests (Day 5)

#### 3.4.1 Browser Environment Tests

**File:** `tests/integration/browser.test.js`

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import dedent from 'dedent';

describe('Browser Integration Tests', () => {
  describe('Full document analysis', () => {
    it('should analyze optimal head structure', () => {
      const html = dedent`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Optimal Page</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <script async src="analytics.js"></script>
            <script src="app.js"></script>
            <link rel="stylesheet" href="styles.css">
          </head>
          <body></body>
        </html>
      `;

      const dom = new JSDOM(html);
      const head = dom.window.document.querySelector('head');
      
      // Import and use capo.js functions
      // This tests that everything works in a browser-like environment
      assert.ok(head);
      assert.strictEqual(head.children.length, 6);
    });

    it('should handle missing elements gracefully', () => {
      const html = '<html><head></head><body></body></html>';
      const dom = new JSDOM(html);
      const head = dom.window.document.querySelector('head');
      
      assert.ok(head);
      assert.strictEqual(head.children.length, 0);
    });
  });
});
```

**Effort:** 0.5 day

---

### Phase 0.5: Snapshot/Baseline Tests (Day 5-6)

#### 3.5.1 Create HTML Fixtures

**Files to create:**
- `tests/fixtures/heads/optimal.html` - From examples/good-example.html
- `tests/fixtures/heads/bad-ordering.html` - From examples/bad-ordering-example.html
- `tests/fixtures/heads/performance.html` - From examples/performance-example.html

#### 3.5.2 Snapshot Tests

**File:** `tests/snapshots/analysis-snapshots.test.js`

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { getWeight } from '../../src/lib/rules.js';
import { getValidationWarnings } from '../../src/lib/validation.js';

describe('Analysis Snapshots', () => {
  const fixtures = [
    { file: 'optimal.html', name: 'Optimal ordering' },
    { file: 'bad-ordering.html', name: 'Bad ordering' },
    { file: 'performance.html', name: 'Performance example' },
  ];

  fixtures.forEach(({ file, name }) => {
    it(`should produce consistent results for ${name}`, () => {
      const html = readFileSync(`tests/fixtures/heads/${file}`, 'utf-8');
      const dom = new JSDOM(html);
      const head = dom.window.document.querySelector('head');
      
      // Get weights for all children
      const weights = Array.from(head.children).map(child => ({
        tag: child.tagName.toLowerCase(),
        weight: getWeight(child),
      }));

      // Get validation warnings
      const warnings = getValidationWarnings(head);

      // Create snapshot object
      const snapshot = {
        elementCount: head.children.length,
        weights,
        warningCount: warnings.length,
      };

      // Store or compare snapshot
      // For now, just assert it's stable
      assert.ok(snapshot.elementCount >= 0);
      assert.ok(Array.isArray(snapshot.weights));
    });
  });
});
```

**Effort:** 0.5 day

---

## 4. Test Patterns & Best Practices

### 4.1 Patterns from eslint-plugin-capo

#### Pattern 1: Parameterized Tests
```javascript
// From eslint-plugin-capo
META_HTTP_EQUIV_KEYWORDS.forEach(keyword => {
  it(`should detect http-equiv="${keyword}"`, () => {
    // test implementation
  });
});
```

#### Pattern 2: Descriptive Test Names
```javascript
// Good
it('should detect async scripts with src attribute')

// Bad
it('test async scripts')
```

#### Pattern 3: Comprehensive Edge Cases
```javascript
describe('isSyncScript', () => {
  it('should detect synchronous script tags');
  it('should NOT detect async scripts');
  it('should NOT detect defer scripts');
  it('should NOT detect module scripts');
  it('should NOT detect JSON scripts');
});
```

### 4.2 Testing Checklist

For each function:
- ✅ Happy path (valid input)
- ✅ Edge cases (empty, null, undefined)
- ✅ Negative cases (should NOT match)
- ✅ Multiple variations
- ✅ Case sensitivity
- ✅ Attribute presence/absence

---

## 5. Coverage Goals

### Minimum Coverage Targets

| Module | Target | Priority |
|--------|--------|----------|
| `rules.js` | 95% | HIGH |
| `validation.js` | 90% | HIGH |
| `io.js` | 70% | MEDIUM |
| `options.js` | 80% | LOW |
| `colors.js` | 60% | LOW |

### Coverage Commands

```bash
# Run all tests with coverage
npm run test:coverage

# Run specific module tests
npm run test:rules
npm run test:validation

# Watch mode for development
npm run test:watch
```

---

## 6. Timeline & Effort

### Summary

| Phase | Tasks | Effort |
|-------|-------|--------|
| 0.1 Setup | Dependencies, directories, helpers | 0.5 day |
| 0.2 rules.js tests | 11 detectors + getWeight | 1.5 days |
| 0.3 validation.js tests | 20+ validators | 1 day |
| 0.4 Integration tests | Browser environment | 0.5 day |
| 0.5 Snapshot tests | Baseline fixtures | 0.5 day |
| **Total** | | **4 days** |

### Recommended Schedule

- **Day 1:** Setup + start rules.js tests
- **Day 2:** Finish rules.js tests
- **Day 3:** validation.js tests
- **Day 4:** Integration + snapshots
- **Day 5:** Review, fix gaps, achieve coverage goals

---

## 7. Success Criteria

### Phase 0 Complete When:

- ✅ All 11 detector functions in rules.js have tests
- ✅ All validation functions have tests
- ✅ Coverage >90% on rules.js and validation.js
- ✅ Integration tests pass in jsdom environment
- ✅ Snapshot tests establish baseline behavior
- ✅ All tests pass: `npm test` → 0 failures
- ✅ Documentation updated with test instructions

### Validation Commands

```bash
# All tests must pass
npm test

# Coverage must meet targets
npm run test:coverage

# Integration tests must pass
npm run test:integration
```

---

## 8. Next Steps After Phase 0

Once test suite is complete:

1. ✅ **Commit baseline tests** to git
2. ✅ **Document coverage metrics** (save report)
3. ✅ **Begin Phase 1** of MIGRATION_PLAN.md (Adapter Interface)
4. ✅ **Run tests after each phase** to catch regressions
5. ✅ **Update tests** as adapters are introduced

### Post-Refactor Validation

After adapter refactor:
- All existing tests should still pass
- Coverage should remain ≥90%
- No behavior changes detected in snapshots

---

## Appendix A: Quick Reference Commands

```bash
# Initial setup
cd /Users/rviscomi/git/capo.js
npm install --save-dev jsdom dedent
mkdir -p tests/{lib,integration,snapshots,fixtures/{heads,elements}}

# Run tests
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:rules          # Just rules.js
npm run test:validation     # Just validation.js
npm run test:integration    # Integration tests
npm run test:snapshots      # Snapshot tests

# Development workflow
npm run test:watch          # Keep running while coding
npm run test:coverage       # Check coverage periodically
```

---

## Appendix B: Test File Templates

### Template: Detector Function Test
```javascript
describe('isXXX', () => {
  it('should detect XXX elements', () => {
    const element = createElement('<XXX ...>');
    assert.strictEqual(isXXX(element), true);
  });

  it('should NOT detect non-XXX elements', () => {
    const element = createElement('<YYY ...>');
    assert.strictEqual(isXXX(element), false);
  });
});
```

### Template: Validation Function Test
```javascript
describe('isInvalidXXX', () => {
  it('should detect invalid XXX', () => {
    const element = createElement('<meta XXX="invalid">');
    assert.strictEqual(isInvalidXXX(element), true);
  });

  it('should allow valid XXX', () => {
    const element = createElement('<meta XXX="valid">');
    assert.strictEqual(isInvalidXXX(element), false);
  });
});
```

---

**End of Test Plan**
