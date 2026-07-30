import { Routes } from '@angular/router';

export const JUGADOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./jugador-shell/jugador-shell').then((m) => m.JugadorShell),
  },
];
