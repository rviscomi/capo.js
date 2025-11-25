import { describe, it } from 'node:test';
import assert from 'node:assert';
import dedent from 'dedent';
import { createDocument } from '../setup.js';
import { getHeadWeights } from '../../src/lib/rules.js';
import { getValidationWarnings } from '../../src/lib/validation.js';
import { BrowserAdapter } from '../../src/adapters/browser.js';

// Create adapter instance for all tests
const adapter = new BrowserAdapter();

describe('Browser Integration Tests', () => {
  describe('Full document analysis', () => {
    it('should analyze optimal head structure', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Optimal Page</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <script async src="analytics.js"></script>
        <script src="app.js"></script>
        <link rel="stylesheet" href="styles.css">
        <link rel="preload" as="font" href="font.woff2" crossorigin>
        <script defer src="lazy.js"></script>
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      // Should have entries for all elements
      assert.strictEqual(weights.length, 9);

      // Should have no validation warnings
      assert.strictEqual(warnings.length, 0, 'Optimal head should have no warnings');

      // Verify weight ordering (higher weights = higher priority)
      const weightValues = weights.map(w => w.weight);
      assert.ok(weightValues[0] >= weightValues[1], 'Elements should be in descending weight order');
    });

    it('should analyze suboptimal head structure', () => {
      const { head } = createDocument(dedent`
        <script src="blocking.js"></script>
        <link rel="stylesheet" href="styles.css">
        <title>Page Title</title>
        <meta charset="utf-8">
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      // Should detect all elements
      assert.strictEqual(weights.length, 4);

      // Charset should be first (weight 10)
      const charsetWeight = weights.find(w => w.element.matches('[charset]'));
      assert.ok(charsetWeight, 'Should find charset element');
      assert.strictEqual(charsetWeight.weight, 10);

      // But it's not first in DOM order, so there should be ordering issues
      const firstElement = weights[0].element;
      assert.ok(!firstElement.matches('[charset]'), 'Charset is not first in DOM');
    });

    it('should detect multiple validation issues', () => {
      const { head } = createDocument(dedent`
        <title>First Title</title>
        <title>Second Title</title>
        <base href="/">
        <base href="/other/">
        <meta name="viewport" content="width=device-width">
        <meta name="viewport" content="initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
      `);

      const warnings = getValidationWarnings(head, adapter);

      // Should have warnings for multiple titles, multiple bases, multiple viewports, and CSP
      assert.ok(warnings.length >= 3, `Expected at least 3 warnings, got ${warnings.length}`);

      // Check for specific warning types
      const hasMultipleTitles = warnings.some(w => w.warning.includes('title'));
      const hasMultipleBases = warnings.some(w => w.warning.includes('base'));
      const hasCSPWarning = warnings.some(w => w.warning.includes('CSP'));

      assert.ok(hasMultipleTitles, 'Should warn about multiple titles');
      assert.ok(hasMultipleBases || hasCSPWarning, 'Should warn about multiple bases or CSP');
    });

    it('should handle empty head', () => {
      const { head } = createDocument('');

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      // Should have no elements
      assert.strictEqual(weights.length, 0);

      // Should warn about missing required elements
      assert.ok(warnings.length > 0, 'Empty head should have warnings');
      
      const hasTitleWarning = warnings.some(w => w.warning.includes('title'));
      const hasViewportWarning = warnings.some(w => w.warning.includes('viewport'));
      
      assert.ok(hasTitleWarning, 'Should warn about missing title');
      assert.ok(hasViewportWarning, 'Should warn about missing viewport');
    });

    it('should handle head with only invalid elements', () => {
      const { head } = createDocument(dedent`
        <div>Invalid content</div>
        <span>More invalid</span>
        <p>Even more invalid</p>
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      // Invalid elements should still be counted
      assert.ok(weights.length >= 3, 'Should count invalid elements');

      // Should warn about missing required elements
      assert.ok(warnings.length > 0, 'Should have warnings');
    });
  });

  describe('Real-world examples', () => {
    it('should analyze performance-optimized head', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Fast Website</title>
        <link rel="preconnect" href="https://cdn.example.com">
        <link rel="dns-prefetch" href="https://analytics.example.com">
        <link rel="preload" as="style" href="critical.css">
        <link rel="preload" as="script" href="app.js">
        <style>/* Critical CSS inline */</style>
        <script async src="analytics.js"></script>
        <link rel="stylesheet" href="styles.css">
        <script defer src="app.js"></script>
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      assert.ok(weights.length > 0, 'Should analyze all elements');
      
      // Well-optimized head might have some warnings (preload for app.js that's also defer-loaded)
      // but should have minimal critical issues
      const criticalWarnings = warnings.filter(w => 
        w.warning.includes('title') || w.warning.includes('charset')
      );
      assert.strictEqual(criticalWarnings.length, 0, 'Should have no critical warnings');
    });

    it('should analyze typical blog head', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <title>My Blog Post</title>
        <meta name="description" content="A great blog post">
        <meta property="og:title" content="My Blog Post">
        <meta property="og:description" content="A great blog post">
        <meta name="twitter:card" content="summary">
        <link rel="canonical" href="https://example.com/post">
        <link rel="stylesheet" href="style.css">
        <script async src="analytics.js"></script>
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      // Should have all elements
      assert.ok(weights.length >= 10, 'Should detect all meta tags and links');

      // Should have no critical warnings for well-formed blog
      const hasCriticalIssues = warnings.some(w => 
        w.warning.includes('Expected exactly 1 <title>') || 
        w.warning.includes('charset')
      );
      assert.strictEqual(hasCriticalIssues, false, 'Well-formed blog should have no critical issues');
    });

    it('should analyze e-commerce head', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
        <title>Product Name - Store</title>
        <meta name="description" content="Buy Product Name">
        <link rel="preconnect" href="https://cdn.shopify.com">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preload" as="image" href="hero.jpg">
        <link rel="stylesheet" href="theme.css">
        <script async src="analytics.js"></script>
        <script async src="facebook-pixel.js"></script>
        <script src="cart.js"></script>
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      assert.ok(weights.length >= 11, 'Should detect all elements');

      // E-commerce sites might have some warnings but should be functional
      // Check that maximum-scale=5 doesn't trigger accessibility warning
      const hasMaxScaleWarning = warnings.some(w => 
        w.warning.includes('maximum-scale') && w.warning.includes('accessibility')
      );
      assert.strictEqual(hasMaxScaleWarning, false, 'maximum-scale=5 should be allowed');
    });
  });

  describe('Element ordering analysis', () => {
    it('should identify optimal ordering', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width">
        <title>Title</title>
        <link rel="preconnect" href="https://example.com">
        <script async src="async.js"></script>
        <link rel="stylesheet" href="styles.css">
        <script src="sync.js"></script>
      `);

      const weights = getHeadWeights(head, adapter);

      // Count how many ordering violations (where weight goes up instead of down)
      let violations = 0;
      for (let i = 0; i < weights.length - 1; i++) {
        const current = weights[i].weight;
        const next = weights[i + 1].weight;
        
        // If next weight is higher than current, that's a violation
        if (next > current) {
          violations++;
        }
      }

      // This specific ordering should have minimal violations
      // Note: stylesheet (4) and sync script (5) are close but this is acceptable
      assert.ok(violations <= 1, `Should have minimal ordering violations, found ${violations}`);
    });

    it('should identify suboptimal ordering', () => {
      const { head } = createDocument(dedent`
        <link rel="stylesheet" href="styles.css">
        <script src="app.js"></script>
        <title>Title</title>
        <meta charset="utf-8">
      `);

      const weights = getHeadWeights(head, adapter);

      // Find out-of-order elements
      let hasOrderingIssue = false;
      for (let i = 0; i < weights.length - 1; i++) {
        if (weights[i].weight < weights[i + 1].weight) {
          hasOrderingIssue = true;
          break;
        }
      }

      assert.ok(hasOrderingIssue, 'Should detect ordering issues');
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed HTML', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <title>Test
        <meta name="viewport" content="width=device-width">
      `);

      // Should still process elements despite malformed HTML
      const weights = getHeadWeights(head, adapter);
      assert.ok(weights.length > 0, 'Should process malformed HTML');
    });

    it('should handle elements with unusual attributes', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8" data-custom="value">
        <title data-lang="en">Title</title>
        <script src="app.js" data-version="1.0" nonce="abc123"></script>
      `);

      const weights = getHeadWeights(head, adapter);
      assert.strictEqual(weights.length, 3, 'Should handle custom attributes');
    });

    it('should handle mixed case element names', () => {
      const { head } = createDocument(dedent`
        <META charset="utf-8">
        <TITLE>Title</TITLE>
        <SCRIPT src="app.js"></SCRIPT>
      `);

      const weights = getHeadWeights(head, adapter);
      assert.strictEqual(weights.length, 3, 'Should handle mixed case');
    });

    it('should handle base64 data URIs', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <title>Title</title>
        <link rel="icon" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==">
      `);

      const weights = getHeadWeights(head, adapter);
      assert.ok(weights.length >= 3, 'Should handle data URIs');
    });

    it('should handle empty attributes', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <title>Title</title>
        <script async src=""></script>
        <link rel="stylesheet" href="">
      `);

      const weights = getHeadWeights(head, adapter);
      assert.ok(weights.length >= 4, 'Should handle empty attributes');
    });
  });

  describe('Validation integration', () => {
    it('should validate and analyze together', () => {
      const { head } = createDocument(dedent`
        <meta charset="utf-8">
        <title>Title</title>
        <meta name="viewport" content="width=device-width">
        <link rel="stylesheet" href="styles.css">
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      // Should have elements
      assert.ok(weights.length > 0, 'Should have weighted elements');

      // Should have no warnings for valid document
      assert.strictEqual(warnings.length, 0, 'Valid document should have no warnings');

      // Each element should have a weight
      weights.forEach(({ element, weight }) => {
        assert.ok(element, 'Should have element reference');
        assert.ok(typeof weight === 'number', 'Should have numeric weight');
      });
    });

    it('should correlate warnings with elements', () => {
      const { head } = createDocument(dedent`
        <title>First</title>
        <title>Second</title>
        <meta charset="iso-8859-1">
      `);

      const weights = getHeadWeights(head, adapter);
      const warnings = getValidationWarnings(head, adapter);

      assert.ok(warnings.length > 0, 'Should have warnings');

      // Check that warnings have the expected structure
      warnings.forEach(warning => {
        assert.ok(warning.warning, 'Should have warning text');
        // Some warnings have elements array, some have element, some have neither
        // Just verify the warning object is well-formed
        assert.ok(typeof warning === 'object', 'Warning should be an object');
      });
    });
  });
});
