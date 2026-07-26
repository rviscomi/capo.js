import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SRC = 'src/extension';
const DIST = 'dist';
const DIST_CHROME = path.join(DIST, 'chrome');
const DIST_FIREFOX = path.join(DIST, 'firefox');

// Files to exclude from copying (Parcel handles these)
const EXCLUDE = ['capo.js', 'options.js'];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    if (src === SRC && EXCLUDE.includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // Don't copy manifest.json directly, we handle it separately
      if (src === SRC && entry.name === 'manifest.json') {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copy all static files
copyDir(SRC, DIST_CHROME);
copyDir(SRC, DIST_FIREFOX);

// 2. Handle manifest.json
const manifestPath = path.join(SRC, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Firefox manifest
const firefoxManifest = { ...manifest };
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
fs.writeFileSync(path.join(DIST_FIREFOX, 'manifest.json'), JSON.stringify(firefoxManifest, null, 2));

// Chrome manifest (remove browser_specific_settings if it exists)
const chromeManifest = { ...manifest };
delete chromeManifest.browser_specific_settings;
fs.writeFileSync(path.join(DIST_CHROME, 'manifest.json'), JSON.stringify(chromeManifest, null, 2));

// 3. Copy compiled JS files from chrome to firefox (since Parcel deduplicates identical targets)
const compiledFiles = [
  'capo.js',
  'options/options.js'
];
for (const file of compiledFiles) {
  const src = path.join(DIST_CHROME, file);
  const dest = path.join(DIST_FIREFOX, file);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('Static extension files copied and manifests generated.');

// 4. Zip the extensions
try {
  console.log('Zipping extensions...');
  // -r: recursive, -q: quiet, -FS: sync (update/delete as needed)
  execSync(`cd ${DIST_CHROME} && zip -r -q ../chrome.zip .`);
  console.log('Created dist/chrome.zip');
  execSync(`cd ${DIST_FIREFOX} && zip -r -q ../firefox.zip .`);
  console.log('Created dist/firefox.zip');
} catch (error) {
  console.error('Failed to zip extensions:', error.message);
}
