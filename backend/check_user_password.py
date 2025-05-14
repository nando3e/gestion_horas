import sys
from sqlalchemy import create_engine, text
import os
import pathlib
from dotenv import load_dotenv
from passlib.context import CryptContext

# Cargar variables de entorno desde .env
base_dir = pathlib.Path(__file__).parent.parent
dotenv_paths = [
    base_dir / '.env',
    pathlib.Path('.env'),
    pathlib.Path('../.env'),
]

for dotenv_path in dotenv_paths:
    if dotenv_path.exists():
        print(f"Cargando variables de entorno desde: {dotenv_path}")
        load_dotenv(dotenv_path=dotenv_path)
        break

# Configuración de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Función para verificar contraseña
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Configuración de la base de datos
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "gestion_horas")

# URL de la base de datos
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Intentando conectar a: {DATABASE_URL}")

# Obtener información del admin
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

try:
    # Crear conexión
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Obtener usuario de la base de datos
        result = conn.execute(
            text("SELECT username, password_hash FROM usuarios WHERE username = :username"),
            {"username": ADMIN_USERNAME}
        )
        user = result.first()
        
        if user:
            username, password_hash = user
            print(f"Usuario encontrado: {username}")
            print(f"Hash almacenado: {password_hash}")
            
            # Verificar si la contraseña del .env coincide con el hash
            if verify_password(ADMIN_PASSWORD, password_hash):
                print(f"✅ La contraseña en .env ({ADMIN_PASSWORD}) coincide con el hash almacenado")
            else:
                print(f"❌ La contraseña en .env ({ADMIN_PASSWORD}) NO coincide con el hash almacenado")
                
                # Generar un nuevo hash con la contraseña actual
                new_hash = pwd_context.hash(ADMIN_PASSWORD)
                print(f"Nuevo hash generado: {new_hash}")
                
                # Actualizar la contraseña en la base de datos
                respuesta = input("¿Quieres actualizar la contraseña en la base de datos? (s/n): ")
                if respuesta.lower() == 's':
                    with conn.begin():
                        conn.execute(
                            text("UPDATE usuarios SET password_hash = :password_hash WHERE username = :username"),
                            {"username": ADMIN_USERNAME, "password_hash": new_hash}
                        )
                    print(f"✅ Contraseña actualizada correctamente")
                else:
                    print("No se actualizó la contraseña")
        else:
            print(f"❌ No se encontró el usuario '{ADMIN_USERNAME}' en la base de datos")
            
except Exception as e:
    print(f"❌ Error al verificar la contraseña: {e}")
    sys.exit(1) 