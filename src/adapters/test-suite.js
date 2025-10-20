/**
 * Reusable test suite for adapter validation
 * 
 * This module provides a standard test suite that can be used to validate
 * any custom adapter implementation. Consumers can import this and run it
 * against their own adapters to ensure compliance with the AdapterInterface.
 * 
 * @example
 * import { describe } from 'node:test';
 * import { runAdapterTestSuite } from '@rviscomi/capo.js/adapters/test-suite';
 * import { MyCustomAdapter } from './my-adapter.js';
 * 
 * describe('MyCustomAdapter', () => {
 *   runAdapterTestSuite(MyCustomAdapter, {
 *     createElement: (html) => {
 *       // Return a node compatible with your adapter
 *       return parseHtml(html);
 *     }
 *   });
 * });
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Run the standard adapter test suite
 * 
 * @param {Function} AdapterClass - The adapter class to test
 * @param {Object} options - Test configuration
 * @param {Function} options.createElement - Function that creates test nodes from HTML strings
 * @param {boolean} [options.supportsLocation=false] - Whether adapter supports getLocation()
 */
export function runAdapterTestSuite(AdapterClass, options) {
  const { createElement, supportsLocation = false } = options;
  
  if (!createElement) {
    throw new Error('createElement function is required in test options');
  }

  let adapter;

  function setup() {
    adapter = new AdapterClass();
  }

  describe('isElement', () => {
    it('should return true for valid element nodes', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.isElement(el), true, 'Should identify valid element');
    });

    it('should return false for null', () => {
      setup();
      assert.equal(adapter.isElement(null), false, 'Should return false for null');
    });

    it('should return false for undefined', () => {
      setup();
      assert.equal(adapter.isElement(undefined), false, 'Should return false for undefined');
    });
  });

  describe('getTagName', () => {
    it('should return lowercase tag name for meta', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getTagName(el), 'meta');
    });

    it('should return lowercase tag name for LINK (uppercase HTML)', () => {
      setup();
      const el = createElement('<LINK rel="stylesheet" href="styles.css">');
      assert.equal(adapter.getTagName(el), 'link');
    });

    it('should return lowercase tag name for script', () => {
      setup();
      const el = createElement('<script src="app.js"></script>');
      assert.equal(adapter.getTagName(el), 'script');
    });

    it('should handle null node gracefully', () => {
      setup();
      const result = adapter.getTagName(null);
      assert.equal(typeof result, 'string', 'Should return a string');
    });
  });

  describe('getAttribute', () => {
    it('should get attribute value', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getAttribute(el, 'charset'), 'utf-8');
    });

    it('should be case-insensitive for attribute names', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getAttribute(el, 'CHARSET'), 'utf-8');
      assert.equal(adapter.getAttribute(el, 'CharSet'), 'utf-8');
    });

    it('should return null for missing attribute', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getAttribute(el, 'name'), null);
    });

    it('should handle complex attribute values', () => {
      setup();
      const el = createElement('<meta http-equiv="Content-Security-Policy">');
      assert.equal(adapter.getAttribute(el, 'http-equiv'), 'Content-Security-Policy');
    });

    it('should handle null node gracefully', () => {
      setup();
      assert.equal(adapter.getAttribute(null, 'charset'), null);
    });
  });

  describe('hasAttribute', () => {
    it('should return true when attribute exists', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.hasAttribute(el, 'charset'), true);
    });

    it('should return false when attribute does not exist', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.hasAttribute(el, 'name'), false);
    });

    it('should be case-insensitive', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.hasAttribute(el, 'CHARSET'), true);
      assert.equal(adapter.hasAttribute(el, 'CharSet'), true);
    });

    it('should handle null node gracefully', () => {
      setup();
      assert.equal(adapter.hasAttribute(null, 'charset'), false);
    });
  });

  describe('getAttributeNames', () => {
    it('should return all attribute names', () => {
      setup();
      const el = createElement('<meta charset="utf-8" name="viewport">');
      const names = adapter.getAttributeNames(el);
      assert.ok(Array.isArray(names), 'Should return an array');
      assert.ok(names.includes('charset'), 'Should include charset');
      assert.ok(names.includes('name'), 'Should include name');
    });

    it('should return empty array for element with no attributes', () => {
      setup();
      const el = createElement('<title>Test</title>');
      const names = adapter.getAttributeNames(el);
      assert.deepEqual(names, []);
    });

    it('should handle null node gracefully', () => {
      setup();
      const names = adapter.getAttributeNames(null);
      assert.ok(Array.isArray(names), 'Should return an array');
      assert.equal(names.length, 0, 'Should be empty for null');
    });
  });

  describe('getTextContent', () => {
    it('should get text content from title', () => {
      setup();
      const el = createElement('<title>Hello World</title>');
      assert.equal(adapter.getTextContent(el), 'Hello World');
    });

    it('should get text content from inline script', () => {
      setup();
      const el = createElement('<script>console.log("test");</script>');
      assert.equal(adapter.getTextContent(el), 'console.log("test");');
    });

    it('should get text content from inline style', () => {
      setup();
      const el = createElement('<style>body { margin: 0; }</style>');
      assert.equal(adapter.getTextContent(el), 'body { margin: 0; }');
    });

    it('should return empty string for empty element', () => {
      setup();
      const el = createElement('<title></title>');
      assert.equal(adapter.getTextContent(el), '');
    });

    it('should handle null node gracefully', () => {
      setup();
      const result = adapter.getTextContent(null);
      assert.equal(typeof result, 'string', 'Should return a string');
    });
  });

  describe('getChildren', () => {
    it('should return array of child elements', () => {
      setup();
      const el = createElement('<noscript><link rel="stylesheet" href="noscript.css"></noscript>');
      const children = adapter.getChildren(el);
      assert.ok(Array.isArray(children), 'Should return an array');
      assert.equal(children.length, 1, 'Should have 1 child');
      assert.equal(adapter.getTagName(children[0]), 'link', 'Child should be link element');
    });

    it('should return empty array for element with no children', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      const children = adapter.getChildren(el);
      assert.deepEqual(children, []);
    });

    it('should handle null node gracefully', () => {
      setup();
      const children = adapter.getChildren(null);
      assert.ok(Array.isArray(children), 'Should return an array');
      assert.equal(children.length, 0, 'Should be empty for null');
    });
  });

  describe('matches', () => {
    it('should match simple tag selector', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.matches(el, 'meta'), true);
    });

    it('should match attribute selector', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.matches(el, '[charset]'), true);
    });

    it('should match attribute value selector', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.matches(el, 'meta[charset="utf-8"]'), true);
    });

    it('should match complex selector', () => {
      setup();
      const el = createElement('<link rel="preload" as="font">');
      assert.equal(adapter.matches(el, 'link[rel="preload"][as="font"]'), true);
    });

    it('should return false for non-matching selector', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.matches(el, 'link'), false);
    });

    it('should handle null node gracefully', () => {
      setup();
      assert.equal(adapter.matches(null, 'meta'), false);
    });
  });

  describe('getLocation', () => {
    if (supportsLocation) {
      it('should return location object with line and column', () => {
        setup();
        const el = createElement('<meta charset="utf-8">');
        const loc = adapter.getLocation(el);
        assert.ok(loc !== null, 'Should return location object');
        assert.ok(typeof loc === 'object', 'Location should be an object');
        assert.ok('line' in loc || 'start' in loc, 'Should have line or start property');
      });
    } else {
      it('should return null (location not supported)', () => {
        setup();
        const el = createElement('<meta charset="utf-8">');
        assert.equal(adapter.getLocation(el), null);
      });
    }

    it('should handle null node gracefully', () => {
      setup();
      assert.equal(adapter.getLocation(null), null);
    });
  });

  describe('stringify', () => {
    it('should stringify element with single attribute', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      const str = adapter.stringify(el);
      assert.ok(str.includes('meta'), 'Should include tag name');
      assert.ok(str.includes('charset'), 'Should include attribute name');
      assert.ok(str.includes('utf-8'), 'Should include attribute value');
    });

    it('should stringify element with multiple attributes', () => {
      setup();
      const el = createElement('<link rel="stylesheet" href="styles.css">');
      const str = adapter.stringify(el);
      assert.ok(str.includes('link'), 'Should include tag name');
      assert.ok(str.includes('rel'), 'Should include rel attribute');
      assert.ok(str.includes('href'), 'Should include href attribute');
    });

    it('should stringify element with no attributes', () => {
      setup();
      const el = createElement('<title>Test</title>');
      const str = adapter.stringify(el);
      assert.ok(str.includes('title'), 'Should include tag name');
    });

    it('should handle null node gracefully', () => {
      setup();
      const str = adapter.stringify(null);
      assert.equal(typeof str, 'string', 'Should return a string');
    });
  });
}

/**
 * Create a minimal compliance test
 * 
 * This is a lighter-weight alternative that just checks the adapter
 * implements all required methods without full behavior testing.
 * 
 * @param {Function} AdapterClass - The adapter class to test
 */
export function testAdapterCompliance(AdapterClass) {
  describe('Adapter Compliance', () => {
    it('should implement all required methods', () => {
      const adapter = new AdapterClass();
      const requiredMethods = [
        'isElement',
        'getTagName',
        'getAttribute',
        'hasAttribute',
        'getAttributeNames',
        'getTextContent',
        'getChildren',
        'matches',
        'getLocation',
        'stringify'
      ];

      for (const method of requiredMethods) {
        assert.equal(
          typeof adapter[method],
          'function',
          `Adapter must implement ${method}() method`
        );
      }
    });

    it('should be instantiable without errors', () => {
      assert.doesNotThrow(() => {
        new AdapterClass();
      });
    });
  });
}
