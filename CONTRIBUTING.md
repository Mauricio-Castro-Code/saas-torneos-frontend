## Flujo de trabajo en equipo

### División de módulos
Para evitar pisarnos, cada quien trabaja en carpetas/apps distintas la mayor parte del tiempo:

**Backend:**
- Persona A: `accounts` (auth, JWT, login con Google), `leagues` (liga, código de join)
- Persona B: `teams` (equipos, jugadores), `matches` (jornadas, partidos, resultados)

**Frontend:**
- Persona A: `admin/`, `auth/`
- Persona B: `capitan/`, `jugador/`

### Reglas base
- **Nadie hace commit directo a `main`.** Todo el trabajo vive en una rama.
- Ramas de vida corta (1-2 días máximo) — entre más tiempo vive una rama sin mergear, peor el conflicto al juntarla.
- Commits chicos y frecuentes, con mensajes descriptivos (`feat: `, `fix: `, `refactor: `), no un commit gigante al final del día.

### 1. Clonar y crear tu rama

```bash
git clone <url-del-repo>
cd <carpeta-del-repo>
git checkout -b feature/nombre-descriptivo
```

### 2. Trabajar y commitear

```bash
git add .
git commit -m "feat: descripción corta de lo que hiciste"
```

### 3. Antes de empezar a trabajar cada día — actualizar tu rama

```bash
git checkout feature/tu-rama
git pull origin main --rebase
```

El `--rebase` reacomoda tus commits encima de lo nuevo que bajó de `main`, evita un commit de merge feo en medio del historial. Si hay conflicto aquí, es chico y fácil de resolver — mucho mejor que dejarlo acumular para el final.

### 4. Subir tu rama

```bash
git push -u origin feature/nombre-descriptivo
```
(la primera vez con `-u`; después solo `git push`)

### 5. Abrir Pull Request en GitHub
- Describe qué hiciste
- Asigna al otro como reviewer
- Espera aprobación antes de mergear — este es el punto de control real del equipo

### 6. Revisar el PR del otro (probarlo sin perder tu propio trabajo)

```bash
git fetch origin
git worktree add ../<repo>-review feature/su-rama
cd ../<repo>-review
# correr el proyecto y probar ahí
```

Revisa el código en "Files changed" en GitHub, comenta si algo no queda claro, aprueba si todo bien.

### 7. Mergear — usar "Squash and merge" en GitHub
Convierte todos los commits chicos de la rama en uno solo limpio en `main`. Así el historial queda legible en vez de lleno de "fix", "wip", etc.

### 8. Después de mergear

```bash
git checkout main
git pull
git branch -d feature/nombre-descriptivo
```

### Resumen visual

```
main (protegida)
  └─ checkout -b
       feature/tu-cosa → commits → push → Pull Request → review → squash merge → main
```