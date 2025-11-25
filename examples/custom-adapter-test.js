/**
 * Example: How to test a custom adapter using the provided test suite
 * 
 * This demonstrates how a consumer can validate their custom adapter
 * implementation using capo.js's built-in test utilities.
 */

import { describe } from 'node:test';
import { runAdapterTestSuite } from '../src/adapters/test-suite.js';
import { testAdapterCompliance } from '@rviscomi/capo.js/adapters';
import { MyJsxAdapter } from './my-jsx-adapter.js';

// Hypothetical JSX parser
function parseJsx(htmlString) {
  // This would use a real JSX parser like @babel/parser
  // For example purposes, we'll assume it returns an AST node
  return {
    type: 'JSXElement',
    openingElement: {
      name: { name: 'meta' },
      attributes: [
        { name: { name: 'charset' }, value: { value: 'utf-8' } }
      ]
    },
    children: []
  };
}

describe('MyJsxAdapter', () => {
  // Option 1: Full test suite
  // Tests all 10 methods with various edge cases
  runAdapterTestSuite(MyJsxAdapter, {
    createElement: (html) => {
      // Your parser/DOM creation logic
      return parseJsx(html);
    },
    supportsLocation: true  // Set to true if your adapter supports getLocation()
  });

  // Option 2: Quick compliance check
  // Just verifies all methods exist and adapter is instantiable
  testAdapterCompliance(MyJsxAdapter);
});
