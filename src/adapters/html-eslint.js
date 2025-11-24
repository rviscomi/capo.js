/**
 * @file HTML ESLint Parser adapter for @html-eslint/parser AST nodes
 * 
 * This adapter works with AST nodes from @html-eslint/parser,
 * which is used by eslint-plugin-capo and other HTML linting tools.
 */

/**
 * HTML ESLint Parser adapter for @html-eslint/parser AST nodes
 * 
 * Compatible with eslint-plugin-capo's node structure.
 * 
 * @implements {HTMLAdapter}
 * @example
 * import { HtmlEslintAdapter } from './adapters/html-eslint.js';
 * import { analyzeHead } from './core/analyzer.js';
 * 
 * const adapter = new HtmlEslintAdapter();
 * const headNode = context.getSourceCode().ast; // ESLint context
 * const result = analyzeHead(headNode, adapter);
 */
export class HtmlEslintAdapter {
  /**
   * Check if node is an Element (not text, comment, etc.)
   * @param {any} node - The node to check
   * @returns {boolean}
   */
  isElement(node) {
    if (!node) return false;
    return (
      node.type === 'Tag' ||
      node.type === 'ScriptTag' ||
      node.type === 'StyleTag'
    );
  }

  /**
   * Get the tag name of an element (lowercase)
   * @param {any} element - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */
  getTagName(node) {
    if (!node) {
      return '';
    }
    
    // Special handling for ScriptTag and StyleTag which don't have a name property
    if (node.type === 'ScriptTag') {
      return 'script';
    }
    if (node.type === 'StyleTag') {
      return 'style';
    }
    
    // Regular Tag nodes have a name property
    // Ensure it's lowercase as per the JSDoc
    return node.name ? node.name.toLowerCase() : '';
  }

  /**
   * Get attribute value from element
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {string | null} - Attribute value or null if not found
   */
  getAttribute(node, attrName) {
    if (!node || !node.attributes) {
      return null;
    }

    const normalizedAttrName = attrName.toLowerCase();
    const attr = node.attributes.find(a => {
      const keyName = a.key?.value;
      return keyName?.toLowerCase() === normalizedAttrName;
    });

    if (!attr || !attr.value) {
      return null;
    }

    // Handle different value types
    if (attr.value.type === 'AttributeValue') {
      return attr.value.value;
    }

    // For quoted values
    if (typeof attr.value.value === 'string') {
      return attr.value.value;
    }

    return null;
  }

  /**
   * Check if element has a specific attribute
   * @param {any} node - Element node
   * @param {string} attrName - Attribute name (case-insensitive)
   * @returns {boolean} - True if attribute exists
   */
  hasAttribute(node, attrName) {
    if (!node || !node.attributes) {
      return false;
    }

    const normalizedAttrName = attrName.toLowerCase();
    return node.attributes.some(a => {
      const keyName = a.key?.value;
      return keyName?.toLowerCase() === normalizedAttrName;
    });
  }

  /**
   * Get all attribute names for an element
   * @param {any} node - Element node
   * @returns {string[]} - Array of attribute names
   */
  getAttributeNames(node) {
    if (!node || !node.attributes) {
      return [];
    }

    return node.attributes
      .map(a => a.key?.value)
      .filter(Boolean);
  }

  /**
   * Get the direct children of an element
   * @param {any} node - Element node
   * @returns {any[]} - Array of child element nodes (excluding text nodes)
   */
  getChildren(node) {
    if (!node || !node.children) {
      return [];
    }
    // Return only element children, exclude text nodes and comments
    return node.children.filter(child => this.isElement(child));
  }

  /**
   * Get the text content of an element
   * @param {any} node - Element node
   * @returns {string} - Text content
   */
  getTextContent(node) {
    if (!node) {
      return '';
    }

    // Special handling for StyleTag and ScriptTag which have a value property
    if ((node.type === 'StyleTag' || node.type === 'ScriptTag') && node.value) {
      return node.value.value || '';
    }

    if (!node.children || node.children.length === 0) {
      return '';
    }

    // Concatenate all text nodes (both Text and VText types)
    return node.children
      .filter(child => child.type === 'Text' || child.type === 'VText')
      .map(child => child.value)
      .join('');
  }

  /**
   * Get parent element of a node
   * @param {any} node - Child node
   * @returns {any | null} - Parent element node, or null if no parent
   */
  getParent(node) {
    if (!node || !node.parent) {
      return null;
    }
    // Return parent if it's an element, otherwise null
    return this.isElement(node.parent) ? node.parent : null;
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
    const parent = this.getParent(node);
    if (!parent) {
      return [];
    }
    return this.getChildren(parent).filter(child => child !== node);
  }

  /**
   * Get source location for a node (for linting)
   * @param {any} node - Element node
   * @returns {{ line: number, column: number, endLine?: number, endColumn?: number } | null}
   */
  getLocation(node) {
    if (!node || !node.loc) {
      return null;
    }

    return {
      line: node.loc.start.line,
      column: node.loc.start.column,
      endLine: node.loc.end?.line,
      endColumn: node.loc.end?.column,
    };
  }

  /**
   * Stringify element for logging/debugging
   * @param {any} node - Element node
   * @returns {string} - String representation like "<meta charset='utf-8'>"
   */
  stringify(node) {
    if (!node) {
      return '[invalid node]';
    }

    const tagName = this.getTagName(node);
    const attrNames = this.getAttributeNames(node);

    if (attrNames.length === 0) {
      return `<${tagName}>`;
    }

    const attrs = attrNames
      .map(name => {
        const value = this.getAttribute(node, name);
        if (value === null) {
          // Boolean attribute without value (e.g., async)
          return name;
        }
        const escapedValue = value.replace(/"/g, '\\"');
        return `${name}="${escapedValue}"`;
      })
      .join(' ');

    return `<${tagName} ${attrs}>`;
  }
}
