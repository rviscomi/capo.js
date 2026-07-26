import { Options } from '../lib/options.js';

let options;

async function initOptions() {
  const data = await chrome.storage.sync.get('options');
  options = new Options(data.options);
}

function initUI() {
  const preferStatic = document.getElementById('prefer-static');
  const validation = document.getElementById('validation');
  const palette = document.getElementById('palette');

  preferStatic.checked = options.prefersStaticAssessment();
  preferStatic.dataset.option = 'PREFERRED_ASSESSMENT_MODE';
  validation.checked = options.isValidationEnabled();
  validation.dataset.option = 'VALIDATION';
  
  Object.entries(Options.Palettes).forEach(([name, value]) => {
    const option = document.createElement('option');
    option.textContent = name;
    option.value = name;
    option.selected = options.isPreferredPalette(value);
    option.dataset.colors = JSON.stringify(value);
    palette.appendChild(option);
  });
  palette.dataset.option = 'PALETTE';

  listenForUpdates();
}

function listenForUpdates() {
  const optionsForm = document.getElementById('options');
  optionsForm.addEventListener('change', handleUpdate);
}

async function handleUpdate(event) {
  const option = event.target.dataset.option;
  let value;

  switch (option) {
    case 'PREFERRED_ASSESSMENT_MODE':
      value = event.target.checked;
      options.setPreferredAssessmentModeToStatic(value);
      break;
    case 'VALIDATION':
      value = event.target.checked;
      options.setValidation(value);
      break;
    case 'PALETTE':
      value = event.target.value;
      options.setPalette(value);
      break;
    default:
      console.warn(`Unknown option: ${option}`);
      return;
  }

  await chrome.storage.sync.set({ options: options.valueOf() });
  const data = await chrome.storage.sync.get('options');
};

async function init() {
  await initOptions();
  initUI();
}

init();
