import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./mis-ligas/mis-ligas').then((m) => m.MisLigas),
  },
  {
    path: 'nueva-liga',
    loadComponent: () => import('./admin-shell/admin-shell').then((m) => m.AdminShell),
  },
];
