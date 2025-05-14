import sys
from sqlalchemy import create_engine, text
import os
import pathlib
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
# Intentamos cargar desde diferentes ubicaciones relativas comunes
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
    else:
        print(f"No se encontró archivo .env en: {dotenv_path}")

# Configuración de la base de datos desde variables de entorno
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "gestion_horas")

# URL de la base de datos
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Intentando conectar a: {DATABASE_URL}")

try:
    # Crear conexión
    engine = create_engine(DATABASE_URL)
    
    # Probar la conexión
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("¡Conexión exitosa a la base de datos!")
        
        # Verificar tablas existentes
        result = connection.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        
        tables = [row[0] for row in result]
        if tables:
            print(f"Tablas existentes: {', '.join(tables)}")
        else:
            print("No se encontraron tablas en la base de datos.")
            
except Exception as e:
    print(f"Error al conectar con la base de datos: {e}")
    sys.exit(1) 