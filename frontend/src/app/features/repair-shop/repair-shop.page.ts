import { Component, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RepairShopService } from '../../core/services/repair-shop.service';
import { AuthService } from '../../core/services/auth.service';
import {
  RepairShop,
  VehicleType,
  GeoPoint,
  CreateRepairShopPayload,
  UpdateRepairShopPayload,
} from '../../core/models/repair-shop.model';
import { ApiResponse } from '../../core/models/api-response.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { VerificationBadgeComponent, VerificationStatus } from '../../shared/components/verification-badge/verification-badge.component';

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
};

@Component({
  selector: 'app-repair-shop',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    VerificationBadgeComponent,
    DatePipe,
  ],
  templateUrl: './repair-shop.page.html',
  styleUrl: './repair-shop.page.scss',
})
export class RepairShopPageComponent implements OnInit {
  protected readonly shop = signal<RepairShop | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly isLocating = signal<boolean>(false);
  protected readonly locationError = signal<string | null>(null);

  protected form: FormGroup;
  protected isEditMode = signal<boolean>(false);

  protected readonly vehicleTypes = [
    { value: 'two_wheeler', label: 'Two Wheeler' },
    { value: 'four_wheeler', label: 'Four Wheeler' },
  ];

  protected readonly isMechanic = computed(() => {
    const user = this.authService.user();
    return user?.role === 'mechanic';
  });

  protected readonly hasShop = computed(() => {
    return this.shop() !== null;
  });

  protected readonly verificationStatus = computed((): VerificationStatus => {
    return this.shop()?.status ?? 'pending';
  });

  protected readonly verificationLabel = computed(() => {
    const status = this.verificationStatus();
    return VERIFICATION_LABELS[status] ?? status;
  });

  protected reverificationRequired(): boolean {
    const currentShop = this.shop();
    if (!currentShop || !this.isEditMode()) return false;

    const values = this.form.getRawValue();
    const original = currentShop;

    const hasShopNameChanged = values.shopName !== original.shopName;
    const hasAddressChanged = values.address !== original.address;
    const hasVehicleTypesChanged = !this._arraysEqual(values.vehicleTypesServiced, original.vehicleTypesServiced);
    const hasLocationChanged = !this._locationsEqual(values.location, original.location);

    return hasShopNameChanged || hasAddressChanged || hasVehicleTypesChanged || hasLocationChanged;
  }

  private _arraysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
  }

  private _locationsEqual(a: GeoPoint | undefined, b: GeoPoint | undefined): boolean {
    if (!a || !b) return false;
    return (
      a.type === b.type &&
      a.coordinates[0] === b.coordinates[0] &&
      a.coordinates[1] === b.coordinates[1]
    );
  }

  protected get shopNameCtrl(): AbstractControl<any, any> | null {
    return this.form.get('shopName');
  }
  protected get vehicleTypesCtrl(): AbstractControl<any, any> | null {
    return this.form.get('vehicleTypesServiced');
  }
  protected get addressCtrl(): AbstractControl<any, any> | null {
    return this.form.get('address');
  }
  protected get phoneCtrl(): AbstractControl<any, any> | null {
    return this.form.get('phone');
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly repairShopService: RepairShopService,
    private readonly authService: AuthService,
  ) {
    this.form = this.fb.group({
      shopName: ['', { validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)] }],
      vehicleTypesServiced: [[], { validators: [Validators.required] }],
      location: this.fb.group({
        type: ['Point'],
        coordinates: [[]],
      }),
      address: ['', { validators: [Validators.required, Validators.maxLength(300)] }],
      phone: ['', { validators: [Validators.required] }],
      description: [''],
      openingHours: [''],
      photoUrl: [''],
    });
  }

  ngOnInit(): void {
    this.loadMyShop();
  }

  protected loadMyShop(): void {
    this.isLoading.set(true);
    this.serverError.set(null);

    this.repairShopService
      .getMyShop()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: ApiResponse<{ repairShop: RepairShop }>) => {
          if (response.success && response.data?.repairShop) {
            this.shop.set(response.data.repairShop);
            this.populateForm(response.data.repairShop);
          } else if (response.message) {
            this.serverError.set(response.message);
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 404) {
              this.shop.set(null);
            } else if (error.status === 403) {
              this.serverError.set('You do not have permission to access this shop.');
            } else {
              this.serverError.set(error.message || 'Failed to load repair shop');
            }
          } else {
            this.serverError.set(error.message || 'Failed to load repair shop');
          }
        },
      });
  }

  protected populateForm(shop: RepairShop): void {
    this.form.patchValue({
      shopName: shop.shopName,
      vehicleTypesServiced: shop.vehicleTypesServiced,
      location: shop.location,
      address: shop.address,
      phone: shop.phone,
      description: shop.description ?? '',
      openingHours: shop.openingHours ?? '',
      photoUrl: shop.photoUrl ?? '',
    });
    this.form.markAsPristine();
  }

  protected startEdit(): void {
    this.isEditMode.set(true);
    this.serverError.set(null);
    this.successMessage.set(null);
  }

  protected cancelEdit(): void {
    this.isEditMode.set(false);
    this.form.markAsPristine();
    this.form.reset();
    if (this.shop()) {
      this.populateForm(this.shop()!);
    }
  }

  protected saveShop(): void {
    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const values = this.form.getRawValue();
    const hasShop = this.shop();

    this.isSaving.set(true);
    this.serverError.set(null);
    this.successMessage.set(null);

    if (!hasShop) {
      const createPayload: CreateRepairShopPayload = {
        shopName: values.shopName,
        vehicleTypesServiced: values.vehicleTypesServiced,
        location: values.location,
        address: values.address,
        phone: values.phone,
        description: values.description || undefined,
        openingHours: values.openingHours || undefined,
        photoUrl: values.photoUrl || undefined,
      };

      this.repairShopService
        .create(createPayload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (response: ApiResponse<{ repairShop: RepairShop }>) => {
            if (response.success && response.data?.repairShop) {
              this.shop.set(response.data.repairShop);
              this.isEditMode.set(false);
              this.form.markAsPristine();
              this.setSuccessMessage(response.message || 'Repair shop created successfully');
            } else if (response.message) {
              this.serverError.set(response.message);
            } else {
              this.serverError.set('Failed to create repair shop');
            }
          },
          error: (error: Error) => {
            if (error instanceof HttpErrorResponse) {
              if (error.status === 409) {
                this.serverError.set('You already have a repair shop');
              } else {
                this.serverError.set(error.message || 'Failed to create repair shop');
              }
            } else {
              this.serverError.set(error.message || 'Failed to create repair shop');
            }
          },
        });
    } else {
      const updatePayload: UpdateRepairShopPayload = {
        shopName: values.shopName,
        vehicleTypesServiced: values.vehicleTypesServiced,
        location: values.location,
        address: values.address,
        phone: values.phone,
        description: values.description || undefined,
        openingHours: values.openingHours || undefined,
        photoUrl: values.photoUrl || undefined,
      };

      this.repairShopService
        .update(updatePayload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (response: ApiResponse<{ repairShop: RepairShop }>) => {
            if (response.success && response.data?.repairShop) {
              this.shop.set(response.data.repairShop);
              this.form.markAsPristine();
              this.setSuccessMessage(response.message || 'Repair shop updated successfully');
            } else if (response.message) {
              this.serverError.set(response.message);
            } else {
              this.serverError.set('Failed to update repair shop');
            }
          },
          error: (error: Error) => {
            if (error instanceof HttpErrorResponse) {
              if (error.status === 409) {
                this.serverError.set('You already have a repair shop');
              } else {
                this.serverError.set(error.message || 'Failed to update repair shop');
              }
            } else {
              this.serverError.set(error.message || 'Failed to update repair shop');
            }
          },
        });
    }
  }

  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  protected setSuccessMessage(message: string): void {
    this.successMessage.set(message);
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    this.successTimeout = setTimeout(() => {
      this.successMessage.set(null);
      this.successTimeout = null;
    }, 3000);
  }

  protected ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  protected goBack(): void {
    this.router.navigate(['/service-requests']);
  }

  protected toggleVehicleType(type: string | VehicleType): void {
    const vt = type as VehicleType;
    const current = this.form.get('vehicleTypesServiced')?.value ?? [];
    if (current.includes(vt)) {
      this.form.get('vehicleTypesServiced')?.setValue(current.filter((t: VehicleType) => t !== vt));
    } else {
      this.form.get('vehicleTypesServiced')?.setValue([...current, vt]);
    }
  }

  protected hasVehicleType(type: string | VehicleType): boolean {
    const vt = type as VehicleType;
    const current = this.form.get('vehicleTypesServiced')?.value ?? [];
    return current.includes(vt);
  }

  protected getLocation(): void {
    if (this.isLocating() || this.isSaving()) {
      return;
    }

    if (!navigator.geolocation) {
      this.locationError.set('Unable to get your location. Please enter coordinates manually.');
      return;
    }

    this.isLocating.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;
        this.form.get('location')?.setValue({
          type: 'Point',
          coordinates: [lng, lat],
        });
        this.isLocating.set(false);
      },
      (err) => {
        this.locationError.set('Unable to get your location. Please enter coordinates manually.');
        this.isLocating.set(false);
      },
    );
  }

  protected isLocationSet(): boolean {
    const loc = this.form.get('location')?.value;
    return loc && loc.coordinates && loc.coordinates.length === 2;
  }

  protected formatLocation(): string {
    const loc = this.form.get('location')?.value;
    if (!loc || !loc.coordinates || loc.coordinates.length < 2) return 'Not set';
    const [lng, lat] = loc.coordinates;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}
