import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

@Injectable({ providedIn: 'root' })
export class LoadingInterceptor implements HttpInterceptor {
  private readonly debounceMs = 200;
  private readonly timeoutIds = new Map<string, number>();
  private requestIdCounter = 0;

  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const requestId = `mtc-${this.requestIdCounter++}`;

    const timeoutId = setTimeout(() => {
      this.loadingService.show();
      this.timeoutIds.delete(requestId);
    }, this.debounceMs);

    this.timeoutIds.set(requestId, timeoutId);

    return next.handle(req).pipe(
      finalize(() => {
        this.clearTimeout(requestId);
        this.loadingService.hide();
      })
    );
  }

  private clearTimeout(requestId: string): void {
    const timeoutId = this.timeoutIds.get(requestId);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(requestId);
    }
  }
}
