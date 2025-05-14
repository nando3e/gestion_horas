from pydantic import BaseModel, Field
from typing import Optional, List, Any

class ObraBase(BaseModel):
    """Schema base para obras"""
    nombre_obra: str = Field(..., description="Nombre de la obra")
    direccion_obra: Optional[str] = Field(None, description="Dirección de la obra")

class ObraCreate(ObraBase):
    """Schema para crear una obra"""
    pass

class ObraUpdate(BaseModel):
    """Schema para actualizar una obra"""
    nombre_obra: Optional[str] = Field(None, description="Nombre de la obra")
    direccion_obra: Optional[str] = Field(None, description="Dirección de la obra")

class ObraInDB(ObraBase):
    """Schema para obra almacenada en la base de datos"""
    id_obra: int = Field(..., description="ID único de la obra")
    
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