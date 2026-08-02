import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LoginCredentials } from '../../../core/models/auth.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CardComponent } from '../../../shared/components/card/card.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, CardComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPageComponent {
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
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  }

  protected get email() {
    return this.form.controls['email'];
  }

  protected get password() {
    return this.form.controls['password'];
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
    return '';
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }
    this.serverError.set(null);
    this.isSubmitting.set(true);
    this.auth
      .login(this.form.getRawValue() as LoginCredentials)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.auth.persistSession(response.data.token, response.data.user);
            this.router.navigate([this.returnUrl || '/']);
          } else {
            this.serverError.set(response.message || 'Invalid email or password');
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message || 'Invalid email or password');
        },
      });
  }
}
