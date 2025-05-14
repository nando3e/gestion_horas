from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.trabajadores import Trabajador
from app.schemas.trabajadores import (
    Trabajador as TrabajadorSchema,
    TrabajadorCreate,
    TrabajadorUpdate
)
from app.core.permissions import get_current_secretaria_user, get_current_trabajador_user
from app.models.usuarios import Usuario

router = APIRouter()

@router.get("/", response_model=List[TrabajadorSchema])
async def read_trabajadores(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Obtener todos los trabajadores (requiere rol secretaria o admin)
    """
    trabajadores = db.query(Trabajador).offset(skip).limit(limit).all()
    return trabajadores

@router.get("/{chat_id}", response_model=TrabajadorSchema)
async def read_trabajador(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener un trabajador por su chat_id
    - Si es un trabajador, solo puede obtener su propio perfil
    - Si es secretaria o admin, puede obtener cualquier perfil
    """
    # Verificar permisos (trabajador solo puede ver su propio perfil)
    if current_user.rol == "trabajador" and current_user.chat_id != chat_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este trabajador"
        )
    
    trabajador = db.query(Trabajador).filter(Trabajador.chat_id == chat_id).first()
    if not trabajador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trabajador no encontrado"
        )
    return trabajador

@router.post("/", response_model=TrabajadorSchema)
async def create_trabajador(
    trabajador: TrabajadorCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Crear un nuevo trabajador (requiere rol secretaria o admin)
    """
    # Verificar si ya existe un trabajador con ese chat_id
    db_trabajador = db.query(Trabajador).filter(Trabajador.chat_id == trabajador.chat_id).first()
    if db_trabajador:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un trabajador con ese ID"
        )
    
    # Crear el trabajador
    db_trabajador = Trabajador(**trabajador.model_dump())
    db.add(db_trabajador)
    db.commit()
    db.refresh(db_trabajador)
    return db_trabajador

@router.put("/{chat_id}", response_model=TrabajadorSchema)
async def update_trabajador(
    chat_id: str,
    trabajador: TrabajadorUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Actualizar un trabajador (requiere rol secretaria o admin)
    """
    # Buscar el trabajador
    db_trabajador = db.query(Trabajador).filter(Trabajador.chat_id == chat_id).first()
    if not db_trabajador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trabajador no encontrado"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = trabajador.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_trabajador, key, value)
    
    db.commit()
    db.refresh(db_trabajador)
    return db_trabajador

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trabajador(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Eliminar un trabajador (requiere rol secretaria o admin)
    """
    # Buscar el trabajador
    db_trabajador = db.query(Trabajador).filter(Trabajador.chat_id == chat_id).first()
    if not db_trabajador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trabajador no encontrado"
        )
    
    # Eliminar el trabajador
    db.delete(db_trabajador)
    db.commit()
    return 