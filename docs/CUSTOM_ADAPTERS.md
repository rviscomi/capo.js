# Creating and Testing Custom Adapters

This guide explains how to create custom adapters for capo.js and validate them using the built-in test utilities.

## Why Custom Adapters?

Custom adapters allow you to use capo.js with different HTML parsers or AST formats, such as:
- JSX/React elements
- Vue template AST
- Svelte component AST  
- Custom XML parsers
- Server-side rendering frameworks

## Creating a Custom Adapter

### Step 1: Extend the AdapterInterface

```javascript
import { AdapterInterface } from '@rviscomi/capo.js/adapters';

export class MyCustomAdapter extends AdapterInterface {
  // Implement all 10 required methods
  
  isElement(node) {
    // Return true if node is a valid element for your parser
    return node && node.type === 'YourElementType';
  }
  
  getTagName(node) {
    // Return lowercase tag name
    if (!node) return '';
    return node.tagName?.toLowerCase() || '';
  }
  
  getAttribute(node, name) {
    // Get attribute value (case-insensitive)
    if (!node || !node.attributes) return null;
    const attr = node.attributes.find(a => 
      a.name.toLowerCase() === name.toLowerCase()
    );
    return attr ? attr.value : null;
  }
  
  hasAttribute(node, name) {
    return this.getAttribute(node, name) !== null;
  }
  
  getAttributeNames(node) {
    if (!node || !node.attributes) return [];
    return node.attributes.map(a => a.name);
  }
  
  getTextContent(node) {
    if (!node) return '';
    return node.textContent || '';
  }
  
  getChildren(node) {
    if (!node || !node.children) return [];
    return node.children.filter(child => this.isElement(child));
  }
  
  matches(node, selector) {
    // Implement CSS selector matching
    // You can use a library like css-select or implement simple matching
    if (!node) return false;
    // ... selector matching logic
    return false;
  }
  
  getLocation(node) {
    // Return source location if available, otherwise null
    if (!node || !node.loc) return null;
    return {
      start: { line: node.loc.start.line, column: node.loc.start.column },
      end: { line: node.loc.end.line, column: node.loc.end.column }
    };
  }
  
  stringify(node) {
    // Return string representation of the element
    if (!node) return '';
    const attrs = this.getAttributeNames(node)
      .map(name => `${name}="${this.getAttribute(node, name)}"`)
      .join(' ');
    return `<${this.getTagName(node)}${attrs ? ' ' + attrs : ''}>`;
  }
}
```

### Step 2: Register Your Adapter

```javascript
import { AdapterFactory } from '@rviscomi/capo.js/adapters';
import { MyCustomAdapter } from './my-custom-adapter.js';

// Register the adapter
AdapterFactory.register('my-parser', MyCustomAdapter);

// Now you can use it
const adapter = AdapterFactory.create('my-parser');

// Or let the factory auto-detect it by updating the detect() method
```

## Validating Your Adapter

capo.js provides **three levels of validation** for custom adapters:

### Level 1: Automatic Validation (Registration Time)

The simplest validation happens automatically when you register your adapter:

```javascript
import { AdapterFactory } from '@rviscomi/capo.js/adapters';
import { MyCustomAdapter } from './my-custom-adapter.js';

// This will throw an error if your adapter is invalid
AdapterFactory.register('my-parser', MyCustomAdapter);
// ✅ Validates that all 10 required methods exist
```

**What it checks:**
- Adapter class is a valid constructor
- Adapter can be instantiated
- All 10 required methods are implemented

**When to use:** Quick validation during development.

### Level 2: Programmatic Validation

Use the `validateAdapter()` function for explicit validation:

```javascript
import { validateAdapter } from '@rviscomi/capo.js/adapters';
import { MyCustomAdapter } from './my-custom-adapter.js';

const adapter = new MyCustomAdapter();

try {
  validateAdapter(adapter);
  console.log('✅ Adapter is valid!');
} catch (error) {
  console.error('❌ Adapter validation failed:', error.message);
}
```

**What it checks:**
- All 10 required methods exist
- Each method is a function

**When to use:** Integration tests, CI/CD pipelines.

### Level 3: Full Test Suite

Run the comprehensive test suite to validate behavior:

```javascript
import { describe } from 'node:test';
import { runAdapterTestSuite, testAdapterCompliance } from '@rviscomi/capo.js/adapters';
import { MyCustomAdapter } from './my-custom-adapter.js';
import { parseHtml } from './my-parser.js';  // Your parser

describe('MyCustomAdapter', () => {
  // Full test suite - tests all methods with edge cases
  runAdapterTestSuite(MyCustomAdapter, {
    createElement: (htmlString) => {
      // Your logic to create a node from HTML
      return parseHtml(htmlString);
    },
    supportsLocation: true  // true if getLocation() works
  });
  
  // OR: Quick compliance check only
  testAdapterCompliance(MyCustomAdapter);
});
```

**What it tests:**
- All 10 methods with various inputs
- Edge cases (null, undefined, empty strings)
- Expected return types
- Case-insensitivity
- 39 individual test cases

**When to use:** Comprehensive validation before release.

## Full Example: JSX Adapter

```javascript
// jsx-adapter.js
import { AdapterInterface } from '@rviscomi/capo.js/adapters';

export class JsxAdapter extends AdapterInterface {
  isElement(node) {
    return node && node.type === 'JSXElement';
  }
  
  getTagName(node) {
    if (!this.isElement(node)) return '';
    return node.openingElement.name.name.toLowerCase();
  }
  
  getAttribute(node, name) {
    if (!this.isElement(node)) return null;
    const nameLower = name.toLowerCase();
    const attr = node.openingElement.attributes.find(a => 
      a.name && a.name.name.toLowerCase() === nameLower
    );
    if (!attr || !attr.value) return null;
    return attr.value.value || null;
  }
  
  hasAttribute(node, name) {
    return this.getAttribute(node, name) !== null;
  }
  
  getAttributeNames(node) {
    if (!this.isElement(node)) return [];
    return node.openingElement.attributes
      .filter(a => a.name)
      .map(a => a.name.name);
  }
  
  getTextContent(node) {
    if (!this.isElement(node)) return '';
    // JSX text is in children
    return node.children
      .filter(c => c.type === 'JSXText')
      .map(c => c.value)
      .join('');
  }
  
  getChildren(node) {
    if (!this.isElement(node)) return [];
    return node.children.filter(c => c.type === 'JSXElement');
  }
  
  matches(node, selector) {
    if (!this.isElement(node)) return false;
    
    // Simple selector matching
    const tagMatch = selector.match(/^([a-z0-9-]+)/i);
    if (tagMatch && tagMatch[1] !== this.getTagName(node)) {
      return false;
    }
    
    // Attribute selectors [attr] or [attr="value"]
    const attrMatches = selector.matchAll(/\[([a-z-]+)(?:="([^"]+)")?\]/gi);
    for (const match of attrMatches) {
      const attrName = match[1];
      const attrValue = match[2];
      
      if (!this.hasAttribute(node, attrName)) return false;
      if (attrValue && this.getAttribute(node, attrName) !== attrValue) {
        return false;
      }
    }
    
    return true;
  }
  
  getLocation(node) {
    if (!this.isElement(node) || !node.loc) return null;
    return {
      start: { line: node.loc.start.line, column: node.loc.start.column },
      end: { line: node.loc.end.line, column: node.loc.end.column }
    };
  }
  
  stringify(node) {
    if (!this.isElement(node)) return '';
    const tag = this.getTagName(node);
    const attrs = this.getAttributeNames(node)
      .map(name => `${name}="${this.getAttribute(node, name)}"`)
      .join(' ');
    return `<${tag}${attrs ? ' ' + attrs : ''}>`;
  }
}
```

```javascript
// jsx-adapter.test.js
import { describe } from 'node:test';
import { runAdapterTestSuite } from '@rviscomi/capo.js/adapters';
import { JsxAdapter } from './jsx-adapter.js';
import { parse } from '@babel/parser';

describe('JsxAdapter', () => {
  runAdapterTestSuite(JsxAdapter, {
    createElement: (htmlString) => {
      // Parse HTML-like string as JSX
      const code = `const el = ${htmlString.replace(/>/g, '/>')};`;
      const ast = parse(code, {
        plugins: ['jsx'],
        sourceType: 'module'
      });
      
      // Extract JSX element from AST
      return ast.program.body[0].declarations[0].init;
    },
    supportsLocation: true
  });
});
```

```javascript
// Usage
import { AdapterFactory } from '@rviscomi/capo.js/adapters';
import { JsxAdapter } from './jsx-adapter.js';

// Register the adapter
AdapterFactory.register('jsx', JsxAdapter);

// Use it with capo.js
import { getHeadWeights } from '@rviscomi/capo.js';

const adapter = AdapterFactory.create('jsx');
const weights = getHeadWeights(jsxHeadElement, adapter);
```

## Best Practices

1. **Always extend AdapterInterface** - Don't implement from scratch
2. **Test thoroughly** - Run the full test suite before releasing
3. **Handle null gracefully** - All methods should handle null/undefined inputs
4. **Return consistent types** - Follow the exact return types in the interface
5. **Be case-insensitive** - Attribute names should be case-insensitive
6. **Document your adapter** - Explain what parser/format it supports

## API Reference

### runAdapterTestSuite(AdapterClass, options)

Runs comprehensive tests on a custom adapter.

**Parameters:**
- `AdapterClass` (Function) - The adapter constructor to test
- `options` (Object)
  - `createElement` (Function) - Function that creates test nodes from HTML strings
  - `supportsLocation` (boolean, optional) - Whether adapter supports `getLocation()`. Default: `false`

**Example:**
```javascript
runAdapterTestSuite(MyAdapter, {
  createElement: (html) => parseHtml(html),
  supportsLocation: true
});
```

### testAdapterCompliance(AdapterClass)

Quick compliance check that verifies all required methods exist.

**Parameters:**
- `AdapterClass` (Function) - The adapter constructor to test

**Example:**
```javascript
testAdapterCompliance(MyAdapter);
```

### validateAdapter(adapter)

Programmatically validates an adapter instance.

**Parameters:**
- `adapter` (Object) - Adapter instance to validate

**Throws:** Error if validation fails

**Example:**
```javascript
const adapter = new MyAdapter();
validateAdapter(adapter);  // throws if invalid
```

## Troubleshooting

**"Adapter missing required method: X"**
- Ensure your adapter implements all 10 required methods
- Check for typos in method names
- Verify methods are functions, not properties

**"Cannot detect adapter for node"**
- Your node type isn't recognized by the factory
- Register your adapter explicitly: `AdapterFactory.create('your-name')`
- Or update `AdapterFactory.detect()` to recognize your node type

**Tests failing with "createElement is required"**
- You must provide a `createElement` function in test options
- This function should convert HTML strings to your parser's node format

## Support

For questions or issues with custom adapters:
- [GitHub Issues](https://github.com/rviscomi/capo.js/issues)
- [Discussions](https://github.com/rviscomi/capo.js/discussions)
