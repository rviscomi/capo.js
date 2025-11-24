/**
 * @file Base adapter interface for HTML tree operations
 * 
 * This file defines the contract that all adapters must implement.
 * Adapters abstract away environment-specific operations (browser DOM vs AST nodes)
 * to make capo.js core logic reusable across different contexts.
 * 
 * @interface HTMLAdapter
 */

/**
 * Base adapter interface (documentation only)
 * 
 * Actual adapters should implement all these methods.
 * This serves as both documentation and a reference implementation.
 * 
 * @example
 * import { BrowserAdapter } from './browser.js';
 * import { ParserAdapter } from './parser.js';
 * 
 * // For browser DOM:
 * const adapter = new BrowserAdapter();
 * 
 * // For ESLint HTML parser AST:
 * const adapter = new ParserAdapter();
 */
export class AdapterInterface {
  /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */
  isElement(node) {
    throw new Error('isElement() not implemented');
  }

  /**
   * Get the tag name of an element (lowercase)
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */
  getTagName(node) {
    throw new Error('getTagName() not implemented');
  }

  /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */
  getAttribute(node, attrName) {
    throw new Error('getAttribute() not implemented');
  }

  /**
   * Check if element has a specific attribute
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */
  hasAttribute(node, attrName) {
    throw new Error('hasAttribute() not implemented');
  }

  /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */
  getAttributeNames(node) {
    throw new Error('getAttributeNames() not implemented');
  }

  /**
   * Get text content of a node (for inline scripts/styles)
   * @param {any} node - Element node
   * @returns {string} - Text content
   */
  getTextContent(node) {
    throw new Error('getTextContent() not implemented');
  }

  /**
   * Get child elements of a node
   * @param {any} node - Parent node
   * @returns {any[]} - Array of child element nodes (excluding text/comment nodes)
   */
  getChildren(node) {
    throw new Error('getChildren() not implemented');
  }

  /**
   * Get parent element of a node
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */
  getParent(node) {
    throw new Error('getParent() not implemented');
  }

  /**
   * Get sibling elements of a node
   * @param {any} node - Element node
   * @returns {any[]} - Array of sibling element nodes (excluding the node itself)
   */
  getSiblings(node) {
    throw new Error('getSiblings() not implemented');
  }

  /**
   * Get source location for a node (optional, for linting)
   * @param {any} node - Element node
   * @returns {{ line: number, column: number, endLine?: number, endColumn?: number } | null}
   */
  getLocation(node) {
    throw new Error('getLocation() not implemented');
  }

  /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */
  stringify(node) {
    throw new Error('stringify() not implemented');
  }
}

/**
 * Validate that an object implements the HTMLAdapter interface
 * @param {any} adapter - The adapter to validate
 * @throws {Error} If adapter is missing required methods
 */
export function validateAdapter(adapter) {
  const requiredMethods = [
    'isElement',
    'getTagName',
    'getAttribute',
    'hasAttribute',
    'getAttributeNames',
    'getTextContent',
    'getChildren',
    'getParent',
    'getSiblings',
    'getLocation',
    'stringify',
  ];

  for (const method of requiredMethods) {
    if (typeof adapter[method] !== 'function') {
      throw new Error(`Adapter missing required method: ${method}()`);
    }
  }
}
