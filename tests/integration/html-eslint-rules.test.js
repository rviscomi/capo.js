/**
 * Integration tests for rules.js with HtmlEslintAdapter
 * Ensures detector functions and weight calculation work with @html-eslint/parser AST nodes
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseForESLint } from '@html-eslint/parser';
import { HtmlEslintAdapter } from '../../src/adapters/html-eslint.js';
import {
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
  getWeight,
  ElementWeights,
} from '../../src/lib/rules.js';

describe('HtmlEslintAdapter Integration - rules.js', () => {
  const adapter = new HtmlEslintAdapter();

  /**
   * Helper to parse HTML and extract the first child element from <head>
   */
  function parseElement(html) {
    const fullHtml = `<!DOCTYPE html><html><head>${html}</head></html>`;
    const { ast } = parseForESLint(fullHtml);
    const htmlNode = ast.body[0].children.find(n => n.name === 'html');
    const headNode = htmlNode.children.find(n => n.name === 'head');
    const children = adapter.getChildren(headNode);
    return children[0];
  }

  describe('isMeta', () => {
    it('should detect meta charset', () => {
      const element = parseElement('<meta charset="utf-8">');
      assert.equal(isMeta(element, adapter), true);
    });

    it('should detect meta viewport', () => {
      const element = parseElement('<meta name="viewport" content="width=device-width">');
      assert.equal(isMeta(element, adapter), true);
    });

    it('should detect CSP meta tag', () => {
      const element = parseElement('<meta http-equiv="content-security-policy" content="default-src \'self\'">');
      assert.equal(isMeta(element, adapter), true);
    });

    it('should detect origin-trial meta tag', () => {
      const element = parseElement('<meta http-equiv="origin-trial" content="token123">');
      assert.equal(isMeta(element, adapter), true);
    });

    it('should detect base element', () => {
      const element = parseElement('<base href="https://example.com/">');
      assert.equal(isMeta(element, adapter), true);
    });

    it('should NOT detect regular meta tags', () => {
      const element = parseElement('<meta name="description" content="test">');
      assert.equal(isMeta(element, adapter), false);
    });
  });

  describe('isTitle', () => {
    it('should detect title element', () => {
      const element = parseElement('<title>Test Page</title>');
      assert.equal(isTitle(element, adapter), true);
    });

    it('should NOT detect other elements', () => {
      const element = parseElement('<meta charset="utf-8">');
      assert.equal(isTitle(element, adapter), false);
    });
  });

  describe('isPreconnect', () => {
    it('should detect preconnect links', () => {
      const element = parseElement('<link rel="preconnect" href="https://example.com">');
      assert.equal(isPreconnect(element, adapter), true);
    });

    it('should NOT detect other link types', () => {
      const element = parseElement('<link rel="stylesheet" href="styles.css">');
      assert.equal(isPreconnect(element, adapter), false);
    });
  });

  describe('isAsyncScript', () => {
    it('should detect async scripts with src', () => {
      const element = parseElement('<script src="analytics.js" async></script>');
      assert.equal(isAsyncScript(element, adapter), true);
    });

    it('should NOT detect sync scripts', () => {
      const element = parseElement('<script src="app.js"></script>');
      assert.equal(isAsyncScript(element, adapter), false);
    });

    it('should NOT detect inline async scripts', () => {
      const element = parseElement('<script async>console.log("test");</script>');
      assert.equal(isAsyncScript(element, adapter), false);
    });
  });

  describe('isImportStyles', () => {
    it('should detect style with @import', () => {
      const element = parseElement('<style>@import url("fonts.css");</style>');
      assert.equal(isImportStyles(element, adapter), true);
    });

    it('should NOT detect regular styles', () => {
      const element = parseElement('<style>body { margin: 0; }</style>');
      assert.equal(isImportStyles(element, adapter), false);
    });
  });

  describe('isSyncScript', () => {
    it('should detect synchronous external scripts', () => {
      const element = parseElement('<script src="app.js"></script>');
      assert.equal(isSyncScript(element, adapter), true);
    });

    it('should detect inline scripts', () => {
      const element = parseElement('<script>console.log("test");</script>');
      assert.equal(isSyncScript(element, adapter), true);
    });

    it('should NOT detect async scripts', () => {
      const element = parseElement('<script src="app.js" async></script>');
      assert.equal(isSyncScript(element, adapter), false);
    });

    it('should NOT detect defer scripts', () => {
      const element = parseElement('<script src="app.js" defer></script>');
      assert.equal(isSyncScript(element, adapter), false);
    });

    it('should NOT detect module scripts', () => {
      const element = parseElement('<script src="app.js" type="module"></script>');
      assert.equal(isSyncScript(element, adapter), false);
    });
  });

  describe('isSyncStyles', () => {
    it('should detect stylesheet links', () => {
      const element = parseElement('<link rel="stylesheet" href="styles.css">');
      assert.equal(isSyncStyles(element, adapter), true);
    });

    it('should detect inline styles', () => {
      const element = parseElement('<style>body { margin: 0; }</style>');
      assert.equal(isSyncStyles(element, adapter), true);
    });

    it('should NOT detect preload links', () => {
      const element = parseElement('<link rel="preload" href="font.woff2" as="font">');
      assert.equal(isSyncStyles(element, adapter), false);
    });
  });

  describe('isPreload', () => {
    it('should detect preload links', () => {
      const element = parseElement('<link rel="preload" href="font.woff2" as="font">');
      assert.equal(isPreload(element, adapter), true);
    });

    it('should detect modulepreload links', () => {
      const element = parseElement('<link rel="modulepreload" href="module.js">');
      assert.equal(isPreload(element, adapter), true);
    });

    it('should NOT detect stylesheet links', () => {
      const element = parseElement('<link rel="stylesheet" href="styles.css">');
      assert.equal(isPreload(element, adapter), false);
    });
  });

  describe('isDeferScript', () => {
    it('should detect defer scripts', () => {
      const element = parseElement('<script src="app.js" defer></script>');
      assert.equal(isDeferScript(element, adapter), true);
    });

    it('should detect module scripts without async', () => {
      const element = parseElement('<script src="module.js" type="module"></script>');
      assert.equal(isDeferScript(element, adapter), true);
    });

    it('should NOT detect async module scripts', () => {
      const element = parseElement('<script src="module.js" type="module" async></script>');
      assert.equal(isDeferScript(element, adapter), false);
    });

    it('should NOT detect sync scripts', () => {
      const element = parseElement('<script src="app.js"></script>');
      assert.equal(isDeferScript(element, adapter), false);
    });
  });

  describe('isPrefetchPrerender', () => {
    it('should detect prefetch links', () => {
      const element = parseElement('<link rel="prefetch" href="next.html">');
      assert.equal(isPrefetchPrerender(element, adapter), true);
    });

    it('should detect dns-prefetch links', () => {
      const element = parseElement('<link rel="dns-prefetch" href="https://api.example.com">');
      assert.equal(isPrefetchPrerender(element, adapter), true);
    });

    it('should detect prerender links', () => {
      const element = parseElement('<link rel="prerender" href="next.html">');
      assert.equal(isPrefetchPrerender(element, adapter), true);
    });

    it('should NOT detect preconnect links', () => {
      const element = parseElement('<link rel="preconnect" href="https://example.com">');
      assert.equal(isPrefetchPrerender(element, adapter), false);
    });
  });

  describe('getWeight', () => {
    it('should return 10 (META) for meta charset', () => {
      const element = parseElement('<meta charset="utf-8">');
      assert.equal(getWeight(element, adapter), ElementWeights.META);
    });

    it('should return 10 (META) for meta viewport', () => {
      const element = parseElement('<meta name="viewport" content="width=device-width">');
      assert.equal(getWeight(element, adapter), ElementWeights.META);
    });

    it('should return 10 (META) for base', () => {
      const element = parseElement('<base href="/">');
      assert.equal(getWeight(element, adapter), ElementWeights.META);
    });

    it('should return 9 (TITLE) for title', () => {
      const element = parseElement('<title>Test</title>');
      assert.equal(getWeight(element, adapter), ElementWeights.TITLE);
    });

    it('should return 8 (PRECONNECT) for preconnect', () => {
      const element = parseElement('<link rel="preconnect" href="https://example.com">');
      assert.equal(getWeight(element, adapter), ElementWeights.PRECONNECT);
    });

    it('should return 7 (ASYNC_SCRIPT) for async script', () => {
      const element = parseElement('<script src="analytics.js" async></script>');
      assert.equal(getWeight(element, adapter), ElementWeights.ASYNC_SCRIPT);
    });

    it('should return 6 (IMPORT_STYLES) for style with @import', () => {
      const element = parseElement('<style>@import url("fonts.css");</style>');
      assert.equal(getWeight(element, adapter), ElementWeights.IMPORT_STYLES);
    });

    it('should return 5 (SYNC_SCRIPT) for sync script', () => {
      const element = parseElement('<script src="app.js"></script>');
      assert.equal(getWeight(element, adapter), ElementWeights.SYNC_SCRIPT);
    });

    it('should return 4 (SYNC_STYLES) for stylesheet', () => {
      const element = parseElement('<link rel="stylesheet" href="styles.css">');
      assert.equal(getWeight(element, adapter), ElementWeights.SYNC_STYLES);
    });

    it('should return 3 (PRELOAD) for preload', () => {
      const element = parseElement('<link rel="preload" href="font.woff2" as="font">');
      assert.equal(getWeight(element, adapter), ElementWeights.PRELOAD);
    });

    it('should return 2 (DEFER_SCRIPT) for defer script', () => {
      const element = parseElement('<script src="app.js" defer></script>');
      assert.equal(getWeight(element, adapter), ElementWeights.DEFER_SCRIPT);
    });

    it('should return 1 (PREFETCH_PRERENDER) for prefetch', () => {
      const element = parseElement('<link rel="prefetch" href="next.html">');
      assert.equal(getWeight(element, adapter), ElementWeights.PREFETCH_PRERENDER);
    });

    it('should return 0 (OTHER) for description meta', () => {
      const element = parseElement('<meta name="description" content="test">');
      assert.equal(getWeight(element, adapter), ElementWeights.OTHER);
    });

    it('should return 0 (OTHER) for icon link', () => {
      const element = parseElement('<link rel="icon" href="favicon.ico">');
      assert.equal(getWeight(element, adapter), ElementWeights.OTHER);
    });
  });
});
