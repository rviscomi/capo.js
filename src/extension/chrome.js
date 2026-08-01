init();

/**
 * @returns {Promise<chrome.scripting.InjectionTarget>}
 */
async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  }
  return { tabId: tab?.id || 0 };
}

/**
 * @returns {Promise<void>}
 */
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

/**
 * @param {any} result
 */
function print(result) {
  console.log("Data", result);
  const actualEl = document.getElementById("actual");
  const sortedEl = document.getElementById("sorted");

  if (actualEl) actualEl.textContent = "";
  if (sortedEl) sortedEl.textContent = "";

  let frag = document.createDocumentFragment();
  for (let r of result.actual) {
    frag.appendChild(getCapoHeadElement(r));
  }
  if (actualEl) actualEl.appendChild(frag);

  result.sorted = result.actual.slice().sort((/** @type {any} */ a, /** @type {any} */ b) => {
    return b.weight - a.weight;
  });
  frag = document.createDocumentFragment();
  for (let r of result.sorted) {
    frag.appendChild(getCapoHeadElement(r));
  }
  if (sortedEl) sortedEl.appendChild(frag);
  document.body.addEventListener("click", handleCapoClick);
}

/**
 * @param {Object} params
 * @param {number} params.weight
 * @param {string} params.color
 * @param {string} params.selector
 * @param {string} params.html
 * @param {boolean} params.isValid
 * @param {any} params.customValidations
 * @returns {HTMLSpanElement}
 */
function getCapoHeadElement({ weight, color, selector, html, isValid, customValidations }) {
  const span = document.createElement("span");
  span.classList.add("capo-head-element");
  span.classList.toggle("invalid", !isValid);
  span.dataset.weight = String(weight);
  span.style.backgroundColor = color;
  span.dataset.selector = selector;
  span.dataset.html = html;
  span.dataset.customValidations = JSON.stringify(customValidations);
  span.title = `[${weight + 1}] ${selector}`;
  return span;
}

/**
 * @param {MouseEvent} event
 */
async function handleCapoClick(event) {
  const target = /** @type {HTMLElement} */ (event.target);
  if (!target || !target.dataset) return;
  const { weight, selector, html } = target.dataset;
  const customValidations = JSON.parse(target.dataset.customValidations || "{}");
  const isValid = !target.classList.contains("invalid");

  await chrome.storage.local.set({
    click: JSON.stringify({
      weight,
      selector,
      html,
      isValid,
      customValidations,
    }),
  });
  await chrome.scripting.executeScript({
    target: await getCurrentTab(),
    files: ["capo.js"],
  });
}
