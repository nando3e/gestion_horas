from pydantic import BaseModel, Field
from typing import Optional, List

class PartidaBase(BaseModel):
    """Schema base para partidas"""
    nombre_partida: str = Field(..., description="Nombre de la partida")
    id_obra: int = Field(..., description="ID de la obra a la que pertenece la partida")

class PartidaCreate(PartidaBase):
    """Schema para crear una partida"""
    pass

class PartidaUpdate(BaseModel):
    """Schema para actualizar una partida"""
    nombre_partida: Optional[str] = Field(None, description="Nombre de la partida")
    acabada: Optional[bool] = Field(None, description="Estado de la partida (acabada o no)")

class PartidaInDB(PartidaBase):
    """Schema para partida almacenada en la base de datos"""
    id_partida: int = Field(..., description="ID único de la partida")
    nombre_obra: str = Field(..., description="Nombre de la obra a la que pertenece")
    acabada: bool = Field(False, description="Estado de la partida (acabada o no)")
    
    class Config:
        from_attributes = True

# Schema para incluir el total de horas
class PartidaWithHoras(PartidaInDB):
    """Schema para partida con el total de horas"""
    horas_totales: float = Field(0.0, description="Total de horas acumuladas en la partida")
    
    class Config:
        from_attributes = True

# Alias para la respuesta API
Partida = PartidaInDB 