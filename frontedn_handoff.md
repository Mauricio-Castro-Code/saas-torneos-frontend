# Estado del backend — contexto para el front

Última actualización: 2026-07-29

Este documento resume qué endpoints ya existen y funcionan, cuáles faltan, y qué pantallas se pueden construir ya vs. cuáles dependen de trabajo pendiente. Pensado para pasarle contexto rápido a quien trabaje en el front (humano o agente).

**Base URL local:** `http://127.0.0.1:8000`

---

## ✅ Ya funciona (probado)

### Auth — `accounts`

| Endpoint | Method | Auth | Body | Notas |
|---|---|---|---|---|
| `/api/auth/registro/admin/` | POST | No | `username, email, password` | Crea usuario `role=admin` |
| `/api/auth/registro/jugador/` | POST | No | `username, email, password, codigo_liga` | Valida que el código exista y esté activo. Responde con datos del usuario + de la liga. **No une a un equipo todavía** (ver [Pendiente](#-pendiente--bloquea-partes-del-front)) |
| `/api/auth/login/` | POST | No | `username, password` | Devuelve `access` + `refresh` (JWT). El token trae `username` y `role` embebidos como claims |
| `/api/auth/login/refresh/` | POST | No | `refresh` | Renueva el `access` token |

Ejemplo de respuesta de `/api/auth/registro/jugador/`:
```json
{
  "id": 6,
  "username": "jugador_test",
  "role": "jugador",
  "liga": {
    "id": 5,
    "nombre": "Liga de Prueba",
    "codigo": "UZD-WCJV"
  }
}
```

### Ligas — `leagues`

Todos requieren `Authorization: Bearer <access>` de un usuario `role=admin`, **excepto** el de validar código.

| Endpoint | Method | Auth | Body / Params |
|---|---|---|---|
| `/api/ligas/` | GET | Admin | — lista solo las ligas del admin logueado (`Liga.objects.filter(admin=request.user)`) |
| `/api/ligas/` | POST | Admin | `{"nombre": "..."}` — el `codigo` se genera automático (ej. `PUE-7A3F`) |
| `/api/ligas/{id}/` | GET / PUT / PATCH / DELETE | Admin | `{"nombre": "..."}` para editar |
| `/api/ligas/validar/{codigo}/` | GET | **Público** | — usado en la pantalla donde el jugador mete el código antes de registrarse. 404 si el código no existe o la liga no está activa |

---

## ❌ Pendiente — bloquea partes del front

- **Equipos y jugadores** (`teams` app): sin modelos, sin endpoints. Sin esto no se puede crear equipos, listar equipos de una liga, unirse a un equipo con código, ni asignar capitán automáticamente al primero en unirse. → Tareas #7-10 de `PLANNING.md`
- **Temporadas, categorías, jornadas, partidos, resultados** (`matches` app): sin modelos, sin endpoints. → Tareas #11-12 de `PLANNING.md`
- **Login con Google**: no configurado (`django-allauth` está en `requirements.txt` pero sin wiring en `settings.py`)
- **Límites por tier de suscripción** (Starter/Pro/Complejo): sin enforcement en backend — si el front construye pantallas de creación de equipos, aún no va a chocar con ningún límite de "20 equipos máx." porque no está validado del lado del servidor
- **Pago/suscripción**: no hay modelo `Suscripcion`/`Pago`; pasarela de pago no decidida (Stripe/Conekta/Mercado Pago) — ver preguntas abiertas en `CLAUDE.md`

---

## Qué se puede construir ya en el front

1. Login (admin y jugador comparten el mismo endpoint)
2. Registro de admin
3. Registro de jugador — con el paso de meter código de liga y validarlo (`GET /validar/{codigo}/`) antes de mandar el registro completo
4. Dashboard de admin: crear liga, listar sus ligas, editar/eliminar
5. Guardado y uso del JWT (`access` en header `Authorization: Bearer`, refrescar con `refresh` cuando expire)

## Qué NO se puede construir todavía con datos reales

- Pantalla de equipos (crear, listar, editar)
- Pantalla de unirse a equipo con código
- Jornadas y calendario
- Captura de resultados
- Tabla de posiciones
- Cualquier pantalla de suscripción/pago

Todo esto espera a que Jorge termine `teams` + `matches` (ver `PLANNING.md`).
