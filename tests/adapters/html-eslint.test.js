/**
 * Tests for HtmlEslintAdapter
 * Tests with mock AST nodes matching @html-eslint/parser structure
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HtmlEslintAdapter } from '../../src/adapters/html-eslint.js';

describe('HtmlEslintAdapter', () => {
  let adapter;

  // Helper to create mock AST node matching @html-eslint/parser structure
  function createNode(tag, attributes = [], children = [], loc = null) {
    return {
      type: 'Tag',
      name: tag,
      attributes: attributes.map(([key, value]) => ({
        type: 'Attribute',
        key: { type: 'AttributeKey', value: key },
        value: value !== null ? { type: 'AttributeValue', value } : null
      })),
      children: children,
      loc: loc || {
        start: { line: 1, column: 0 },
        end: { line: 1, column: 10 }
      }
    };
  }

  // Helper to create text node
  function createTextNode(text) {
    return {
      type: 'Text',
      value: text
    };
  }

  // Create adapter before each test
  function setup() {
    adapter = new HtmlEslintAdapter();
  }

  describe('isElement', () => {
    it('should return true for Tag nodes', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.isElement(node), true);
    });

    it('should return true for ScriptTag nodes', () => {
      setup();
      const node = { type: 'ScriptTag', name: 'script', attributes: [], children: [] };
      assert.equal(adapter.isElement(node), true);
    });

    it('should return true for StyleTag nodes', () => {
      setup();
      const node = { type: 'StyleTag', name: 'style', attributes: [], children: [] };
      assert.equal(adapter.isElement(node), true);
    });

    it('should return false for Text nodes', () => {
      setup();
      const node = createTextNode('Some text');
      assert.equal(adapter.isElement(node), false);
    });

    it('should return false for Comment nodes', () => {
      setup();
      const node = { type: 'Comment', value: 'comment text' };
      assert.equal(adapter.isElement(node), false);
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
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.getTagName(node), 'meta');
    });

    it('should return lowercase tag name for LINK', () => {
      setup();
      const node = createNode('LINK', [['rel', 'stylesheet']]);
      assert.equal(adapter.getTagName(node), 'link');
    });

    it('should return lowercase tag name for Script', () => {
      setup();
      const node = { type: 'ScriptTag', name: 'Script', attributes: [], children: [] };
      assert.equal(adapter.getTagName(node), 'script');
    });

    it('should return empty string for null', () => {
      setup();
      assert.equal(adapter.getTagName(null), '');
    });

    it('should return empty string for node without name', () => {
      setup();
      const node = { type: 'Text', value: 'text' };
      assert.equal(adapter.getTagName(node), '');
    });
  });

  describe('getAttribute', () => {
    it('should get attribute value', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.getAttribute(node, 'charset'), 'utf-8');
    });

    it('should be case-insensitive for attribute names', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.getAttribute(node, 'CHARSET'), 'utf-8');
      assert.equal(adapter.getAttribute(node, 'Charset'), 'utf-8');
    });

    it('should return null for missing attribute', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.getAttribute(node, 'name'), null);
    });

    it('should get http-equiv attribute', () => {
      setup();
      const node = createNode('meta', [
        ['http-equiv', 'content-type'],
        ['content', 'text/html; charset=utf-8']
      ]);
      assert.equal(adapter.getAttribute(node, 'http-equiv'), 'content-type');
    });

    it('should get multiple attributes', () => {
      setup();
      const node = createNode('meta', [
        ['name', 'viewport'],
        ['content', 'width=device-width']
      ]);
      assert.equal(adapter.getAttribute(node, 'name'), 'viewport');
      assert.equal(adapter.getAttribute(node, 'content'), 'width=device-width');
    });

    it('should return null for attribute without value', () => {
      setup();
      const node = {
        type: 'Tag',
        name: 'script',
        attributes: [{
          type: 'Attribute',
          key: { type: 'AttributeKey', value: 'async' },
          value: null
        }],
        children: []
      };
      assert.equal(adapter.getAttribute(node, 'async'), null);
    });

    it('should return null for null node', () => {
      setup();
      assert.equal(adapter.getAttribute(null, 'charset'), null);
    });
  });

  describe('hasAttribute', () => {
    it('should return true when attribute exists', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.hasAttribute(node, 'charset'), true);
    });

    it('should return false when attribute does not exist', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.hasAttribute(node, 'name'), false);
    });

    it('should be case-insensitive', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.hasAttribute(node, 'CHARSET'), true);
    });

    it('should return true for attribute without value', () => {
      setup();
      const node = {
        type: 'Tag',
        name: 'script',
        attributes: [{
          type: 'Attribute',
          key: { type: 'AttributeKey', value: 'async' },
          value: null
        }],
        children: []
      };
      assert.equal(adapter.hasAttribute(node, 'async'), true);
    });

    it('should return false for null node', () => {
      setup();
      assert.equal(adapter.hasAttribute(null, 'charset'), false);
    });
  });

  describe('getAttributeNames', () => {
    it('should return all attribute names', () => {
      setup();
      const node = createNode('meta', [
        ['charset', 'utf-8'],
        ['name', 'viewport'],
        ['content', 'width=device-width']
      ]);
      const names = adapter.getAttributeNames(node);
      assert.deepEqual(names.sort(), ['charset', 'content', 'name'].sort());
    });

    it('should return empty array for element with no attributes', () => {
      setup();
      const node = createNode('title', [], [createTextNode('Test')]);
      assert.deepEqual(adapter.getAttributeNames(node), []);
    });

    it('should return empty array for null node', () => {
      setup();
      assert.deepEqual(adapter.getAttributeNames(null), []);
    });
  });

  describe('getTextContent', () => {
    it('should get text content from title', () => {
      setup();
      const node = createNode('title', [], [createTextNode('My Page Title')]);
      assert.equal(adapter.getTextContent(node), 'My Page Title');
    });

    it('should get text content from inline script', () => {
      setup();
      const node = {
        type: 'ScriptTag',
        name: 'script',
        attributes: [],
        children: [createTextNode('console.log("test");')]
      };
      assert.equal(adapter.getTextContent(node), 'console.log("test");');
    });

    it('should concatenate multiple text nodes', () => {
      setup();
      const node = createNode('title', [], [
        createTextNode('Part 1'),
        createTextNode(' Part 2')
      ]);
      assert.equal(adapter.getTextContent(node), 'Part 1 Part 2');
    });

    it('should use VText type nodes', () => {
      setup();
      const node = createNode('title', [], [
        { type: 'VText', value: 'Virtual Text' }
      ]);
      assert.equal(adapter.getTextContent(node), 'Virtual Text');
    });

    it('should skip non-text children', () => {
      setup();
      const node = createNode('div', [], [
        createTextNode('Text 1'),
        createNode('span', [], []),
        createTextNode('Text 2')
      ]);
      assert.equal(adapter.getTextContent(node), 'Text 1Text 2');
    });

    it('should return empty string for empty element', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.getTextContent(node), '');
    });

    it('should return empty string for null node', () => {
      setup();
      assert.equal(adapter.getTextContent(null), '');
    });
  });

  describe('getChildren', () => {
    it('should return array of child elements', () => {
      setup();
      const children = [
        createNode('meta', [['charset', 'utf-8']]),
        createNode('title', [], [createTextNode('Test')]),
        createNode('link', [['rel', 'stylesheet']])
      ];
      const head = createNode('head', [], children);
      
      const result = adapter.getChildren(head);
      assert.equal(result.length, 3);
      assert.equal(adapter.getTagName(result[0]), 'meta');
      assert.equal(adapter.getTagName(result[1]), 'title');
      assert.equal(adapter.getTagName(result[2]), 'link');
    });

    it('should exclude text nodes', () => {
      setup();
      const children = [
        createTextNode('Text node'),
        createNode('meta', [['charset', 'utf-8']]),
        createTextNode('More text')
      ];
      const head = createNode('head', [], children);
      
      const result = adapter.getChildren(head);
      assert.equal(result.length, 1);
      assert.equal(adapter.getTagName(result[0]), 'meta');
    });

    it('should include ScriptTag and StyleTag children', () => {
      setup();
      const children = [
        { type: 'ScriptTag', name: 'script', attributes: [], children: [] },
        { type: 'StyleTag', name: 'style', attributes: [], children: [] },
        createNode('meta', [['charset', 'utf-8']])
      ];
      const head = createNode('head', [], children);
      
      const result = adapter.getChildren(head);
      assert.equal(result.length, 3);
    });

    it('should return empty array for element with no children', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.deepEqual(adapter.getChildren(node), []);
    });

    it('should return empty array for null node', () => {
      setup();
      assert.deepEqual(adapter.getChildren(null), []);
    });
  });

  describe('getLocation', () => {
    it('should return location object', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']], [], {
        start: { line: 5, column: 2 },
        end: { line: 5, column: 28 }
      });
      const loc = adapter.getLocation(node);
      
      assert.equal(loc.line, 5);
      assert.equal(loc.column, 2);
      assert.equal(loc.endLine, 5);
      assert.equal(loc.endColumn, 28);
    });

    it('should return null for node without location', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      delete node.loc;
      assert.equal(adapter.getLocation(node), null);
    });

    it('should return null for null node', () => {
      setup();
      assert.equal(adapter.getLocation(null), null);
    });
  });

  describe('stringify', () => {
    it('should stringify element with single attribute', () => {
      setup();
      const node = createNode('meta', [['charset', 'utf-8']]);
      assert.equal(adapter.stringify(node), '<meta charset="utf-8">');
    });

    it('should stringify element with multiple attributes', () => {
      setup();
      const node = createNode('meta', [
        ['name', 'viewport'],
        ['content', 'width=device-width']
      ]);
      const str = adapter.stringify(node);
      assert.ok(str.includes('<meta'));
      assert.ok(str.includes('name="viewport"'));
      assert.ok(str.includes('content="width=device-width"'));
    });

    it('should stringify element with no attributes', () => {
      setup();
      const node = createNode('title', [], [createTextNode('Test')]);
      assert.equal(adapter.stringify(node), '<title>');
    });

    it('should handle attribute without value', () => {
      setup();
      const node = {
        type: 'Tag',
        name: 'script',
        attributes: [{
          type: 'Attribute',
          key: { type: 'AttributeKey', value: 'async' },
          value: null
        }],
        children: []
      };
      assert.equal(adapter.stringify(node), '<script async>');
    });

    it('should escape quotes in attribute values', () => {
      setup();
      const node = createNode('meta', [['content', 'value with "quotes"']]);
      const str = adapter.stringify(node);
      assert.ok(str.includes('content="value with \\"quotes\\""'));
    });

    it('should handle ScriptTag', () => {
      setup();
      const node = {
        type: 'ScriptTag',
        name: 'script',
        attributes: [{
          type: 'Attribute',
          key: { type: 'AttributeKey', value: 'src' },
          value: { type: 'AttributeValue', value: '/app.js' }
        }],
        children: []
      };
      assert.equal(adapter.stringify(node), '<script src="/app.js">');
    });

    it('should handle invalid node', () => {
      setup();
      assert.equal(adapter.stringify(null), '[invalid node]');
    });
  });
});
