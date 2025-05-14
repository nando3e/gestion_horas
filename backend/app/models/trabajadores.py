from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import CITEXT
from app.db.database import Base

class Trabajador(Base):
    """Modelo para la tabla trabajadores"""
    __tablename__ = "trabajadores"
    
    chat_id = Column(CITEXT, primary_key=True, index=True)
    nombre = Column(CITEXT, nullable=False) 