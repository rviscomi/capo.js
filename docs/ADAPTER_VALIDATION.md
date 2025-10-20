# Adapter Validation Summary

## Three Levels of Validation

capo.js provides three progressive levels for validating custom adapters, from quick checks to comprehensive testing.

---

## 🟢 Level 1: Automatic Validation (Registration)

**Happens when:** You register a custom adapter  
**Validates:** Constructor, instantiation, method existence

```javascript
import { AdapterFactory } from '@rviscomi/capo.js/adapters';
import { MyAdapter } from './my-adapter.js';

// Throws error if invalid
AdapterFactory.register('my-parser', MyAdapter);
// ✅ Adapter validated automatically
```

**What gets checked:**
- ✅ `AdapterClass` is a constructor function
- ✅ Can instantiate: `new AdapterClass()` succeeds
- ✅ All 10 required methods exist and are functions

**Catches:**
- Missing methods
- Non-function methods
- Constructor errors

---

## 🟡 Level 2: Programmatic Validation

**Happens when:** You explicitly call `validateAdapter()`  
**Validates:** Method existence and types

```javascript
import { validateAdapter } from '@rviscomi/capo.js/adapters';
import { MyAdapter } from './my-adapter.js';

const adapter = new MyAdapter();
validateAdapter(adapter);  // Throws if invalid
// ✅ All methods confirmed to exist
```

**What gets checked:**
- ✅ All 10 required methods exist
- ✅ Each method is a function

**Use cases:**
- CI/CD validation
- Integration tests
- Pre-deployment checks

---

## 🔵 Level 3: Full Test Suite

**Happens when:** You run the comprehensive test suite  
**Validates:** Complete behavior with 39 test cases

```javascript
import { describe } from 'node:test';
import { runAdapterTestSuite } from '@rviscomi/capo.js/adapters';
import { MyAdapter } from './my-adapter.js';

describe('MyAdapter', () => {
  runAdapterTestSuite(MyAdapter, {
    createElement: (html) => parseYourFormat(html),
    supportsLocation: true
  });
});
```

**What gets tested (39 tests across 10 methods):**

### `isElement` (3 tests)
- ✅ Returns `true` for valid elements
- ✅ Returns `false` for `null`
- ✅ Returns `false` for `undefined`

### `getTagName` (4 tests)
- ✅ Returns lowercase for `<meta>`
- ✅ Returns lowercase for `<LINK>` (uppercase input)
- ✅ Returns lowercase for `<script>`
- ✅ Handles `null` gracefully

### `getAttribute` (5 tests)
- ✅ Gets attribute value correctly
- ✅ Case-insensitive for attribute names
- ✅ Returns `null` for missing attributes
- ✅ Handles complex values (e.g., `http-equiv`)
- ✅ Handles `null` node gracefully

### `hasAttribute` (4 tests)
- ✅ Returns `true` when attribute exists
- ✅ Returns `false` when attribute missing
- ✅ Case-insensitive matching
- ✅ Handles `null` node gracefully

### `getAttributeNames` (3 tests)
- ✅ Returns all attribute names as array
- ✅ Returns empty array for no attributes
- ✅ Handles `null` node gracefully

### `getTextContent` (5 tests)
- ✅ Gets text from `<title>`
- ✅ Gets text from inline `<script>`
- ✅ Gets text from inline `<style>`
- ✅ Returns empty string for empty element
- ✅ Handles `null` node gracefully

### `getChildren` (3 tests)
- ✅ Returns array of child elements
- ✅ Returns empty array for no children
- ✅ Handles `null` node gracefully

### `matches` (6 tests)
- ✅ Matches simple tag selector (`meta`)
- ✅ Matches attribute selector (`[charset]`)
- ✅ Matches attribute value selector (`[charset="utf-8"]`)
- ✅ Matches complex selector (`link[rel="preload"][as="font"]`)
- ✅ Returns `false` for non-matching selector
- ✅ Handles `null` node gracefully

### `getLocation` (2 tests)
- ✅ Returns location object (if `supportsLocation: true`)
- ✅ Returns `null` (if `supportsLocation: false`)
- ✅ Handles `null` node gracefully

### `stringify` (4 tests)
- ✅ Stringifies element with single attribute
- ✅ Stringifies element with multiple attributes
- ✅ Stringifies element with no attributes
- ✅ Handles `null` node gracefully

**Use cases:**
- Pre-release validation
- Ensuring compatibility
- Catching edge case bugs

---

## Quick Compliance Test

For a lighter-weight check, use `testAdapterCompliance()`:

```javascript
import { testAdapterCompliance } from '@rviscomi/capo.js/adapters';
import { MyAdapter } from './my-adapter.js';

testAdapterCompliance(MyAdapter);
// Only checks method existence and instantiation
```

**What it checks:**
- ✅ All 10 required methods exist
- ✅ Adapter can be instantiated

**When to use:** Quick smoke tests, development iteration

---

## Comparison Table

| Validation Level | When | What | Tests | Time | Use Case |
|-----------------|------|------|-------|------|----------|
| **Registration** | `AdapterFactory.register()` | Method existence | 1 | <1ms | Automatic safety check |
| **Programmatic** | `validateAdapter()` | Method types | 1 | <1ms | CI/CD, integration tests |
| **Compliance** | `testAdapterCompliance()` | Methods + instantiation | 2 | ~10ms | Quick validation |
| **Full Suite** | `runAdapterTestSuite()` | Complete behavior | 39 | ~100ms | Comprehensive validation |

---

## Recommended Workflow

1. **During Development**
   ```javascript
   // Quick check while iterating
   AdapterFactory.register('test', MyAdapter);
   ```

2. **In Unit Tests**
   ```javascript
   // Comprehensive validation
   describe('MyAdapter', () => {
     runAdapterTestSuite(MyAdapter, options);
   });
   ```

3. **In CI/CD**
   ```javascript
   // Automated validation
   it('should be a valid adapter', () => {
     const adapter = new MyAdapter();
     validateAdapter(adapter);
   });
   ```

4. **Before Release**
   ```bash
   # Run full test suite
   npm test
   ```

---

## Error Messages

### "Adapter missing required method: X"
**Cause:** Method `X` doesn't exist or isn't a function  
**Fix:** Implement the missing method

### "Cannot register adapter: AdapterClass must be a constructor function"
**Cause:** Passed a non-constructor to `register()`  
**Fix:** Pass a class or constructor function

### "createElement function is required in test options"
**Cause:** Didn't provide `createElement` to test suite  
**Fix:** Add `createElement` function to test options

### "Cannot detect adapter for node with type=..."
**Cause:** Node type not recognized by factory  
**Fix:** Use `AdapterFactory.create('name')` instead of auto-detection

---

## Complete Example

```javascript
// my-adapter.js - Implementation
import { AdapterInterface } from '@rviscomi/capo.js/adapters';

export class MyAdapter extends AdapterInterface {
  // ... implement all 10 methods
}

// my-adapter.test.js - Validation
import { describe, it } from 'node:test';
import { 
  validateAdapter,
  runAdapterTestSuite,
  testAdapterCompliance,
  AdapterFactory
} from '@rviscomi/capo.js/adapters';
import { MyAdapter } from './my-adapter.js';

describe('MyAdapter', () => {
  // Level 1: Registration validation
  it('should register successfully', () => {
    AdapterFactory.register('my-parser', MyAdapter);
  });

  // Level 2: Programmatic validation
  it('should pass validateAdapter', () => {
    const adapter = new MyAdapter();
    validateAdapter(adapter);
  });

  // Level 2.5: Compliance check
  testAdapterCompliance(MyAdapter);

  // Level 3: Full test suite
  runAdapterTestSuite(MyAdapter, {
    createElement: (html) => parseMyFormat(html),
    supportsLocation: true
  });
});
```

---

## See Also

- [CUSTOM_ADAPTERS.md](./CUSTOM_ADAPTERS.md) - Complete guide to creating custom adapters
- [AdapterInterface](../src/adapters/adapter.js) - Interface definition
- [Test Suite Source](../src/adapters/test-suite.js) - Test suite implementation
