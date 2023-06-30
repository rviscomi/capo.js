import * as colors from './colors.js';

export class Options {

  constructor({
    preferredAssessmentMode = AssessmentMode.STATIC,
    validation = true,
    palette = colors.DEFAULT,
    loggingPrefix = 'Capo: '
  }) {
    if (!this.isValidAssessmentMode(preferredAssessmentMode)) {
      throw new Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`);
    }
    if (!this.isValidValidation(validation)) {
      throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
    }
    if (!this.isValidPalette(palette)) {
      throw new Error(`Invalid option: palette, expected an array of colors, got "${palette}".`);
    }
    if (!this.isValidLoggingPrefix(loggingPrefix)) {
      throw new Error(`Invalid option: logging prefix, expected string, got "${loggingPrefix}".`);
    }

    this.preferredAssessmentMode = preferredAssessmentMode;
    this.validation = validation;
    this.palette = palette;
    this.loggingPrefix = loggingPrefix;
  }

  static get AssessmentMode() {
    return {
      STATIC: 'static',
      DYNAMIC: 'dynamic'
    };
  }

  isValidAssessmentMode(assessmentMode) {
    return Object.values(Options.AssessmentMode).includes(assessmentMode);
  }

  isValidValidation(validation) {
    return typeof validation === 'boolean';
  }

  isValidPalette(palette) {
    return Array.isArray(palette) &&
        palette.length === 11 &&
        palette.every(color => typeof color === 'string');
  }

  isValidLoggingPrefix(loggingPrefix) {
    return typeof loggingPrefix === 'string';
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

}