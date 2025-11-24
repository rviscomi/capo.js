# [rviscomi/capo.js](https://github.com/rviscomi/capo.js)
_Get your `<head>` in order_

Inspired by [Harry Roberts](https://twitter.com/csswizardry)' work on [ct.css](https://csswizardry.com/ct/) and [Vitaly Friedman](https://twitter.com/smashingmag)'s [Nordic.js 2022 presentation](https://youtu.be/uqLl-Yew2o8?t=2873):

![image](https://github.com/rviscomi/capo.js/assets/1120896/2319bf3e-21b3-48dd-afcd-a1d379a1daeb)

## Why it matters

How you order elements in the `<head>` can have an effect on the (perceived) performance of the page.

This script helps you identify which elements are out of order.

## How to use it

✨ _New: Install the [Capo Chrome extension](https://chrome.google.com/webstore/detail/capo-get-your-%3Chead%3E-in-o/ohabpnaccigjhkkebjofhpmebofgpbeb)_ ✨

1. Install the [Chrome extension](https://chrome.google.com/webstore/detail/capo/ohkeehjepccojmgephomofandmjaafid)
3. Explore the console logs

<img width="1552" alt="capo screenshot" src="https://github.com/rviscomi/capo.js/assets/1120896/b29672f9-1f05-4a05-a85e-df27acd153bd">

For applications that add lots of dynamic content to the `<head>` on the client, it'd be more accurate to look at the server-rendered `<head>` instead.

## Programmatic API (v2.0)

You can also use capo.js programmatically to analyze HTML `<head>` elements in Node.js or other JavaScript environments.

### Installation

```bash
npm install @rviscomi/capo.js
```

### Basic Usage

```javascript
import { analyzeHead, HtmlEslintAdapter } from '@rviscomi/capo.js';

// Analyze a head element
const head = /* your head element */;
const adapter = new HtmlEslintAdapter();
const result = analyzeHead(head, adapter);

console.log(result.elements);      // Array of head elements with weights
console.log(result.violations);    // Number of ordering violations
console.log(result.warnings);      // Validation warnings
```

### Using Adapters

Capo.js uses adapters to work with different HTML representations:

```javascript
import { analyzeHead, BrowserAdapter, HtmlEslintAdapter } from '@rviscomi/capo.js';

// For browser DOM (if using in browser context)
const browserAdapter = new BrowserAdapter();
const browserResult = analyzeHead(document.head, browserAdapter);

// For @html-eslint (in ESLint plugins)
const eslintAdapter = new HtmlEslintAdapter();
const eslintResult = analyzeHead(headNode, eslintAdapter);
```

### Subpath Exports

Import only what you need for smaller bundle sizes:

```javascript
// Import just the core analyzer
import { analyzeHead, checkOrdering } from '@rviscomi/capo.js/core';

// Import just adapters
import { BrowserAdapter, HtmlEslintAdapter } from '@rviscomi/capo.js/adapters';

// Import specific adapters
import { BrowserAdapter } from '@rviscomi/capo.js/adapters/browser';

// Import rules API
import { ElementWeights, getWeight } from '@rviscomi/capo.js/rules';

// Import validation API
import { isValidElement, getValidationWarnings } from '@rviscomi/capo.js/validation';
```

### API Reference

#### Core Functions

- `analyzeHead(head, adapter)` - Analyzes a head element and returns detailed results
- `analyzeHeadWithOrdering(head, adapter)` - Analyzes with ordering violations
- `checkOrdering(elements)` - Checks for ordering violations in element array
- `getWeightCategory(weight)` - Gets the category name for a weight value

#### Rules API

- `ElementWeights` - Constant object mapping element types to weight values
- `getWeight(element, adapter)` - Gets the weight for a specific element
- `getHeadWeights(head, adapter)` - Gets weights for all elements in head

Plus individual detector functions: `isMeta()`, `isTitle()`, `isPreconnect()`, etc.

#### Validation API

- `VALID_HEAD_ELEMENTS` - Array of valid head element names
- `isValidElement(element, adapter)` - Checks if an element is valid in head
- `hasValidationWarning(element, adapter)` - Checks if element has warnings
- `getValidationWarnings(head, adapter)` - Gets all validation warnings
- `getCustomValidations(element, adapter)` - Gets custom validation rules

#### Adapters

- `BrowserAdapter` - For working with browser DOM elements
- `HtmlEslintAdapter` - For working with @html-eslint AST nodes
- `AdapterFactory` - Factory for creating adapters from strings
- `AdapterInterface` - Base interface for custom adapters
- `validateAdapter(adapter)` - Validates an adapter implementation

### Migration from v1.x

See [MIGRATION.md](MIGRATION.md) for detailed migration guide.

**Key changes:**
- All analysis functions now require an adapter parameter
- New subpath exports for granular imports
- Enhanced TypeScript support via JSDoc

### Chrome extension

![Capo.js Chrome extension](https://github.com/rviscomi/capo.js/assets/1120896/389bcec0-567d-448f-9897-eee5ca373e6b)

WIP see [crx/](crx/)


### Other

Alternatively, you can use local overrides in DevTools to manually inject the capo.js script into the document so that it runs before anything else, eg the first child of `<body>`. Harry Roberts also has a nifty [video](https://www.youtube.com/watch?v=UOn0b5kn3jk) showing how to use this feature. This has some drawbacks as well, for example the inline script might be blocked by CSP.

Another idea would be to use something like Cloudflare workers to inject the script into the HTML stream. To work around CSP issues, you can write the worker in such a way that it parses out the correct `nonce` and adds it to the inline script. _(Note: Not tested, but please share examples if you get it working! _😄_)_

## Summary view

The script logs two info groups to the console: the actual order of the `<head>`, and the optimal order. In this collapsed view, you can see at a glance whether there are any high impact elements out of order.

Each "weight" has a corresponding color, with red being the highest and blue/grey being the lowest. See [capo.js](https://github.com/rviscomi/capo.js/blob/main/capo.js#L1-L13) for the exact mapping.

Here are a few examples.

### www.nytimes.com

<img width="1314" alt="image" src="https://github.com/rviscomi/capo.js/assets/1120896/5c19e758-9f88-42c1-81e8-9f757a6c92be">

### docs.github.io

<img width="819" alt="image" src="https://github.com/rviscomi/capo.js/assets/1120896/798a0e99-04dd-4d27-a241-b5d77320a46e">

### web.dev

<img width="842" alt="image" src="https://github.com/rviscomi/capo.js/assets/1120896/fe6bb67c-697a-4fdf-aa28-52429239fcf5">

## stackoverflow.com

<img width="626" alt="image" src="https://github.com/rviscomi/capo.js/assets/1120896/8964fed2-e933-4795-ada6-79c56cbc416d">

## Detailed view

Expanding the actual or sorted views reveals the detailed view. This includes an itemized list of each `<head>` element and its weight as well as a reference to the actual or sorted `<head>` element.

### www.nytimes.com

Here you can see a drilled-down view of the end of the `<head>` for the NYT site, where high impact origin trial meta elements are set too late.

<img width="472" alt="image" src="https://github.com/rviscomi/capo.js/assets/1120896/c0342d54-9e23-4b91-8df1-277c251ee0c5">
