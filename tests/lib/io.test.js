import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IO } from '../../src/lib/io.js';
import { Options } from '../../src/lib/options.js';
import { createDocument, mockConsole } from '../setup.js';

describe('IO', () => {
  describe('logElement', () => {
    it('should not throw TypeError when customValidations is undefined', () => {
      const { document } = createDocument('');
      const console = mockConsole();
      const options = new Options();
      const io = new IO(document, options, console);

      const viz = { visual: 'test', style: 'color: red' };
      const element = document.createElement('div');

      // This should not throw
      assert.doesNotThrow(() => {
        io.logElement({
          viz,
          weight: 1,
          element,
          isValid: true,
          // customValidations is omitted, simulating undefined
        });
      });

      const logs = console.getLogs();
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].type, 'log');
    });

    it('should handle customValidations with payload', () => {
      const { document } = createDocument('');
      const console = mockConsole();
      const options = new Options();
      const io = new IO(document, options, console);

      const viz = { visual: 'test', style: 'color: red' };
      const element = document.createElement('div');
      const customValidations = {
        payload: { expiry: '2025-01-01' },
        warnings: []
      };

      io.logElement({
        viz,
        weight: 1,
        element,
        isValid: true,
        customValidations
      });

      const logs = console.getLogs();
      assert.strictEqual(logs.length, 1);
      assert.ok(logs[0].args.some(arg => arg && arg.expiry instanceof Date));
    });

    it('should handle customValidations with warnings', () => {
      const { document } = createDocument('');
      const console = mockConsole();
      const options = new Options();
      const io = new IO(document, options, console);

      const viz = { visual: 'test', style: 'color: red' };
      const element = document.createElement('div');
      const customValidations = {
        warnings: ['Test warning']
      };

      io.logElement({
        viz,
        weight: 1,
        element,
        isValid: true,
        customValidations
      });

      const logs = console.getLogs();
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].type, 'warn');
      assert.ok(logs[0].args.some(arg => typeof arg === 'string' && arg.includes('Test warning')));
    });
  });

  describe('getElementVisualization', () => {
    it('should not return striped background for invalid elements', () => {
      const { document } = createDocument('');
      const options = new Options();
      const io = new IO(document, options, mockConsole());

      const weight = 1;
      const isValid = false;
      const viz = io.getElementVisualization(weight, isValid);

      assert.ok(viz.style.includes('color:'));
      assert.ok(!viz.style.includes('background-image'));
      assert.ok(!viz.style.includes('-webkit-background-clip: text'));
      assert.ok(!viz.style.includes('color: transparent'));
    });

    it('should return normal style for valid elements', () => {
      const { document } = createDocument('');
      const options = new Options();
      const io = new IO(document, options, mockConsole());

      const weight = 1;
      const isValid = true;
      const viz = io.getElementVisualization(weight, isValid);

      assert.ok(viz.style.includes('color:'));
      assert.ok(!viz.style.includes('background-image'));
    });
  });

  describe('getHeadVisualization', () => {
    it('should return striped background for invalid elements', () => {
      const { document } = createDocument('');
      const options = new Options();
      const io = new IO(document, options, mockConsole());

      const elements = [
        { weight: 1, isValid: false }
      ];
      const viz = io.getHeadVisualization(elements);

      assert.ok(viz.styles[0].includes('background-image'));
      assert.ok(viz.styles[0].includes('repeating-linear-gradient'));
    });

    it('should return solid background for valid elements', () => {
      const { document } = createDocument('');
      const options = new Options();
      const io = new IO(document, options, mockConsole());

      const elements = [
        { weight: 1, isValid: true }
      ];
      const viz = io.getHeadVisualization(elements);

      assert.ok(viz.styles[0].includes('background-color'));
      assert.ok(!viz.styles[0].includes('background-image'));
    });
  });
});
