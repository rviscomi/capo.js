init();

async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  }
  return { tabId: tab?.id };
}

async function init() {
  chrome.storage.onChanged.addListener((changes) => {
    console.log("Storage changed", changes);
    const { data } = changes;
    if (data?.newValue) {
      print(data.newValue);
    }
  });

  await chrome.storage.local.remove("data");

  await chrome.scripting.executeScript({
    target: await getCurrentTab(),
    files: ["capo.js"],
  });

  const { data } = await chrome.storage.local.get("data");
  if (data) {
    print(data);
  }
}

function print(result) {
  console.log("Data", result);
  actual.innerHTML = "";
  sorted.innerHTML = "";

  let frag = document.createDocumentFragment();
  for (let r of result.actual) {
    frag.appendChild(getCapoHeadElement(r));
  }
  actual.appendChild(frag);

  result.sorted = result.actual.sort((a, b) => {
    return b.weight - a.weight;
  });
  frag = document.createDocumentFragment();
  for (let r of result.sorted) {
    frag.appendChild(getCapoHeadElement(r));
  }
  sorted.appendChild(frag);
  document.body.addEventListener("click", handleCapoClick);
}

function getCapoHeadElement({
  weight,
  color,
  selector,
  innerHTML,
  isValid,
  customValidations,
}) {
  const span = document.createElement("span");
  span.classList.add("capo-head-element");
  span.classList.toggle("invalid", !isValid);
  span.dataset.weight = weight;
  span.style.backgroundColor = color;
  span.dataset.selector = selector;
  span.dataset.innerHTML = innerHTML;
  span.dataset.customValidations = JSON.stringify(customValidations);
  span.title = `[${weight + 1}] ${selector}`;
  return span;
}

async function handleCapoClick(event) {
  const { weight, selector, innerHTML } = event.target.dataset;
  const customValidations = JSON.parse(event.target.dataset.customValidations);
  const isValid = !event.target.classList.contains("invalid");

  await chrome.storage.local.set({
    click: JSON.stringify({
      weight,
      selector,
      innerHTML,
      isValid,
      customValidations,
    }),
  });
  await chrome.scripting.executeScript({
    target: await getCurrentTab(),
    files: ["capo.js"],
  });
}
