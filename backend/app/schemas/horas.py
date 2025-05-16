from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime, time
from decimal import Decimal

class HoraBase(BaseModel):
    """Schema base para horas"""
    fecha: date = Field(..., description="Fecha del registro de horas")
    id_obra: Optional[int] = Field(None, description="ID de la obra")
    id_partida: Optional[int] = Field(None, description="ID de la partida")
    horario: Optional[str] = Field(None, description="Horario en formato texto (ej: '08:00-12:00', preferir hora_inicio/hora_fin)")
    hora_inicio: Optional[time] = Field(None, description="Hora de inicio del tramo")
    hora_fin: Optional[time] = Field(None, description="Hora de fin del tramo")
    horas_totales: Decimal = Field(..., description="Total de horas trabajadas")
    es_extra: bool = Field(False, description="Indica si son horas extra")
    tipo_extra: Optional[str] = Field(None, description="Tipo de hora extra (Interno/Externo)")
    descripcion_extra: Optional[str] = Field(None, description="Descripción de las horas extra")
    es_regularizacion: Optional[bool] = Field(False, description="Indica si es un registro de regularización")

class HoraCreate(HoraBase):
    """Schema para crear un registro de horas"""
    chat_id: str = Field(..., description="ID del trabajador")

class HoraUpdate(BaseModel):
    """Schema para actualizar un registro de horas"""
    fecha: Optional[date] = Field(None, description="Fecha del registro de horas")
    id_obra: Optional[int] = Field(None, description="ID de la obra")
    id_partida: Optional[int] = Field(None, description="ID de la partida")
    horario: Optional[str] = Field(None, description="Horario en formato texto, preferir hora_inicio/hora_fin")
    hora_inicio: Optional[time] = Field(None, description="Hora de inicio del tramo")
    hora_fin: Optional[time] = Field(None, description="Hora de fin del tramo")
    horas_totales: Optional[Decimal] = Field(None, description="Total de horas trabajadas")
    es_extra: Optional[bool] = Field(None, description="Indica si son horas extra")
    tipo_extra: Optional[str] = Field(None, description="Tipo de hora extra")
    descripcion_extra: Optional[str] = Field(None, description="Descripción de las horas extra")
    es_regularizacion: Optional[bool] = Field(None, description="Indica si es un registro de regularización")

class HoraInDB(HoraBase):
    """Schema para registro de horas almacenado en la base de datos"""
    id_movimiento: int = Field(..., description="ID único del movimiento")
    timestamp: datetime = Field(..., description="Fecha y hora del registro")
    chat_id: str = Field(..., description="ID del trabajador")
    nombre_trabajador: str = Field(..., description="Nombre del trabajador")
    nombre_partida: Optional[str] = Field(None, description="Nombre de la partida")
    año: int = Field(..., description="Año del registro")
    mes: str = Field(..., description="Mes del registro (nombre del mes)")
    
    class Config:
        from_attributes = True

# Schema para el resumen de horas por día
class ResumenDiario(BaseModel):
    """Resumen de horas por día"""
    fecha: date = Field(..., description="Fecha")
    horas_totales: Decimal = Field(..., description="Total de horas en el día")
    
    class Config:
        from_attributes = True

# Schema para el resumen mensual
class ResumenMensual(BaseModel):
    """Resumen mensual de horas"""
    trabajador: str = Field(..., description="Nombre del trabajador")
    días: List[ResumenDiario] = Field(..., description="Resumen por días")
    total_mes: Decimal = Field(..., description="Total de horas en el mes")
    
    class Config:
        from_attributes = True

# Alias para la respuesta API
Hora = HoraInDB 

class TramoCreate(BaseModel):
    chat_id: str
    fecha: date
    id_obra: Optional[int] = None
    id_partida: Optional[int] = None
    hora_inicio: time
    hora_fin: time
    horas_totales: Decimal
    es_extra: bool = False
    tipo_extra: Optional[str] = None
    descripcion_extra: Optional[str] = None

class HorasLoteCreate(BaseModel):
    tramos: List[TramoCreate] 