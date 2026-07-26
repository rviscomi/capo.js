import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const DEFAULT_SRC = 'src/extension';
const DEFAULT_DIST = 'dist';

// Files to exclude from copying (Parcel handles these)
const EXCLUDE = ['capo.js', 'options.js'];

export function copyDir(src, dest, srcBase = src) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    if (src === srcBase && EXCLUDE.includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, srcBase);
    } else {
      // Don't copy manifest.json directly, we handle it separately
      if (src === srcBase && entry.name === 'manifest.json') {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function transformManifestForFirefox(manifest) {
  const firefoxManifest = JSON.parse(JSON.stringify(manifest));
  firefoxManifest.browser_specific_settings = {
    gecko: {
      id: "capo@rviscomi.github.io",
      strict_min_version: "121.0"
    }
  };
  if (firefoxManifest.background && firefoxManifest.background.service_worker) {
    firefoxManifest.background = {
      scripts: [firefoxManifest.background.service_worker]
    };
  }
  return firefoxManifest;
}

export function transformManifestForChrome(manifest) {
  const chromeManifest = JSON.parse(JSON.stringify(manifest));
  delete chromeManifest.browser_specific_settings;
  return chromeManifest;
}

export function buildExtension({ src = DEFAULT_SRC, dist = DEFAULT_DIST, zip = true } = {}) {
  const distChrome = path.join(dist, 'chrome');
  const distFirefox = path.join(dist, 'firefox');

  // 1. Copy all static files
  copyDir(src, distChrome);
  copyDir(src, distFirefox);

  // 2. Handle manifest.json
  const manifestPath = path.join(src, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const firefoxManifest = transformManifestForFirefox(manifest);
    fs.writeFileSync(path.join(distFirefox, 'manifest.json'), JSON.stringify(firefoxManifest, null, 2));

    const chromeManifest = transformManifestForChrome(manifest);
    fs.writeFileSync(path.join(distChrome, 'manifest.json'), JSON.stringify(chromeManifest, null, 2));
  }

  // 3. Copy compiled JS files from chrome to firefox (since Parcel deduplicates identical targets)
  const compiledFiles = [
    'capo.js',
    'options/options.js'
  ];
  for (const file of compiledFiles) {
    const srcFile = path.join(distChrome, file);
    const destFile = path.join(distFirefox, file);
    if (fs.existsSync(srcFile)) {
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
    }
  }

  console.log('Static extension files copied and manifests generated.');

  // 4. Zip the extensions
  if (zip) {
    try {
      console.log('Zipping extensions...');
      // -r: recursive, -q: quiet, -FS: sync (update/delete as needed)
      execSync(`cd ${distChrome} && zip -r -q ../chrome.zip .`);
      console.log('Created dist/chrome.zip');
      execSync(`cd ${distFirefox} && zip -r -q ../firefox.zip .`);
      console.log('Created dist/firefox.zip');
    } catch (error) {
      console.error('Failed to zip extensions:', error.message);
    }
  }
}

// Execute if run directly from CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  buildExtension();
}
