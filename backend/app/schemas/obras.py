from pydantic import BaseModel, Field
from typing import Optional, List, Any, Literal

EstadoObra = Literal["activa", "completada", "cancelada"]
ESTADOS_OBRA = ("activa", "completada", "cancelada")

class ObraBase(BaseModel):
    """Schema base para obras"""
    nombre_obra: str = Field(..., description="Nombre de la obra")
    direccion_obra: Optional[str] = Field(None, description="Dirección de la obra")
    estado: EstadoObra = Field("activa", description="Estado de la obra: activa, completada o cancelada")

class ObraCreate(ObraBase):
    """Schema para crear una obra"""
    pass

class ObraUpdate(BaseModel):
    """Schema para actualizar una obra"""
    nombre_obra: Optional[str] = Field(None, description="Nombre de la obra")
    direccion_obra: Optional[str] = Field(None, description="Dirección de la obra")
    estado: Optional[EstadoObra] = Field(None, description="Estado de la obra: activa, completada o cancelada")

class ObraInDB(ObraBase):
    """Schema para obra almacenada en la base de datos"""
    id_obra: int = Field(..., description="ID único de la obra")
    estado: str = Field("activa", description="Estado de la obra")

    class Config:
        from_attributes = True

# Schema para incluir partidas en la respuesta
class ObraWithPartidas(ObraInDB):
    """Schema para obra con sus partidas"""
    # Usamos Any para evitar problemas de referencia circular
    partidas: List[Any] = []
    
    class Config:
        from_attributes = True

# Alias para la respuesta API
Obra = ObraInDB 