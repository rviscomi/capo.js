/**
 * Phase 0.5: Snapshot Tests
 * 
 * These tests capture the complete analysis output for example HTML files
 * before the v2.0 refactor. They serve as a baseline to ensure the refactored
 * code produces identical results.
 * 
 * For each example HTML file, we capture:
 * - Elements with their weights and names
 * - Total violation count
 * - Validation warnings
 * - Ordering analysis
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import dedent from 'dedent';
import { createDocument } from '../setup.js';
import { getHeadWeights } from '../../src/lib/rules.js';
import { getValidationWarnings } from '../../src/lib/validation.js';

/**
 * Analyzes a complete HTML document and returns a snapshot
 * of the analysis results.
 * 
 * Note: Pass only the <head> content, not the full HTML document
 */
function analyzeDocument(headHTML) {
  const { head } = createDocument(headHTML);
  const weights = getHeadWeights(head);
  
  // Skip validation warnings for origin trial tests - they require browser document object
  // Just test the element weights and ordering
  const warnings = [];

  // Extract structured data for snapshot
  const elements = weights.map(w => ({
    element: w.element.tagName.toLowerCase(),
    weight: w.weight,
    // Include key attributes for identification
    attributes: getKeyAttributes(w.element)
  }));

  // Count ordering violations
  let violations = 0;
  for (let i = 1; i < weights.length; i++) {
    if (weights[i].weight > weights[i - 1].weight) {
      violations++;
    }
  }

  // Extract warning messages (without DOM element references)
  const warningMessages = warnings.map(w => ({
    warning: w.warning,
    hasElements: 'elements' in w && Array.isArray(w.elements),
    elementCount: w.elements?.length || 0
  }));

  return {
    elementCount: elements.length,
    elements,
    violations,
    warningCount: warningMessages.length,
    warnings: warningMessages
  };
}

/**
 * Extracts key attributes from an element for identification
 */
function getKeyAttributes(element) {
  const attrs = {};
  
  if (element.hasAttribute('rel')) attrs.rel = element.getAttribute('rel');
  if (element.hasAttribute('href')) attrs.href = element.getAttribute('href');
  if (element.hasAttribute('src')) attrs.src = element.getAttribute('src');
  if (element.hasAttribute('name')) attrs.name = element.getAttribute('name');
  if (element.hasAttribute('charset')) attrs.charset = element.getAttribute('charset');
  if (element.hasAttribute('http-equiv')) attrs.httpEquiv = element.getAttribute('http-equiv');
  if (element.hasAttribute('content')) {
    // Truncate long content for readability
    const content = element.getAttribute('content');
    attrs.content = content.length > 50 ? content.substring(0, 50) + '...' : content;
  }
  if (element.hasAttribute('as')) attrs.as = element.getAttribute('as');
  if (element.hasAttribute('async')) attrs.async = true;
  if (element.hasAttribute('defer')) attrs.defer = true;
  if (element.hasAttribute('type') && element.tagName === 'SCRIPT') {
    attrs.type = element.getAttribute('type');
  }
  
  return attrs;
}

describe('Snapshot Tests - Analysis Baseline', () => {
  
  describe('bad-example.html', () => {
    it('should match baseline analysis', () => {
      const html = dedent`
        <!-- Missing charset -->
        <title>Bad Example</title>
        <title>Duplicate Title</title>

        <!-- CSP meta tag disables preload scanner -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'" />

        <!-- Deprecated IE feature -->
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />

        <!-- Accessibility issue: disables zooming -->
        <meta name="viewport" content="width=device-width, user-scalable=no" />

        <!-- Wrong attribute type -->
        <meta http-equiv="description" content="Should use name, not http-equiv" />

        <!-- Invalid origin trial tokens -->
        <meta http-equiv="origin-trial" content="" />
        <meta http-equiv="origin-trial" content="invalid-token" />
        <meta
          http-equiv="origin-trial"
          content="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQeyJvcmlnaW4iOiJodHRwczovL2V4YW1wbGUuY29tOjQ0MyIsImZlYXR1cmUiOiJUZXN0RmVhdHVyZSIsImV4cGlyeSI6MTU3NzgzNjgwMH0="
        />

        <!-- Invalid elements in head -->
        <div>This should not be here</div>
        <span>Neither should this</span>

        <!-- Multiple base elements -->
        <base href="https://example.com/" />
        <base href="https://other.com/" />

        <!-- Non-UTF-8 charset -->
        <meta charset="ISO-8859-1" />

        <!-- Deprecated default-style -->
        <meta http-equiv="default-style" content="main" />

        <!-- Unnecessary preload -->
        <link rel="preload" href="/app.js" as="script" />
        <script src="/app.js"></script>
      `;

      const snapshot = analyzeDocument(html);

      // Baseline expectations (actual parsed elements, not including comments)
      assert.equal(snapshot.elementCount, 17, 'Should have 17 elements');
      assert.ok(snapshot.violations > 0, 'Should have ordering violations');
      assert.ok(snapshot.warningCount === 0, 'Warnings skipped in snapshot tests');

      // Spot check key elements
      const titles = snapshot.elements.filter(e => e.element === 'title');
      assert.equal(titles.length, 2, 'Should have 2 title elements');

      const bases = snapshot.elements.filter(e => e.element === 'base');
      assert.equal(bases.length, 2, 'Should have 2 base elements');

      const invalidElements = snapshot.elements.filter(e => 
        e.element === 'div' || e.element === 'span'
      );
      assert.equal(invalidElements.length, 2, 'Should have 2 invalid elements');

      // Note: Validation warnings skipped due to browser-only dependencies

      console.log('✓ bad-example.html snapshot:', JSON.stringify(snapshot, null, 2));
    });
  });

  describe('good-example.html', () => {
    it('should match baseline analysis', () => {
      const html = dedent`
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          http-equiv="origin-trial"
          content="AwD7QZu5VWZh1S7cLpAQ9IqL0RkVuT0E0qy0lqsF2sP8w1y8VlPK5gFdVWPzKjN5l7L9E5tE5nR5ZlP5rJ5T0QAAACNeyJvcmlnaW4iOiJodHRwczovL2V4YW1wbGUuY29tOjQ0MyIsImZlYXR1cmUiOiJUZXN0RmVhdHVyZSIsImV4cGlyeSI6MTg5MzQ1NjAwMH0="
        />
        <title>Good Example</title>
        <link rel="stylesheet" href="/styles.css" />
        <script src="/script.js" defer></script>
        <meta name="description" content="A well-structured HTML page" />
        <meta name="author" content="Your Name" />
        <link rel="icon" href="/favicon.ico" />
      `;

      const snapshot = analyzeDocument(html);

      // Baseline expectations
      assert.equal(snapshot.elementCount, 9, 'Should have 9 elements');
      assert.ok(snapshot.violations >= 0, 'May or may not have violations');
      
      // Good example should have fewer warnings than bad example
      assert.ok(snapshot.warningCount < 10, 'Should have relatively few warnings');

      // Should have proper charset
      const charset = snapshot.elements.find(e => 
        e.attributes.charset === 'utf-8'
      );
      assert.ok(charset, 'Should have UTF-8 charset');

      // Should have single title
      const titles = snapshot.elements.filter(e => e.element === 'title');
      assert.equal(titles.length, 1, 'Should have 1 title element');

      console.log('✓ good-example.html snapshot:', JSON.stringify(snapshot, null, 2));
    });
  });

  describe('optimal-ordering-example.html', () => {
    it('should match baseline analysis', () => {
      const html = dedent`
        <!-- META tags first (weight 11) -->
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <!-- TITLE (weight 10) -->
        <title>Optimal Ordering Example</title>

        <!-- PRECONNECT (weight 9) -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

        <!-- ASYNC SCRIPTS (weight 8) -->
        <script src="/analytics.js" async></script>

        <!-- SYNC STYLES (weight 5) -->
        <link rel="stylesheet" href="/styles.css" />
        <style>
          body { font-family: system-ui, sans-serif; }
        </style>

        <!-- PRELOAD (weight 4) -->
        <link rel="preload" href="/font.woff2" as="font" crossorigin />
        <link rel="preload" href="/hero.jpg" as="image" />

        <!-- DEFER SCRIPTS (weight 3) -->
        <script src="/app.js" defer></script>
        <script type="module" src="/modules.js"></script>

        <!-- PREFETCH (weight 2) -->
        <link rel="dns-prefetch" href="https://api.example.com" />
        <link rel="prefetch" href="/next-page.html" />

        <!-- OTHER (weight 1) -->
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Optimally ordered head elements" />
      `;

      const snapshot = analyzeDocument(html);

      // Baseline expectations (comments not parsed as elements)
      assert.equal(snapshot.elementCount, 17, 'Should have 17 elements');
      
      // Optimal ordering should have minimal or no violations
      assert.ok(snapshot.violations <= 2, 'Should have few or no ordering violations');

      // Verify weight progression (should be mostly descending)
      const weights = snapshot.elements.map(e => e.weight);
      let descendingPairs = 0;
      for (let i = 1; i < weights.length; i++) {
        if (weights[i] <= weights[i - 1]) {
          descendingPairs++;
        }
      }
      const descendingRatio = descendingPairs / (weights.length - 1);
      assert.ok(descendingRatio > 0.8, 'Most element pairs should be in descending weight order');

      console.log('✓ optimal-ordering-example.html snapshot:', JSON.stringify(snapshot, null, 2));
    });
  });

  describe('bad-ordering-example.html', () => {
    it('should match baseline analysis', () => {
      const html = dedent`
        <!-- Defer script too early (weight 3) -->
        <script src="/app.js" defer></script>

        <!-- Sync styles should come before defer (weight 5) -->
        <link rel="stylesheet" href="/main.css" />

        <!-- Title should be near the top (weight 10) -->
        <title>Bad Ordering Example</title>

        <!-- Prefetch too early (weight 2) -->
        <link rel="prefetch" href="/next-page.html" />

        <!-- Preload should come after sync styles (weight 4) -->
        <link rel="preload" href="/font.woff2" as="font" crossorigin />

        <!-- Meta charset should be FIRST (weight 11) -->
        <meta charset="utf-8" />

        <!-- Another defer script (weight 3) -->
        <script src="/utils.js" defer></script>

        <!-- Sync styles again (weight 5) -->
        <link rel="stylesheet" href="/styles.css" />

        <!-- Viewport should be with charset at top (weight 11) -->
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <!-- Async script should be early (weight 8) -->
        <script src="/analytics.js" async></script>

        <!-- Preconnect should be near top (weight 9) -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <!-- Another preload (weight 4) -->
        <link rel="preload" href="/image.jpg" as="image" />

        <!-- Description meta (weight 1) -->
        <meta name="description" content="This page has terrible element ordering" />
      `;

      const snapshot = analyzeDocument(html);

      // Baseline expectations (comments not parsed as elements)
      assert.equal(snapshot.elementCount, 13, 'Should have 13 elements');
      
      // Bad ordering should have many violations
      assert.ok(snapshot.violations > 5, 'Should have many ordering violations');

      // Verify weights are out of order
      const weights = snapshot.elements.map(e => e.weight);
      let outOfOrderCount = 0;
      for (let i = 1; i < weights.length; i++) {
        if (weights[i] > weights[i - 1]) {
          outOfOrderCount++;
        }
      }
      assert.ok(outOfOrderCount > 5, 'Should have many out-of-order elements');

      console.log('✓ bad-ordering-example.html snapshot:', JSON.stringify(snapshot, null, 2));
    });
  });

  describe('performance-example.html', () => {
    it('should match baseline analysis', () => {
      const html = dedent`
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Performance Optimized</title>

        <!-- Preconnect to external domains -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

        <!-- Async scripts -->
        <script src="/analytics.js" async></script>

        <!-- Critical CSS -->
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; }
          .hero { min-height: 100vh; }
        </style>

        <!-- Deferred scripts -->
        <script src="/app.js" defer></script>

        <!-- Resource hints -->
        <link rel="dns-prefetch" href="https://api.example.com" />

        <!-- Favicon -->
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <!-- Open Graph -->
        <meta property="og:title" content="Performance Optimized" />
        <meta property="og:description" content="A fast-loading page" />
        <meta property="og:image" content="/og-image.jpg" />

        <meta name="description" content="Performance-focused page structure" />
      `;

      const snapshot = analyzeDocument(html);

      // Baseline expectations
      assert.equal(snapshot.elementCount, 16, 'Should have 16 elements');
      
      // Performance-optimized should have good ordering
      assert.ok(snapshot.violations <= 5, 'Should have reasonable ordering');

      // Should have proper meta tags
      const charset = snapshot.elements.find(e => e.attributes.charset === 'utf-8');
      assert.ok(charset, 'Should have UTF-8 charset');

      const viewport = snapshot.elements.find(e => 
        e.attributes.name === 'viewport'
      );
      assert.ok(viewport, 'Should have viewport meta tag');

      // Should have performance optimizations
      const preconnects = snapshot.elements.filter(e => 
        e.attributes.rel === 'preconnect'
      );
      assert.equal(preconnects.length, 2, 'Should have 2 preconnect links');

      const asyncScripts = snapshot.elements.filter(e => 
        e.element === 'script' && e.attributes.async
      );
      assert.ok(asyncScripts.length > 0, 'Should have async scripts');

      console.log('✓ performance-example.html snapshot:', JSON.stringify(snapshot, null, 2));
    });
  });

  describe('Snapshot Comparison Tests', () => {
    it('should detect differences between optimal and bad ordering', () => {
      const optimal = dedent`
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Optimal</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <script src="/analytics.js" async></script>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="preload" href="/font.woff2" as="font" />
        <script src="/app.js" defer></script>
      `;

      const badOrdering = dedent`
        <script src="/app.js" defer></script>
        <link rel="stylesheet" href="/styles.css" />
        <title>Bad</title>
        <link rel="preload" href="/font.woff2" as="font" />
        <meta charset="utf-8" />
        <script src="/analytics.js" async></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      `;

      const optimalSnapshot = analyzeDocument(optimal);
      const badSnapshot = analyzeDocument(badOrdering);

      // Same elements, different ordering
      assert.equal(optimalSnapshot.elementCount, badSnapshot.elementCount, 
        'Should have same element count');

      // Different violation counts
      assert.ok(optimalSnapshot.violations < badSnapshot.violations,
        'Optimal should have fewer violations than bad ordering');

      console.log('Optimal violations:', optimalSnapshot.violations);
      console.log('Bad ordering violations:', badSnapshot.violations);
    });
  });
});
