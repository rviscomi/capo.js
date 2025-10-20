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
   * @param {any} node - Element node
   * @returns {string} - Tag name like 'meta', 'link', 'script'
   */
  getTagName(node) {
    if (!node || !node.name) {
      return '';
    }
    return node.name.toLowerCase();
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
   * Get text content of a node (for inline scripts/styles)
   * @param {any} node - Element node
   * @returns {string} - Text content
   */
  getTextContent(node) {
    if (!node || !node.children) {
      return '';
    }

    return node.children
      .filter(child => child.type === 'VText' || child.type === 'Text')
      .map(child => child.value)
      .join('');
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

    return node.children.filter(child => this.isElement(child));
  }

  /**
   * Check if element matches a simple selector pattern
   * @param {any} node - Element node
   * @param {string} selector - Simple selector (tag[attr="value"])
   * @returns {boolean}
   */
  matches(node, selector) {
    // Implement simple selector matching for common patterns
    return matchesSelector(node, selector, this);
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

/**
 * Simple selector matcher helper (supports tag[attr="value"] patterns)
 * 
 * This is a lightweight implementation for capo's needs.
 * Supports:
 * - Wildcard selector: '*'
 * - Tag selectors: 'meta', 'link', 'script'
 * - Attribute presence: 'script[src]'
 * - Attribute value: 'link[rel="stylesheet"]'
 * - Case-insensitive flag: 'meta[http-equiv="content-type" i]'
 * 
 * @param {any} node - The node to test
 * @param {string} selector - The selector string
 * @param {HtmlEslintAdapter} adapter - The adapter instance
 * @returns {boolean}
 */
function matchesSelector(node, selector, adapter) {
  // Handle wildcard selector
  if (selector === '*') {
    return true;
  }
  
  // Reject complex selectors with combinators (not supported)
  if (selector.includes('>') || selector.includes('+') || selector.includes('~') || /\s/.test(selector.replace(/\s+i\]/g, '').trim())) {
    return false;
  }
  
  // Parse simple selector: tag, tag[attr], tag[attr="value"], etc.
  
  // Extract tag name
  const tagMatch = selector.match(/^([a-z*]+)/i);
  const requiredTag = tagMatch ? tagMatch[1].toLowerCase() : null;
  
  if (requiredTag && requiredTag !== '*' && adapter.getTagName(node) !== requiredTag) {
    return false;
  }

  // Extract attribute requirements [attr="value"]
  // Supports: [attr], [attr="value"], [attr="value" i]
  const attrPattern = /\[([a-z-]+)(?:="([^"]*)")?(?:\s+i)?\]/gi;
  let match;
  
  while ((match = attrPattern.exec(selector)) !== null) {
    const [fullMatch, attrName, attrValue] = match;
    const actualValue = adapter.getAttribute(node, attrName);
    
    if (attrValue === undefined) {
      // Just check attribute exists: [src]
      if (actualValue === null) {
        return false;
      }
    } else {
      // Check attribute value: [rel="stylesheet"]
      const isCaseInsensitive = fullMatch.includes(' i]');
      const expected = isCaseInsensitive ? attrValue.toLowerCase() : attrValue;
      const actual = actualValue === null ? null : 
        (isCaseInsensitive ? actualValue.toLowerCase() : actualValue);
      
      if (actual !== expected) {
        return false;
      }
    }
  }

  return true;
}
