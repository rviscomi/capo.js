import * as colors from "./colors.js";

/**
 * @typedef {'static' | 'dynamic'} AssessmentModeValue
 *
 * @typedef {Object} OptionsInit
 * @property {AssessmentModeValue} [preferredAssessmentMode]
 * @property {boolean} [validation]
 * @property {string | string[]} [palette]
 * @property {string} [loggingPrefix]
 *
 * @typedef {Object} OptionsValue
 * @property {string} preferredAssessmentMode
 * @property {boolean} validation
 * @property {string[]} palette
 * @property {string} loggingPrefix
 */

export class Options {
  /**
   * @param {OptionsInit} [options={}]
   */
  constructor({
    preferredAssessmentMode = Options.AssessmentMode.STATIC,
    validation = true,
    palette = colors.DEFAULT,
    loggingPrefix = "Capo: ",
  } = {}) {
    /** @type {string} */
    this.preferredAssessmentMode = Options.AssessmentMode.STATIC;
    /** @type {boolean} */
    this.validation = true;
    /** @type {string[]} */
    this.palette = colors.DEFAULT;
    /** @type {string} */
    this.loggingPrefix = "Capo: ";

    this.setPreferredAssessmentMode(preferredAssessmentMode);
    this.setValidation(validation);
    this.setPalette(palette);
    this.setLoggingPrefix(loggingPrefix);
  }

  /**
   * @returns {{ STATIC: 'static', DYNAMIC: 'dynamic' }}
   */
  static get AssessmentMode() {
    return {
      STATIC: "static",
      DYNAMIC: "dynamic",
    };
  }

  /**
   * @returns {Record<string, string[]>}
   */
  static get Palettes() {
    return colors.Palettes;
  }

  /**
   * @returns {boolean}
   */
  prefersStaticAssessment() {
    return this.preferredAssessmentMode === Options.AssessmentMode.STATIC;
  }

  /**
   * @returns {boolean}
   */
  prefersDynamicAssessment() {
    return this.preferredAssessmentMode === Options.AssessmentMode.DYNAMIC;
  }

  /**
   * @returns {boolean}
   */
  isValidationEnabled() {
    return this.validation;
  }

  /**
   * @param {string} preferredAssessmentMode
   */
  setPreferredAssessmentMode(preferredAssessmentMode) {
    if (!this.isValidAssessmentMode(preferredAssessmentMode)) {
      throw new Error(
        `Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`,
      );
    }

    this.preferredAssessmentMode = preferredAssessmentMode;
  }

  /**
   * @param {boolean} prefersStatic
   */
  setPreferredAssessmentModeToStatic(prefersStatic) {
    /** @type {string} */
    let mode = Options.AssessmentMode.STATIC;
    if (!prefersStatic) {
      mode = Options.AssessmentMode.DYNAMIC;
    }

    this.setPreferredAssessmentMode(mode);
  }

  /**
   * @param {boolean} validation
   */
  setValidation(validation) {
    if (!this.isValidValidation(validation)) {
      throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
    }

    this.validation = validation;
  }

  /**
   * @param {string | string[]} palette
   */
  setPalette(palette) {
    if (!this.isValidPalette(palette)) {
      throw new Error(
        `Invalid option: palette, expected [${Object.keys(colors.Palettes).join("|")}] or an array of colors, got "${palette}".`,
      );
    }

    if (typeof palette === "string") {
      this.palette = colors.Palettes[palette];
      return;
    }

    this.palette = palette;
  }

  /**
   * @param {string} loggingPrefix
   */
  setLoggingPrefix(loggingPrefix) {
    if (!this.isValidLoggingPrefix(loggingPrefix)) {
      throw new Error(`Invalid option: logging prefix, expected string, got "${loggingPrefix}".`);
    }

    this.loggingPrefix = loggingPrefix;
  }

  /**
   * @param {any} assessmentMode
   * @returns {boolean}
   */
  isValidAssessmentMode(assessmentMode) {
    return Object.values(Options.AssessmentMode).includes(assessmentMode);
  }

  /**
   * @param {any} validation
   * @returns {boolean}
   */
  isValidValidation(validation) {
    return typeof validation === "boolean";
  }

  /**
   * @param {any} palette
   * @returns {boolean}
   */
  isValidPalette(palette) {
    if (typeof palette === "string") {
      return Object.keys(colors.Palettes).includes(palette);
    }

    if (!Array.isArray(palette)) {
      return false;
    }

    return palette.length === 11 && palette.every((color) => typeof color === "string");
  }

  /**
   * @param {any} loggingPrefix
   * @returns {boolean}
   */
  isValidLoggingPrefix(loggingPrefix) {
    return typeof loggingPrefix === "string";
  }

  /**
   * @param {string[]} palette
   * @returns {boolean}
   */
  isPreferredPalette(palette) {
    return JSON.stringify(this.palette) === JSON.stringify(palette);
  }

  /**
   * @returns {OptionsValue}
   */
  valueOf() {
    return {
      preferredAssessmentMode: this.preferredAssessmentMode,
      validation: this.validation,
      palette: this.palette,
      loggingPrefix: this.loggingPrefix,
    };
  }
}
