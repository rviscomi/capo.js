/**
 * Tests for AdapterFactory
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { AdapterFactory } from '../../src/adapters/factory.js';
import { BrowserAdapter } from '../../src/adapters/browser.js';
import { HtmlEslintAdapter } from '../../src/adapters/html-eslint.js';

describe('AdapterFactory', () => {
  describe('createByName', () => {
    it('should create BrowserAdapter by name "browser"', () => {
      const adapter = AdapterFactory.createByName('browser');
      assert.ok(adapter instanceof BrowserAdapter);
    });

    it('should create HtmlEslintAdapter by name "html-eslint"', () => {
      const adapter = AdapterFactory.createByName('html-eslint');
      assert.ok(adapter instanceof HtmlEslintAdapter);
    });

    it('should create HtmlEslintAdapter by package name "@html-eslint/parser"', () => {
      const adapter = AdapterFactory.createByName('@html-eslint/parser');
      assert.ok(adapter instanceof HtmlEslintAdapter);
    });

    it('should throw error for unknown adapter name', () => {
      assert.throws(
        () => AdapterFactory.createByName('unknown'),
        /Unknown adapter: "unknown"/
      );
    });

    it('should list available adapters in error message', () => {
      try {
        AdapterFactory.createByName('invalid');
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('Available adapters:'));
        assert.ok(error.message.includes('browser'));
        assert.ok(error.message.includes('html-eslint'));
      }
    });
  });

  describe('detect', () => {
    it('should detect BrowserAdapter from DOM element', () => {
      const dom = new JSDOM('<!DOCTYPE html><html><head><meta charset="utf-8"></head></html>');
      const element = dom.window.document.querySelector('meta');
      
      const adapter = AdapterFactory.detect(element);
      assert.ok(adapter instanceof BrowserAdapter);
    });

    it('should detect HtmlEslintAdapter from Tag node', () => {
      const node = {
        type: 'Tag',
        name: 'meta',
        attributes: []
      };
      
      const adapter = AdapterFactory.detect(node);
      assert.ok(adapter instanceof HtmlEslintAdapter);
    });

    it('should detect HtmlEslintAdapter from ScriptTag node', () => {
      const node = {
        type: 'ScriptTag',
        name: 'script',
        attributes: []
      };
      
      const adapter = AdapterFactory.detect(node);
      assert.ok(adapter instanceof HtmlEslintAdapter);
    });

    it('should detect HtmlEslintAdapter from StyleTag node', () => {
      const node = {
        type: 'StyleTag',
        name: 'style',
        attributes: []
      };
      
      const adapter = AdapterFactory.detect(node);
      assert.ok(adapter instanceof HtmlEslintAdapter);
    });

    it('should throw error for null node', () => {
      assert.throws(
        () => AdapterFactory.detect(null),
        /Cannot detect adapter: node is null or undefined/
      );
    });

    it('should throw error for undefined node', () => {
      assert.throws(
        () => AdapterFactory.detect(undefined),
        /Cannot detect adapter: node is null or undefined/
      );
    });

    it('should throw error for unknown node type', () => {
      const node = { type: 'Unknown' };
      
      assert.throws(
        () => AdapterFactory.detect(node),
        /Cannot detect adapter for node/
      );
    });

    it('should include node type in error message', () => {
      const node = { type: 'JSXElement' };
      
      try {
        AdapterFactory.detect(node);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error.message.includes('type="JSXElement"'));
        assert.ok(error.message.includes('Supported types:'));
      }
    });
  });

  describe('create (combined)', () => {
    it('should create adapter by string name', () => {
      const adapter = AdapterFactory.create('browser');
      assert.ok(adapter instanceof BrowserAdapter);
    });

    it('should auto-detect adapter from DOM node', () => {
      const dom = new JSDOM('<!DOCTYPE html><html><head></head></html>');
      const head = dom.window.document.querySelector('head');
      
      const adapter = AdapterFactory.create(head);
      assert.ok(adapter instanceof BrowserAdapter);
    });

    it('should auto-detect adapter from AST node', () => {
      const node = { type: 'Tag', name: 'meta', attributes: [] };
      
      const adapter = AdapterFactory.create(node);
      assert.ok(adapter instanceof HtmlEslintAdapter);
    });
  });

  describe('register', () => {
    // Mock adapter for testing
    class TestAdapter {
      isElement() { return true; }
      getTagName() { return 'test'; }
      getAttribute() { return null; }
      hasAttribute() { return false; }
      getAttributeNames() { return []; }
      getTextContent() { return ''; }
      getChildren() { return []; }
      matches() { return false; }
      getLocation() { return null; }
      stringify() { return '<test>'; }
    }

    beforeEach(() => {
      // Clean up any test adapters
      try {
        AdapterFactory.unregister('test');
      } catch (e) {
        // Ignore if not registered
      }
    });

    it('should register new adapter', () => {
      AdapterFactory.register('test', TestAdapter);
      assert.ok(AdapterFactory.has('test'));
    });

    it('should create registered adapter', () => {
      AdapterFactory.register('test', TestAdapter);
      const adapter = AdapterFactory.create('test');
      assert.ok(adapter instanceof TestAdapter);
    });

    it('should throw error if AdapterClass is not a constructor', () => {
      assert.throws(
        () => AdapterFactory.register('invalid', 'not-a-constructor'),
        /must be a constructor function/
      );
    });

    it('should validate adapter on registration', () => {
      class InvalidAdapter {
        // Missing required methods
      }

      assert.throws(
        () => AdapterFactory.register('invalid', InvalidAdapter),
        /Adapter missing required method/
      );
    });

    it('should allow overriding existing adapter', () => {
      AdapterFactory.register('test', TestAdapter);
      
      class TestAdapter2 extends TestAdapter {}
      AdapterFactory.register('test', TestAdapter2);
      
      const adapter = AdapterFactory.create('test');
      assert.ok(adapter instanceof TestAdapter2);
    });
  });

  describe('list', () => {
    it('should list built-in adapters', () => {
      const adapters = AdapterFactory.list();
      
      assert.ok(adapters.includes('browser'));
      assert.ok(adapters.includes('html-eslint'));
      assert.ok(adapters.includes('@html-eslint/parser'));
    });

    it('should include registered adapters', () => {
      class TestAdapter {
        isElement() { return true; }
        getTagName() { return 'test'; }
        getAttribute() { return null; }
        hasAttribute() { return false; }
        getAttributeNames() { return []; }
        getTextContent() { return ''; }
        getChildren() { return []; }
        matches() { return false; }
        getLocation() { return null; }
        stringify() { return '<test>'; }
      }

      AdapterFactory.register('test', TestAdapter);
      const adapters = AdapterFactory.list();
      
      assert.ok(adapters.includes('test'));
      
      // Cleanup
      AdapterFactory.unregister('test');
    });
  });

  describe('has', () => {
    it('should return true for registered adapters', () => {
      assert.equal(AdapterFactory.has('browser'), true);
      assert.equal(AdapterFactory.has('html-eslint'), true);
    });

    it('should return false for unregistered adapters', () => {
      assert.equal(AdapterFactory.has('unknown'), false);
      assert.equal(AdapterFactory.has('jsx'), false);
    });
  });

  describe('unregister', () => {
    it('should throw error when unregistering built-in adapters', () => {
      assert.throws(
        () => AdapterFactory.unregister('browser'),
        /Cannot unregister built-in adapter/
      );
      
      assert.throws(
        () => AdapterFactory.unregister('html-eslint'),
        /Cannot unregister built-in adapter/
      );
      
      assert.throws(
        () => AdapterFactory.unregister('@html-eslint/parser'),
        /Cannot unregister built-in adapter/
      );
    });

    it('should unregister custom adapter', () => {
      class TestAdapter {
        isElement() { return true; }
        getTagName() { return 'test'; }
        getAttribute() { return null; }
        hasAttribute() { return false; }
        getAttributeNames() { return []; }
        getTextContent() { return ''; }
        getChildren() { return []; }
        matches() { return false; }
        getLocation() { return null; }
        stringify() { return '<test>'; }
      }

      AdapterFactory.register('test', TestAdapter);
      assert.ok(AdapterFactory.has('test'));
      
      const result = AdapterFactory.unregister('test');
      assert.equal(result, true);
      assert.equal(AdapterFactory.has('test'), false);
    });

    it('should return false when unregistering non-existent adapter', () => {
      const result = AdapterFactory.unregister('nonexistent');
      assert.equal(result, false);
    });
  });
});
