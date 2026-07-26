chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    chrome.tabs.create({
      url: "https://rviscomi.github.io/capo.js/user/extension/?utm_source=installed&utm_medium=extension&utm_campaign=capo",
    });
  }
});
