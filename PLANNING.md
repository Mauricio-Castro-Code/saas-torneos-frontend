# PLANNING.md — Frontend

División de trabajo entre Mauricio y Jorge, y cómo la juntamos sin pisarnos. Este documento es vivo: actualízalo conforme se resuelvan las preguntas abiertas o cambien prioridades.

## 0. Setup inicial — bloqueante, se hace antes de dividir

El repo todavía no tiene el proyecto Angular scaffolded (no hay `angular.json` ni `src/`). Esto se hace en **un solo PR chico, juntos o uno de los dos primero**, antes de que cada quien se vaya a su módulo — si cada uno hace su propio `ng new` o toca `app.routes.ts`/`app.config.ts` por separado, el primer merge va a ser un dolor.

- [ ] `ng new` + `ng add @angular/pwa`
- [ ] Estructura de carpetas por rol (`admin/`, `capitan/`, `jugador/`, `auth/`, `shared/`) según CLAUDE.md
- [ ] `environment.ts` / `environment.prod.ts` con `apiUrl`
- [ ] Routing base (shell vacío por módulo, lazy-loaded)
- [ ] `AuthService` esqueleto (estado en memoria, sin lógica todavía)
- [ ] `HttpInterceptor` esqueleto para adjuntar JWT
- [ ] Deploy inicial a Vercel (aunque sea la pantalla default de Angular) para validar el pipeline

Una vez que esto esté en `main`, cada quien rama desde ahí.

## 1. Diseños de Stitch → cómo los usamos

Ya los tienes en Stitch. No se importan como código directo (no calza con la arquitectura de componentes Angular). Flujo recomendado:

1. Si Stitch permite exportar a Figma, expórtalo — así podemos sacar specs exactos (colores, espaciados, assets) con el plugin de Figma.
2. Si no, exporta imagen (PNG) de cada pantalla y súbela a una carpeta compartida — Drive o `design-reference/` en el repo — nombrada por módulo: `design-reference/auth/login.png`, `design-reference/admin/dashboard.png`, etc.
3. **Antes de construir una pantalla, comparte la imagen de esa pantalla específica.** No hay que diseñar a ciegas ni asumir composición — si no hay diseño para una pantalla todavía, esa tarea queda bloqueada (ver sección 4).

## 2. Front y back en paralelo — sí, es viable

Como ya hay endpoints funcionando en el backend, el front debe apuntar a la API real desde el arranque (al menos auth/login), no mockear con datos falsos — mockear agrega trabajo doble y esconde bugs de integración hasta el final.

Riesgo real: que el shape de una respuesta cambie mientras el back sigue avanzando. Dos mitigaciones:

- Toda llamada HTTP vive en un `@Injectable` service (ya es la convención de CLAUDE.md) — si cambia un shape, se toca un archivo, no los componentes.
- Lleven un `API.md` o Postman collection compartido con los endpoints que ya funcionan y su shape actual, actualizado por quien toque el backend ese día. Evita que alguien tipe una interfaz en el front contra un endpoint que ya cambió.

## 3. División de tareas

### Mauricio — `auth/` + `admin/`

**Sprint 1 — flujo funcional mínimo**
- [ ] `AuthService`: login, guardar `access_token` en memoria, decodificar JWT
- [ ] Pantalla: ingresar código de liga
- [ ] Pantalla: lista de equipos de la liga → unirse (join)
- [ ] `AuthGuard` genérico (valida `role` desde JWT)
- [ ] `RoleGuard` específico para rutas `admin/`
- [ ] Shell/layout de `admin/` (nav, header)
- [ ] Dashboard admin (resumen de liga)

**Sprint 2**
- [ ] Gestión de equipos (crear, editar, listar)
- [ ] Jornadas (crear jornada, calendario de partidos)
- [ ] Captura de resultados por partido
- [ ] Tabla de posiciones — vista admin

### Jorge — `capitan/` + `jugador/`

**Sprint 1**
- [ ] `RoleGuard` aplicado a `capitan/` y `jugador/`
- [ ] Shell/layout capitán y jugador
- [ ] Vista capitán: editar info de su equipo (nombre, logo, roster)
- [ ] Vista jugador: jornadas y horarios de su equipo

**Sprint 2**
- [ ] Vista jugador: estadísticas personales
- [ ] Tabla de posiciones — vista jugador, **con cache offline** (service worker de `@angular/pwa`, estrategia cache-first o stale-while-revalidate — es la vista que más necesita funcionar sin señal en la cancha)
- [ ] Detalle de partido (incluye nombre del árbitro solo como dato informativo — sin permisos, sin vista propia; recordatorio: no existe rol árbitro, no construir nada más ahí)

### `shared/` — de quien lo necesite primero, avisando al otro antes de tocarlo
- [ ] `HttpInterceptor` real: adjunta JWT, maneja 401 (logout o refresh)
- [ ] `RoleGuard` genérico parametrizable por rol
- [ ] Servicio base de API (usa `environment.apiUrl`)
- [ ] Componentes comunes: loading spinner, empty state, error/toast banner
- [ ] Configuración de cache del service worker (tabla de posiciones y horarios offline)

## 4. Preguntas abiertas que bloquean tareas específicas

Ver también la sección "❓ Preguntas abiertas" en `CLAUDE.md`.

| Pregunta abierta | Qué bloquea |
|---|---|
| ¿Página pública de liga requiere código en la URL o es 100% pública? | No empezar esa pantalla hasta resolverlo — cambia si lleva guard o no |
| Login con Google — no prioritario v1 | No entra a sprint 1/2, no bloquea nada por ahora |
| Tarjeta de jugador tipo FIFA — sin campos definidos | No meterla a sprint 1/2 hasta tener diseño y campos confirmados |

Si alguno de los dos resuelve una de estas con el resto del equipo, actualiza `CLAUDE.md` y esta tabla en el mismo PR.

## 5. Ramas, commits y PRs

El flujo completo ya está en `CONTRIBUTING.md` — esto es el resumen operativo:

- **Nombre de rama:** `feature/<modulo>-<tarea-corta>`, ej. `feature/auth-join-liga`, `feature/admin-tabla-posiciones`, `feature/jugador-estadisticas`
- **Commits chicos y frecuentes**, con prefijo (`feat:`, `fix:`, `refactor:`) cada vez que termines algo funcional — no un commit gigante al final del día
- **Rebase diario contra `main`** antes de seguir trabajando (`git pull origin main --rebase`)
- **Ramas de vida corta** (1-2 días máx) — si una tarea de las de arriba es más grande que eso, pártela en sub-tareas/sub-ramas
- **PR con el otro como reviewer**, esperar aprobación, **squash and merge**
- Nadie commitea directo a `main`

## 6. Orden sugerido para no bloquearse

1. Setup inicial (sección 0) — juntos, un PR
2. Mauricio arranca auth/join + guards base — Jorge puede ir en paralelo con el shell/layout visual de `capitan/` y `jugador/` usando los diseños de Stitch (sin login real todavía), y conecta el login real en cuanto el `AuthGuard`/`AuthService` estén en `main`
3. De ahí en adelante, cada quien avanza su módulo en paralelo; lo único que requiere coordinación es tocar `shared/`
