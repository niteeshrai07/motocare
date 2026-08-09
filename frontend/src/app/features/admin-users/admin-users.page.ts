import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { AdminUserListItem } from '../../core/models/admin.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DialogComponent } from '../../shared/components/dialog/dialog.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CardComponent, ButtonComponent, DialogComponent, SpinnerComponent],
  templateUrl: './admin-users.page.html',
  styleUrl: './admin-users.page.scss',
})
export class AdminUsersPageComponent implements OnInit, OnDestroy {
  protected readonly isLoading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly items = signal<AdminUserListItem[]>([]);
  protected readonly page = signal<number>(1);
  protected readonly limit = signal<number>(20);
  protected readonly total = signal<number>(0);
  protected readonly totalPages = signal<number>(1);
  protected readonly searchQuery = signal<string>('');
  protected readonly roleFilter = signal<string>('all');
  protected readonly statusFilter = signal<string>('all');
  protected readonly actionInProgress = signal<boolean>(false);
  protected readonly selectedUser = signal<AdminUserListItem | null>(null);
  protected readonly dialogType = signal<'activate' | 'deactivate' | null>(null);
  protected readonly currentUserId = computed(() => {
    const user = this.auth.user();
    return user?.id ?? null;
  });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SEARCH_DEBOUNCE_MS = 300;
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly adminService: AdminService,
    private readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  protected loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const params: {
      page: number;
      limit: number;
      role?: string;
      search?: string;
      sort?: 'newest' | 'oldest';
    } = {
      page: this.page(),
      limit: this.limit(),
      sort: 'newest',
    };

    const roleFilter = this.roleFilter();
    if (roleFilter !== 'all') {
      params.role = roleFilter;
    }

    const statusFilter = this.statusFilter();
    if (statusFilter !== 'all') {
      params.search = statusFilter === 'active' ? 'active' : 'inactive';
    }

    const search = this.searchQuery();
    if (search) {
      params.search = search;
    }

    this.adminService.getAllUsers(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.items.set(response.data.users);
          this.page.set(response.data.pagination.page);
          this.total.set(response.data.pagination.total);
          this.totalPages.set(response.data.pagination.totalPages);
        } else {
          this.error.set(response.message || 'Failed to load users');
        }
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Failed to load users');
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected onSearchInput(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const trimmed = rawValue.trim();

    if (this.searchQuery() === trimmed) {
      return;
    }

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.searchQuery.set(trimmed);
      this.page.set(1);
      this.loadUsers();
    }, this.SEARCH_DEBOUNCE_MS);
  }

  protected setRoleFilter(role: string): void {
    this.roleFilter.set(role);
    this.page.set(1);
    this.loadUsers();
  }

  protected setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadUsers();
  }

  protected openActivateDialog(user: AdminUserListItem): void {
    if (this.actionInProgress()) {
      return;
    }
    this.selectedUser.set(user);
    this.dialogType.set('activate');
  }

  protected openDeactivateDialog(user: AdminUserListItem): void {
    if (this.actionInProgress()) {
      return;
    }
    this.selectedUser.set(user);
    this.dialogType.set('deactivate');
  }

  protected closeDialog(): void {
    this.dialogType.set(null);
    this.selectedUser.set(null);
  }

  protected confirmAction(): void {
    const user = this.selectedUser();
    const type = this.dialogType();

    if (!user || !type || this.actionInProgress()) {
      return;
    }

    this.actionInProgress.set(true);

    const request$ = type === 'activate'
      ? this.adminService.activateUser(user.id)
      : this.adminService.deactivateUser(user.id);

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          const newStatus = type === 'activate';
          this.items.update((items) =>
            items.map((item) =>
              item.id === user.id ? { ...item, isActive: newStatus } : item
            )
          );
          this.setSuccessMessage(
            `${user.name} has been ${type === 'activate' ? 'activated' : 'deactivated'}`
          );
        } else {
          this.error.set(response.message || `Failed to ${type} user`);
        }
      },
      error: (err: Error) => {
        this.error.set(err.message || `Failed to ${type} user`);
      },
      complete: () => {
        this.actionInProgress.set(false);
        this.closeDialog();
      },
    });
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages() && !this.isLoading()) {
      this.page.set(this.page() + 1);
      this.loadUsers();
    }
  }

  protected prevPage(): void {
    if (this.page() > 1 && !this.isLoading()) {
      this.page.set(this.page() - 1);
      this.loadUsers();
    }
  }

  protected formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected get dialogTitle(): string {
    const type = this.dialogType();
    if (!type) return '';
    return type === 'activate' ? 'Activate User' : 'Deactivate User';
  }

  protected get dialogBody(): string {
    const user = this.selectedUser();
    const type = this.dialogType();
    if (!user || !type) return '';

    if (type === 'activate') {
      return `Are you sure you want to activate ${user.name}? This user will regain access to MotoCare.`;
    }
    return `Are you sure you want to deactivate ${user.name}? This user will no longer be able to access MotoCare.`;
  }

  protected get confirmButtonLabel(): string {
    const type = this.dialogType();
    return type === 'activate' ? 'Activate' : 'Deactivate';
  }

  protected get confirmButtonVariant(): 'primary' | 'danger' {
    const type = this.dialogType();
    return type === 'activate' ? 'primary' : 'danger';
  }

  protected get isDialogOpen(): boolean {
    return this.dialogType() !== null;
  }

  private setSuccessMessage(message: string): void {
    this.successMessage.set(message);
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    this.successTimeout = setTimeout(() => {
      this.successMessage.set(null);
      this.successTimeout = null;
    }, 3000);
  }
}
