import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ServiceRequestService } from '../../../core/services/service-request.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ServiceRequest,
  ServiceRequestStatus,
  QuoteServiceRequestPayload,
} from '../../../core/models/service-request.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CardComponent } from '../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { RequestStatusBadgeComponent } from '../../../shared/components/request-status-badge/request-status-badge.component';
import { InputComponent } from '../../../shared/components/input/input.component';

const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  pending: 'Pending',
  quoted: 'Quoted',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

type ActionType = 'quote' | 'reject' | 'accept' | 'cancel' | 'start' | 'complete' | null;

@Component({
  selector: 'app-service-request-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    RequestStatusBadgeComponent,
    CurrencyPipe,
    DatePipe,
    InputComponent,
  ],
  templateUrl: './service-request-detail.page.html',
  styleUrl: './service-request-detail.page.scss',
})
export class ServiceRequestDetailPageComponent implements OnInit, OnDestroy {
  protected readonly request = signal<ServiceRequest | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly serverError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly actionInProgress = signal<ActionType>(null);
  protected readonly isConfirmingCancel = signal<boolean>(false);
  protected readonly isConfirmingReject = signal<boolean>(false);
  protected readonly isQuoteFormExpanded = signal<boolean>(false);

  protected quoteForm: FormGroup;

  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly isCustomer = computed(() => {
    const user = this.authService.user();
    return user?.role === 'customer';
  });

  protected readonly isMechanic = computed(() => {
    const user = this.authService.user();
    return user?.role === 'mechanic';
  });

  protected readonly isActionLoading = computed(() => {
    return this.actionInProgress() !== null;
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly authService: AuthService,
  ) {
    this.quoteForm = this.fb.group({
      estimatedCost: ['', { validators: [Validators.required], updateOn: 'change' }],
      estimatedDuration: ['', { validators: [Validators.required], updateOn: 'change' }],
      mechanicNotes: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequest(id);
    } else {
      this.serverError.set('Invalid request ID');
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

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

  protected loadRequest(id: string): void {
    this.isLoading.set(true);
    this.serverError.set(null);

    this.serviceRequestService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.request.set(response.data.serviceRequest);
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to load service request');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 404) {
              this.serverError.set(
                'Service request not found. It may have been deleted or you may not have permission to view it.',
              );
            } else if (error.status === 403) {
              this.serverError.set(
                'You do not have permission to view this service request.',
              );
            } else {
              this.serverError.set(
                error.message || 'Failed to load service request',
              );
            }
          } else {
            this.serverError.set(error.message || 'Failed to load service request');
          }
        },
      });
  }

  protected accept(): void {
    const req = this.request();
    if (!req || this.isActionLoading()) {
      return;
    }

    this.actionInProgress.set('accept');
    this.serverError.set(null);
    this.successMessage.set(null);

    this.serviceRequestService
      .accept(req.id)
      .pipe(finalize(() => this.actionInProgress.set(null)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.request.set(response.data.serviceRequest);
            this.setSuccessMessage(response.message || 'Quote accepted');
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to accept quote');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 409) {
              this.serverError.set('This service request cannot be accepted at this time.');
            } else {
              this.serverError.set(error.message || 'Failed to accept quote');
            }
          } else {
            this.serverError.set(error.message || 'Failed to accept quote');
          }
        },
      });
  }

  protected startCancel(): void {
    if (this.isActionLoading()) {
      return;
    }
    this.isConfirmingCancel.set(true);
  }

  protected confirmCancel(): void {
    const req = this.request();
    if (!req || this.isActionLoading()) {
      return;
    }

    this.actionInProgress.set('cancel');
    this.isConfirmingCancel.set(false);
    this.serverError.set(null);
    this.successMessage.set(null);

    this.serviceRequestService
      .cancel(req.id)
      .pipe(finalize(() => this.actionInProgress.set(null)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.request.set(response.data.serviceRequest);
            this.setSuccessMessage(response.message || 'Request cancelled');
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to cancel request');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 409) {
              this.serverError.set('This service request cannot be cancelled at this time.');
            } else {
              this.serverError.set(error.message || 'Failed to cancel request');
            }
          } else {
            this.serverError.set(error.message || 'Failed to cancel request');
          }
        },
      });
  }

  protected cancelCancel(): void {
    this.isConfirmingCancel.set(false);
  }

  protected toggleQuoteForm(): void {
    if (this.isActionLoading()) {
      return;
    }
    this.isQuoteFormExpanded.set(!this.isQuoteFormExpanded());
  }

  protected submitQuote(): void {
    if (this.quoteForm.invalid || this.isActionLoading()) {
      return;
    }

    const req = this.request();
    if (!req) {
      return;
    }

    this.actionInProgress.set('quote');
    this.serverError.set(null);
    this.successMessage.set(null);

    const payload: QuoteServiceRequestPayload = {
      estimatedCost: this.quoteForm.value.estimatedCost,
      estimatedDuration: this.quoteForm.value.estimatedDuration,
      mechanicNotes: this.quoteForm.value.mechanicNotes || undefined,
    };

    this.serviceRequestService
      .quote(req.id, payload)
      .pipe(finalize(() => this.actionInProgress.set(null)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.request.set(response.data.serviceRequest);
            this.isQuoteFormExpanded.set(false);
            this.quoteForm.reset();
            this.setSuccessMessage(response.message || 'Quote submitted');
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to submit quote');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 422) {
              this.serverError.set('Please fill in all required fields.');
            } else if (error.status === 409) {
              this.serverError.set('This service request cannot be quoted at this time.');
            } else {
              this.serverError.set(error.message || 'Failed to submit quote');
            }
          } else {
            this.serverError.set(error.message || 'Failed to submit quote');
          }
        },
      });
  }

  protected startWork(): void {
    const req = this.request();
    if (!req || this.isActionLoading()) {
      return;
    }

    this.actionInProgress.set('start');
    this.serverError.set(null);
    this.successMessage.set(null);

    this.serviceRequestService
      .startWork(req.id)
      .pipe(finalize(() => this.actionInProgress.set(null)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.request.set(response.data.serviceRequest);
            this.setSuccessMessage(response.message || 'Work started');
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to start work');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 409) {
              this.serverError.set('This service request cannot be started at this time.');
            } else {
              this.serverError.set(error.message || 'Failed to start work');
            }
          } else {
            this.serverError.set(error.message || 'Failed to start work');
          }
        },
      });
  }

  protected startReject(): void {
    if (this.isActionLoading()) {
      return;
    }
    this.isConfirmingReject.set(true);
  }

  protected confirmReject(): void {
    const req = this.request();
    if (!req || this.isActionLoading()) {
      return;
    }

    this.actionInProgress.set('reject');
    this.isConfirmingReject.set(false);
    this.serverError.set(null);
    this.successMessage.set(null);

    this.serviceRequestService
      .reject(req.id)
      .pipe(finalize(() => this.actionInProgress.set(null)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.request.set(response.data.serviceRequest);
            this.setSuccessMessage(response.message || 'Request rejected');
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to reject request');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 409) {
              this.serverError.set('This service request cannot be rejected at this time.');
            } else {
              this.serverError.set(error.message || 'Failed to reject request');
            }
          } else {
            this.serverError.set(error.message || 'Failed to reject request');
          }
        },
      });
  }

  protected cancelReject(): void {
    this.isConfirmingReject.set(false);
  }

  protected completeWork(): void {
    const req = this.request();
    if (!req || this.isActionLoading()) {
      return;
    }

    this.actionInProgress.set('complete');
    this.serverError.set(null);
    this.successMessage.set(null);

    this.serviceRequestService
      .completeWork(req.id)
      .pipe(finalize(() => this.actionInProgress.set(null)))
      .subscribe({
        next: (response: ApiResponse<{ serviceRequest: ServiceRequest }>) => {
          if (response.success && response.data?.serviceRequest) {
            this.request.set(response.data.serviceRequest);
            this.setSuccessMessage(response.message || 'Work completed');
          } else if (response.message) {
            this.serverError.set(response.message);
          } else {
            this.serverError.set('Failed to complete work');
          }
        },
        error: (error: Error) => {
          if (error instanceof HttpErrorResponse) {
            if (error.status === 409) {
              this.serverError.set('This service request cannot be completed at this time.');
            } else {
              this.serverError.set(error.message || 'Failed to complete work');
            }
          } else {
            this.serverError.set(error.message || 'Failed to complete work');
          }
        },
      });
  }

  protected goBack(): void {
    this.router.navigate(['/service-requests']);
  }

  protected formatStatus(status: ServiceRequestStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected vehicleIcon(): string {
    const req = this.request();
    if (!req) return '';
    return req.vehicleType === 'two_wheeler' ? '🏍️' : '🚗';
  }

  protected vehicleLabel(): string {
    const req = this.request();
    if (!req) return '';
    return req.vehicleType === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler';
  }

  protected shortId(): string {
    const req = this.request();
    if (!req) return '';
    return req.id.length > 8 ? req.id.substring(0, 8) : req.id;
  }

  protected formatCoordinates(): string {
    const req = this.request();
    if (!req || !req.location?.coordinates || req.location.coordinates.length < 2) return '';
    const [lng, lat] = req.location.coordinates;
    return `${this.formatCoordinate(lat)}, ${this.formatCoordinate(lng)}`;
  }

  protected formatCoordinate(value: number): string {
    if (value === null || value === undefined) return '';
    return value.toFixed(6);
  }

  protected isExpired(): boolean {
    const req = this.request();
    if (!req) return false;
    if (req.status === 'expired') return true;
    const expiry = new Date(req.expiresAt);
    return Date.now() > expiry.getTime();
  }

  protected hasLocation(): boolean {
    const req = this.request();
    if (!req) return false;
    return (
      req.location?.coordinates != null &&
      req.location.coordinates.length >= 2
    );
  }

  protected canAccept(): boolean {
    const req = this.request();
    if (!req) return false;
    return req.status === 'quoted';
  }

  protected canCancel(): boolean {
    const req = this.request();
    if (!req) return false;
    return req.status === 'pending' || req.status === 'quoted';
  }

  protected canQuote(): boolean {
    const req = this.request();
    if (!req) return false;
    return req.status === 'pending';
  }

  protected canReject(): boolean {
    const req = this.request();
    if (!req) return false;
    return req.status === 'pending';
  }

  protected canStart(): boolean {
    const req = this.request();
    if (!req) return false;
    return req.status === 'accepted';
  }

  protected canComplete(): boolean {
    const req = this.request();
    if (!req) return false;
    return req.status === 'in_progress';
  }

  protected showActions(): boolean {
    return this.isCustomer() && !this.isConfirmingCancel() && (this.canAccept() || this.canCancel());
  }

  protected showMechanicActions(): boolean {
    return this.isMechanic() && (this.canQuote() || this.canReject() || this.canStart() || this.canComplete());
  }

  protected get quoteCostCtrl() { return this.quoteForm.controls['estimatedCost']; }
  protected get quoteDurationCtrl() { return this.quoteForm.controls['estimatedDuration']; }
}
