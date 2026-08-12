import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterCredentials } from '../../../core/models/auth.model';
import { matchPasswords, mustBeOneOf, INDIAN_MOBILE_REGEXP } from '../auth.validators';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

type StepNumber = 1 | 2 | 3 | 4;

/** Which controls belong to each step — drives stepValid() and the
 *  markAsTouched() sweep in nextStep(). */
const STEP_FIELDS: Record<StepNumber, string[]> = {
  1: ['name', 'email'],
  2: ['password', 'confirmPassword'],
  3: ['phone'],
  4: ['role'],
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPageComponent {
  protected readonly form: FormGroup;
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly currentStep = signal<StepNumber>(1);

  private readonly returnUrl: string | null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.form = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        phone: ['', [Validators.required, Validators.pattern(INDIAN_MOBILE_REGEXP)]],
        role: ['customer', mustBeOneOf(['customer', 'mechanic'])],
      },
      { validators: matchPasswords('password', 'confirmPassword') },
    );
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }

  protected get name() {
    return this.form.controls['name'];
  }

  protected get email() {
    return this.form.controls['email'];
  }

  protected get password() {
    return this.form.controls['password'];
  }

  protected get confirmPassword() {
    return this.form.controls['confirmPassword'];
  }

  protected get phone() {
    return this.form.controls['phone'];
  }

  protected get role() {
    return this.form.controls['role'];
  }

  protected get passwordMismatch(): boolean {
    return this.form.hasError('mismatch') && (this.submitted() || this.confirmPassword.touched);
  }

  protected get nameError(): string {
    if (this.name.valid || (!this.submitted() && !this.name.touched)) {
      return '';
    }
    if (this.name.hasError('required')) {
      return 'Name is required';
    }
    return '';
  }

  protected get emailError(): string {
    if (this.email.valid || (!this.submitted() && !this.email.touched)) {
      return '';
    }
    if (this.email.hasError('required')) {
      return 'Email is required';
    }
    if (this.email.hasError('email')) {
      return 'Enter a valid email address';
    }
    return '';
  }

  protected get passwordError(): string {
    if (this.password.valid || (!this.submitted() && !this.password.touched)) {
      return '';
    }
    if (this.password.hasError('required')) {
      return 'Password is required';
    }
    if (this.password.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }

  protected get confirmPasswordError(): string {
    if (this.confirmPassword.valid || (!this.submitted() && !this.confirmPassword.touched)) {
      return '';
    }
    if (this.confirmPassword.hasError('required')) {
      return 'Please confirm your password';
    }
    return '';
  }

  protected get phoneError(): string {
    if (this.phone.valid || (!this.submitted() && !this.phone.touched)) {
      return '';
    }
    if (this.phone.hasError('required')) {
      return 'Phone number is required';
    }
    if (this.phone.hasError('pattern')) {
      return 'Enter a valid phone number';
    }
    return '';
  }

  protected get roleError(): string {
    if (this.role.valid || (!this.submitted() && !this.role.touched)) {
      return '';
    }
    if (this.role.hasError('mustBeOneOf')) {
      return 'Please select a valid role';
    }
    return '';
  }

  // ── Step navigation ──────────────────────────────────────

  /**
   * Jump to a step directly (stepper tab click). Takes `number`, not
   * `StepNumber` — the template's `@for` loop builds its step list from
   * an inline array literal, so `s.n` is inferred as plain `number`, not
   * the literal union. Validate and narrow here instead of trying to
   * force the template's inferred type to match.
   *
   * Also re-checks step <= currentStep() even though the template
   * disables tabs ahead of currentStep(); this guard holds even if
   * goToStep is ever called some other way (e.g. a future deep link).
   */
  protected goToStep(step: number): void {
    if (step >= 1 && step <= 4 && step <= this.currentStep()) {
      this.currentStep.set(step as StepNumber);
    }
  }

  /**
   * Advance one step. Marks this step's controls touched first so the
   * existing touched-based error getters (nameError, phoneError, etc.)
   * surface immediately — they already know how to display without any
   * changes, they just needed something to flip `touched` before the
   * final submit does.
   */
  protected nextStep(): void {
    const step = this.currentStep();
    STEP_FIELDS[step].forEach((name) => this.form.controls[name].markAsTouched());

    if (!this.stepValid(step)) {
      return;
    }
    this.currentStep.update((s) => (s < 4 ? ((s + 1) as StepNumber) : s));
  }

  protected prevStep(): void {
    this.currentStep.update((s) => (s > 1 ? ((s - 1) as StepNumber) : s));
  }

  /** Gates the Continue button; also reused internally by nextStep(). */
  protected stepValid(step: StepNumber): boolean {
    const fieldsValid = STEP_FIELDS[step].every((name) => this.form.controls[name].valid);
    if (step === 2) {
      // password/confirmPassword can each be individually valid while
      // matchPasswords' group-level 'mismatch' error still fires.
      return fieldsValid && !this.form.hasError('mismatch');
    }
    return fieldsValid;
  }

  // ── Submit ────────────────────────────────────────────────

  protected onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }
    this.serverError.set(null);
    this.isSubmitting.set(true);
    const { confirmPassword, ...credentials } = this.form.getRawValue();
    this.auth
      .register(credentials as Omit<RegisterCredentials, 'confirmPassword'> & RegisterCredentials)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.auth.persistSession(response.data.token, response.data.user);
            this.router.navigate([this.returnUrl || '/']);
          } else {
            this.serverError.set(response.message || 'Unable to create account. Please try again.');
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message || 'Unable to create account. Please try again.');
        },
      });
  }
}