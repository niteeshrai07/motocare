import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LoginPageComponent } from './login.page';
import { AuthService } from '../../../core/services/auth.service';
import { LoginCredentials } from '../../../core/models/auth.model';
import { ApiResponse } from '../../../core/models/api-response.model';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;

  const authService = {
    login: vi.fn(),
    persistSession: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
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

  it('should create a valid form with correct credentials', () => {
    const c = component as any;
    c.form.controls['email'].setValue('test@example.com');
    c.form.controls['password'].setValue('password123');

    expect(c.form.valid).toBe(true);
  });

  it('should call auth.login on submit with valid form', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    authService.login.mockReturnValue(of({} as any));
    const c = component as any;
    c.form.setValue(credentials);
    c.onSubmit();

    expect(authService.login).toHaveBeenCalledWith(credentials);
  });

  it('should not call auth.login when form is invalid', () => {
    const c = component as any;
    c.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should persist session and navigate on successful login', () => {
    const mockResponse: ApiResponse<{ user: any; token: string }> = {
      success: true,
      message: 'Login successful',
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'customer' },
        token: 'mock-token',
      },
      errors: null,
    };

    authService.login.mockReturnValue(of(mockResponse));
    const navigateSpy = vi.spyOn((component as any).router, 'navigate').mockReturnValue(Promise.resolve(true));

    const c = component as any;
    c.form.setValue({ email: 'test@example.com', password: 'password123' });
    c.onSubmit();

    expect(authService.login).toHaveBeenCalled();
    expect(authService.persistSession).toHaveBeenCalledWith('mock-token', mockResponse.data!.user);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should set server error on login failure', () => {
    authService.login.mockReturnValue(
      throwError(() => new Error('Invalid email or password')),
    );

    const c = component as any;
    c.form.setValue({ email: 'test@example.com', password: 'wrong' });
    c.onSubmit();

    expect(c.serverError()).toBe('Invalid email or password');
    expect(c.isSubmitting()).toBe(false);
  });

  it('should set submitted to true on submit', () => {
    authService.login.mockReturnValue(of({} as any));

    const c = component as any;
    c.form.setValue({ email: 'test@example.com', password: 'password123' });
    c.onSubmit();

    expect(c.submitted()).toBe(true);
  });

  it('should reset isSubmitting after login completes', () => {
    authService.login.mockReturnValue(
      throwError(() => new Error('fail')),
    );

    const c = component as any;
    c.form.setValue({ email: 'test@example.com', password: 'wrong' });
    c.onSubmit();

    expect(c.isSubmitting()).toBe(false);
  });
});
