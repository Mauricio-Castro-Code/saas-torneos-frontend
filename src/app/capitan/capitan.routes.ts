import { Routes } from '@angular/router';

export const CAPITAN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./capitan-shell/capitan-shell').then((m) => m.CapitanShell),
  },
];
