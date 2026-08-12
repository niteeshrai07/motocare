import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ServiceRequest, ServiceRequestStatus } from '../../../core/models/service-request.model';

/* Status metadata — used for both badge color/label and card accent */
const STATUS_META: Record<ServiceRequestStatus, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'status--pending'     },
  quoted:      { label: 'Quoted',      cls: 'status--quoted'      },
  accepted:    { label: 'Accepted',    cls: 'status--accepted'    },
  in_progress: { label: 'In Progress', cls: 'status--in-progress' },
  completed:   { label: 'Completed',   cls: 'status--completed'   },
  rejected:    { label: 'Rejected',    cls: 'status--rejected'    },
  cancelled:   { label: 'Cancelled',   cls: 'status--cancelled'   },
  expired:     { label: 'Expired',     cls: 'status--expired'     },
};

@Component({
  selector: 'app-service-request-card',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass],
  template: `
    <article class="rc" (click)="onClick()" role="button" tabindex="0"
             (keydown.enter)="onClick()" (keydown.space)="onClick()"
             [attr.aria-label]="'Service request ' + shortId() + ', ' + statusLabel()">

      <!-- ── Top row: ID + status badge ── -->
      <div class="rc__top">
        <span class="rc__id">#SR-{{ shortId() }}</span>
        <span class="rc__badge" [ngClass]="statusCls()" [attr.aria-label]="statusLabel()">
          {{ statusLabel() }}
        </span>
      </div>

      <!-- ── Issue description ── -->
      <p class="rc__desc" [title]="request.issueDescription">
        {{ request.issueDescription }}
      </p>

      <!-- ── Meta row: vehicle + shop ── -->
      <div class="rc__meta">
        <div class="rc__meta-item">
          <span class="rc__meta-icon" aria-hidden="true">{{ vehicleIcon() }}</span>
          <span class="rc__meta-label">{{ vehicleLabel() }}</span>
        </div>
        <div class="rc__meta-item">
          <span class="rc__meta-icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </span>
          <span class="rc__meta-label">{{ request.shop.shopName }}</span>
        </div>

        @if (hasContactInfo() && request.shop.phone) {
          <div class="rc__meta-item">
            <span class="rc__meta-icon" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.17-1.17a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </span>
            <span class="rc__meta-label">{{ request.shop.phone }}</span>
          </div>
        }
      </div>

      <!-- ── Footer: date + cost + action ── -->
      <div class="rc__footer">
        <span class="rc__date">{{ request.createdAt | date:'d MMM yyyy' }}</span>
        <div class="rc__footer-right">
          @if (request.estimatedCost !== null && request.estimatedCost !== undefined) {
            <span class="rc__cost">₹{{ request.estimatedCost | number:'1.0-0' }}</span>
          }
          <span class="rc__action" aria-hidden="true">View details →</span>
        </div>
      </div>

    </article>
  `,
  styles: [`
    /* ── Card shell ─────────────────────────── */
    .rc {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px 20px 16px;
      background: #fff;
      border: 1px solid #e7eaf0;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.045);
      cursor: pointer;
      transition:
        box-shadow 160ms ease,
        transform 160ms ease,
        border-color 160ms ease;
      text-align: left;
      outline: none;
    }

    .rc:hover {
      box-shadow: 0 8px 28px rgba(15, 23, 42, 0.09);
      transform: translateY(-2px);
      border-color: #c7d2fe;
    }

    .rc:focus-visible {
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
      border-color: #6366f1;
    }

    /* ── Top row ─────────────────────────────── */
    .rc__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .rc__id {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.03em;
    }

    /* ── Status badge ────────────────────────── */
    .rc__badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .status--pending     { color: #b45309; background: #fffbeb; border: 1px solid rgba(245,158,11,.25); }
    .status--quoted      { color: #1d4ed8; background: #eff6ff; border: 1px solid rgba(59,130,246,.25); }
    .status--accepted    { color: #1e40af; background: #eef2ff; border: 1px solid rgba(79,70,229,.25);  }
    .status--in-progress { color: #6d28d9; background: #f5f3ff; border: 1px solid rgba(109,40,217,.2); }
    .status--completed   { color: #065f46; background: #ecfdf5; border: 1px solid rgba(16,185,129,.25);}
    .status--rejected    { color: #b91c1c; background: #fef2f2; border: 1px solid rgba(239,68,68,.2);  }
    .status--cancelled   { color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0;             }
    .status--expired     { color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0;             }

    /* ── Description ─────────────────────────── */
    .rc__desc {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 0;
    }

    /* ── Meta row ────────────────────────────── */
    .rc__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 18px;
    }

    .rc__meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .rc__meta-icon {
      display: flex;
      align-items: center;
      color: #94a3b8;
      font-size: 13px;
      flex-shrink: 0;
    }

    .rc__meta-label {
      font-size: 12px;
      color: #475569;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    /* ── Footer ──────────────────────────────── */
    .rc__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
    }

    .rc__date {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
    }

    .rc__footer-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rc__cost {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      font-family: var(--font-heading, sans-serif);
    }

    .rc__action {
      font-size: 11.5px;
      font-weight: 700;
      color: #4f46e5;
      white-space: nowrap;
      transition: color 140ms ease;
    }

    .rc:hover .rc__action {
      color: #3730a3;
    }
  `],
})
export class ServiceRequestCardComponent {
  @Input({ required: true }) request!: ServiceRequest;
  @Output() selected = new EventEmitter<ServiceRequest>();

  onClick(): void {
    this.selected.emit(this.request);
  }

  shortId(): string {
    const id = this.request.id || '';
    return id.length > 8 ? id.substring(0, 8) : id;
  }

  vehicleIcon(): string {
    return this.request.vehicleType === 'two_wheeler' ? '🏍️' : '🚗';
  }

  vehicleLabel(): string {
    return this.request.vehicleType === 'two_wheeler' ? 'Two Wheeler' : 'Four Wheeler';
  }

  hasContactInfo(): boolean {
    const contactStatuses: ServiceRequestStatus[] = ['accepted', 'in_progress', 'completed'];
    return contactStatuses.includes(this.request.status);
  }

  statusLabel(): string {
    return STATUS_META[this.request.status]?.label ?? this.request.status;
  }

  statusCls(): string {
    return STATUS_META[this.request.status]?.cls ?? '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
