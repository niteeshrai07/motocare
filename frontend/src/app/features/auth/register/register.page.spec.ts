import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RegisterPageComponent } from './register.page';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/api-response.model';

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let component: RegisterPageComponent;

  const authService = {
    register: vi.fn(),
    persistSession: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    const c = component as any;
    expect(c.form.valid).toBe(false);
  });

  it('should create a valid form with correct data', () => {
    const c = component as any;
    c.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '+919876543210',
      role: 'customer',
    });

    expect(c.form.valid).toBe(true);
  });

  it('should detect password mismatch', () => {
    const c = component as any;
    c.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'different123',
      phone: '+919876543210',
      role: 'customer',
    });
    c.form.controls['confirmPassword'].markAsTouched();

    expect(c.form.valid).toBe(false);
    expect(c.form.errors).toEqual({ mismatch: true });
    expect(c.passwordMismatch).toBe(true);
  });

  it('should be valid when passwords match', () => {
    const c = component as any;
    c.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '+919876543210',
      role: 'mechanic',
    });

    expect(c.form.valid).toBe(true);
    expect(c.passwordMismatch).toBe(false);
  });

  it('should reject admin role', () => {
    const c = component as any;
    c.form.controls['role'].setValue('admin');

    expect(c.form.controls['role'].valid).toBe(false);
    expect(c.form.controls['role'].hasError('mustBeOneOf')).toBe(true);
  });

  it('should accept role as customer', () => {
    const c = component as any;
    c.form.controls['role'].setValue('customer');

    expect(c.form.controls['role'].valid).toBe(true);
  });

  it('should accept role as mechanic', () => {
    const c = component as any;
    c.form.controls['role'].setValue('mechanic');

    expect(c.form.controls['role'].valid).toBe(true);
  });

  it('should call auth.register on submit with valid form', () => {
    const credentials = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '+919876543210',
      role: 'customer',
    };

    authService.register.mockReturnValue(of({} as any));
    const c = component as any;
    c.form.setValue(credentials);
    c.onSubmit();

    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
        role: credentials.role,
      }),
    );

    const callArgs = authService.register.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('confirmPassword');
  });

  it('should not call auth.register when form is invalid', () => {
    const c = component as any;
    c.onSubmit();

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should persist session and navigate on successful registration', () => {
    const mockResponse: ApiResponse<{ user: any; token: string }> = {
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: '1', email: 'jane@example.com', name: 'Jane Doe', role: 'customer' },
        token: 'mock-token',
      },
      errors: null,
    };

    authService.register.mockReturnValue(of(mockResponse));
    const navigateSpy = vi.spyOn((component as any).router, 'navigate').mockReturnValue(Promise.resolve(true));

    const c = component as any;
    c.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '+919876543210',
      role: 'customer',
    });
    c.onSubmit();

    expect(authService.register).toHaveBeenCalled();
    expect(authService.persistSession).toHaveBeenCalledWith('mock-token', mockResponse.data!.user);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should set server error on registration failure', () => {
    authService.register.mockReturnValue(
      throwError(() => new Error('Email already registered')),
    );

    const c = component as any;
    c.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '+919876543210',
      role: 'customer',
    });
    c.onSubmit();

    expect(c.serverError()).toBe('Email already registered');
    expect(c.isSubmitting()).toBe(false);
  });

  it('should default role to customer', () => {
    const c = component as any;
    expect(c.form.controls['role'].value).toBe('customer');
  });

  it('should set submitted to true on submit', () => {
    authService.register.mockReturnValue(of({} as any));

    const c = component as any;
    c.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      phone: '+919876543210',
      role: 'customer',
    });
    c.onSubmit();

    expect(c.submitted()).toBe(true);
  });
});
