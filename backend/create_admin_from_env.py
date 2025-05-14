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

# Función para generar hash de contraseña
def get_password_hash(password):
    return pwd_context.hash(password)

# Obtener datos del admin desde variables de entorno
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "admin_id")
ADMIN_NOMBRE = os.getenv("ADMIN_NOMBRE", "Administrador")

# Configuración de la base de datos
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "gestion_horas")

# URL de la base de datos
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Intentando conectar a: {DATABASE_URL}")
print(f"Datos del admin a crear:")
print(f"- Username: {ADMIN_USERNAME}")
print(f"- Chat ID: {ADMIN_CHAT_ID}")
print(f"- Nombre: {ADMIN_NOMBRE}")

try:
    # Crear el hash de la contraseña
    password_hash = get_password_hash(ADMIN_PASSWORD)
    print(f"Hash de contraseña generado correctamente")
    
    # Crear conexión
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Iniciar transacción
        with conn.begin():
            # Verificar si ya existe el trabajador
            result = conn.execute(
                text(f"SELECT * FROM trabajadores WHERE chat_id = :chat_id"),
                {"chat_id": ADMIN_CHAT_ID}
            )
            trabajador = result.first()
            
            if not trabajador:
                # Crear trabajador
                conn.execute(
                    text("INSERT INTO trabajadores (chat_id, nombre) VALUES (:chat_id, :nombre)"),
                    {"chat_id": ADMIN_CHAT_ID, "nombre": ADMIN_NOMBRE}
                )
                print(f"✅ Trabajador '{ADMIN_NOMBRE}' creado con chat_id: {ADMIN_CHAT_ID}")
            else:
                print(f"ℹ️ El trabajador con chat_id '{ADMIN_CHAT_ID}' ya existe")
            
            # Verificar si ya existe el usuario
            result = conn.execute(
                text("SELECT * FROM usuarios WHERE username = :username"),
                {"username": ADMIN_USERNAME}
            )
            user = result.first()
            
            if not user:
                # Crear el usuario admin
                conn.execute(
                    text("""
                        INSERT INTO usuarios (username, password_hash, chat_id, rol, activo) 
                        VALUES (:username, :password_hash, :chat_id, 'admin', TRUE)
                    """),
                    {
                        "username": ADMIN_USERNAME,
                        "password_hash": password_hash,
                        "chat_id": ADMIN_CHAT_ID
                    }
                )
                print(f"✅ Usuario administrador '{ADMIN_USERNAME}' creado correctamente")
            else:
                print(f"ℹ️ El usuario '{ADMIN_USERNAME}' ya existe")
        
    print("✅ Proceso completado correctamente")

except Exception as e:
    print(f"❌ Error al crear el usuario administrador: {e}")
    sys.exit(1) 