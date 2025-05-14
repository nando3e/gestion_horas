from pydantic import BaseModel, Field
from typing import Optional

class TrabajadorBase(BaseModel):
    """Schema base para trabajadores"""
    nombre: str = Field(..., description="Nombre del trabajador")

class TrabajadorCreate(TrabajadorBase):
    """Schema para crear un trabajador"""
    chat_id: str = Field(..., description="ID único del trabajador")

class TrabajadorUpdate(TrabajadorBase):
    """Schema para actualizar un trabajador"""
    nombre: Optional[str] = Field(None, description="Nombre del trabajador")

class TrabajadorInDB(TrabajadorBase):
    """Schema para trabajador almacenado en la base de datos"""
    chat_id: str = Field(..., description="ID único del trabajador")
    
    class Config:
        from_attributes = True

# Alias para la respuesta API
Trabajador = TrabajadorInDB 