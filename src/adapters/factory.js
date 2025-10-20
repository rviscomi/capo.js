/**
 * @file Adapter Factory
 * 
 * Provides a registry-based factory for creating adapters.
 * Supports both explicit adapter creation by name and auto-detection
 * from node structure.
 */

import { BrowserAdapter } from './browser.js';
import { HtmlEslintAdapter } from './html-eslint.js';
import { validateAdapter } from './adapter.js';

/**
 * Registry of available adapters
 * Maps adapter names to their constructor classes
 */
const registry = new Map([
  ['browser', BrowserAdapter],
  ['html-eslint', HtmlEslintAdapter],
  ['@html-eslint/parser', HtmlEslintAdapter], // Alias for package name
]);

/**
 * Adapter Factory
 * 
 * Creates adapter instances by name or auto-detects from node structure.
 * 
 * @example
 * // Create by name
 * const adapter = AdapterFactory.create('browser');
 * const adapter = AdapterFactory.create('html-eslint');
 * 
 * // Auto-detect from node
 * const adapter = AdapterFactory.create(document.querySelector('head'));
 * const adapter = AdapterFactory.create(astNode);
 * 
 * // Register custom adapter
 * AdapterFactory.register('jsx', JsxAdapter);
 */
export class AdapterFactory {
  /**
   * Create an adapter by name or auto-detect from node
   * 
   * @param {string|any} nameOrNode - Adapter name string or node to detect from
   * @returns {BrowserAdapter|HtmlEslintAdapter} Adapter instance
   * @throws {Error} If adapter name is unknown or node type cannot be detected
   */
  static create(nameOrNode) {
    // If string name provided, look up in registry
    if (typeof nameOrNode === 'string') {
      return this.createByName(nameOrNode);
    }
    
    // Otherwise auto-detect from node structure
    return this.detect(nameOrNode);
  }

  /**
   * Create an adapter by registered name
   * 
   * @param {string} name - Adapter name ('browser', 'html-eslint', etc.)
   * @returns {BrowserAdapter|HtmlEslintAdapter} Adapter instance
   * @throws {Error} If adapter name is not registered
   */
  static createByName(name) {
    const AdapterClass = registry.get(name);
    
    if (!AdapterClass) {
      const available = Array.from(registry.keys()).join(', ');
      throw new Error(
        `Unknown adapter: "${name}". Available adapters: ${available}`
      );
    }
    
    const adapter = new AdapterClass();
    
    // Validate that adapter implements the interface correctly
    try {
      validateAdapter(adapter);
    } catch (error) {
      throw new Error(
        `Adapter "${name}" failed validation: ${error.message}`
      );
    }
    
    return adapter;
  }

  /**
   * Auto-detect adapter from node structure
   * 
   * Examines the node to determine which adapter should be used.
   * 
   * @param {any} node - Node to examine
   * @returns {BrowserAdapter|HtmlEslintAdapter} Detected adapter
   * @throws {Error} If node type cannot be detected
   */
  static detect(node) {
    if (!node) {
      throw new Error('Cannot detect adapter: node is null or undefined');
    }

    // Browser DOM Element
    // Check for nodeType property (standard DOM API)
    if (typeof node.nodeType === 'number' && node.nodeType === 1) {
      return new BrowserAdapter();
    }

    // @html-eslint/parser AST node
    // Check for type property with Tag/ScriptTag/StyleTag values
    if (node.type === 'Tag' || 
        node.type === 'ScriptTag' || 
        node.type === 'StyleTag') {
      return new HtmlEslintAdapter();
    }

    // Future: JSX AST node detection
    // if (node.type === 'JSXElement') {
    //   return new JsxAdapter();
    // }

    // Unknown node type
    const nodeInfo = node.type 
      ? `type="${node.type}"` 
      : `nodeType=${node.nodeType}`;
    
    throw new Error(
      `Cannot detect adapter for node with ${nodeInfo}. ` +
      'Supported types: Browser DOM Element (nodeType=1), ' +
      '@html-eslint/parser AST (type="Tag"|"ScriptTag"|"StyleTag")'
    );
  }

  /**
   * Register a new adapter
   * 
   * Allows external code to register custom adapters for new parser types.
   * 
   * @param {string} name - Name to register adapter under
   * @param {Function} AdapterClass - Adapter constructor class
   * @throws {Error} If AdapterClass is not a constructor
   * 
   * @example
   * import { JsxAdapter } from './my-jsx-adapter.js';
   * AdapterFactory.register('jsx', JsxAdapter);
   * const adapter = AdapterFactory.create('jsx');
   */
  static register(name, AdapterClass) {
    if (typeof AdapterClass !== 'function') {
      throw new Error(
        `Cannot register adapter "${name}": AdapterClass must be a constructor function`
      );
    }

    // Test that the adapter can be instantiated
    try {
      const testInstance = new AdapterClass();
      validateAdapter(testInstance);
    } catch (error) {
      throw new Error(
        `Cannot register adapter "${name}": ${error.message}`
      );
    }

    registry.set(name, AdapterClass);
  }

  /**
   * List all registered adapter names
   * 
   * @returns {string[]} Array of registered adapter names
   */
  static list() {
    return Array.from(registry.keys());
  }

  /**
   * Check if an adapter is registered
   * 
   * @param {string} name - Adapter name to check
   * @returns {boolean} True if adapter is registered
   */
  static has(name) {
    return registry.has(name);
  }

  /**
   * Unregister an adapter
   * 
   * Useful for testing or removing custom adapters.
   * Cannot remove built-in adapters (browser, html-eslint).
   * 
   * @param {string} name - Adapter name to remove
   * @returns {boolean} True if adapter was removed
   */
  static unregister(name) {
    // Protect built-in adapters
    if (name === 'browser' || name === 'html-eslint' || name === '@html-eslint/parser') {
      throw new Error(`Cannot unregister built-in adapter: "${name}"`);
    }
    
    return registry.delete(name);
  }
}
