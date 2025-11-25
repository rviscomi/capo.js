/**
 * Tests for package exports
 * Verifies that all public APIs are accessible via index.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Package Exports', () => {
  it('should export core analyzer functions', async () => {
    const capo = await import('../src/index.js');
    
    assert.ok(capo.analyzeHead, 'Should export analyzeHead');
    assert.ok(capo.analyzeHeadWithOrdering, 'Should export analyzeHeadWithOrdering');
    assert.ok(capo.checkOrdering, 'Should export checkOrdering');
    assert.ok(capo.getWeightCategory, 'Should export getWeightCategory');
  });

  it('should export rules API', async () => {
    const capo = await import('../src/index.js');
    
    assert.ok(capo.ElementWeights, 'Should export ElementWeights');
    assert.ok(capo.getWeight, 'Should export getWeight');
    assert.ok(capo.getHeadWeights, 'Should export getHeadWeights');
    assert.ok(capo.isMeta, 'Should export isMeta');
    assert.ok(capo.isTitle, 'Should export isTitle');
  });

  it('should export validation API', async () => {
    const capo = await import('../src/index.js');
    
    assert.ok(capo.VALID_HEAD_ELEMENTS, 'Should export VALID_HEAD_ELEMENTS');
    assert.ok(capo.isValidElement, 'Should export isValidElement');
    assert.ok(capo.hasValidationWarning, 'Should export hasValidationWarning');
    assert.ok(capo.getValidationWarnings, 'Should export getValidationWarnings');
    assert.ok(capo.getCustomValidations, 'Should export getCustomValidations');
  });

  it('should export adapters', async () => {
    const capo = await import('../src/index.js');
    
    assert.ok(capo.BrowserAdapter, 'Should export BrowserAdapter');
    assert.ok(capo.AdapterInterface, 'Should export AdapterInterface');
    assert.ok(capo.validateAdapter, 'Should export validateAdapter');
  });


  it('should work with named imports', async () => {
    const { analyzeHead, BrowserAdapter } = await import('../src/index.js');
    
    assert.strictEqual(typeof analyzeHead, 'function');
    assert.strictEqual(typeof BrowserAdapter, 'function');
  });

  it('should support subpath exports - core', async () => {
    const core = await import('../src/core/analyzer.js');
    
    assert.ok(core.analyzeHead, 'Core export should work');
  });

  it('should support subpath exports - adapters', async () => {
    const adapters = await import('../src/adapters/index.js');
    
    assert.ok(adapters.BrowserAdapter, 'Adapters export should work');
  });
});
