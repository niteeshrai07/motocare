import { Routes } from '@angular/router';
import { AppShellComponent } from './layouts/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [],
  },
  {
    path: '**',
    redirectTo: '',
  },
];