const CAPO_GLOBAL = '__CAPO__';

init();

async function init() {
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['capo.js']
  });
  const [{result}] = await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    args: [CAPO_GLOBAL],
    func: (CAPO_GLOBAL) => {
      return JSON.stringify(self[CAPO_GLOBAL].data);
    }
  });
  print(JSON.parse(result));
}
  
function print(result) {
  console.log(result);
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
  document.body.addEventListener('click', handleCapoClick);
}

function getCapoHeadElement({weight, selector, innerHTML, isValid, customValidations}) {
  const span = document.createElement('span');
  span.classList.add('capo-head-element');
  span.classList.toggle('invalid', !isValid);
  span.dataset.weight = weight;
  span.dataset.selector = selector;
  span.dataset.innerHTML = innerHTML;
  span.dataset.customValidations = JSON.stringify(customValidations);
  span.title = `[${weight + 1}] ${selector}`;
  return span;
}

async function handleCapoClick(event) {
  const {weight, selector, innerHTML} = event.target.dataset;
  const customValidations = JSON.parse(event.target.dataset.customValidations);
  const isValid = !event.target.classList.contains('invalid');
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    args: [CAPO_GLOBAL, {
      weight, selector, innerHTML, isValid, customValidations
    }],
    func: (CAPO_GLOBAL, data) => {
      self[CAPO_GLOBAL].click = data;
    }
  });
  await chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['capo.js']
  });
}
