import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateRangeValidator(startField: string, endField: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const start = control.get(startField)?.value;
    const end = control.get(endField)?.value;
    if (!start || !end) return null;
    return new Date(end) >= new Date(start) ? null : { invalidDateRange: true };
  };
}

// Backward-compatible alias for previous name usage.
export const endDateAfterStartDate = dateRangeValidator;
