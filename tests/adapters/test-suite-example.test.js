/**
 * Example: Using the test suite with BrowserAdapter
 * 
 * This demonstrates that the test suite works correctly.
 */

import { describe } from 'node:test';
import { JSDOM } from 'jsdom';
import { runAdapterTestSuite } from '../../src/adapters/test-suite.js';
import { BrowserAdapter } from '../../src/adapters/browser.js';

describe('BrowserAdapter (via test suite)', () => {
  runAdapterTestSuite(BrowserAdapter, {
    createElement: (html) => {
      const dom = new JSDOM(`<!DOCTYPE html><html><head>${html}</head><body></body></html>`);
      return dom.window.document.head.firstElementChild;
    },
    supportsLocation: false  // Browser DOM doesn't have source locations
  });
});
