const AssessmentMode = {
  STATIC: 'static',
  DYNAMIC: 'dynamic'
};

const Palette = {
  DEFAULT: 'default'
};

const Options = {
  PREFERRED_ASSESSMENT_MODE: AssessmentMode.STATIC,
  VALIDATION: true,
  PALETTE: Palette.DEFAULT
};

async function initOptions() {
  const data = await chrome.storage.sync.get('options');
  Object.assign(Options, data.options);
}

function initUI() {
  const preferStatic = document.getElementById('prefer-static');
  const validation = document.getElementById('validation');
  const palette = document.getElementById('palette');

  preferStatic.checked = Options.PREFERRED_ASSESSMENT_MODE === AssessmentMode.STATIC;
  preferStatic.dataset.option = 'PREFERRED_ASSESSMENT_MODE';
  validation.checked = Options.VALIDATION;
  validation.dataset.option = 'VALIDATION';
  palette.value = Options.PALETTE;
  palette.dataset.option = 'PALETTE';

  listenForUpdates();
}

function listenForUpdates() {
  const optionsForm = document.getElementById('options');
  optionsForm.addEventListener('change', handleUpdate);
}

function handleUpdate(event) {
  const option = event.target.dataset.option;
  let value;

  switch (option) {
    case 'PREFERRED_ASSESSMENT_MODE':
      value = event.target.checked ? AssessmentMode.STATIC : AssessmentMode.DYNAMIC;
      break;
    case 'VALIDATION':
      value = event.target.checked;
      break;
    case 'PALETTE':
      value = event.target.value;
      break;
    default:
      console.warn(`Unknown option: ${option}`);
      return;
  }

  Options[option] = value;
  chrome.storage.sync.set({ options: Options });
};

await initOptions();
initUI();