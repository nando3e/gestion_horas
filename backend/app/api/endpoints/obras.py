from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.obras import Obra
from app.schemas.obras import (
    Obra as ObraSchema,
    ObraCreate,
    ObraUpdate,
    ObraWithPartidas
)
from app.core.permissions import get_current_secretaria_user, get_current_trabajador_user
from app.models.usuarios import Usuario

router = APIRouter()

@router.get("", response_model=List[ObraSchema])
async def read_obras(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener todas las obras
    """
    obras = db.query(Obra).offset(skip).limit(limit).all()
    return obras

@router.get("/activas", response_model=List[ObraSchema])
async def read_obras_activas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener obras con partidas activas (no acabadas)
    """
    # Consulta para obtener obras que tienen al menos una partida activa
    from app.models.partidas import Partida
    from sqlalchemy import and_, exists
    
    obras = db.query(Obra).filter(
        exists().where(
            and_(
                Partida.id_obra == Obra.id_obra,
                Partida.acabada == False
            )
        )
    ).offset(skip).limit(limit).all()
    
    return obras

@router.get("/{obra_id}", response_model=ObraWithPartidas)
async def read_obra(
    obra_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener una obra por su ID, incluyendo sus partidas
    """
    obra = db.query(Obra).filter(Obra.id_obra == obra_id).first()
    if not obra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Obra no encontrada"
        )
    return obra

@router.post("", response_model=ObraSchema)
async def create_obra(
    obra: ObraCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Crear una nueva obra (requiere rol secretaria o admin)
    """
    db_obra = Obra(**obra.model_dump())
    db.add(db_obra)
    db.commit()
    db.refresh(db_obra)
    return db_obra

@router.put("/{obra_id}", response_model=ObraSchema)
async def update_obra(
    obra_id: int,
    obra: ObraUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Actualizar una obra (requiere rol secretaria o admin)
    """
    db_obra = db.query(Obra).filter(Obra.id_obra == obra_id).first()
    if not db_obra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Obra no encontrada"
        )
    
    update_data = obra.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_obra, key, value)
    
    db.commit()
    db.refresh(db_obra)
    return db_obra

@router.delete("/{obra_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_obra(
    obra_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Eliminar una obra (requiere rol secretaria o admin)
    """
    db_obra = db.query(Obra).filter(Obra.id_obra == obra_id).first()
    if not db_obra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Obra no encontrada"
        )
    
    # Verificar si hay partidas asociadas
    from app.models.partidas import Partida
    partidas = db.query(Partida).filter(Partida.id_obra == obra_id).count()
    if partidas > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la obra porque tiene partidas asociadas"
        )
    
    # Verificar si hay horas asociadas
    from app.models.horas import Hora
    horas = db.query(Hora).filter(Hora.id_obra == obra_id).count()
    if horas > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la obra porque tiene horas asociadas"
        )
    
    db.delete(db_obra)
    db.commit()
    return