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
  getHeadWeights,
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
      assert.strictEqual(ElementWeights.PRECONNECT, 8);
      assert.strictEqual(ElementWeights.ASYNC_SCRIPT, 7);
      assert.strictEqual(ElementWeights.IMPORT_STYLES, 6);
      assert.strictEqual(ElementWeights.SYNC_SCRIPT, 5);
      assert.strictEqual(ElementWeights.SYNC_STYLES, 4);
      assert.strictEqual(ElementWeights.PRELOAD, 3);
      assert.strictEqual(ElementWeights.DEFER_SCRIPT, 2);
      assert.strictEqual(ElementWeights.PREFETCH_PRERENDER, 1);
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

    it('should NOT detect other elements', () => {
      const element = createElement('<meta charset="utf-8">');
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

    it('should NOT detect inline async scripts (no src)', () => {
      const element = createElement('<script async>console.log("test")</script>');
      assert.strictEqual(isAsyncScript(element), false);
    });

    it('should NOT detect defer scripts', () => {
      const element = createElement('<script src="app.js" defer></script>');
      assert.strictEqual(isAsyncScript(element), false);
    });
  });

  describe('isImportStyles', () => {
    it('should detect style with @import', () => {
      const element = createElement('<style>@import url("fonts.css");</style>');
      assert.strictEqual(isImportStyles(element), true);
    });

    it('should detect style with @import in middle of content', () => {
      const element = createElement('<style>body { margin: 0; } @import url("fonts.css"); p { color: red; }</style>');
      assert.strictEqual(isImportStyles(element), true);
    });

    it('should NOT detect regular styles', () => {
      const element = createElement('<style>body { margin: 0; }</style>');
      assert.strictEqual(isImportStyles(element), false);
    });

    it('should NOT detect empty styles', () => {
      const element = createElement('<style></style>');
      assert.strictEqual(isImportStyles(element), false);
    });

    it('should NOT detect link stylesheets', () => {
      const element = createElement('<link rel="stylesheet" href="styles.css">');
      assert.strictEqual(isImportStyles(element), false);
    });
  });

  describe('isSyncScript', () => {
    it('should detect synchronous script tags', () => {
      const element = createElement('<script src="app.js"></script>');
      assert.strictEqual(isSyncScript(element), true);
    });

    it('should detect inline scripts', () => {
      const element = createElement('<script>console.log("test")</script>');
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

    it('should NOT detect JSON scripts', () => {
      const element = createElement('<script type="application/json">{"key": "value"}</script>');
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

    it('should detect styles with @import', () => {
      const element = createElement('<style>@import url("fonts.css");</style>');
      assert.strictEqual(isSyncStyles(element), true);
    });

    it('should NOT detect preload links', () => {
      const element = createElement('<link rel="preload" href="font.woff2" as="font">');
      assert.strictEqual(isSyncStyles(element), false);
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

    it('should NOT detect stylesheet links', () => {
      const element = createElement('<link rel="stylesheet" href="styles.css">');
      assert.strictEqual(isPreload(element), false);
    });

    it('should NOT detect preconnect links', () => {
      const element = createElement('<link rel="preconnect" href="https://fonts.googleapis.com">');
      assert.strictEqual(isPreload(element), false);
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

    it('should NOT detect sync scripts', () => {
      const element = createElement('<script src="app.js"></script>');
      assert.strictEqual(isDeferScript(element), false);
    });

    it('should NOT detect inline scripts', () => {
      const element = createElement('<script>console.log("test")</script>');
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

    it('should NOT detect preconnect links', () => {
      const element = createElement('<link rel="preconnect" href="https://fonts.googleapis.com">');
      assert.strictEqual(isPrefetchPrerender(element), false);
    });

    it('should NOT detect preload links', () => {
      const element = createElement('<link rel="preload" href="font.woff2" as="font">');
      assert.strictEqual(isPrefetchPrerender(element), false);
    });
  });

  describe('isOriginTrial', () => {
    it('should detect origin trial meta tags', () => {
      const element = createElement('<meta http-equiv="origin-trial" content="token">');
      assert.strictEqual(isOriginTrial(element), true);
    });

    it('should detect origin trial with case variations', () => {
      const element = createElement('<meta http-equiv="Origin-Trial" content="token">');
      assert.strictEqual(isOriginTrial(element), true);
    });

    it('should NOT detect other http-equiv values', () => {
      const element = createElement('<meta http-equiv="content-type" content="text/html">');
      assert.strictEqual(isOriginTrial(element), false);
    });
  });

  describe('isMetaCSP', () => {
    it('should detect CSP meta tags', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">');
      assert.strictEqual(isMetaCSP(element), true);
    });

    it('should detect CSP report-only meta tags', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy-Report-Only" content="default-src \'self\'">');
      assert.strictEqual(isMetaCSP(element), true);
    });

    it('should detect CSP with case variations', () => {
      const element = createElement('<meta http-equiv="content-security-policy" content="default-src \'self\'">');
      assert.strictEqual(isMetaCSP(element), true);
    });

    it('should NOT detect other meta tags', () => {
      const element = createElement('<meta charset="utf-8">');
      assert.strictEqual(isMetaCSP(element), false);
    });
  });

  describe('getWeight', () => {
    const testCases = [
      { html: '<meta charset="utf-8">', expected: ElementWeights.META, type: 'META' },
      { html: '<base href="/">', expected: ElementWeights.META, type: 'META (base)' },
      { html: '<meta name="viewport" content="width=device-width">', expected: ElementWeights.META, type: 'META (viewport)' },
      { html: '<title>Test</title>', expected: ElementWeights.TITLE, type: 'TITLE' },
      { html: '<link rel="preconnect" href="https://example.com">', expected: ElementWeights.PRECONNECT, type: 'PRECONNECT' },
      { html: '<script src="analytics.js" async></script>', expected: ElementWeights.ASYNC_SCRIPT, type: 'ASYNC_SCRIPT' },
      { html: '<style>@import url("fonts.css");</style>', expected: ElementWeights.IMPORT_STYLES, type: 'IMPORT_STYLES' },
      { html: '<script src="app.js"></script>', expected: ElementWeights.SYNC_SCRIPT, type: 'SYNC_SCRIPT' },
      { html: '<link rel="stylesheet" href="styles.css">', expected: ElementWeights.SYNC_STYLES, type: 'SYNC_STYLES' },
      { html: '<style>body { margin: 0; }</style>', expected: ElementWeights.SYNC_STYLES, type: 'SYNC_STYLES (inline)' },
      { html: '<link rel="preload" href="font.woff2" as="font">', expected: ElementWeights.PRELOAD, type: 'PRELOAD' },
      { html: '<script src="app.js" defer></script>', expected: ElementWeights.DEFER_SCRIPT, type: 'DEFER_SCRIPT' },
      { html: '<script src="module.js" type="module"></script>', expected: ElementWeights.DEFER_SCRIPT, type: 'DEFER_SCRIPT (module)' },
      { html: '<link rel="prefetch" href="next.html">', expected: ElementWeights.PREFETCH_PRERENDER, type: 'PREFETCH_PRERENDER' },
      { html: '<meta name="description" content="test">', expected: ElementWeights.OTHER, type: 'OTHER' },
      { html: '<link rel="icon" href="favicon.ico">', expected: ElementWeights.OTHER, type: 'OTHER (icon)' },
    ];

    testCases.forEach(({ html, expected, type }) => {
      it(`should return ${expected} (${type}) for ${html}`, () => {
        const element = createElement(html);
        assert.strictEqual(getWeight(element), expected);
      });
    });
  });

  describe('getHeadWeights', () => {
    it('should return weights for all children', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <title>Test</title>
        <script src="app.js"></script>
      `);

      const weights = getHeadWeights(head);
      
      assert.strictEqual(weights.length, 3);
      assert.strictEqual(weights[0].weight, ElementWeights.META);
      assert.strictEqual(weights[1].weight, ElementWeights.TITLE);
      assert.strictEqual(weights[2].weight, ElementWeights.SYNC_SCRIPT);
    });

    it('should return empty array for empty head', () => {
      const { head } = createDocument('');
      const weights = getHeadWeights(head);
      assert.strictEqual(weights.length, 0);
    });

    it('should include element references', () => {
      const { head } = createDocument('<meta charset="utf-8">');
      const weights = getHeadWeights(head);
      
      assert.strictEqual(weights.length, 1);
      assert.ok(weights[0].element);
      assert.strictEqual(weights[0].element.tagName.toLowerCase(), 'meta');
    });
  });
});
