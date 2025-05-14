from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    """Schema base para usuarios"""
    username: str = Field(..., description="Nombre de usuario")
    chat_id: Optional[str] = Field(None, description="ID del trabajador asociado")
    rol: str = Field("trabajador", description="Rol del usuario (trabajador/secretaria/admin)")

class UsuarioCreate(UsuarioBase):
    """Schema para crear un usuario"""
    password: str = Field(..., description="Contraseña del usuario")

class UsuarioUpdate(BaseModel):
    """Schema para actualizar un usuario"""
    username: Optional[str] = Field(None, description="Nombre de usuario")
    password: Optional[str] = Field(None, description="Contraseña del usuario")
    chat_id: Optional[str] = Field(None, description="ID del trabajador asociado")
    rol: Optional[str] = Field(None, description="Rol del usuario")
    activo: Optional[bool] = Field(None, description="Estado del usuario")

class UsuarioInDB(UsuarioBase):
    """Schema para usuario almacenado en la base de datos"""
    id: int = Field(..., description="ID único del usuario")
    ultimo_login: Optional[datetime] = Field(None, description="Fecha del último login")
    activo: bool = Field(True, description="Estado del usuario")
    
    class Config:
        from_attributes = True

# Alias para la respuesta API
Usuario = UsuarioInDB

class UsuarioWithPassword(UsuarioInDB):
    """Schema para usuario con contraseña hasheada (solo uso interno)"""
    password_hash: str = Field(..., description="Hash de la contraseña")

# Schemas para autenticación
class Token(BaseModel):
    """Schema para token de acceso"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    rol: str
    chat_id: Optional[str] = None

class TokenData(BaseModel):
    """Schema para datos del token"""
    username: str
    user_id: int
    rol: str

class LoginCredentials(BaseModel):
    """Schema para credenciales de login"""
    username: str
    password: str 