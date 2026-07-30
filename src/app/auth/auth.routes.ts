import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth-shell/auth-shell').then((m) => m.AuthShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
      { path: 'registro', loadComponent: () => import('./register/register').then((m) => m.Register) },
      { path: 'unirse', loadComponent: () => import('./join/join').then((m) => m.Join) },
    ],
  },
];
