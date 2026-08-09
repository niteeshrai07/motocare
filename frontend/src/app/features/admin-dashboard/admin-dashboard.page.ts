import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { DashboardOverview } from '../../core/models/admin.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CardComponent, ButtonComponent, SpinnerComponent],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
})
export class AdminDashboardPageComponent implements OnInit, OnDestroy {
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly overview = signal<DashboardOverview | null>(null);

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    // No timers or subscriptions to clean up for the dashboard in V1.
  }

  protected loadDashboard(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService
      .getDashboard()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.overview.set(response.data.overview);
          } else {
            this.error.set(response.message || 'Failed to load dashboard');
          }
        },
        error: (err: Error) => {
          this.error.set(err.message || 'Failed to load dashboard');
        },
      });
  }

  protected get activeServiceRequests(): number {
    const data = this.overview();
    if (!data) return 0;
    // Active Service Requests is not returned by the backend.
    // It is derived on the frontend as accepted + in_progress.
    return data.acceptedRequests + data.inProgressRequests;
  }
}
