import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, NEVER } from 'rxjs';
import { vi } from 'vitest';
import { ProfilePageComponent } from './profile.page';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiResponse, ApiValidationError } from '../../core/models/api-response.model';
import { ProfileResponse, Profile, ProfileUpdatePayload } from '../../core/models/profile.model';

describe('ProfilePageComponent', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let component: ProfilePageComponent;

  const profileService = {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    deactivateAccount: vi.fn(),
  };

  const authService = {
    logout: vi.fn(),
  };

  const mockProfile: Profile = {
    id: '1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '9876543210',
    role: 'customer',
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
    repairShop: null,
  };

  const mockMechanicProfile: Profile = {
    id: '2',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '9876543210',
    role: 'mechanic',
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2024-01-10T08:00:00.000Z',
    repairShop: {
      id: 'shop1',
      shopName: 'MotoCare Repairs',
      status: 'verified',
    },
  };

  const mockProfileResponse: ProfileResponse = {
    profile: { ...mockProfile },
  };

  const mockMechanicProfileResponse: ProfileResponse = {
    profile: { ...mockMechanicProfile },
  };

  const setupProfileLoaded = (profile: Profile = mockProfile) => {
    profileService.getProfile.mockReturnValue(
      of({
        success: true,
        message: 'Profile fetched successfully',
        data: { profile: { ...profile } },
        errors: null,
      } as ApiResponse<ProfileResponse>),
    );
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        { provide: ProfileService, useValue: profileService },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  describe('View Mode', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      const c = component as any;
      expect(c.isLoading()).toBe(true);
    });

    it('should have null profile on init', () => {
      const c = component as any;
      expect(c.profile()).toBeNull();
    });

    it('should have null server error on init', () => {
      const c = component as any;
      expect(c.serverError()).toBeNull();
    });

    it('should call getProfile on init', () => {
      profileService.getProfile.mockReturnValue(of({} as any));
      fixture.detectChanges();

      expect(profileService.getProfile).toHaveBeenCalled();
    });

    it('should show loading skeleton while fetching', () => {
      profileService.getProfile.mockReturnValue(NEVER);
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should hide loading skeleton after success', () => {
      profileService.getProfile.mockReturnValue(
        of({
          success: true,
          message: 'Profile fetched successfully',
          data: mockProfileResponse,
          errors: null,
        } as ApiResponse<ProfileResponse>),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(false);
      const skeleton = fixture.nativeElement.querySelector('.skeleton');
      expect(skeleton).toBeFalsy();
    });

    it('should set profile data on successful fetch', () => {
      profileService.getProfile.mockReturnValue(
        of({
          success: true,
          message: 'Profile fetched successfully',
          data: mockProfileResponse,
          errors: null,
        } as ApiResponse<ProfileResponse>),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.profile()).toEqual(mockProfileResponse.profile);
    });

    it('should display profile name and email after fetch', () => {
      profileService.getProfile.mockReturnValue(
        of({
          success: true,
          message: 'Profile fetched successfully',
          data: mockProfileResponse,
          errors: null,
        } as ApiResponse<ProfileResponse>),
      );
      fixture.detectChanges();

      const values = fixture.nativeElement.querySelectorAll('.profile-field__value');
      expect(values[0].textContent).toBe('Jane Doe');
      expect(values[1].textContent).toBe('jane@example.com');
    });

    it('should display shop info for mechanic with repair shop', () => {
      profileService.getProfile.mockReturnValue(
        of({
          success: true,
          message: 'Profile fetched successfully',
          data: mockMechanicProfileResponse,
          errors: null,
        } as ApiResponse<ProfileResponse>),
      );
      fixture.detectChanges();

      const fields = fixture.nativeElement.querySelectorAll('.profile-field');
      const fieldArray = Array.from(fields) as Element[];
      const shopField = fieldArray.find(
        (f: Element) => f.querySelector('.profile-field__label')?.textContent === 'Shop',
      );
      expect(shopField).toBeTruthy();
      expect(shopField!.querySelector('.profile-field__value')?.textContent).toBe('MotoCare Repairs');
    });

    it('should not display shop info for customer', () => {
      profileService.getProfile.mockReturnValue(
        of({
          success: true,
          message: 'Profile fetched successfully',
          data: mockProfileResponse,
          errors: null,
        } as ApiResponse<ProfileResponse>),
      );
      fixture.detectChanges();

      const fields = fixture.nativeElement.querySelectorAll('.profile-field');
      const fieldArray = Array.from(fields) as Element[];
      const shopField = fieldArray.find(
        (f: Element) => f.querySelector('.profile-field__label')?.textContent === 'Shop',
      );
      expect(shopField).toBeFalsy();
    });

    it('should display error on failed fetch', () => {
      profileService.getProfile.mockReturnValue(
        throwError(() => new Error('Your session has expired. Please log in again.')),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.serverError()).toBe('Your session has expired. Please log in again.');
    });

    it('should show error banner on failure', () => {
      profileService.getProfile.mockReturnValue(
        throwError(() => new Error('Something went wrong')),
      );
      fixture.detectChanges();

      const c = component as any;
      expect(c.isLoading()).toBe(false);
      const errorBanner = fixture.nativeElement.querySelector('.profile-error');
      expect(errorBanner).toBeTruthy();
      expect(errorBanner.textContent).toContain('Something went wrong');
    });

    it('should show loading text in card while loading', () => {
      profileService.getProfile.mockReturnValue(NEVER);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('app-card');
      expect(card).toBeTruthy();
      expect(card.textContent).toContain('Loading your profile...');
    });

    it('should show Edit Profile button when profile is loaded', () => {
      setupProfileLoaded();
      const c = component as any;
      expect(c.isEditing()).toBe(false);
      const editButton = fixture.nativeElement.querySelector('app-button[variant="outline"]');
      expect(editButton).toBeTruthy();
      expect(editButton.textContent).toContain('Edit Profile');
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when Edit Profile is clicked', () => {
      setupProfileLoaded();
      const c = component as any;
      expect(c.isEditing()).toBe(false);

      c.enterEditMode();
      expect(c.isEditing()).toBe(true);
    });

    it('should populate form with current profile values on enter edit mode', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();

      expect(c.form.value.name).toBe('Jane Doe');
      expect(c.form.value.phone).toBe('9876543210');
    });

    it('should show edit form with name and phone inputs', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      fixture.detectChanges();

      const inputs = fixture.nativeElement.querySelectorAll('app-input');
      const inputArray = Array.from(inputs) as Element[];
      const labels = inputArray.map((i: Element) => i.getAttribute('label'));
      expect(labels).toContain('Name');
      expect(labels).toContain('Phone');
    });

    it('should show Save and Cancel buttons in edit mode', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('app-button');
      const buttonArray = Array.from(buttons) as Element[];
      const buttonTexts = buttonArray.map((b: Element) => b.textContent?.trim());
      expect(buttonTexts).toContain('Cancel');
      expect(buttonTexts).toContain('Save');
    });

    it('should cancel edit and return to view mode', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      expect(c.isEditing()).toBe(true);

      c.cancelEdit();
      expect(c.isEditing()).toBe(false);
      expect(c.form.value.name).toBeNull();
      expect(c.form.value.phone).toBeNull();
    });

    it('should show form validation errors when submitted with empty form', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: '', phone: '' });
      c.onSave();

      expect(c.submitted()).toBe(true);
      expect(c.nameError).toBe('Name is required');
      expect(c.phoneError).toBe('Phone number is required');
    });

    it('should show name length validation error', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      const longName = 'a'.repeat(101);
      c.form.setValue({ name: longName, phone: '9876543210' });
      c.onSave();

      expect(c.nameError).toBe('Name must be between 1 and 100 characters');
    });

    it('should show phone pattern validation error', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Jane Doe', phone: '12345' });
      c.onSave();

      expect(c.phoneError).toBe('Enter a valid 10-digit Indian phone number');
    });

    it('should call updateProfile with correct payload on valid submit', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Jane Updated', phone: '9876543211' });

      profileService.updateProfile.mockReturnValue(
        of({
          success: true,
          message: 'Profile updated successfully',
          data: { profile: { ...mockProfile, name: 'Jane Updated', phone: '9876543211' } },
          errors: null,
        } as ApiResponse<ProfileResponse>),
      );

      c.onSave();

      const expectedPayload: ProfileUpdatePayload = {
        name: 'Jane Updated',
        phone: '9876543211',
      };
      expect(profileService.updateProfile).toHaveBeenCalledWith(expectedPayload);
    });

    it('should set isSubmitting to true during update', () => {
      setupProfileLoaded();
      profileService.updateProfile.mockReturnValue(NEVER);
      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Jane Doe', phone: '9876543210' });
      c.onSave();

      expect(c.isSubmitting()).toBe(true);
    });

    it('should reset isSubmitting after update completes', () => {
      setupProfileLoaded();
      profileService.updateProfile.mockReturnValue(
        throwError(() => new Error('Failed')),
      );
      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Jane Doe', phone: '9876543210' });
      c.onSave();

      expect(c.isSubmitting()).toBe(false);
    });

    it('should update profile signal on successful save and return to view mode', () => {
      setupProfileLoaded();
      const updatedProfile: Profile = { ...mockProfile, name: 'Jane Updated', phone: '9876543211' };
      profileService.updateProfile.mockReturnValue(
        of({
          success: true,
          message: 'Profile updated successfully',
          data: { profile: updatedProfile },
          errors: null,
        } as ApiResponse<ProfileResponse>),
      );

      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Jane Updated', phone: '9876543211' });
      c.onSave();

      expect(c.profile()).toEqual(updatedProfile);
      expect(c.isEditing()).toBe(false);
    });

    it('should remain in edit mode on validation error', () => {
      setupProfileLoaded();
      const validationErrors: ApiValidationError[] = [
        { field: 'name', message: 'name must be between 1 and 100 characters' },
      ];
      profileService.updateProfile.mockReturnValue(
        throwError(() => new Error('name must be between 1 and 100 characters')),
      );

      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Jane', phone: '9876543210' });
      c.onSave();

      expect(c.isEditing()).toBe(true);
      expect(c.serverError()).toBe('name must be between 1 and 100 characters');
    });

    it('should preserve user input on validation error', () => {
      setupProfileLoaded();
      profileService.updateProfile.mockReturnValue(
        throwError(() => new Error('Phone number must be a valid 10-digit Indian mobile number')),
      );

      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Custom Name', phone: '12345' });
      c.onSave();

      expect(c.form.value.name).toBe('Custom Name');
      expect(c.form.value.phone).toBe('12345');
    });

    it('should display backend validation errors on save failure', () => {
      setupProfileLoaded();
      const validationErrors: ApiValidationError[] = [
        { field: 'name', message: 'name must be between 1 and 100 characters' },
        { field: 'phone', message: 'Phone number must be a valid 10-digit Indian mobile number, optionally prefixed with +91' },
      ];
      profileService.updateProfile.mockReturnValue(
        throwError(() => new Error(validationErrors.map((e) => e.message).join('. '))),
      );

      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: 'Valid Name', phone: '9876543210' });
      c.onSave();

      expect(c.serverError()).toContain('name must be between 1 and 100 characters');
      expect(c.serverError()).toContain('Phone number must be a valid');
    });

    it('should not call updateProfile when form is invalid', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterEditMode();
      c.form.setValue({ name: '', phone: '' });
      c.onSave();

      expect(profileService.updateProfile).not.toHaveBeenCalled();
    });

    it('should clear server error when entering edit mode', () => {
      setupProfileLoaded();
      const c = component as any;
      c.serverError.set('Some previous error');
      c.enterEditMode();

      expect(c.serverError()).toBeNull();
    });
  });

  describe('Change Password Mode', () => {
    it('should enter change password mode when Change Password is clicked', () => {
      setupProfileLoaded();
      const c = component as any;
      expect(c.isChangingPassword()).toBe(false);

      c.enterChangePasswordMode();
      expect(c.isChangingPassword()).toBe(true);
    });

    it('should reset password form on enter change password mode', () => {
      setupProfileLoaded();
      const c = component as any;
      c.passwordForm.setValue({
        currentPassword: 'oldvalue1',
        newPassword: 'newvalue1',
        confirmPassword: 'newvalue1',
      });
      c.enterChangePasswordMode();

      expect(c.passwordForm.value.currentPassword).toBeNull();
      expect(c.passwordForm.value.newPassword).toBeNull();
      expect(c.passwordForm.value.confirmPassword).toBeNull();
    });

    it('should exit change password mode and reset form', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'old',
        newPassword: 'new123',
        confirmPassword: 'new123',
      });
      expect(c.isChangingPassword()).toBe(true);

      c.exitChangePasswordMode();
      expect(c.isChangingPassword()).toBe(false);
      expect(c.passwordForm.value.currentPassword).toBeNull();
    });

    it('should show current password error when required field is empty', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: '',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.submitted()).toBe(true);
      expect(c.currentPasswordError).toBe('Current password is required');
    });

    it('should show new password required error', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: '',
        confirmPassword: '',
      });
      c.onChangePassword();

      expect(c.newPasswordError).toBe('New password is required');
    });

    it('should show new password min length error', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'short',
        confirmPassword: 'short',
      });
      c.onChangePassword();

      expect(c.newPasswordError).toBe('New password must be at least 6 characters');
    });

    it('should show confirm password required error', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: '',
      });
      c.onChangePassword();

      expect(c.confirmPasswordError).toBe('Please confirm your new password');
    });

    it('should show mismatch error when passwords do not match', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'different123',
      });
      c.onChangePassword();

      expect(c.passwordForm.hasError('mismatch')).toBe(true);
      expect(c.confirmPasswordError).toBe('Passwords do not match');
    });

    it('should show same-as-current error when new password equals current password', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'samepass123',
        newPassword: 'samepass123',
        confirmPassword: 'samepass123',
      });
      c.onChangePassword();

      expect(c.passwordForm.hasError('sameAsCurrent')).toBe(true);
      expect(c.newPasswordError).toBe('New password must be different from current password');
    });

    it('should call changePassword with correct payload on valid submit', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });

      profileService.changePassword.mockReturnValue(
        of({
          success: true,
          message: 'Password changed successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      c.onChangePassword();

      expect(profileService.changePassword).toHaveBeenCalledWith('oldpass123', 'newpass123');
    });

    it('should set isSubmitting to true during password change', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(NEVER);
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.isSubmitting()).toBe(true);
    });

    it('should reset isSubmitting after password change completes', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        throwError(() => new Error('Failed')),
      );
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.isSubmitting()).toBe(false);
    });

    it('should display success message on successful password change', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        of({
          success: true,
          message: 'Password changed successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.passwordSuccess()).toBe('Password changed successfully');
    });

    it('should reset form and exit change password mode on success', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        of({
          success: true,
          message: 'Password changed successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.isChangingPassword()).toBe(false);
      expect(c.passwordForm.value.currentPassword).toBeNull();
      expect(c.passwordForm.value.newPassword).toBeNull();
      expect(c.passwordForm.value.confirmPassword).toBeNull();
    });

    it('should clear serverError after successful password change', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        of({
          success: true,
          message: 'Password changed successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.serverError.set('Some previous error');
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.serverError()).toBeNull();
    });

    it('should display error on wrong current password (400)', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        throwError(() => new Error('Current password is incorrect')),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'wrongpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.serverError()).toBe('Current password is incorrect');
      expect(c.isChangingPassword()).toBe(true);
    });

    it('should display backend validation errors', () => {
      setupProfileLoaded();
      const validationErrors: ApiValidationError[] = [
        { field: 'currentPassword', message: 'currentPassword is required' },
      ];
      profileService.changePassword.mockReturnValue(
        throwError(() => new Error(validationErrors.map((e) => e.message).join('. '))),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.serverError()).toBe('currentPassword is required');
    });

    it('should not call changePassword when form is invalid', () => {
      setupProfileLoaded();
      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      c.onChangePassword();

      expect(profileService.changePassword).not.toHaveBeenCalled();
    });

    it('should show Change Password button in view mode', () => {
      setupProfileLoaded();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('app-button');
      const buttonArray = Array.from(buttons) as Element[];
      const buttonTexts = buttonArray.map((b: Element) => b.textContent?.trim());
      expect(buttonTexts).toContain('Change Password');
    });

    it('should show success banner with backend message', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        of({
          success: true,
          message: 'Password changed successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();
      fixture.detectChanges();

      const successBanner = fixture.nativeElement.querySelector('.profile-success');
      expect(successBanner).toBeTruthy();
      expect(successBanner.textContent).toContain('Password changed successfully');
    });

    it('should hide passwordSuccess when re-entering change password mode', () => {
      setupProfileLoaded();
      const c = component as any;
      c.passwordSuccess.set('Password changed successfully');

      c.enterChangePasswordMode();

      expect(c.passwordSuccess()).toBeNull();
    });
  });

  describe('Deactivate Mode', () => {
    it('should show Danger Zone in view mode', () => {
      setupProfileLoaded();
      fixture.detectChanges();

      const dangerZone = fixture.nativeElement.querySelector('.danger-zone');
      expect(dangerZone).toBeTruthy();
      expect(dangerZone.textContent).toContain('Danger Zone');
      expect(dangerZone.textContent).toContain('Deactivate Account');
    });

    it('should show Deactivate button disabled until confirmation phrase is entered', () => {
      setupProfileLoaded();
      const c = component as any;

      expect(c.canDeactivate).toBe(false);
      c.deactivationControl.setValue('');
      expect(c.canDeactivate).toBe(false);

      c.deactivationControl.setValue('deactivate');
      expect(c.canDeactivate).toBe(false);
    });

    it('should enable Deactivate button when DEACTIVATE is typed exactly', () => {
      setupProfileLoaded();
      const c = component as any;

      c.deactivationControl.setValue('DEACTIVATE');
      expect(c.canDeactivate).toBe(true);
    });

    it('should reject partial match (case-sensitive)', () => {
      setupProfileLoaded();
      const c = component as any;

      c.deactivationControl.setValue('deactivate');
      expect(c.canDeactivate).toBe(false);

      c.deactivationControl.setValue('DEACTIVAT');
      expect(c.canDeactivate).toBe(false);

      c.deactivationControl.setValue('DEACTIVATE ');
      expect(c.canDeactivate).toBe(false);
    });

    it('should call deactivateAccount on submit with correct form', () => {
      setupProfileLoaded();
      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');

      profileService.deactivateAccount.mockReturnValue(
        of({
          success: true,
          message: 'Account deactivated successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      c.onDeactivate();

      expect(profileService.deactivateAccount).toHaveBeenCalled();
    });

    it('should not call deactivateAccount when confirmation is wrong', () => {
      setupProfileLoaded();
      const c = component as any;
      c.deactivationControl.setValue('WRONG');

      c.onDeactivate();

      expect(profileService.deactivateAccount).not.toHaveBeenCalled();
    });

    it('should set isDeactivating to true during deactivation', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(NEVER);
      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');

      c.onDeactivate();

      expect(c.isDeactivating()).toBe(true);
    });

    it('should reset isDeactivating after deactivation completes', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(
        throwError(() => new Error('Failed')),
      );
      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');

      c.onDeactivate();

      expect(c.isDeactivating()).toBe(false);
    });

    it('should call AuthService.logout on successful deactivation', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(
        of({
          success: true,
          message: 'Account deactivated successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      c.onDeactivate();

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should NOT log out on deactivation failure', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(
        throwError(() => new Error('Something went wrong')),
      );

      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      c.onDeactivate();

      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should display success message on successful deactivation', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(
        of({
          success: true,
          message: 'Account deactivated successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      c.onDeactivate();

      expect(c.passwordSuccess()).toBe('Account deactivated successfully');
    });

    it('should clear deactivation input on successful deactivation', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(
        of({
          success: true,
          message: 'Account deactivated successfully',
          data: null,
          errors: null,
        } as ApiResponse<null>),
      );

      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      c.onDeactivate();

      expect(c.deactivationControl.value).toBe('');
    });

    it('should stay in view mode on deactivation error', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(
        throwError(() => new Error('Something went wrong')),
      );

      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      c.onDeactivate();

      expect(c.isDeactivating()).toBe(false);
      expect(c.deactivationControl.value).toBe('DEACTIVATE');
      expect(c.serverError()).toBe('Something went wrong');
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should preserve user input on deactivation error', () => {
      setupProfileLoaded();
      profileService.deactivateAccount.mockReturnValue(
        throwError(() => new Error('Server error')),
      );

      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      c.onDeactivate();

      expect(c.deactivationControl.value).toBe('DEACTIVATE');
    });

    it('should clear deactivation input and error on cancel', () => {
      setupProfileLoaded();
      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      c.serverError.set('Some error');

      c.cancelDeactivation();

      expect(c.deactivationControl.value).toBe('');
      expect(c.serverError()).toBeNull();
    });

    it('should show Cancel button as disabled when no input', () => {
      setupProfileLoaded();
      const c = component as any;
      c.deactivationControl.setValue('');
      fixture.detectChanges();

      expect(c.hasDeactivationInput).toBe(false);
    });

    it('should show Cancel button as enabled when input exists', () => {
      setupProfileLoaded();
      const c = component as any;
      c.deactivationControl.setValue('DEACTIVATE');
      fixture.detectChanges();

      expect(c.hasDeactivationInput).toBe(true);
    });
  });

  describe('ErrorInterceptor exclusion for /profile/password', () => {
    it('should show error on wrong current password without logout', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        throwError(() => new Error('Current password is incorrect')),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'wrongpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.serverError()).toBe('Current password is incorrect');
      expect(c.isChangingPassword()).toBe(true);
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('should remain in Change Password mode on wrong current password', () => {
      setupProfileLoaded();
      profileService.changePassword.mockReturnValue(
        throwError(() => new Error('Current password is incorrect')),
      );

      const c = component as any;
      c.enterChangePasswordMode();
      c.passwordForm.setValue({
        currentPassword: 'wrongpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      });
      c.onChangePassword();

      expect(c.isChangingPassword()).toBe(true);
      expect(c.isSubmitting()).toBe(false);
    });
  });
});
