import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent {
  constructor(private readonly auth: AuthService) {}

  protected readonly isMechanic = computed(() => {
    return this.auth.user()?.role === 'mechanic';
  });

  onLogout(): void {
    this.auth.logout();
  }
}
