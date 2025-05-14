from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.usuarios import Usuario
from app.schemas.usuarios import (
    Usuario as UsuarioSchema,
    UsuarioCreate,
    UsuarioUpdate
)
from app.core.permissions import get_current_secretaria_user, get_current_trabajador_user
from app.core.auth import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[UsuarioSchema])
async def read_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Obtener todos los usuarios (requiere rol secretaria o admin)
    """
    usuarios = db.query(Usuario).offset(skip).limit(limit).all()
    return usuarios

@router.get("/me", response_model=UsuarioSchema)
async def read_usuario_me(
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener el perfil del usuario actual
    """
    return current_user

@router.get("/{usuario_id}", response_model=UsuarioSchema)
async def read_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener un usuario por su ID
    - Si es un trabajador, solo puede obtener su propio perfil
    - Si es secretaria o admin, puede obtener cualquier perfil
    """
    # Verificar permisos (trabajador solo puede ver su propio perfil)
    if current_user.rol == "trabajador" and current_user.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este usuario"
        )
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return usuario

@router.post("/", response_model=UsuarioSchema)
async def create_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Crear un nuevo usuario (requiere rol secretaria o admin)
    """
    # Verificar si ya existe un usuario con ese username
    db_usuario = db.query(Usuario).filter(Usuario.username == usuario.username).first()
    if db_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese nombre de usuario"
        )
    
    # Verificar si el chat_id existe en la tabla trabajadores
    if usuario.chat_id:
        from app.models.trabajadores import Trabajador
        trabajador = db.query(Trabajador).filter(Trabajador.chat_id == usuario.chat_id).first()
        if not trabajador:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No existe un trabajador con ese ID"
            )
    
    # Crear el usuario
    hashed_password = get_password_hash(usuario.password)
    db_usuario = Usuario(
        username=usuario.username,
        password_hash=hashed_password,
        chat_id=usuario.chat_id,
        rol=usuario.rol
    )
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.put("/{usuario_id}", response_model=UsuarioSchema)
async def update_usuario(
    usuario_id: int,
    usuario: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Actualizar un usuario
    - Si es un trabajador, solo puede actualizar su propio perfil
    - Si es secretaria o admin, puede actualizar cualquier perfil
    """
    # Verificar permisos (trabajador solo puede actualizar su propio perfil)
    if current_user.rol == "trabajador" and current_user.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este usuario"
        )
    
    # Buscar el usuario
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = usuario.model_dump(exclude_unset=True)
    
    # Si se proporciona una nueva contraseña, hashearla
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    # Verificar que si se cambia el rol, solo pueda hacerlo un admin o secretaria
    if "rol" in update_data and current_user.rol == "trabajador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para cambiar el rol"
        )
    
    for key, value in update_data.items():
        setattr(db_usuario, key, value)
    
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Eliminar un usuario (requiere rol secretaria o admin)
    """
    # Buscar el usuario
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Eliminar el usuario
    db.delete(db_usuario)
    db.commit()
    return

@router.post("/{usuario_id}/reset-password", response_model=UsuarioSchema)
async def reset_password(
    usuario_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Restablecer la contraseña de un usuario (requiere rol secretaria o admin)
    """
    # Buscar el usuario
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Restablecer la contraseña
    db_usuario.password_hash = get_password_hash(new_password)
    
    db.commit()
    db.refresh(db_usuario)
    return db_usuario 