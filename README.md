# saas-torneos-frontend

PWA (Angular) para un SaaS de gestión de ligas deportivas amateur (fútbol 7, tochito). Consume la API del repo `saas-torneos-backend`.

## Stack
- Angular + PWA (`@angular/pwa`)
- Login con Google (`@abacritt/angularx-social-login`)
- Deploy en Vercel

## Requisitos
- Node.js 20+
- Angular CLI

## Instalación

```bash
npm install
ng serve
```

## Variables de entorno

Copia `.env.example` a `.env` (o `src/environments/environment.ts` según config) y llena:

```
API_URL=http://localhost:8000
GOOGLE_OAUTH_CLIENT_ID=
```

## Estructura del proyecto

```
src/app/
├── admin/      # dashboard, jornadas, captura de resultados, tabla, gestión de equipos
├── capitan/    # edición de info del equipo propio
├── jugador/    # estadísticas, jornadas, horarios
├── auth/       # crear cuenta / login (correo o Google), join con código de liga
└── shared/     # servicios, guards, interceptors, componentes comunes
```

## Roles
`admin` (administrador de liga), `capitan`, `jugador`. Detalle completo del flujo de auth/join y convenciones en `CLAUDE.md`.

## Cómo trabajamos en equipo
Ver `CONTRIBUTING.md` — flujo de ramas, Pull Requests y revisión.

## Deploy
Automático a Vercel en cada push a `main`.