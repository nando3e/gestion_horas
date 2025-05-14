import os
from dotenv import load_dotenv
import pathlib

# Cargar variables de entorno desde .env
# Intentamos cargar desde diferentes ubicaciones relativas comunes
base_dir = pathlib.Path(__file__).parent.parent.parent.parent
dotenv_paths = [
    base_dir / '.env',
    pathlib.Path('.env'),
    pathlib.Path('../.env'),
    pathlib.Path('../../.env'),
]

for dotenv_path in dotenv_paths:
    if dotenv_path.exists():
        load_dotenv(dotenv_path=dotenv_path)
        break

# Configuración de la base de datos
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "gestion_horas")

# URL de la base de datos
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123456789")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Configuración de la aplicación
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
API_V1_STR = "/api/v1" 