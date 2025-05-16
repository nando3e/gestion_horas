from sqlalchemy import Column, Integer, String, Date, Boolean, Numeric, ForeignKey, TIMESTAMP, Text, Computed, Time
from sqlalchemy.dialects.postgresql import CITEXT, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class Hora(Base):
    """Modelo para la tabla horas"""
    __tablename__ = "horas"
    
    id_movimiento = Column(Integer, primary_key=True, index=True)
    timestamp = Column(TIMESTAMP(timezone=True), default=datetime.now)
    chat_id = Column(CITEXT, ForeignKey("trabajadores.chat_id"), nullable=True)
    nombre_trabajador = Column(CITEXT, nullable=False)
    fecha = Column(Date, nullable=False)
    id_obra = Column(Integer, ForeignKey("obras.id_obra"), nullable=True)
    nombre_partida = Column(CITEXT, nullable=True)
    horario = Column(CITEXT, nullable=True) # Podría considerarse para deprecación o solo para data antigua
    hora_inicio = Column(Time, nullable=True)
    hora_fin = Column(Time, nullable=True)
    horas_totales = Column(Numeric(precision=4, scale=2), nullable=True)
    
    # Columnas generadas: SQLAlchemy sabrá que no debe intentar insertar/actualizar estos campos
    año = Column(Integer, Computed("EXTRACT(YEAR FROM fecha)", persisted=True), nullable=False)
    # Garantizar que el mes es un entero y no se transforma en nombre
    mes = Column(Integer, Computed("EXTRACT(MONTH FROM fecha)::integer", persisted=True), nullable=False)

    es_extra = Column(Boolean, nullable=True, default=False)
    tipo_extra = Column(CITEXT, nullable=True)
    descripcion_extra = Column(Text, nullable=True)
    id_partida = Column(Integer, ForeignKey("partidas.id_partida"), nullable=True)
    es_regularizacion = Column(Boolean, default=False, nullable=True)
    
    # Relaciones
    trabajador = relationship("Trabajador", backref="horas")
    obra = relationship("Obra", backref="horas")
    partida = relationship("Partida", backref="horas") 