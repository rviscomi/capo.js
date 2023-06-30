export const AssessmentMode = {
  STATIC: 'static',
  DYNAMIC: 'dynamic'
};

export class Options {

  constructor({
    preferredAssessmentMode = AssessmentMode.STATIC,
    validation = true
  }) {
    if (!this.isValidAssessmentMode(preferredAssessmentMode)) {
      throw new Error(`Invalid option: preferred assessment mode, expected AssessmentMode.STATIC or AssessmentMode.DYNAMIC, got "${preferredAssessmentMode}".`);
    }
    if (!this.isValidValidation(validation)) {
      throw new Error(`Invalid option: validation, expected boolean, got "${validation}".`);
    }

    this.preferredAssessmentMode = preferredAssessmentMode;
    this.validation = validation;
  }

  isValidAssessmentMode(assessmentMode) {
    return Object.values(AssessmentMode).includes(assessmentMode);
  }

  isValidValidation(validation) {
    return typeof validation === 'boolean';
  }

  prefersStaticAssessment() {
    return this.preferredAssessmentMode === AssessmentMode.STATIC;
  }

  prefersDynamicAssessment() {
    return this.preferredAssessmentMode === AssessmentMode.DYNAMIC;
  }

  isValidationEnabled() {
    return this.validation;
  }

}