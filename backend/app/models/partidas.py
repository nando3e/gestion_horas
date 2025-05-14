from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import relationship
from app.db.database import Base

class Partida(Base):
    """Modelo para la tabla partidas"""
    __tablename__ = "partidas"
    
    id_partida = Column(Integer, primary_key=True, index=True)
    id_obra = Column(Integer, ForeignKey("obras.id_obra"), nullable=False)
    nombre_partida = Column(CITEXT, nullable=False)
    nombre_obra = Column(CITEXT, nullable=False)
    acabada = Column(Boolean, nullable=False, default=False)
    
    # Relaciones
    obra = relationship("Obra", back_populates="partidas") 