/**
 * Tests for BrowserAdapter
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { BrowserAdapter } from '../../src/adapters/browser.js';

describe('BrowserAdapter', () => {
  let adapter;
  let document;

  // Helper to create a DOM element
  function createElement(html) {
    const dom = new JSDOM(`<!DOCTYPE html><html><head>${html}</head><body></body></html>`);
    document = dom.window.document;
    return document.head.firstElementChild;
  }

  // Create adapter before each test
  function setup() {
    adapter = new BrowserAdapter();
  }

  describe('isElement', () => {
    it('should return true for element nodes', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.isElement(el), true);
    });

    it('should return false for text nodes', () => {
      setup();
      const el = createElement('<title>Test</title>');
      const textNode = el.firstChild;
      assert.equal(adapter.isElement(textNode), false);
    });

    it('should return false for null', () => {
      setup();
      assert.equal(adapter.isElement(null), false);
    });

    it('should return false for undefined', () => {
      setup();
      assert.equal(adapter.isElement(undefined), false);
    });
  });

  describe('getTagName', () => {
    it('should return lowercase tag name for meta', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getTagName(el), 'meta');
    });

    it('should return lowercase tag name for LINK', () => {
      setup();
      const el = createElement('<LINK rel="stylesheet" href="/styles.css">');
      assert.equal(adapter.getTagName(el), 'link');
    });

    it('should return lowercase tag name for script', () => {
      setup();
      const el = createElement('<script src="/app.js"></script>');
      assert.equal(adapter.getTagName(el), 'script');
    });

    it('should return empty string for null', () => {
      setup();
      assert.equal(adapter.getTagName(null), '');
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
      assert.equal(adapter.getAttribute(el, 'Charset'), 'utf-8');
    });

    it('should return null for missing attribute', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getAttribute(el, 'name'), null);
    });

    it('should get http-equiv attribute', () => {
      setup();
      const el = createElement('<meta http-equiv="content-type" content="text/html; charset=utf-8">');
      assert.equal(adapter.getAttribute(el, 'http-equiv'), 'content-type');
    });

    it('should return null for null node', () => {
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
    });

    it('should return false for null node', () => {
      setup();
      assert.equal(adapter.hasAttribute(null, 'charset'), false);
    });
  });

  describe('getAttributeNames', () => {
    it('should return all attribute names', () => {
      setup();
      const el = createElement('<meta charset="utf-8" name="viewport" content="width=device-width">');
      const names = adapter.getAttributeNames(el);
      assert.deepEqual(names.sort(), ['charset', 'content', 'name'].sort());
    });

    it('should return empty array for element with no attributes', () => {
      setup();
      const el = createElement('<title>Test</title>');
      assert.deepEqual(adapter.getAttributeNames(el), []);
    });

    it('should return empty array for null node', () => {
      setup();
      assert.deepEqual(adapter.getAttributeNames(null), []);
    });
  });

  describe('getTextContent', () => {
    it('should get text content from title', () => {
      setup();
      const el = createElement('<title>My Page Title</title>');
      assert.equal(adapter.getTextContent(el), 'My Page Title');
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
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getTextContent(el), '');
    });

    it('should return empty string for null node', () => {
      setup();
      assert.equal(adapter.getTextContent(null), '');
    });
  });

  describe('getChildren', () => {
    it('should return array of child elements', () => {
      setup();
      const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Test</title>
            <link rel="stylesheet" href="/styles.css">
          </head>
          <body></body>
        </html>
      `);
      const head = dom.window.document.querySelector('head');
      const children = adapter.getChildren(head);
      
      assert.equal(children.length, 3);
      assert.equal(adapter.getTagName(children[0]), 'meta');
      assert.equal(adapter.getTagName(children[1]), 'title');
      assert.equal(adapter.getTagName(children[2]), 'link');
    });

    it('should exclude text nodes', () => {
      setup();
      const dom = new JSDOM(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>`);
      const head = dom.window.document.querySelector('head');
      // Manually insert a text node
      const textNode = dom.window.document.createTextNode('Text node');
      head.insertBefore(textNode, head.firstChild);
      
      const children = adapter.getChildren(head);
      
      // Should only get the <meta>, not text nodes (element.children already filters)
      assert.equal(children.length, 1);
      assert.equal(adapter.getTagName(children[0]), 'meta');
    });

    it('should return empty array for element with no children', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.deepEqual(adapter.getChildren(el), []);
    });

    it('should return empty array for null node', () => {
      setup();
      assert.deepEqual(adapter.getChildren(null), []);
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
      assert.equal(adapter.matches(el, 'meta[charset]'), true);
      assert.equal(adapter.matches(el, 'meta[name]'), false);
    });

    it('should match attribute value selector', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.matches(el, 'meta[charset="utf-8"]'), true);
      assert.equal(adapter.matches(el, 'meta[charset="iso-8859-1"]'), false);
    });

    it('should match complex selector', () => {
      setup();
      const el = createElement('<link rel="stylesheet" href="/styles.css">');
      assert.equal(adapter.matches(el, 'link[rel="stylesheet"]'), true);
    });

    it('should return false for invalid selector', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.matches(el, ':::invalid:::'), false);
    });

    it('should return false for null node', () => {
      setup();
      assert.equal(adapter.matches(null, 'meta'), false);
    });
  });

  describe('getLocation', () => {
    it('should return null (not available in browser DOM)', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.getLocation(el), null);
    });
  });

  describe('stringify', () => {
    it('should stringify element with single attribute', () => {
      setup();
      const el = createElement('<meta charset="utf-8">');
      assert.equal(adapter.stringify(el), '<meta charset="utf-8">');
    });

    it('should stringify element with multiple attributes', () => {
      setup();
      const el = createElement('<meta name="viewport" content="width=device-width">');
      const str = adapter.stringify(el);
      assert.ok(str.includes('<meta'));
      assert.ok(str.includes('name="viewport"'));
      assert.ok(str.includes('content="width=device-width"'));
    });

    it('should stringify element with no attributes', () => {
      setup();
      const el = createElement('<title>Test</title>');
      assert.equal(adapter.stringify(el), '<title>');
    });

    it('should escape quotes in attribute values', () => {
      setup();
      const el = createElement('<meta content="value with &quot;quotes&quot;">');
      const str = adapter.stringify(el);
      assert.ok(str.includes('content="value with &quot;quotes&quot;"'));
    });

    it('should handle invalid node', () => {
      setup();
      assert.equal(adapter.stringify(null), '[invalid node]');
    });
  });
});
