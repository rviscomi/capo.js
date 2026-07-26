import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  transformManifestForFirefox,
  transformManifestForChrome,
  buildExtension
} from '../../scripts/build-extension.js';

describe('build-extension', () => {
  describe('transformManifestForFirefox', () => {
    it('should add browser_specific_settings.gecko', () => {
      const inputManifest = {
        manifest_version: 3,
        name: 'Capo Test',
        version: '1.0.0',
        background: {
          service_worker: 'background.js'
        }
      };

      const result = transformManifestForFirefox(inputManifest);

      assert.deepEqual(result.browser_specific_settings, {
        gecko: {
          id: 'capo@rviscomi.github.io',
          strict_min_version: '121.0'
        }
      });
    });

    it('should convert background.service_worker to background.scripts', () => {
      const inputManifest = {
        manifest_version: 3,
        name: 'Capo Test',
        version: '1.0.0',
        background: {
          service_worker: 'background.js'
        }
      };

      const result = transformManifestForFirefox(inputManifest);

      assert.deepEqual(result.background, {
        scripts: ['background.js']
      });
      assert.equal(result.background.service_worker, undefined);
    });

    it('should not mutate the input manifest', () => {
      const inputManifest = {
        manifest_version: 3,
        name: 'Capo Test',
        version: '1.0.0',
        background: {
          service_worker: 'background.js'
        }
      };

      transformManifestForFirefox(inputManifest);

      assert.equal(inputManifest.background.service_worker, 'background.js');
      assert.equal(inputManifest.browser_specific_settings, undefined);
    });

    it('should handle manifest without background service worker', () => {
      const inputManifest = {
        manifest_version: 3,
        name: 'Capo Test',
        version: '1.0.0'
      };

      const result = transformManifestForFirefox(inputManifest);

      assert.deepEqual(result.browser_specific_settings, {
        gecko: {
          id: 'capo@rviscomi.github.io',
          strict_min_version: '121.0'
        }
      });
      assert.equal(result.background, undefined);
    });
  });

  describe('transformManifestForChrome', () => {
    it('should remove browser_specific_settings if present', () => {
      const inputManifest = {
        manifest_version: 3,
        name: 'Capo Test',
        version: '1.0.0',
        browser_specific_settings: {
          gecko: { id: 'test@example.com' }
        }
      };

      const result = transformManifestForChrome(inputManifest);

      assert.equal(result.browser_specific_settings, undefined);
      assert.equal(result.name, 'Capo Test');
    });

    it('should pass through manifest without browser_specific_settings', () => {
      const inputManifest = {
        manifest_version: 3,
        name: 'Capo Test',
        version: '1.0.0',
        background: {
          service_worker: 'background.js'
        }
      };

      const result = transformManifestForChrome(inputManifest);

      assert.equal(result.browser_specific_settings, undefined);
      assert.equal(result.background.service_worker, 'background.js');
    });

    it('should not mutate the input manifest', () => {
      const inputManifest = {
        manifest_version: 3,
        name: 'Capo Test',
        version: '1.0.0',
        browser_specific_settings: {
          gecko: { id: 'test@example.com' }
        }
      };

      transformManifestForChrome(inputManifest);

      assert.deepEqual(inputManifest.browser_specific_settings, {
        gecko: { id: 'test@example.com' }
      });
    });
  });

  describe('buildExtension', () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'capo-test-build-'));
    });

    afterEach(() => {
      if (tmpDir && fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    function createTestSource(files = {}) {
      const srcDir = path.join(tmpDir, 'src');
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(srcDir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
      }
      return srcDir;
    }

    describe('Chrome output', () => {
      it('should generate a valid Chrome manifest', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({
            manifest_version: 3,
            name: 'Capo Extension',
            version: '2.2.0',
            background: { service_worker: 'background.js' }
          }),
          'background.js': 'console.log("bg");'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'chrome', 'manifest.json'), 'utf8'));
        assert.equal(manifest.browser_specific_settings, undefined);
        assert.equal(manifest.background.service_worker, 'background.js');
      });

      it('should copy static files', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({ manifest_version: 3 }),
          'background.js': 'console.log("bg");',
          'capo.html': '<html></html>'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        assert.ok(fs.existsSync(path.join(distDir, 'chrome', 'background.js')));
        assert.ok(fs.existsSync(path.join(distDir, 'chrome', 'capo.html')));
      });

      it('should exclude capo.js from static copy', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({ manifest_version: 3 }),
          'capo.js': 'console.log("capo");'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        assert.ok(!fs.existsSync(path.join(distDir, 'chrome', 'capo.js')));
      });

      it('should exclude options.js from static copy', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({ manifest_version: 3 }),
          'options.js': 'console.log("options");'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        assert.ok(!fs.existsSync(path.join(distDir, 'chrome', 'options.js')));
      });
    });

    describe('Firefox output', () => {
      it('should generate a valid Firefox manifest', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({
            manifest_version: 3,
            name: 'Capo Extension',
            version: '2.2.0',
            background: { service_worker: 'background.js' }
          }),
          'background.js': 'console.log("bg");'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'firefox', 'manifest.json'), 'utf8'));
        assert.deepEqual(manifest.browser_specific_settings, {
          gecko: {
            id: 'capo@rviscomi.github.io',
            strict_min_version: '121.0'
          }
        });
        assert.deepEqual(manifest.background, { scripts: ['background.js'] });
        assert.equal(manifest.background.service_worker, undefined);
      });

      it('should copy static files', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({ manifest_version: 3 }),
          'background.js': 'console.log("bg");',
          'capo.html': '<html></html>'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'background.js')));
        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'capo.html')));
      });
    });

    describe('subdirectory handling', () => {
      it('should copy files in subdirectories recursively', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({ manifest_version: 3 }),
          'images/icon128.png': 'fake-png-data',
          'images/icon256.png': 'fake-png-data',
          'options/options.html': '<html></html>',
          'styles/panel.css': 'body {}'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        assert.ok(fs.existsSync(path.join(distDir, 'chrome', 'images', 'icon128.png')));
        assert.ok(fs.existsSync(path.join(distDir, 'chrome', 'options', 'options.html')));
        assert.ok(fs.existsSync(path.join(distDir, 'chrome', 'styles', 'panel.css')));
        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'images', 'icon128.png')));
        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'options', 'options.html')));
        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'styles', 'panel.css')));
      });

      it('should not exclude capo.js inside nested subdirectories', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({ manifest_version: 3 }),
          'lib/capo.js': 'console.log("nested capo");'
        });
        const distDir = path.join(tmpDir, 'dist');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        assert.ok(fs.existsSync(path.join(distDir, 'chrome', 'lib', 'capo.js')));
        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'lib', 'capo.js')));
      });
    });

    describe('compiled JS sync', () => {
      it('should copy compiled JS files from dist/chrome to dist/firefox', () => {
        const srcDir = createTestSource({
          'manifest.json': JSON.stringify({ manifest_version: 3, name: 'Test' })
        });
        const distDir = path.join(tmpDir, 'dist');

        // Simulate Parcel having built compiled files in dist/chrome
        const chromeDir = path.join(distDir, 'chrome');
        fs.mkdirSync(path.join(chromeDir, 'options'), { recursive: true });
        fs.writeFileSync(path.join(chromeDir, 'capo.js'), '// compiled capo.js');
        fs.writeFileSync(path.join(chromeDir, 'options', 'options.js'), '// compiled options.js');

        buildExtension({ src: srcDir, dist: distDir, zip: false });

        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'capo.js')));
        assert.equal(fs.readFileSync(path.join(distDir, 'firefox', 'capo.js'), 'utf8'), '// compiled capo.js');
        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'options', 'options.js')));
        assert.equal(fs.readFileSync(path.join(distDir, 'firefox', 'options', 'options.js'), 'utf8'), '// compiled options.js');
      });
    });

    describe('edge cases', () => {
      it('should handle missing manifest.json without error', () => {
        const srcDir = createTestSource({
          'background.js': 'console.log("bg");'
        });
        const distDir = path.join(tmpDir, 'dist');

        assert.doesNotThrow(() => {
          buildExtension({ src: srcDir, dist: distDir, zip: false });
        });

        assert.ok(fs.existsSync(path.join(distDir, 'chrome', 'background.js')));
        assert.ok(fs.existsSync(path.join(distDir, 'firefox', 'background.js')));
        // No manifest should be written
        assert.ok(!fs.existsSync(path.join(distDir, 'chrome', 'manifest.json')));
        assert.ok(!fs.existsSync(path.join(distDir, 'firefox', 'manifest.json')));
      });
    });
  });
});
