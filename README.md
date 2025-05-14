# Gestión de Horas

Aplicación web responsive para la gestión de horas trabajadas, con soporte para trabajadores, obras y partidas.

## Estructura del Proyecto

- **backend/**: API REST con FastAPI y SQLAlchemy
- **frontend/**: Aplicación web con React

## Características

- Sistema de autenticación con JWT
- Roles de usuario (trabajador, secretaria, admin)
- Registro de horas trabajadas
- Gestión de obras y partidas
- Resumen mensual de horas
- Vista para dispositivos móviles (trabajadores)
- Panel de administración (secretaria)

## Requisitos

- Python 3.8+
- Node.js 14+
- PostgreSQL

## Instalación

### Backend

1. Crear un entorno virtual:
```
python -m venv venv
```

2. Activar el entorno virtual:
```
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Instalar dependencias:
```
cd backend
pip install -r requirements.txt
```

4. Configurar variables de entorno (o editar `app/core/environment.py`):
```
# Configuración de la base de datos
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_horas

# Configuración de seguridad
SECRET_KEY=supersecretkey123456789
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

5. Ejecutar la aplicación:
```
python main.py
```

La API estará disponible en http://localhost:8000

### Frontend

1. Instalar dependencias:
```
cd frontend
npm install
```

2. Ejecutar en modo desarrollo:
```
npm run dev
```

La aplicación web estará disponible en http://localhost:3000

## API Endpoints

### Autenticación

- `POST /api/v1/auth/login`: Iniciar sesión
- `POST /api/v1/auth/login/json`: Iniciar sesión (JSON)
- `POST /api/v1/auth/register`: Registrar usuario

### Usuarios

- `GET /api/v1/usuarios`: Listar usuarios
- `GET /api/v1/usuarios/me`: Obtener perfil propio
- `GET /api/v1/usuarios/{id}`: Obtener usuario
- `POST /api/v1/usuarios`: Crear usuario
- `PUT /api/v1/usuarios/{id}`: Actualizar usuario
- `DELETE /api/v1/usuarios/{id}`: Eliminar usuario
- `POST /api/v1/usuarios/{id}/reset-password`: Resetear contraseña

### Trabajadores

- `GET /api/v1/trabajadores`: Listar trabajadores
- `GET /api/v1/trabajadores/{id}`: Obtener trabajador
- `POST /api/v1/trabajadores`: Crear trabajador
- `PUT /api/v1/trabajadores/{id}`: Actualizar trabajador
- `DELETE /api/v1/trabajadores/{id}`: Eliminar trabajador

### Obras

- `GET /api/v1/obras`: Listar obras
- `GET /api/v1/obras/activas`: Listar obras con partidas activas
- `GET /api/v1/obras/{id}`: Obtener obra con sus partidas
- `POST /api/v1/obras`: Crear obra
- `PUT /api/v1/obras/{id}`: Actualizar obra
- `DELETE /api/v1/obras/{id}`: Eliminar obra

### Partidas

- `GET /api/v1/partidas`: Listar partidas
- `GET /api/v1/partidas/obra/{id}`: Listar partidas de una obra
- `GET /api/v1/partidas/obra/{id}/activas`: Listar partidas activas de una obra
- `GET /api/v1/partidas/{id}`: Obtener partida con horas acumuladas
- `POST /api/v1/partidas`: Crear partida
- `PUT /api/v1/partidas/{id}`: Actualizar partida
- `DELETE /api/v1/partidas/{id}`: Eliminar partida

### Horas

- `GET /api/v1/horas`: Listar registros de horas
- `GET /api/v1/horas/hoy`: Obtener registros de hoy
- `GET /api/v1/horas/mes`: Obtener registros de un mes
- `GET /api/v1/horas/resumen-mensual`: Obtener resumen mensual
- `GET /api/v1/horas/{id}`: Obtener registro
- `POST /api/v1/horas`: Crear registro
- `PUT /api/v1/horas/{id}`: Actualizar registro
- `DELETE /api/v1/horas/{id}`: Eliminar registro 