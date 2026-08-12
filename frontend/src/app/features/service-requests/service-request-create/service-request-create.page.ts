import { Component, signal, computed, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceRequest, VehicleType } from '../../../core/models/service-request.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ShopSelectorComponent } from './shop-selector/shop-selector.component';

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'two_wheeler', label: 'Two Wheeler', icon: '🏍️' },
  { value: 'four_wheeler', label: 'Four Wheeler', icon: '🚗' },
];

@Component({
  selector: 'app-service-request-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    ButtonComponent,
    ShopSelectorComponent,
  ],
  templateUrl: './service-request-create.page.html',
  styleUrl: './service-request-create.page.scss',
})
export class ServiceRequestCreatePageComponent {
  protected readonly isLoading = signal<boolean>(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly locationError = signal<string | null>(null);
  protected readonly isLocating = signal<boolean>(false);
  protected readonly coordinates = signal<{ lng: number; lat: number } | null>(null);

  protected readonly vehicleTypes = VEHICLE_TYPES;
  protected form: FormGroup;

  protected readonly isCustomer = computed(() => {
    const user = this.authService.user();
    return user?.role === 'customer';
  });

  private readonly hasLoaded = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly authService: AuthService,
  ) {
    this.form = this.fb.group({
      shopId: ['', Validators.required],
      vehicleType: ['', Validators.required],
      issueDescription: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      locationType: this.fb.control<'geolocation' | 'manual'>('manual'),
      locationLat: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      locationLng: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
    });

    // Wait for async auth restoration before deciding whether to redirect non-customers
    effect(() => {
      const user = this.authService.user();
      if (user && !this.hasLoaded()) {
        this.hasLoaded.set(true);
        if (!this.isCustomer()) {
          this.router.navigate(['/service-requests']);
        }
      }
    });

    this.form.get('vehicleType')?.valueChanges.subscribe(() => {
      this.form.get('shopId')?.setValue('');
    });
  }

  protected get isSubmitting(): boolean {
    return this.isLoading();
  }

  protected get locationType(): 'geolocation' | 'manual' {
    return this.form.get('locationType')?.value ?? 'manual';
  }

  protected get manualLat(): number | null {
    const val = this.form.get('locationLat')?.value;
    if (!val) return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }

  protected get manualLng(): number | null {
    const val = this.form.get('locationLng')?.value;
    if (!val) return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }

  protected useGeolocation(): void {
    if (!navigator.geolocation) {
      this.locationError.set('Geolocation is not supported by your browser. Please enter coordinates manually.');
      return;
    }

    this.isLocating.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.coordinates.set({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
        this.form.get('locationType')?.setValue('geolocation');
        this.form.get('locationLat')?.setValue(position.coords.latitude);
        this.form.get('locationLng')?.setValue(position.coords.longitude);
        this.isLocating.set(false);
      },
      () => {
        this.locationError.set(
          'Unable to retrieve your location. Please enter coordinates manually.',
        );
        this.form.get('locationType')?.setValue('manual');
        this.isLocating.set(false);
      },
    );
  }

  protected onShopSelected(shop: { id: string }): void {
    this.form.get('shopId')?.setValue(shop.id);
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      return;
    }

    const shopId = this.form.get('shopId')?.value as string;
    const vehicleType = this.form.get('vehicleType')?.value as VehicleType;
    const issueDescription = this.form.get('issueDescription')?.value as string;
    const lat = parseFloat(this.form.get('locationLat')?.value);
    const lng = parseFloat(this.form.get('locationLng')?.value);

    this.isLoading.set(true);
    this.serverError.set(null);

    this.serviceRequestService
      .create({
        shopId,
        vehicleType,
        issueDescription,
        location: {
          type: 'Point' as const,
          coordinates: [lng, lat],
        },
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.router.navigate(['/service-requests', response.data.serviceRequest.id]);
          } else {
            this.serverError.set(response.message || 'Failed to create service request');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 404) {
              this.serverError.set(
                'The selected repair shop was not found. Please select a different shop.',
              );
            } else if (error.status === 409) {
              this.serverError.set(
                error.error?.message ||
                  'You already have an active request with this repair shop.',
              );
            } else if (error.status === 403) {
              this.serverError.set(
                'You do not have permission to create a service request.',
              );
            } else if (error.status === 401) {
              this.serverError.set('Your session has expired. Please log in again.');
            } else if (error.error?.errors?.length) {
              this.serverError.set(
                (error.error.errors as Array<{ message: string }>)
                  .map((e) => e.message)
                  .join('. '),
              );
            } else if (error.error?.message) {
              this.serverError.set(error.error.message);
            } else if (error.status === 500) {
              this.serverError.set('A server error occurred. Please try again later.');
            } else {
              this.serverError.set(error.error?.message || 'Failed to create service request');
            }
          } else {
            this.serverError.set(error.message || 'Failed to create service request');
          }
        },
      });
  }

  protected goBack(): void {
    this.router.navigate(['/service-requests']);
  }
}
