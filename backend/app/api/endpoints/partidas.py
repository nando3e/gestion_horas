from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.partidas import Partida
from app.models.horas import Hora
from app.schemas.partidas import (
    Partida as PartidaSchema,
    PartidaCreate,
    PartidaUpdate,
    PartidaWithHoras
)
from app.core.permissions import get_current_secretaria_user, get_current_trabajador_user
from app.models.usuarios import Usuario

router = APIRouter()

@router.get("/", response_model=List[PartidaSchema])
async def read_partidas(
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener todas las partidas
    """
    partidas = db.query(Partida).offset(skip).limit(limit).all()
    return partidas

@router.get("/obra/{obra_id}", response_model=List[PartidaSchema])
async def read_partidas_by_obra(
    obra_id: int,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener todas las partidas de una obra
    """
    partidas = db.query(Partida).filter(Partida.id_obra == obra_id).offset(skip).limit(limit).all()
    return partidas

@router.get("/obra/{obra_id}/activas", response_model=List[PartidaSchema])
async def read_partidas_activas_by_obra(
    obra_id: int,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener partidas activas (no acabadas) de una obra
    """
    partidas = db.query(Partida).filter(
        Partida.id_obra == obra_id,
        Partida.acabada == False
    ).offset(skip).limit(limit).all()
    
    return partidas

@router.get("/{partida_id}", response_model=PartidaWithHoras)
async def read_partida(
    partida_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener una partida por su ID, incluyendo el total de horas acumuladas
    """
    partida = db.query(Partida).filter(Partida.id_partida == partida_id).first()
    if not partida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partida no encontrada"
        )
    
    # Calcular el total de horas para esta partida
    horas_totales = db.query(func.sum(Hora.horas_totales)).filter(
        Hora.id_partida == partida_id
    ).scalar() or 0
    
    # Crear y devolver el objeto PartidaWithHoras
    result = PartidaWithHoras(
        id_partida=partida.id_partida,
        id_obra=partida.id_obra,
        nombre_partida=partida.nombre_partida,
        nombre_obra=partida.nombre_obra,
        acabada=partida.acabada,
        horas_totales=float(horas_totales)
    )
    
    return result

@router.post("/", response_model=PartidaSchema)
async def create_partida(
    partida: PartidaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Crear una nueva partida (requiere rol secretaria o admin)
    """
    # Verificar si la obra existe
    from app.models.obras import Obra
    obra = db.query(Obra).filter(Obra.id_obra == partida.id_obra).first()
    if not obra:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La obra especificada no existe"
        )
    
    # Crear la partida con el nombre de la obra
    db_partida = Partida(
        id_obra=partida.id_obra,
        nombre_partida=partida.nombre_partida,
        nombre_obra=obra.nombre_obra,
        acabada=False
    )
    
    db.add(db_partida)
    db.commit()
    db.refresh(db_partida)
    return db_partida

@router.put("/{partida_id}", response_model=PartidaSchema)
async def update_partida(
    partida_id: int,
    partida: PartidaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Actualizar una partida (requiere rol secretaria o admin)
    """
    db_partida = db.query(Partida).filter(Partida.id_partida == partida_id).first()
    if not db_partida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partida no encontrada"
        )
    
    update_data = partida.model_dump(exclude_unset=True)
    
    # Si se intenta cambiar el nombre_partida, verificar que no exista un trigger que lo bloquee
    
    for key, value in update_data.items():
        setattr(db_partida, key, value)
    
    db.commit()
    db.refresh(db_partida)
    return db_partida

@router.delete("/{partida_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partida(
    partida_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_secretaria_user)
):
    """
    Eliminar una partida (requiere rol secretaria o admin)
    """
    db_partida = db.query(Partida).filter(Partida.id_partida == partida_id).first()
    if not db_partida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partida no encontrada"
        )
    
    # Verificar si hay horas asociadas
    horas = db.query(Hora).filter(Hora.id_partida == partida_id).count()
    if horas > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar la partida porque tiene horas asociadas"
        )
    
    db.delete(db_partida)
    db.commit()
    return 