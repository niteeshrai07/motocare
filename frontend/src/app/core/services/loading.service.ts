import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private isLoadingState = signal(false);
  private requestCount = signal(0);

  readonly isLoading = this.isLoadingState.asReadonly();

  show(): void {
    this.requestCount.update((count) => count + 1);
    this.isLoadingState.set(true);
  }

  hide(): void {
    this.requestCount.update((count) => Math.max(0, count - 1));
    if (this.requestCount() === 0) {
      this.isLoadingState.set(false);
    }
  }
}