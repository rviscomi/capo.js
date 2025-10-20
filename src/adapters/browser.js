/**
 * @file Browser DOM adapter
 * 
 * Wraps native DOM Element APIs to implement the HTMLAdapter interface.
 * This adapter is used in browser environments where capo.js operates
 * on actual DOM elements.
 */

/**
 * Browser DOM adapter
 * 
 * Wraps native DOM Element APIs for use with capo.js core logic.
 * 
 * @implements {HTMLAdapter}
 * @example
 * import { BrowserAdapter } from './adapters/browser.js';
 * import { analyzeHead } from './core/analyzer.js';
 * 
 * const adapter = new BrowserAdapter();
 * const head = document.querySelector('head');
 * const result = analyzeHead(head, adapter);
 */
export class BrowserAdapter {
  /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */
  isElement(node) {
    if (!node) return false;
    // Node.ELEMENT_NODE === 1
    return node.nodeType === 1;
  }

  /**
   * Get the tag name of an element (lowercase)
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */
  getTagName(node) {
    if (!node || !node.tagName) {
      return '';
    }
    return node.tagName.toLowerCase();
  }

  /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */
  getAttribute(node, attrName) {
    if (!node || typeof node.getAttribute !== 'function') {
      return null;
    }
    return node.getAttribute(attrName);
  }

  /**
   * Check if element has a specific attribute
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */
  hasAttribute(node, attrName) {
    if (!node || typeof node.hasAttribute !== 'function') {
      return false;
    }
    return node.hasAttribute(attrName);
  }

  /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */
  getAttributeNames(node) {
    if (!node || typeof node.getAttributeNames !== 'function') {
      return [];
    }
    return node.getAttributeNames();
  }

  /**
   * Get text content of a node (for inline scripts/styles)
   * @param {any} node - Element node
   * @returns {string} - Text content
   */
  getTextContent(node) {
    if (!node) {
      return '';
    }
    return node.textContent || '';
  }

  /**
   * Get child elements of a node
   * @param {any} node - Parent node
   * @returns {any[]} - Array of child element nodes (excluding text/comment nodes)
   */
  getChildren(node) {
    if (!node || !node.children) {
      return [];
    }
    return Array.from(node.children);
  }

  /**
   * Get parent element of a node
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */
  getParent(node) {
    if (!node) {
      return null;
    }
    return node.parentElement || null;
  }

  /**
   * Get sibling elements of a node
   * @param {any} node - Element node
   * @returns {any[]} - Array of sibling element nodes (excluding the node itself)
   */
  getSiblings(node) {
    if (!node) {
      return [];
    }
    const parent = node.parentElement;
    if (!parent) {
      return [];
    }
    return Array.from(parent.children).filter(child => child !== node);
  }

  /**
   * Get source location for a node (optional, for linting)
   * 
   * Browser DOM elements don't have source location information,
   * so this always returns null.
   * 
   * @param {any} node - Element node
   * @returns {null}
   */
  getLocation(node) {
    // Not available in browser DOM
    return null;
  }

  /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */
  stringify(node) {
    if (!node || !node.nodeName) {
      return '[invalid node]';
    }

    const tagName = this.getTagName(node);
    const attrNames = this.getAttributeNames(node);
    
    if (attrNames.length === 0) {
      return `<${tagName}>`;
    }

    // Build attribute string
    const attrs = attrNames
      .map(attr => {
        const value = this.getAttribute(node, attr);
        // Escape value for display
        const escapedValue = value ? value.replace(/"/g, '&quot;') : '';
        return `${attr}="${escapedValue}"`;
      })
      .join(' ');

    return `<${tagName} ${attrs}>`;
  }
}
