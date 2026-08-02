import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const INDIAN_MOBILE_REGEXP = /^(\+91)?[6-9]\d{9}$/;

export function matchPasswords(passwordName: string, confirmName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const confirm = group.get(confirmName);
    if (!confirm || !confirm.value) {
      return null;
    }
    const password = group.get(passwordName);
    if (!password) {
      return null;
    }
    return password.value === confirm.value ? null : { mismatch: true };
  };
}

export function mustBeOneOf(allowed: readonly string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }
    return allowed.includes(control.value as string)
      ? null
      : { mustBeOneOf: { allowed: [...allowed] } };
  };
}
