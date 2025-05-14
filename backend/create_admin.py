import asyncio
import sys
import sqlalchemy
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.db.database import Base
from app.core.environment import DATABASE_URL

# Configuración de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Función para generar hash de contraseña
def get_password_hash(password):
    return pwd_context.hash(password)

# Convertir DATABASE_URL a versión asíncrona
async_database_url = DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://')

# Crear motor y sesión asíncronos
engine = create_async_engine(async_database_url)
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def create_admin(username, password, chat_id, nombre):
    """Crea un usuario administrador y un trabajador asociado"""
    async with engine.begin() as conn:
        # Crear las tablas si no existen
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Verificar si ya existe el trabajador por SQL directo
        result = await session.execute(
            f"SELECT * FROM trabajadores WHERE chat_id = '{chat_id}'"
        )
        trabajador = result.first()
        
        if not trabajador:
            # Crear trabajador con SQL directo
            await session.execute(
                f"INSERT INTO trabajadores (chat_id, nombre) VALUES ('{chat_id}', '{nombre}')"
            )
            await session.commit()
            print(f"✅ Trabajador '{nombre}' creado con chat_id: {chat_id}")
        else:
            print(f"ℹ️ El trabajador '{nombre}' ya existe")

        # Verificar si ya existe el usuario
        result = await session.execute(
            f"SELECT * FROM usuarios WHERE username = '{username}'"
        )
        user = result.first()
        
        if not user:
            # Crear el usuario admin
            password_hash = get_password_hash(password)
            await session.execute(
                f"INSERT INTO usuarios (username, password_hash, chat_id, rol, activo) VALUES "
                f"('{username}', '{password_hash}', '{chat_id}', 'admin', TRUE)"
            )
            await session.commit()
            print(f"✅ Usuario administrador '{username}' creado correctamente")
        else:
            print(f"ℹ️ El usuario '{username}' ya existe")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Uso: python create_admin.py <username> <password> <chat_id> <nombre>")
        sys.exit(1)
        
    username = sys.argv[1]
    password = sys.argv[2]
    chat_id = sys.argv[3]
    nombre = sys.argv[4]
    
    asyncio.run(create_admin(username, password, chat_id, nombre))
    print("✅ Proceso completado") 