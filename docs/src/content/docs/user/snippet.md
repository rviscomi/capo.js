---
title: Using the capo.js snippet
description: Learn how to use the capo.js snippet
hero:
  title: Using the <code>capo.js</code> snippet
  actions:
    - text: Get the latest source
      link: https://raw.githubusercontent.com/rviscomi/capo.js/main/capo.js
      icon: github
      variant: primary
---

The capo.js snippet is a small script that you can manually run in DevTools. The output is written to the console and includes validation warnings, the actual `<head>` order, and the sorted `<head>` order.

:::caution
The current snapshot of the source code might include bugs. Periodically update your snippet code for the latest bug fixes and features by copy/pasting from [capo.js](https://raw.githubusercontent.com/rviscomi/capo.js/main/snippet/capo.js) or use the [Capo extension](http://localhost:3000/capo.js/user/extension/), which auto-updates.
:::

## DevTools installation

Here's how to install the snippet to Chrome DevTools:

1. Copy [capo.js](https://raw.githubusercontent.com/rviscomi/capo.js/main/snippet/capo.js)
2. [Open DevTools](https://developer.chrome.com/docs/devtools/open/) and navigate to the **Snippets** view of the **Sources** panel

    ![Sources panel of DevTools](/img/devtools-sources.png)

3. Select **＋ New Snippet**, name it `capo.js`, and paste the script

    ![DevTools snippet](/img/devtools-snippet.png)

To run the snippet:

- Press the **▷** button
- Press <kbd>Cmd+Enter</kbd>

Navigate to the **Console** panel to view the results.

![Console output in DevTools](/img/devtools-console.png)

## Bookmarklet installation

Bookmarklets are tiny scripts that you can execute as if you were opening a bookmarked page. To set it up for capo.js:

1. Copy [capo.js](https://raw.githubusercontent.com/rviscomi/capo.js/main/snippet/capo.js)
2. Use a tool like [this one](https://caiorss.github.io/bookmarklet-maker/) to create the bookmarklet

    ![Configuring the bookmarklet](/img/bookmarklet-setup.png)

3. Drag the link to your bookmarks bar and click it to execute on any web page

    ![capo.js on the bookmark bar](/img/bookmarklet.png)

To run the bookmarklet, just click it like a normal bookmark.

[Open DevTools](https://developer.chrome.com/docs/devtools/open/) and navigate to the **Console** panel to view the results.

![Console output in DevTools](/img/devtools-console.png)

## Configuration

You can customize how capo.js behaves by setting a global config object. See the [Configuration](/capo.js/user/config/) guide for more.
