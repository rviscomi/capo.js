import { Options } from "../lib/options.js";

/** @type {Options} */
let options;

/**
 * @returns {Promise<void>}
 */
async function initOptions() {
  const data = await chrome.storage.sync.get("options");
  options = new Options(data.options);
}

function initUI() {
  const preferStatic = /** @type {HTMLInputElement|null} */ (document.getElementById("prefer-static"));
  const validation = /** @type {HTMLInputElement|null} */ (document.getElementById("validation"));
  const palette = /** @type {HTMLSelectElement|null} */ (document.getElementById("palette"));

  if (preferStatic) {
    preferStatic.checked = options.prefersStaticAssessment();
    preferStatic.dataset.option = "PREFERRED_ASSESSMENT_MODE";
  }
  if (validation) {
    validation.checked = options.isValidationEnabled();
    validation.dataset.option = "VALIDATION";
  }

  if (palette) {
    Object.entries(Options.Palettes).forEach(([name, value]) => {
      const option = document.createElement("option");
      option.textContent = name;
      option.value = name;
      option.selected = options.isPreferredPalette(value);
      option.dataset.colors = JSON.stringify(value);
      palette.appendChild(option);
    });
    palette.dataset.option = "PALETTE";
  }

  listenForUpdates();
}

function listenForUpdates() {
  const optionsForm = document.getElementById("options");
  if (optionsForm) {
    optionsForm.addEventListener("change", handleUpdate);
  }
}

/**
 * @param {Event} event
 */
async function handleUpdate(event) {
  const target = /** @type {HTMLInputElement|HTMLSelectElement} */ (event.target);
  if (!target || !target.dataset) return;

  const option = target.dataset.option;
  let value;

  switch (option) {
    case "PREFERRED_ASSESSMENT_MODE":
      value = /** @type {HTMLInputElement} */ (target).checked;
      options.setPreferredAssessmentModeToStatic(value);
      break;
    case "VALIDATION":
      value = /** @type {HTMLInputElement} */ (target).checked;
      options.setValidation(value);
      break;
    case "PALETTE":
      value = /** @type {HTMLSelectElement} */ (target).value;
      options.setPalette(value);
      break;
    default:
      console.warn(`Unknown option: ${option}`);
      return;
  }

  await chrome.storage.sync.set({ options: options.valueOf() });
  await chrome.storage.sync.get("options");
}

async function init() {
  await initOptions();
  initUI();
}

init();
