# Inicialización del paquete api

from fastapi import APIRouter
from app.core.environment import API_V1_STR

api_router = APIRouter()

# Importar y agregar routers de los diferentes módulos
from app.api.endpoints import auth, usuarios, trabajadores, obras, partidas, horas

api_router.include_router(auth.router, prefix="/auth", tags=["autenticación"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(trabajadores.router, prefix="/trabajadores", tags=["trabajadores"])
api_router.include_router(obras.router, prefix="/obras", tags=["obras"])
api_router.include_router(partidas.router, prefix="/partidas", tags=["partidas"])
api_router.include_router(horas.router, prefix="/horas", tags=["horas"]) 