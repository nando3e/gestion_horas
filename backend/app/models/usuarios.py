from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class Usuario(Base):
    """Modelo para la tabla usuarios"""
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    chat_id = Column(CITEXT, ForeignKey("trabajadores.chat_id"), nullable=True)
    rol = Column(String(20), nullable=False, default="trabajador")
    ultimo_login = Column(DateTime, nullable=True)
    activo = Column(Boolean, nullable=False, default=True)
    
    # Relaciones
    trabajador = relationship("Trabajador", backref="usuario") 