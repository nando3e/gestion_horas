from sqlalchemy import Column, Integer, String
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import relationship
from app.db.database import Base

class Obra(Base):
    """Modelo para la tabla obras"""
    __tablename__ = "obras"
    
    id_obra = Column(Integer, primary_key=True, index=True)
    nombre_obra = Column(CITEXT, nullable=False)
    direccion_obra = Column(CITEXT, nullable=True)
    
    # Relaciones
    partidas = relationship("Partida", back_populates="obra") 