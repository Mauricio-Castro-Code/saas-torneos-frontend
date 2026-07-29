# Contexto del proyecto — Frontend (Angular)

## Qué es esto
SaaS para organizadores de torneos amateur de fútbol en México (Puebla). Este repo es SOLO el frontend — una PWA en Angular que consume la API del backend (repo separado, Django). No hay código compartido entre ambos repos.

## Stack
- **Angular** (elegido porque el dev ya lo domino — prioridad es shippear rápido, no aprender framework nuevo en este proyecto)
- **PWA**, no apps nativas — evitar burocracia de App Store/Play Store. Configurar con `ng add @angular/pwa` (genera manifest, service worker y estrategias de cache automáticamente)
- Deploy en **Vercel**
- Consume API REST del backend Django vía JWT

## Roles del sistema — estructurar por feature modules
Tres roles con vistas completamente distintas: **admin**, **capitan**, **jugador**. Organiza el proyecto en feature modules separados por rol, cada uno con su propio routing protegido:

```
src/app/
├── admin/          # dashboard, jornadas, captura resultados, tabla, gestión equipos
├── capitan/        # edición de info de SU equipo
├── jugador/        # estadísticas, jornadas, horarios
├── auth/           # login, join con código de liga
└── shared/         # servicios, guards, interceptors, componentes comunes
```

**No existe rol de árbitro** — no construyas ninguna vista ni permiso para árbitros, solo se les muestra su nombre como dato informativo dentro del detalle de un partido.

**No hay votación/predicción de partidos** — se evaluó y se descartó explícitamente. No construyas ninguna UI de votar.

## Flujo de auth y join — esto define la pantalla de login
No hay registro tradicional de "crea tu cuenta". El flujo real es:

1. El admin ya creó la liga y sus equipos, y tiene un **código único de liga** (ej. `PUE-7A3F`) que comparte por fuera de la app (WhatsApp, etc.)
2. Un jugador nuevo entra a la app, **mete el código de liga** (no hay botón de "registrarse como capitán", eso no existe)
3. La app le muestra la **lista de equipos ya registrados** de esa liga
4. Elige uno, se une, **entra directo sin aprobación de nadie**
5. El **primer jugador en unirse a un equipo se vuelve su capitán automáticamente** — esto lo determina el backend, el front solo debe reflejar el rol que la API le regresa después del join (no asumas el rol en el cliente)

## Guards de ruta
Protege cada feature module con un `CanActivate` guard que valida `role` desde el JWT decodificado o desde el estado de auth en memoria — nunca confíes en ocultar un botón como única protección, el backend ya valida permisos reales, pero el guard evita que un jugador intente navegar directo a una URL de admin.

## Auth token
Guarda el `access_token` en memoria (un `AuthService` con estado, no en `localStorage` — vulnerable a XSS). El `refresh_token` idealmente en cookie httpOnly si el backend lo soporta.

## Convenciones de código
- `camelCase` para variables y funciones
- `PascalCase` para componentes
- Comentarios que expliquen el **por qué**, no el qué
- Servicios de Angular (`@Injectable`) para toda lógica de API — los componentes no llaman HTTP directo

## Consideraciones de PWA específicas de este producto
- **Cache offline para la tabla de posiciones y horarios** — los jugadores suelen estar en la cancha con mal wifi/datos, esta vista debe verse sin conexión
- Push notifications en iOS Safari solo funcionan desde iOS 16.4+ como PWA instalada — no es bloqueante hoy, pero un usuario con iOS viejo no recibirá push, solo verá cambios al abrir la app manualmente

## ❓ Preguntas abiertas — contéstalas aquí mismo antes de que Claude Code asuma algo

- **Página pública de la liga (sin login):** ¿es una ruta que requiere el código de liga en la URL, o es 100% pública/indexable sin ningún código? Afecta si el guard de esa ruta valida algo o no.
- **Diseño de mockups:** vienen de Stitch (AI de diseño). Si hay un mockup de referencia para la pantalla que estás construyendo, pídelo antes de diseñar desde cero.
- **Login con Google:** considerado, no prioritario para v1. Si lo agregas, usar `@abacritt/angularx-social-login`.
- **Tarjeta de jugador (perfil visual tipo carta FIFA):** mencionada como feature de valor pero sin diseño ni campos definidos todavía — confirmar qué datos exactos lleva antes de construirla.