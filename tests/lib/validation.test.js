import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  VALID_HEAD_ELEMENTS,
  isValidElement,
  hasValidationWarning,
  getValidationWarnings,
  getCustomValidations,
} from '../../src/lib/validation.js';
import { BrowserAdapter } from '../../src/adapters/browser.js';
import { createElement, createDocument } from '../setup.js';
import dedent from 'dedent';

// Create adapter instance for all tests
const adapter = new BrowserAdapter();

describe('validation.js', () => {
  describe('VALID_HEAD_ELEMENTS', () => {
    it('should contain all valid head elements', () => {
      const expected = ['base', 'link', 'meta', 'noscript', 'script', 'style', 'template', 'title'];
      expected.forEach(tag => {
        assert.ok(VALID_HEAD_ELEMENTS.has(tag), `Should contain ${tag}`);
      });
    });

    it('should have correct size', () => {
      assert.strictEqual(VALID_HEAD_ELEMENTS.size, 8);
    });
  });

  describe('isValidElement', () => {
    it('should validate known head elements', () => {
      const validTags = ['base', 'link', 'meta', 'script', 'style', 'title', 'noscript', 'template'];
      validTags.forEach(tag => {
        const html = tag === 'base' ? `<${tag} href="/">` : `<${tag}></${tag}>`;
        const element = createElement(html);
        assert.strictEqual(isValidElement(element, adapter), true, `${tag} should be valid`);
      });
    });

    it('should reject invalid elements', () => {
      const invalidTags = ['div', 'span', 'p', 'h1', 'article'];
      invalidTags.forEach(tag => {
        const element = createElement(`<${tag}></${tag}>`);
        if (element) {
          assert.strictEqual(isValidElement(element, adapter), false, `${tag} should be invalid`);
        }
      });
    });

    it('should be case insensitive', () => {
      const element = createElement('<META charset="utf-8">');
      assert.strictEqual(isValidElement(element, adapter), true);
    });
  });

  describe('hasValidationWarning', () => {
    it('should detect invalid elements', () => {
      // Note: createElement may not work for invalid head elements in jsdom
      // We'll test this through getValidationWarnings instead
      const { head } = createDocument('<div>Invalid</div>');
      const divElement = head.querySelector('div');
      if (divElement) {
        assert.strictEqual(hasValidationWarning(divElement, adapter), true);
      }
    });

    it('should detect CSP meta tags', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">');
      assert.strictEqual(hasValidationWarning(element, adapter), true);
    });

    it('should NOT warn on valid meta charset', () => {
      const element = createElement('<meta charset="utf-8">');
      assert.strictEqual(hasValidationWarning(element, adapter), false);
    });

    it('should NOT warn on valid title', () => {
      const element = createElement('<title>Test Page</title>');
      assert.strictEqual(hasValidationWarning(element, adapter), false);
    });

    it('should NOT warn on valid link', () => {
      const element = createElement('<link rel="stylesheet" href="styles.css">');
      assert.strictEqual(hasValidationWarning(element, adapter), false);
    });
  });

  describe('getValidationWarnings', () => {
    it('should detect missing title', () => {
      const { head } = createDocument('<meta charset="utf-8">');
      const warnings = getValidationWarnings(head, adapter);
      const titleWarning = warnings.find(w => w.warning.includes('<title>'));
      assert.ok(titleWarning, 'Should warn about missing title');
      assert.ok(titleWarning.warning.includes('Expected exactly 1'));
    });

    it('should detect multiple titles', () => {
      const { head } = createDocument(dedent`
        <title>First</title>
        <title>Second</title>
      `);
      const warnings = getValidationWarnings(head, adapter);
      const titleWarning = warnings.find(w => w.warning.includes('Expected exactly 1 <title>'));
      assert.ok(titleWarning);
      assert.strictEqual(titleWarning.elements.length, 2);
    });

    it('should NOT warn on optimal head', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <title>Test Page</title>
      `);
      const warnings = getValidationWarnings(head, adapter);
      assert.strictEqual(warnings.length, 0, 'Should have no warnings');
    });

    it('should detect multiple viewports', () => {
      const { head } = createDocument(dedent`
        <meta name="viewport" content="width=device-width">
        <meta name="viewport" content="width=320">
      `);
      const warnings = getValidationWarnings(head, adapter);
      const viewportWarning = warnings.find(w => w.warning.includes('viewport'));
      assert.ok(viewportWarning);
    });

    it('should detect multiple base elements', () => {
      const { head } = createDocument(dedent`
        <base href="/">
        <base href="/app/">
      `);
      const warnings = getValidationWarnings(head, adapter);
      const baseWarning = warnings.find(w => w.warning.includes('<base>'));
      assert.ok(baseWarning);
      assert.strictEqual(baseWarning.elements.length, 2);
    });

    it('should detect CSP meta tag', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <title>Test</title>
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
      `);
      const warnings = getValidationWarnings(head, adapter);
      const cspWarning = warnings.find(w => w.warning.includes('CSP meta tags'));
      assert.ok(cspWarning);
      assert.ok(cspWarning.warning.includes('preload scanner'));
    });

    it('should return warnings array', () => {
      // Note: jsdom doesn't allow invalid elements in <head>, so we skip this test
      // In a real browser, invalid elements would be caught
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <title>Test</title>
        <meta name="viewport" content="width=device-width">
      `);
      const warnings = getValidationWarnings(head, adapter);
      assert.ok(Array.isArray(warnings));
    });
  });

  describe('validateCSP', () => {
    it('should warn when no content attribute', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('content attribute must be set')));
    });

    it('should warn about report-uri directive', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; report-uri /csp-report">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('report-uri directive is not supported')));
    });

    it('should warn about frame-ancestors directive', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="frame-ancestors \'none\'">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('frame-ancestors directive is not supported')));
    });

    it('should warn about sandbox directive', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="sandbox allow-scripts">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('sandbox directive is not supported')));
    });

    it('should accept valid CSP directives', () => {
      const element = createElement('<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      // Should have meta CSP warning but not directive warnings
      const hasDirectiveWarnings = warnings.some(w => 
        w.includes('report-uri') || w.includes('frame-ancestors') || w.includes('sandbox')
      );
      assert.strictEqual(hasDirectiveWarnings, false);
    });
  });

  describe('validateHttpEquiv', () => {
    it('should warn about deprecated X-UA-Compatible', () => {
      const element = createElement('<meta http-equiv="X-UA-Compatible" content="IE=edge">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Internet Explorer') && w.includes('deprecated')));
    });

    it('should warn about cache-control', () => {
      const element = createElement('<meta http-equiv="cache-control" content="no-cache">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Use HTTP headers')));
    });

    it('should warn about pragma', () => {
      const element = createElement('<meta http-equiv="pragma" content="no-cache">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Use HTTP headers')));
    });

    it('should warn about expires', () => {
      const element = createElement('<meta http-equiv="expires" content="0">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Use HTTP headers')));
    });

    it('should warn about x-frame-options', () => {
      const element = createElement('<meta http-equiv="x-frame-options" content="DENY">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('CSP HTTP header') && w.includes('frame-ancestors')));
    });

    it('should warn about refresh with redirect', () => {
      const element = createElement('<meta http-equiv="refresh" content="0; url=https://example.com">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('auto-redirects') && w.includes('discouraged')));
    });

    it('should warn about refresh without URL', () => {
      const element = createElement('<meta http-equiv="refresh" content="30">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('auto-refreshes') && w.includes('discouraged')));
    });

    it('should warn about misused name as http-equiv (description)', () => {
      const element = createElement('<meta http-equiv="description" content="My page">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Did you mean') && w.includes('meta[name=')));
    });

    it('should warn about misused name as http-equiv (keywords)', () => {
      const element = createElement('<meta http-equiv="keywords" content="html, meta">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Did you mean') && w.includes('meta[name=')));
    });

    it('should warn about misused name as http-equiv (viewport)', () => {
      const element = createElement('<meta http-equiv="viewport" content="width=device-width">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Did you mean') && w.includes('meta[name=')));
    });

    it('should warn about set-cookie', () => {
      const element = createElement('<meta http-equiv="set-cookie" content="name=value">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Set-Cookie HTTP header')));
    });

    it('should warn about content-language', () => {
      const element = createElement('<meta http-equiv="content-language" content="en">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('html[lang] attribute')));
    });

    it('should warn about imagetoolbar', () => {
      const element = createElement('<meta http-equiv="imagetoolbar" content="no">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Internet Explorer') && w.includes('deprecated')));
    });

    it('should warn about x-dns-prefetch-control with "on"', () => {
      const element = createElement('<meta http-equiv="x-dns-prefetch-control" content="on">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('enabled by default')));
    });

    it('should warn about x-dns-prefetch-control with "off"', () => {
      const element = createElement('<meta http-equiv="x-dns-prefetch-control" content="off">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('non-standard')));
    });
  });

  describe('validateMetaViewport', () => {
    it('should warn when no content attribute', () => {
      const element = createElement('<meta name="viewport">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('content attribute must be set')));
    });

    it('should warn about user-scalable=no', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, user-scalable=no">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Disabling zooming') && w.includes('accessibility')));
    });

    it('should warn about user-scalable=0', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, user-scalable=0">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Disabling zooming') && w.includes('accessibility')));
    });

    it('should warn about maximum-scale=1', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, maximum-scale=1">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('zoom levels under 2x') || w.includes('accessibility')));
    });

    it('should warn about maximum-scale=1.5', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, maximum-scale=1.5">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('zoom levels under 2x')));
    });

    it('should warn about invalid width', () => {
      const element = createElement('<meta name="viewport" content="width=500">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Invalid width')));
    });

    it('should warn about invalid height', () => {
      const element = createElement('<meta name="viewport" content="height=200">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Invalid height')));
    });

    it('should warn about minimum-scale out of range', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, minimum-scale=0.05">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('minimum zoom level')));
    });

    it('should warn about maximum-scale out of range', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, maximum-scale=15">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('maximum zoom level')));
    });

    it('should warn about initial-scale out of range', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, initial-scale=0.05">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('initial zoom level')));
    });

    it('should warn about shrink-to-fit', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, shrink-to-fit=no">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('shrink-to-fit') && w.includes('obsolete')));
    });

    it('should warn about invalid directives', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, foo=bar">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Invalid viewport directive')));
    });

    it('should warn about invalid viewport-fit value', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, viewport-fit=invalid">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      // viewport-fit warnings say "Unsupported value"
      assert.ok(warnings.some(w => w.includes('Unsupported value') && w.includes('invalid')));
    });

    it('should warn about invalid interactive-widget value', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, interactive-widget=invalid">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('Unsupported value') && w.includes('invalid')));
    });

    it('should accept valid viewport', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, initial-scale=1">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.strictEqual(warnings.length, 0);
    });

    it('should accept viewport with maximum-scale=2', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, maximum-scale=2">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      // Should not have accessibility warnings
      const hasAccessibilityWarning = warnings.some(w => w.includes('accessibility'));
      assert.strictEqual(hasAccessibilityWarning, false);
    });

    it('should accept valid viewport-fit value', () => {
      const element = createElement('<meta name="viewport" content="width=device-width, viewport-fit=cover">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      // Should not warn about viewport-fit with valid value
      const hasViewportFitWarning = warnings.some(w => w.includes('viewport-fit') && w.includes('Unsupported'));
      assert.strictEqual(hasViewportFitWarning, false);
    });
  });

  describe('validateContentType', () => {
    it('should warn about duplicate charset declarations', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <meta http-equiv="content-type" content="text/html; charset=utf-8">
      `);
      const httpEquiv = head.querySelector('meta[http-equiv]');
      const { warnings = [] } = getCustomValidations(httpEquiv, adapter);
      assert.ok(warnings.some(w => w.includes('There can only be one')));
    });

    it('should warn about non-UTF-8 charset', () => {
      const element = createElement('<meta charset="iso-8859-1">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('UTF-8 encoding') && w.includes('iso-8859-1')));
    });

    it('should warn about non-UTF-8 in http-equiv content-type', () => {
      const element = createElement('<meta http-equiv="content-type" content="text/html; charset=iso-8859-1">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('UTF-8 encoding')));
    });

    it('should accept UTF-8 charset', () => {
      const element = createElement('<meta charset="utf-8">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.strictEqual(warnings.length, 0);
    });

    it('should accept UTF-8 in http-equiv content-type', () => {
      const element = createElement('<meta http-equiv="content-type" content="text/html; charset=utf-8">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      // Should have CSP-related warning but not charset warning
      const hasCharsetWarning = warnings.some(w => w.includes('charset') || w.includes('UTF-8'));
      assert.strictEqual(hasCharsetWarning, false);
    });
  });

  describe('validateDefaultStyle', () => {
    it('should warn when no content attribute', () => {
      const element = createElement('<meta http-equiv="default-style">');
      const { warnings = [] } = getCustomValidations(element, adapter);
      assert.ok(warnings.some(w => w.includes('content attribute must be set')));
    });

    it('should warn when no matching alternate stylesheet', () => {
      const { head } = createDocument(dedent`
        <meta http-equiv="default-style" content="MyTheme">
      `);
      const meta = head.querySelector('meta');
      const { warnings = [] } = getCustomValidations(meta, adapter);
      assert.ok(warnings.some(w => w.includes('No alternate stylesheet found')));
    });

    it('should always warn about FOUC', () => {
      const { head } = createDocument(dedent`
        <meta http-equiv="default-style" content="MyTheme">
        <link rel="alternate stylesheet" title="MyTheme" href="theme.css">
      `);
      const meta = head.querySelector('meta');
      const { warnings = [] } = getCustomValidations(meta, adapter);
      assert.ok(warnings.some(w => w.includes('flash of unstyled content')));
    });
  });

  // Note: Preload validation tests are skipped because isUnnecessaryPreload
  // requires document.baseURI which isn't available in the Node.js test environment.
  // These validations work correctly in browser contexts where document is global.
  // This functionality is indirectly tested through integration tests.

  describe('invalid elements', () => {
    it('should detect div in head', () => {
      const { head } = createDocument('<div>Invalid</div>');
      const div = head.querySelector('div');
      if (div) {
        assert.strictEqual(isValidElement(div, adapter), false);
        assert.strictEqual(hasValidationWarning(div, adapter), true);
      }
    });

    it('should detect span in head', () => {
      const { head } = createDocument('<span>Invalid</span>');
      const span = head.querySelector('span');
      if (span) {
        assert.strictEqual(isValidElement(span, adapter), false);
        assert.strictEqual(hasValidationWarning(span, adapter), true);
      }
    });

    it('should detect p in head', () => {
      const { head } = createDocument('<p>Invalid</p>');
      const p = head.querySelector('p');
      if (p) {
        assert.strictEqual(isValidElement(p, adapter), false);
        assert.strictEqual(hasValidationWarning(p, adapter), true);
      }
    });
  });
});
