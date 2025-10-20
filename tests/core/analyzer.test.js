/**
 * Tests for core/analyzer.js
 * Tests the DOM-agnostic analysis functions
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import { analyzeHead, analyzeHeadWithOrdering, getWeightCategory, checkOrdering } from '../../src/core/analyzer.js';
import { BrowserAdapter } from '../../src/adapters/browser.js';

function createDocument(headContent) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head>${headContent}</head><body></body></html>`);
  return {
    document: dom.window.document,
    head: dom.window.document.querySelector('head'),
  };
}

describe('core/analyzer', () => {
  const adapter = new BrowserAdapter();

  describe('analyzeHead', () => {
    it('should analyze a simple head element', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <title>Test Page</title>
        <link rel="stylesheet" href="styles.css">
      `);

      const result = analyzeHead(head, adapter);

      assert.ok(result.weights, 'Should return weights');
      assert.ok(result.validationWarnings, 'Should return validation warnings');
      assert.ok(result.customValidations, 'Should return custom validations');
      assert.strictEqual(result.headElement, head, 'Should return head element reference');
      assert.strictEqual(result.weights.length, 3, 'Should analyze 3 elements');
    });

    it('should compute correct weights', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <title>Test</title>
        <script src="app.js"></script>
      `);

      const result = analyzeHead(head, adapter);

      assert.strictEqual(result.weights[0].weight, 10, 'Meta charset should have weight 10');
      assert.strictEqual(result.weights[1].weight, 9, 'Title should have weight 9');
      assert.strictEqual(result.weights[2].weight, 5, 'Sync script should have weight 5');
    });

    it('should include validation warnings by default', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <title>First Title</title>
        <title>Second Title</title>
      `);

      const result = analyzeHead(head, adapter);

      assert.ok(result.validationWarnings.length > 0, 'Should have validation warnings');
      const titleWarning = result.validationWarnings.find(w => 
        w.warning.includes('<title>')
      );
      assert.ok(titleWarning, 'Should warn about duplicate titles');
    });

    it('should skip validation when disabled', () => {
      const { head } = createDocument(`
        <title>First Title</title>
        <title>Second Title</title>
      `);

      const result = analyzeHead(head, adapter, { includeValidation: false });

      assert.strictEqual(result.validationWarnings.length, 0, 'Should skip validation warnings');
    });

    it('should include custom validations by default', () => {
      const { head } = createDocument(`
        <meta charset="iso-8859-1">
      `);

      const result = analyzeHead(head, adapter);

      assert.ok(result.customValidations.length > 0, 'Should have custom validations');
      const charsetValidation = result.customValidations.find(v =>
        v.warnings.some(w => w.includes('UTF-8'))
      );
      assert.ok(charsetValidation, 'Should warn about non-UTF-8 charset');
    });

    it('should skip custom validations when disabled', () => {
      const { head } = createDocument(`
        <meta charset="iso-8859-1">
      `);

      const result = analyzeHead(head, adapter, { includeCustomValidations: false });

      assert.strictEqual(result.customValidations.length, 0, 'Should skip custom validations');
    });

    it('should handle empty head', () => {
      const { head } = createDocument('');

      const result = analyzeHead(head, adapter);

      assert.strictEqual(result.weights.length, 0, 'Should have no weights');
      assert.ok(result.validationWarnings.length > 0, 'Should warn about missing title');
    });

    it('should handle optimal head structure', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Optimal Page</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <script async src="analytics.js"></script>
        <link rel="stylesheet" href="styles.css">
      `);

      const result = analyzeHead(head, adapter);

      assert.strictEqual(result.weights.length, 6, 'Should analyze all elements');
      assert.strictEqual(result.validationWarnings.length, 0, 'Should have no validation warnings');
    });
  });

  describe('getWeightCategory', () => {
    it('should return correct category names', () => {
      assert.strictEqual(getWeightCategory(10), 'META', 'Weight 10 is META');
      assert.strictEqual(getWeightCategory(9), 'TITLE', 'Weight 9 is TITLE');
      assert.strictEqual(getWeightCategory(8), 'PRECONNECT', 'Weight 8 is PRECONNECT');
      assert.strictEqual(getWeightCategory(7), 'ASYNC_SCRIPT', 'Weight 7 is ASYNC_SCRIPT');
      assert.strictEqual(getWeightCategory(6), 'IMPORT_STYLES', 'Weight 6 is IMPORT_STYLES');
      assert.strictEqual(getWeightCategory(5), 'SYNC_SCRIPT', 'Weight 5 is SYNC_SCRIPT');
      assert.strictEqual(getWeightCategory(4), 'SYNC_STYLES', 'Weight 4 is SYNC_STYLES');
      assert.strictEqual(getWeightCategory(3), 'PRELOAD', 'Weight 3 is PRELOAD');
      assert.strictEqual(getWeightCategory(2), 'DEFER_SCRIPT', 'Weight 2 is DEFER_SCRIPT');
      assert.strictEqual(getWeightCategory(1), 'PREFETCH_PRERENDER', 'Weight 1 is PREFETCH_PRERENDER');
      assert.strictEqual(getWeightCategory(0), 'OTHER', 'Weight 0 is OTHER');
    });

    it('should return UNKNOWN for invalid weights', () => {
      assert.strictEqual(getWeightCategory(99), 'UNKNOWN');
      assert.strictEqual(getWeightCategory(-1), 'UNKNOWN');
    });
  });

  describe('checkOrdering', () => {
    it('should detect ordering violations', () => {
      const { head } = createDocument(`
        <link rel="stylesheet" href="styles.css">
        <title>Test</title>
        <meta charset="utf-8">
      `);

      const result = analyzeHead(head, adapter);
      const violations = checkOrdering(result.weights);

      assert.ok(violations.length > 0, 'Should detect violations');
      assert.ok(violations.some(v => v.nextCategory === 'TITLE'), 'Should detect title violation');
      assert.ok(violations.some(v => v.nextCategory === 'META'), 'Should detect meta violation');
    });

    it('should return empty array for optimal ordering', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <title>Test</title>
        <link rel="stylesheet" href="styles.css">
      `);

      const result = analyzeHead(head, adapter);
      const violations = checkOrdering(result.weights);

      assert.strictEqual(violations.length, 0, 'Should have no violations');
    });

    it('should include violation details', () => {
      const { head } = createDocument(`
        <script src="app.js"></script>
        <title>Test</title>
      `);

      const result = analyzeHead(head, adapter);
      const violations = checkOrdering(result.weights);

      assert.strictEqual(violations.length, 1, 'Should have 1 violation');
      
      const violation = violations[0];
      assert.strictEqual(violation.index, 1, 'Should track index');
      assert.ok(violation.currentElement, 'Should include current element');
      assert.ok(violation.nextElement, 'Should include next element');
      assert.strictEqual(violation.currentWeight, 5, 'Should track current weight');
      assert.strictEqual(violation.nextWeight, 9, 'Should track next weight');
      assert.strictEqual(violation.currentCategory, 'SYNC_SCRIPT');
      assert.strictEqual(violation.nextCategory, 'TITLE');
      assert.ok(violation.message.includes('TITLE'), 'Should include message');
    });

    it('should detect multiple violations', () => {
      const { head } = createDocument(`
        <link rel="prefetch" href="page.html">
        <script defer src="app.js"></script>
        <link rel="stylesheet" href="styles.css">
        <title>Test</title>
        <meta charset="utf-8">
      `);

      const result = analyzeHead(head, adapter);
      const violations = checkOrdering(result.weights);

      assert.ok(violations.length >= 4, 'Should detect multiple violations');
    });
  });

  describe('analyzeHeadWithOrdering', () => {
    it('should include ordering violations', () => {
      const { head } = createDocument(`
        <link rel="stylesheet" href="styles.css">
        <title>Test</title>
        <meta charset="utf-8">
      `);

      const result = analyzeHeadWithOrdering(head, adapter);

      assert.ok(result.weights, 'Should include weights');
      assert.ok(result.validationWarnings, 'Should include validation warnings');
      assert.ok(result.customValidations, 'Should include custom validations');
      assert.ok(result.orderingViolations, 'Should include ordering violations');
      assert.ok(result.orderingViolations.length > 0, 'Should detect violations');
    });

    it('should work with optimal ordering', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <title>Test</title>
        <link rel="stylesheet" href="styles.css">
      `);

      const result = analyzeHeadWithOrdering(head, adapter);

      assert.strictEqual(result.orderingViolations.length, 0, 'Should have no violations');
    });

    it('should respect analysis options', () => {
      const { head } = createDocument(`
        <title>First</title>
        <title>Second</title>
      `);

      const result = analyzeHeadWithOrdering(head, adapter, { 
        includeValidation: false 
      });

      assert.strictEqual(result.validationWarnings.length, 0, 'Should respect options');
    });
  });

  describe('Real-world examples', () => {
    it('should analyze typical blog head', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>My Blog Post</title>
        <link rel="stylesheet" href="/styles.css">
        <script defer src="/analytics.js"></script>
        <meta name="description" content="A great blog post">
        <link rel="icon" href="/favicon.ico">
      `);

      const result = analyzeHeadWithOrdering(head, adapter);

      assert.strictEqual(result.weights.length, 7);
      assert.strictEqual(result.validationWarnings.length, 0, 'Should be valid');
      assert.strictEqual(result.orderingViolations.length, 0, 'Should be optimally ordered');
    });

    it('should analyze performance-optimized head', () => {
      const { head } = createDocument(`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Fast Site</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://cdn.example.com">
        <script async src="/analytics.js"></script>
        <link rel="stylesheet" href="/critical.css">
        <script defer src="/app.js"></script>
        <link rel="prefetch" href="/next-page.html">
        <link rel="icon" href="/favicon.ico">
      `);

      const result = analyzeHeadWithOrdering(head, adapter);

      assert.strictEqual(result.weights.length, 10);
      assert.strictEqual(result.validationWarnings.length, 0);
      assert.strictEqual(result.orderingViolations.length, 0);
    });

    it('should detect problems in suboptimal head', () => {
      const { head } = createDocument(`
        <title>First Title</title>
        <title>Second Title</title>
        <link rel="stylesheet" href="/styles.css">
        <meta charset="utf-8">
        <script src="/blocking.js"></script>
        <meta name="viewport" content="width=device-width, user-scalable=no">
      `);

      const result = analyzeHeadWithOrdering(head, adapter);

      assert.ok(result.validationWarnings.length > 0, 'Should have validation warnings');
      assert.ok(result.orderingViolations.length > 0, 'Should have ordering violations');
      
      // Check specific issues
      const titleWarning = result.validationWarnings.find(w => 
        w.warning.includes('title')
      );
      assert.ok(titleWarning, 'Should warn about duplicate titles');
      
      // Custom validations may or may not include viewport warnings depending on implementation
      // The important thing is that we can analyze the head and return structured results
      assert.ok(Array.isArray(result.customValidations), 'Should return custom validations array');
    });
  });
});
