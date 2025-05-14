import sys
from sqlalchemy import create_engine, text, inspect
import os
import pathlib
from dotenv import load_dotenv

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

# Configuración de la base de datos
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
    inspector = inspect(engine)
    
    # Tablas que deberían existir en nuestra aplicación
    required_tables = ['usuarios', 'trabajadores', 'obras', 'partidas', 'horas']
    
    # Verificar cada tabla
    existing_tables = inspector.get_table_names()
    
    print("\n=== Verificación de tablas de la aplicación ===")
    for table in required_tables:
        if table in existing_tables:
            # Obtener las columnas de la tabla
            columns = [col['name'] for col in inspector.get_columns(table)]
            print(f"✅ Tabla '{table}' existe con columnas: {', '.join(columns)}")
            
            # Verificar si hay registros en la tabla
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"   - Cantidad de registros: {count}")
                
                # Si es la tabla usuarios, verificar si hay un admin
                if table == 'usuarios':
                    admin_result = conn.execute(text("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'"))
                    admin_count = admin_result.scalar()
                    print(f"   - Usuarios administradores: {admin_count}")
        else:
            print(f"❌ Tabla '{table}' NO existe")
    
except Exception as e:
    print(f"Error al verificar las tablas: {e}")
    sys.exit(1) 