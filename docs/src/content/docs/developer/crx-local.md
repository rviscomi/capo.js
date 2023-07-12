---
title: Installing the Capo extension locally
description: Learn how to install the Capo extension locally from source
---

Installing the extension from source can be useful if you're a developer testing code changes, or a technical user looking to beta test the latest features. This guide takes you through the steps to install the extension locally.

:::tip
Disable the production version of the extension and pin the local version to ensure that you're always testing the latest changes.
:::

1. Clone the Capo GitHub repository:

    ```sh
    git clone git@github.com:rviscomi/capo.js.git
    ```

2. Navigate to `chrome://extensions` and enable **Developer mode**

    <p style="display: flex; justify-content: center;">
      <img src="/img/developer-mode.png" alt="Developer mode enabled" style="height: 52px;">
    </p>

3. Select **Load unpacked** and choose the `crx` subdirectory

    <p style="display: flex; justify-content: center;">
      <img src="/img/load-unpacked.png" alt="Select the crx directory to load the unpacked extension">
    </p>

If you get the error `Manifest file is missing or unreadable. Could not load manifest.` make sure you're loading the `crx` subdirectory, and not the top-level `capo.js` directory.

If there are any other error messages, it's possible that the latest source code has a bug. Please [file an issue](https://github.com/rviscomi/capo.js/issues/new) so we can investigate.
