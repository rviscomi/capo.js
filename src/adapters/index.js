/**
 * @file Adapter exports
 * 
 * Central export point for all HTML adapters.
 */

export { AdapterInterface, validateAdapter } from './adapter.js';
export { BrowserAdapter } from './browser.js';
export { HtmlEslintAdapter } from './html-eslint.js';
export { AdapterFactory } from './factory.js';
export { runAdapterTestSuite, testAdapterCompliance } from './test-suite.js';
