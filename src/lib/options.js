import * as colors from './colors.js';

export class Options {

  constructor({
    preferredAssessmentMode = Options.AssessmentMode.STATIC,
    validation = true,
    palette = colors.DEFAULT,
    loggingPrefix = 'Capo: '
  } = {}) {
    this.setPreferredAssessmentMode(preferredAssessmentMode);
    this.setValidation(validation);
    this.setPalette(palette);
    this.setLoggingPrefix(loggingPrefix);
  }

  static get AssessmentMode() {
    return {
      STATIC: 'static',
      DYNAMIC: 'dynamic'
    };
  }

  static get Palettes() {
    return colors.Palettes;
  }

  prefersStaticAssessment() {
    return this.preferredAssessmentMode === Options.AssessmentMode.STATIC;
  }

  prefersDynamicAssessment() {
    return this.preferredAssessmentMode === Options.AssessmentMode.DYNAMIC;
  }

  isValidationEnabled() {
    return this.validation;
  }

  setPreferredAssessmentMode(preferredAssessmentMode) {
    if (!this.isValidAssessmentMode(preferredAssessmentMode)) {
      throw new Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`);
    }

    this.preferredAssessmentMode = preferredAssessmentMode;
  }

  setPreferredAssessmentModeToStatic(prefersStatic) {
    let mode = Options.AssessmentMode.STATIC;
    if (!prefersStatic) {
      mode = Options.AssessmentMode.DYNAMIC;
    }
    
    this.setPreferredAssessmentMode(mode);
  }

  setValidation(validation) {
    if (!this.isValidValidation(validation)) {
      throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
    }

    this.validation = validation;
  }

  setPalette(palette) {
    if (!this.isValidPalette(palette)) {
      throw new Error(`Invalid option: palette, expected [${Object.keys(colors.Palettes).join('|')}] or an array of colors, got "${palette}".`);
    }

    if (typeof palette === 'string') {
      this.palette = colors.Palettes[palette];
      return;
    }
    
    this.palette = palette;
  }

  setLoggingPrefix(loggingPrefix) {
    if (!this.isValidLoggingPrefix(loggingPrefix)) {
      throw new Error(`Invalid option: logging prefix, expected string, got "${loggingPrefix}".`);
    }

    this.loggingPrefix = loggingPrefix;
  }

  isValidAssessmentMode(assessmentMode) {
    return Object.values(Options.AssessmentMode).includes(assessmentMode);
  }

  isValidValidation(validation) {
    return typeof validation === 'boolean';
  }

  isValidPalette(palette) {
    if (typeof palette === 'string') {
      return Object.keys(colors.Palettes).includes(palette);
    }
    
    if (!Array.isArray(palette)) {
      return false;
    }

    return palette.length === 11 && palette.every(color => typeof color === 'string');
  }

  isValidLoggingPrefix(loggingPrefix) {
    return typeof loggingPrefix === 'string';
  }

  isPreferredPalette(palette) {
    return JSON.stringify(this.palette) == JSON.stringify(palette);
  }

  valueOf() {
    return {
      preferredAssessmentMode: this.preferredAssessmentMode,
      validation: this.validation,
      palette: this.palette,
      loggingPrefix: this.loggingPrefix
    };
  }

}
