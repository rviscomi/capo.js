---
title: Quick start guide to capo.js
description: What's Capo, how do you use it, and why should you care?
---

`capo.js` is a tool for assessing the quality of the document `<head>`. You can run it in your browser as a Chrome extension or DevTools snippet, in a testing environment like WebPageTest, or an analytical datastore like BigQuery.

An unoptimized `<head>` can lead to poor performance and a poor user experience. `capo.js` can help you identify and fix these issues.

## _Veloce_: Chrome extension

:::note[Recommended]
The [Capo extension](https://chrome.google.com/webstore/detail/capo-get-your-%3Chead%3E-in-o/ohabpnaccigjhkkebjofhpmebofgpbeb) is the easiest way to use `capo.js`.
:::

The best way to start using `capo.js` is to install the [Capo extension for Chrome](https://chrome.google.com/webstore/detail/capo-get-your-%3Chead%3E-in-o/ohabpnaccigjhkkebjofhpmebofgpbeb):

1. Navigate to the [Capo extension](https://chrome.google.com/webstore/detail/capo-get-your-%3Chead%3E-in-o/ohabpnaccigjhkkebjofhpmebofgpbeb) in the Chrome Web Store
2. Click the **Add to Chrome** button
3. On any page, click the Capo icon (&lt;👤>) in the browser toolbar
    - Open the DevTools Console to see additional logs

Learn more about [using the extension](/capo.js/guides/extension/) and interpreting the results.

## _Svelto_: Snippet

The next best way to use `capo.js` is as an executable snippet in your browser.

1. Copy the [`capo.js` snippet](https://raw.githubusercontent.com/rviscomi/capo.js/main/snippet/capo.js)
2. Save as a new DevTools snippet
    - Open the DevTools Sources panel
    - Create a new snippet
    - Paste the snippet into the editor
    - Save as "Capo"
3. Run the snippet on any web page
    - Open the DevTools Console panel
    - Select the "Capo" snippet
    - Click the "Run" button (or <kbd>Cmd</kbd> + <kbd>Enter</kbd>)

Alternatively, you can save the snippet as a bookmarklet:

1. Copy the [`capo.js` snippet](https://raw.githubusercontent.com/rviscomi/capo.js/main/snippet/capo.js)
2. Create the bookmarklet using a tool like [this one](https://caiorss.github.io/bookmarklet-maker/)
3. Execute the bookmarklet on any web page to run `capo.js`

Learn more about [using the snippet](/capo.js/guides/snippet/).

## _Rapido_: WebPageTest

Coming soon

## _Forte_: BigQuery

Coming soon
