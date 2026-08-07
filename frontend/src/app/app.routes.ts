import { Routes } from '@angular/router';
import { AppShellComponent } from './layouts/app-shell/app-shell.component';
import { authGuard } from './core/guards/auth.guard';
import { mechanicGuard } from './core/guards/mechanic.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.page').then((m) => m.RegisterPageComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePageComponent),
      },
      {
        path: 'service-requests',
        loadComponent: () => import('./features/service-requests/service-request-list/service-request-list.page').then((m) => m.ServiceRequestListPageComponent),
      },
      {
        path: 'service-requests/new',
        loadComponent: () => import('./features/service-requests/service-request-create/service-request-create.page').then((m) => m.ServiceRequestCreatePageComponent),
      },
      {
        path: 'service-requests/:id',
        loadComponent: () => import('./features/service-requests/service-request-detail/service-request-detail.page').then((m) => m.ServiceRequestDetailPageComponent),
      },
      {
        path: 'repair-shop',
        canActivate: [mechanicGuard],
        loadComponent: () => import('./features/repair-shop/repair-shop.page').then((m) => m.RepairShopPageComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.page').then((m) => m.NotificationsPageComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
