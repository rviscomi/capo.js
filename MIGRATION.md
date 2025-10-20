# Migration Guide: v1.x to v2.0

This guide helps you migrate from capo.js v1.x to v2.0.

## Overview

Version 2.0 introduces a unified adapter-based architecture that makes capo.js work consistently across different environments (browser, Node.js, ESLint plugins, etc.).

## Breaking Changes

### 1. Adapter Parameter Required

**v1.x:**
```javascript
import { analyzeHead } from 'capo.js';

const result = analyzeHead(document.head);
```

**v2.0:**
```javascript
import { analyzeHead, BrowserAdapter } from 'capo.js';

const adapter = new BrowserAdapter();
const result = analyzeHead(document.head, adapter);
```

**Why?** This change allows capo.js to work with different HTML representations (browser DOM, ESLint AST, jsdom, etc.) through a consistent interface.

### 2. New Entry Point

**v1.x:**
```javascript
// Main entry was src/main.js
import { analyzeHead } from 'capo.js';
```

**v2.0:**
```javascript
// Main entry is now src/index.js with comprehensive exports
import { analyzeHead } from 'capo.js';
```

The entry point change is transparent if you're using named imports from the package root.

## New Features

### Subpath Exports

v2.0 adds subpath exports for more granular imports and better tree-shaking:

```javascript
// Import just the core analyzer
import { analyzeHead } from 'capo.js/core';

// Import just adapters
import { BrowserAdapter } from 'capo.js/adapters';
import { BrowserAdapter } from 'capo.js/adapters/browser';
import { HtmlEslintAdapter } from 'capo.js/adapters/html-eslint';

// Import just rules
import { ElementWeights, getWeight } from 'capo.js/rules';

// Import just validation
import { isValidElement } from 'capo.js/validation';
```

### Adapter System

v2.0 introduces a flexible adapter system:

```javascript
import { 
  BrowserAdapter, 
  HtmlEslintAdapter, 
  AdapterFactory 
} from 'capo.js';

// Browser environment
const browserAdapter = new BrowserAdapter();

// ESLint plugin
const eslintAdapter = new HtmlEslintAdapter();

// Factory pattern
const adapter = AdapterFactory.create('browser');
```

### Custom Adapters

You can create custom adapters for new environments:

```javascript
import { AdapterInterface, validateAdapter } from 'capo.js';

class MyCustomAdapter extends AdapterInterface {
  getTagName(element) {
    return element.tagName.toLowerCase();
  }
  
  getAttribute(element, name) {
    return element.attributes[name];
  }
  
  hasAttribute(element, name) {
    return name in element.attributes;
  }
  
  getChildren(element) {
    return element.children || [];
  }
  
  getTextContent(element) {
    return element.textContent || '';
  }
}

const adapter = new MyCustomAdapter();
validateAdapter(adapter); // Throws if adapter is invalid
```

## Migration Steps

### Step 1: Update Dependencies

```bash
npm install capo.js@2.0.0
```

### Step 2: Import and Create Adapter

Add adapter imports and instantiation:

```diff
- import { analyzeHead } from 'capo.js';
+ import { analyzeHead, BrowserAdapter } from 'capo.js';

+ const adapter = new BrowserAdapter();
```

### Step 3: Update Function Calls

Add the adapter parameter to all capo.js function calls:

```diff
- const result = analyzeHead(document.head);
+ const result = analyzeHead(document.head, adapter);

- const weights = getHeadWeights(document.head);
+ const weights = getHeadWeights(document.head, adapter);

- const warnings = getValidationWarnings(document.head);
+ const warnings = getValidationWarnings(document.head, adapter);
```

### Step 4: (Optional) Use Subpath Exports

Optimize your imports using subpath exports:

```diff
- import { analyzeHead, ElementWeights, isValidElement } from 'capo.js';
+ import { analyzeHead } from 'capo.js/core';
+ import { ElementWeights } from 'capo.js/rules';
+ import { isValidElement } from 'capo.js/validation';
```

## Environment-Specific Guides

### Browser Usage

```javascript
import { analyzeHead, BrowserAdapter } from 'capo.js';

const adapter = new BrowserAdapter();
const result = analyzeHead(document.head, adapter);
console.log(result);
```

### ESLint Plugin Usage

```javascript
import { analyzeHead, HtmlEslintAdapter } from 'capo.js';

export default {
  create(context) {
    const adapter = new HtmlEslintAdapter();
    
    return {
      HTMLElement(node) {
        if (node.name === 'head') {
          const result = analyzeHead(node, adapter);
          // Report issues...
        }
      }
    };
  }
};
```

### Node.js with jsdom

```javascript
import { JSDOM } from 'jsdom';
import { analyzeHead, BrowserAdapter } from 'capo.js';

const dom = new JSDOM('<html><head>...</head></html>');
const adapter = new BrowserAdapter();
const result = analyzeHead(dom.window.document.head, adapter);
```

## API Compatibility

### Maintained APIs

These APIs work the same in v2.0 (just add the adapter parameter):

- `analyzeHead(head, adapter)` ✅
- `getHeadWeights(head, adapter)` ✅
- `getValidationWarnings(head, adapter)` ✅
- `ElementWeights` ✅ (constant, no changes)
- `VALID_HEAD_ELEMENTS` ✅ (constant, no changes)

### New APIs

- `analyzeHeadWithOrdering(head, adapter)` - Enhanced analysis with ordering details
- `checkOrdering(elements)` - Check ordering violations on element array
- `getWeightCategory(weight)` - Get category name for a weight
- `validateAdapter(adapter)` - Validate adapter implementation
- `AdapterFactory.create(type)` - Factory for creating adapters

## Common Issues

### Issue: `adapter is not defined`

**Error:**
```
ReferenceError: adapter is not defined
```

**Solution:**
Import and create an adapter:

```javascript
import { analyzeHead, BrowserAdapter } from 'capo.js';

const adapter = new BrowserAdapter();
const result = analyzeHead(document.head, adapter);
```

### Issue: `Cannot find module 'capo.js/core'`

**Error:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'capo.js/core'
```

**Solution:**
Make sure you're using capo.js v2.0 or later:

```bash
npm install capo.js@^2.0.0
```

### Issue: TypeScript types not found

**Note:** capo.js uses JSDoc for type definitions, not TypeScript `.d.ts` files. Modern editors (VS Code, WebStorm) support JSDoc types automatically.

If you need TypeScript definitions, you can create them manually or use JSDoc types with `checkJs` enabled in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true
  }
}
```

## Support

- **Documentation:** [https://rviscomi.github.io/capo.js/](https://rviscomi.github.io/capo.js/)
- **Issues:** [GitHub Issues](https://github.com/rviscomi/capo.js/issues)
- **Discussions:** [GitHub Discussions](https://github.com/rviscomi/capo.js/discussions)

## Version History

- **v2.0.0** - Adapter-based architecture, subpath exports, enhanced API
- **v1.x** - Original browser-focused implementation
