import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function diagnosisAfterBirthValidator(birthField: string, diagnosisField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const birth = control.get(birthField)?.value;
    const diagnosis = control.get(diagnosisField)?.value;
    if (!birth || !diagnosis) return null;
    return new Date(diagnosis) >= new Date(birth) ? null : { invalidDiagnosisDate: true };
  };
}

export function geneValidator(field: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const gene = control.get(field)?.value;
    if (!gene) return null;
    return ['TSC1', 'TSC2'].includes(gene) ? null : { invalidGene: true };
  };
}

export function emailIfPresentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) return null;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return ok ? null : { invalidEmail: true };
  };
}
