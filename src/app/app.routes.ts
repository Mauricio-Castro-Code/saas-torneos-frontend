import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'capitan',
    loadChildren: () => import('./capitan/capitan.routes').then((m) => m.CAPITAN_ROUTES),
  },
  {
    path: 'jugador',
    loadChildren: () => import('./jugador/jugador.routes').then((m) => m.JUGADOR_ROUTES),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth',
  },
];
