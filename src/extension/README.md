# Capo Browser Extension Source Code

This directory contains the source code for the Capo browser extension (available for Chrome and Firefox).

## Build Instructions

This extension is built from source using Node.js and Parcel. Follow these steps to produce the exact binary package submitted for verification.

### Requirements

- **Operating System:** macOS, Linux, or Windows.
- **Environment:** 
  - **Node.js:** v18.0.0 or higher (v22.x recommended).
  - **npm:** v9.0.0 or higher (v10.x recommended).

### 1. Installation of Prerequisites

If Node.js and npm are not installed:
- **macOS (via Homebrew):** `brew install node`
- **Windows / Linux:** Download the installer from [nodejs.org](https://nodejs.org/).

Verify installation:
```bash
node -v
npm -v
```

### 2. Install Project Dependencies

Run the following command from the root of the source code directory to install all required development and build dependencies:

```bash
npm install
```

### 3. Execute the Build Script

Run the build script to compile and package the extension:

```bash
npm run build
```

This runs:
- `npm run build:cjs`: Compiles CommonJS bundles using `esbuild`.
- `parcel build`: Compiles, bundles, and minifies the extension source code (`src/extension/capo.js` and `src/extension/options.js`) using `Parcel`.
- `node scripts/build-extension.js`: Copies static files, generates the Firefox-compatible manifest, and packages them.

### 4. Locate Build Outputs

Once the build is complete:
- The compiled Firefox extension files will be in `dist/firefox/`.
- The final zip package submitted to Mozilla is located at `dist/firefox.zip`.
