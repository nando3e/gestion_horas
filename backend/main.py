from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from fastapi.responses import FileResponse, HTMLResponse
import logging
from sqlalchemy.orm import Session
import os
from pathlib import Path

from app.api import api_router
from app.core.environment import API_V1_STR
from app.db.database import get_db, engine, Base
from app.models.usuarios import Usuario
from app.models.trabajadores import Trabajador
from app.core.auth import get_password_hash

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Gestión de Horas API", redirect_slashes=True)

# Middleware para confiar en los encabezados X-Forwarded-* del proxy
# Esto es crucial para que las redirecciones y la generación de URLs funcionen correctamente con HTTPS
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambiar a URL específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(api_router, prefix=API_V1_STR)

# Evento de inicio de aplicación
@app.on_event("startup")
async def startup_event():
    # Crear tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    # Comprobar si existe un superadmin
    db = next(get_db())
    try:
        admin_exists = db.query(Usuario).filter(Usuario.rol == "admin").first() is not None
        
        if not admin_exists:
            logger.info("No hay administrador, creando uno por defecto...")
            
            # Datos del superadmin (lee de variables de entorno o usa valores por defecto)
            admin_username = os.getenv("ADMIN_USERNAME", "admin")
            admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
            admin_chat_id = os.getenv("ADMIN_CHAT_ID", "admin_id")
            admin_nombre = os.getenv("ADMIN_NOMBRE", "Administrador")
            
            # Comprobar si existe el trabajador
            trabajador = db.query(Trabajador).filter(Trabajador.chat_id == admin_chat_id).first()
            if not trabajador:
                trabajador = Trabajador(
                    chat_id=admin_chat_id,
                    nombre=admin_nombre
                )
                db.add(trabajador)
                db.commit()
                logger.info(f"Trabajador '{admin_nombre}' creado con chat_id: {admin_chat_id}")
            
            # Crear el superadmin
            password_hash = get_password_hash(admin_password)
            new_admin = Usuario(
                username=admin_username,
                password_hash=password_hash,
                chat_id=admin_chat_id,
                rol="admin",
                activo=True
            )
            db.add(new_admin)
            db.commit()
            logger.info(f"Superadmin '{admin_username}' creado correctamente")
        else:
            logger.info("Ya existe un administrador, no se creará uno por defecto")
    
    except Exception as e:
        logger.error(f"Error al crear el superadmin: {e}")
    finally:
        db.close()

# Definir handler para la API
@app.get(f"{API_V1_STR}/health")
async def health_check():
    """
    Endpoint para verificar el estado de la API.
    Usado por Docker para health checks.
    """
    return {"status": "ok", "service": "Gestión de Horas API"}

# Verificar que el directorio estático existe
static_directory = Path("/app/static")
if static_directory.exists():
    logger.info(f"Directorio estático encontrado en {static_directory}")
    
    # Montar los archivos estáticos directamente
    app.mount("/", StaticFiles(directory="/app/static", html=True), name="static")
    
else:
    logger.warning(f"Directorio de archivos estáticos no encontrado: {static_directory}")
    
    # Fallback para cuando no hay archivos estáticos
    @app.get("/")
    async def root_fallback():
        return {"message": "Bienvenido a la API de Gestión de Horas"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 