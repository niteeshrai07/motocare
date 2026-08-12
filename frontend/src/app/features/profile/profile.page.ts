import { Component, signal, computed, OnInit } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { INDIAN_MOBILE_REGEXP, matchPasswords, passwordsDiffer } from '../../features/auth/auth.validators';
import { Profile, ProfileUpdatePayload } from '../../core/models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, DatePipe, TitleCasePipe],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePageComponent implements OnInit {
  protected readonly isLoading = signal<boolean>(true);
  protected readonly profile = signal<Profile | null>(null);
  protected readonly serverError = signal<string | null>(null);
  protected readonly passwordSuccess = signal<string | null>(null);
  protected readonly isEditing = signal<boolean>(false);
  protected readonly isChangingPassword = signal<boolean>(false);
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);
  protected readonly isDeactivating = signal<boolean>(false);

  /** Role helpers for template quick-actions */
  protected readonly isMechanic = computed(() => this.authService.user()?.role === 'mechanic');
  protected readonly isAdmin    = computed(() => this.authService.user()?.role === 'admin');

  protected form: FormGroup;
  protected passwordForm: FormGroup;
  protected deactivationControl: FormControl<string | null>;


  constructor(
    private readonly fb: FormBuilder,
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      phone: ['', [Validators.required, Validators.pattern(INDIAN_MOBILE_REGEXP)]],
    });
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: [
          matchPasswords('newPassword', 'confirmPassword'),
          passwordsDiffer('currentPassword', 'newPassword'),
        ],
      },
    );
    this.deactivationControl = new FormControl<string | null>('');
  }

  ngOnInit(): void {
    this.fetchProfile();
  }

  protected enterEditMode(): void {
    this.passwordSuccess.set(null);
    const p = this.profile();
    if (p) {
      this.form.patchValue({
        name: p.name,
        phone: p.phone,
      });
    }
    this.submitted.set(false);
    this.serverError.set(null);
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
    this.submitted.set(false);
    this.serverError.set(null);
    this.form.reset();
  }

  protected enterChangePasswordMode(): void {
    this.passwordSuccess.set(null);
    this.serverError.set(null);
    this.passwordForm.reset();
    this.submitted.set(false);
    this.isChangingPassword.set(true);
  }

  protected exitChangePasswordMode(): void {
    this.isChangingPassword.set(false);
    this.submitted.set(false);
    this.serverError.set(null);
    this.passwordForm.reset();
  }

  protected cancelDeactivation(): void {
    this.serverError.set(null);
    this.deactivationControl.reset('');
  }

  protected get canDeactivate(): boolean {
    return this.deactivationControl.value === 'DEACTIVATE';
  }

  protected get hasDeactivationInput(): boolean {
    return this.deactivationControl.value !== '' && this.deactivationControl.value !== null;
  }

  protected onDeactivate(): void {
    if (!this.canDeactivate || this.isDeactivating()) {
      return;
    }
    this.serverError.set(null);
    this.isDeactivating.set(true);
    this.profileService
      .deactivateAccount()
      .pipe(finalize(() => this.isDeactivating.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.passwordSuccess.set(response.message || 'Account deactivated successfully');
            this.deactivationControl.reset('');
            this.authService.logout();
          } else {
            this.serverError.set(response.message || 'Failed to deactivate account');
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message || 'Failed to deactivate account');
        },
      });
  }

  protected logout(): void {
    this.authService.logout();
  }

  protected get nameError(): string {
    const control = this.form.controls['name'];
    if (control.valid || (!this.submitted() && !control.touched)) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Name is required';
    }
    if (control.hasError('minlength') || control.hasError('maxlength')) {
      return 'Name must be between 1 and 100 characters';
    }
    return '';
  }

  protected get phoneError(): string {
    const control = this.form.controls['phone'];
    if (control.valid || (!this.submitted() && !control.touched)) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Phone number is required';
    }
    if (control.hasError('pattern')) {
      return 'Enter a valid 10-digit Indian phone number';
    }
    return '';
  }

  protected get currentPasswordError(): string {
    const control = this.passwordForm.controls['currentPassword'];
    if (control.hasError('required') && (this.submitted() || control.touched)) {
      return 'Current password is required';
    }
    return '';
  }

  protected get newPasswordError(): string {
    const control = this.passwordForm.controls['newPassword'];
    if (control.hasError('required') && (this.submitted() || control.touched)) {
      return 'New password is required';
    }
    if (control.hasError('minlength') && (this.submitted() || control.touched)) {
      return 'New password must be at least 6 characters';
    }
    if (this.passwordForm.hasError('sameAsCurrent') && (this.submitted() || control.touched)) {
      return 'New password must be different from current password';
    }
    return '';
  }

  protected get confirmPasswordError(): string {
    const control = this.passwordForm.controls['confirmPassword'];
    if (control.hasError('required') && (this.submitted() || control.touched)) {
      return 'Please confirm your new password';
    }
    if (this.passwordForm.hasError('mismatch') && (this.submitted() || control.touched)) {
      return 'Passwords do not match';
    }
    return '';
  }

  protected onSave(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      return;
    }
    const payload: ProfileUpdatePayload = {
      name: this.form.value.name,
      phone: this.form.value.phone,
    };
    this.serverError.set(null);
    this.isSubmitting.set(true);
    this.profileService
      .updateProfile(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.profile.set(response.data.profile);
            this.isEditing.set(false);
            this.submitted.set(false);
            this.serverError.set(null);
          } else {
            this.serverError.set(response.message || 'Failed to update profile');
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message || 'Failed to update profile');
        },
      });
  }

  protected onChangePassword(): void {
    this.submitted.set(true);
    if (this.passwordForm.invalid) {
      return;
    }
    this.serverError.set(null);
    this.passwordSuccess.set(null);
    this.isSubmitting.set(true);
    this.profileService
      .changePassword(this.passwordForm.value.currentPassword, this.passwordForm.value.newPassword)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.passwordSuccess.set(response.message || 'Password changed successfully');
            this.exitChangePasswordMode();
          } else {
            this.serverError.set(response.message || 'Failed to change password');
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message || 'Failed to change password');
        },
      });
  }

  private fetchProfile(): void {
    this.isLoading.set(true);
    this.serverError.set(null);
    this.profileService
      .getProfile()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.profile.set(response.data.profile);
          }
        },
        error: (error: Error) => {
          this.serverError.set(error.message);
        },
      });
  }
}
