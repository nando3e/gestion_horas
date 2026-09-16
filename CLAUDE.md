# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

App de gestión de horas trabajadas (obra/construcción): trabajadores fichan horas contra obras y partidas; admin/secretaria gestionan maestros e informes. Backend FastAPI + SQLAlchemy sobre PostgreSQL; frontend React (CRA) + Material UI servido por nginx.

## Comandos

### Desarrollo local sin Docker

```bash
# Backend (desde backend/)
pip install -r requirements.txt
python main.py                 # uvicorn con reload en :8000, docs en /docs

# Frontend (desde frontend/)
npm install
npm start                      # :3000 — el README dice "npm run dev", NO existe ese script
```

### Docker

```bash
docker compose -f docker-compose.dev.yml up    # dev con hot-reload y volúmenes montados
```

`docker-compose.yml` y `docker-compose.dev.yml` usan `context: ./backend`. El `backend/Dockerfile` de producción hace `COPY backend/ .`, así que **solo funciona con el contexto en la raíz del repo**. `docker-compose.dev.yml` funciona porque usa `Dockerfile.dev` (rutas relativas). `docker-compose.yml` con el Dockerfile de producción está roto.

### Build y publicación de imágenes

El contexto **debe** ser la raíz del repo:

```bash
docker build -t fbermudez3e/gestion-horas-api:vN -f backend/Dockerfile .
docker build -t fbermudez3e/gestion-horas-frontend:vN -f frontend/Dockerfile .
docker push fbermudez3e/gestion-horas-api:vN
docker push fbermudez3e/gestion-horas-frontend:vN
```

Publica **siempre las dos imágenes con el mismo tag** y no reutilices `latest`: en 2025-2026 el frontend en producción (`frontend:latest`, ago-2025) estuvo 10 meses por detrás del repo mientras el backend sí se actualizaba (`api:v3`), y hubo que recuperar el fuente real desde el source map de la imagen. Desde `v4` ambas imágenes salen del mismo commit.

Despliegue en Dokploy con `docker-compose.dokploy.yml`, que consume `${API_IMAGE}` / `${FRONTEND_IMAGE}` desde el `.env` del stack. `docker-compose.github.yml` es la alternativa que construye directamente desde el repo de GitHub.

`restore_from_dockerhub.sh` / `.ps1` extraen el código de vuelta desde las imágenes publicadas (así se generó la carpeta hermana `gestion_horas_v2`, que es un volcado de solo lectura, no una copia de trabajo — no editar ahí).

### Tests

No hay suite de tests. Los `backend/test_*.py` son scripts manuales (`python test_endpoints.py`) que hacen peticiones HTTP reales contra `localhost:8000` con credenciales del `.env`; no contienen funciones `test_` ni se ejecutan con pytest. Los `backend/check_*.py` y `verify_password.py` son utilidades de diagnóstico contra la BD.

## Arquitectura

### `chat_id` es la clave del dominio, no el `id`

Origen Telegram-bot. `trabajadores.chat_id` (tipo `CITEXT`) es la **primary key** de trabajadores, y es la FK que usan `usuarios.chat_id` y `horas.chat_id`. Un `Usuario` (credenciales de login) se vincula a un `Trabajador` (persona que ficha) a través de `chat_id`, no por `id`.

Consecuencia: todo el scoping por rol en los endpoints compara `current_user.chat_id` contra `Hora.chat_id`. Al añadir filtros o endpoints nuevos sobre horas, usa `chat_id`, nunca `usuario.id`.

Casi todas las columnas de texto son `CITEXT` (comparación insensible a mayúsculas). Requiere `CREATE EXTENSION citext` — ver `backend/create_database_structure.sql`.

### Modelo de datos

`obras` → `partidas` (1:N) → `horas`. `trabajadores` → `horas`. Hay **desnormalización deliberada**: `horas.nombre_trabajador`, `horas.nombre_partida` y `partidas.nombre_obra` guardan copias del nombre además de la FK. Al crear o actualizar registros hay que mantener ambos en sincronía.

`horas.año` y `horas.mes` son **columnas generadas por Postgres** (`Computed(..., persisted=True)` sobre `fecha`). SQLAlchemy no debe intentar insertarlas ni actualizarlas.

### Roles y permisos

Tres roles: `trabajador`, `secretaria`, `admin`. No existe un rol "despacho" pese a lo que sugiera algún mensaje de commit — "perfiles de despacho" se refiere a `secretaria`/`admin`.

- `app/core/permissions.py` define dependencias acumulativas: `get_current_trabajador_user` admite los tres roles, `get_current_secretaria_user` admite admin+secretaria, `get_current_admin_user` solo admin.
- La dependencia solo controla el **acceso al endpoint**. El filtrado por propiedad del dato se hace **dentro** de cada handler con `if current_user.rol == "trabajador"`. Los endpoints de horas usan `get_current_trabajador_user` (abierto a todos) y luego restringen a mano. Si añades un endpoint de horas, replica ese patrón o filtrarás de más/de menos.
- Reglas de negocio para rol `trabajador` en `horas.py`: solo puede crear, editar o borrar registros de **hoy o ayer**, y solo los suyos. Las regularizaciones (`es_regularizacion=True`) están reservadas a admin/secretaria.

En el frontend, `isAdmin()` de `AuthContext` devuelve true para **admin y secretaria** (no solo admin), y es lo que usa `<ProtectedRoute adminOnly>`.

### Sin migraciones

`alembic` está en `requirements.txt` pero **no hay configuración ni versiones**. El esquema se crea con `Base.metadata.create_all()` en el evento de arranque de `main.py`. `create_all` no altera tablas existentes: **añadir una columna a un modelo no la crea en una BD ya desplegada**. Para cambios de esquema en producción hay que aplicar el DDL a mano y reflejarlo en `backend/create_database_structure.sql`.

El arranque también autocrea un admin si no existe ninguno, leyendo `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_CHAT_ID` / `ADMIN_NOMBRE` del entorno.

### Resolución de la URL de la API

`frontend/src/services/api.js` decide en runtime: en `localhost` apunta a `http://localhost:8000/api/v1`; en cualquier otro host usa `${window.location.origin}/api/v1` (mismo protocolo, para evitar Mixed Content en HTTPS). En producción nginx hace de proxy: `location /api/` → `http://${API_SERVICE_NAME}:${API_PORT}`, sustituido en el arranque por `docker-entrypoint.sh` con `envsubst` sobre `nginx.conf.template`. No hardcodees URLs de API en los servicios del frontend.

El interceptor de respuesta en `api.js` redirige a `/login` ante un 401, **salvo** que el 401 venga del propio intento de login o que ya estés en `/login` — cuidado al tocarlo, evita bucles de redirección.

### Añadir un endpoint

1. Modelo en `app/models/`, e impórtalo en `app/models/base.py`.
2. Schemas Pydantic en `app/schemas/` (patrón `XBase` / `XCreate` / `XUpdate` / `XInDB`, con `from_attributes = True`).
3. Router en `app/api/endpoints/`, y regístralo en `app/api/__init__.py`.
4. En el frontend: un servicio en `src/services/` que use el cliente `api` compartido, y la ruta en `App.js`.

## Trampas conocidas

- **Ruta `/lote` duplicada**: `horas.py` define `@router.post("/lote")` dos veces (líneas ~227 y ~743), ambas con el nombre `create_horas_lote`. FastAPI resuelve con la primera; la segunda es código muerto. No edites la de abajo esperando efecto.
- **`ResumenMensual` usa `días` con tilde** como nombre de campo (igual que `año` en `HoraInDB`). Es el nombre literal de la clave JSON que consume el frontend.
- **`HoraInDB.mes` está declarado `str`** mientras la columna del modelo es `Integer`. Discrepancia preexistente; si tocas ese schema, verifica contra la respuesta real de la API antes de "arreglarla".
- **`.env` está en `.gitignore`** pero hay un `.env` versionado en el árbol de trabajo. Usa `.env-example` como referencia.
- CORS está abierto (`allow_origins=["*"]`) en `main.py`.

## Idioma

Todo el código, comentarios, docstrings, mensajes de error de la API y nombres de campo están en castellano. Mantén esa convención.
