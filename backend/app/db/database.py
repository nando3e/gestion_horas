from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.environment import DATABASE_URL

# Definir la convención de nombres para minúsculas
naming_convention = {
    "case_sensitive": False,
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# Crear metadata con configuración
metadata = MetaData(schema="public", naming_convention=naming_convention)

# Crear el motor SQLAlchemy con configuración para tablas en minúsculas
engine = create_engine(
    DATABASE_URL,
    # Asegurarnos de que maneje correctamente las tablas en minúsculas
    connect_args={"options": "-c search_path=public"}
)

# Crear una sesión local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base(metadata=metadata)

# Obtener una sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 