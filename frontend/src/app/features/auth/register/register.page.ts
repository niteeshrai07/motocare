import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterCredentials } from '../../../core/models/auth.model';
import { matchPasswords, mustBeOneOf, INDIAN_MOBILE_REGEXP } from '../auth.validators';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, CardComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPageComponent {
  protected readonly form: FormGroup;
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

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
