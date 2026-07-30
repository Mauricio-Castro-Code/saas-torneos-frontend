import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./mis-ligas/mis-ligas').then((m) => m.MisLigas),
  },
  {
    path: 'nueva-liga',
    loadComponent: () => import('./nueva-liga/nueva-liga').then((m) => m.NuevaLiga),
  },
  {
    path: 'perfil',
    loadComponent: () => import('./perfil/perfil').then((m) => m.Perfil),
  },
  {
    // Flujo improvisado anterior (liga+equipo+jornada+resultado en una sola
    // pantalla): se conserva para seguir probando end-to-end mientras no
    // existe el mockup de gestión de equipos.
    path: 'prueba-completa',
    loadComponent: () => import('./admin-shell/admin-shell').then((m) => m.AdminShell),
  },
];
