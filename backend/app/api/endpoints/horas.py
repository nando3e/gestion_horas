from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, timedelta

from app.db.database import get_db
from app.models.horas import Hora
from app.schemas.horas import (
    Hora as HoraSchema,
    HoraCreate,
    HoraUpdate,
    ResumenDiario,
    ResumenMensual,
    HorasLoteCreate,
    TramoCreate
)
from app.core.permissions import get_current_secretaria_user, get_current_trabajador_user
from app.models.usuarios import Usuario
from app.models.trabajadores import Trabajador

router = APIRouter()

@router.get("/", response_model=List[HoraSchema])
async def read_horas(
    skip: int = 0,
    limit: int = 100,
    trabajador_id: Optional[str] = None,
    fecha: Optional[date] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener registros de horas con filtros opcionales
    - Si es un trabajador, solo puede obtener sus propios registros
    - Si es secretaria o admin, puede obtener todos los registros
    """
    query = db.query(Hora)
    
    # Aplicar filtros
    if trabajador_id:
        # Verificar permisos (trabajador solo puede ver sus propios registros)
        if current_user.rol == "trabajador" and current_user.chat_id != trabajador_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver registros de otros trabajadores"
            )
        query = query.filter(Hora.chat_id == trabajador_id)
    elif current_user.rol == "trabajador":
        # Si es trabajador y no especifica id, filtrar por su propio id
        query = query.filter(Hora.chat_id == current_user.chat_id)
    
    # Filtrar por fecha exacta si se proporciona
    if fecha:
        query = query.filter(Hora.fecha == fecha)
    else:
        # Si no hay fecha exacta, usar el rango de fechas si se proporciona
        if fecha_inicio:
            query = query.filter(Hora.fecha >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(Hora.fecha <= fecha_fin)
    
    horas = query.order_by(Hora.fecha.desc()).offset(skip).limit(limit).all()
    return horas

@router.get("/hoy", response_model=List[HoraSchema])
async def read_horas_hoy(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener registros de horas del día actual
    - Si es un trabajador, solo puede obtener sus propios registros
    - Si es secretaria o admin, puede obtener todos los registros
    """
    hoy = date.today()
    
    query = db.query(Hora).filter(Hora.fecha == hoy)
    
    # Filtrar por trabajador si es un rol de trabajador
    if current_user.rol == "trabajador":
        query = query.filter(Hora.chat_id == current_user.chat_id)
    
    horas = query.all()
    return horas

@router.get("/mes", response_model=List[HoraSchema])
async def read_horas_mes(
    año: int = Query(..., description="Año (ej: 2024)"),
    mes: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener registros de horas de un mes específico
    - Si es un trabajador, solo puede obtener sus propios registros
    - Si es secretaria o admin, puede obtener todos los registros
    """
    # Determinar primer y último día del mes
    primer_dia = date(año, mes, 1)
    
    if mes == 12:
        ultimo_dia = date(año + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo_dia = date(año, mes + 1, 1) - timedelta(days=1)
    
    query = db.query(Hora).filter(
        Hora.fecha >= primer_dia,
        Hora.fecha <= ultimo_dia
    )
    
    # Filtrar por trabajador si es un rol de trabajador
    if current_user.rol == "trabajador":
        query = query.filter(Hora.chat_id == current_user.chat_id)
    
    horas = query.order_by(Hora.fecha).all()
    return horas

@router.get("/resumen-mensual", response_model=List[ResumenMensual])
async def read_resumen_mensual(
    año: int = Query(..., description="Año (ej: 2024)"),
    mes: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener resumen mensual agrupado por trabajador y día
    - Si es un trabajador, solo puede obtener su propio resumen
    - Si es secretaria o admin, puede obtener todos los resúmenes
    """
    # Determinar primer y último día del mes
    primer_dia = date(año, mes, 1)
    
    if mes == 12:
        ultimo_dia = date(año + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo_dia = date(año, mes + 1, 1) - timedelta(days=1)
    
    # Determinar los trabajadores a incluir
    if current_user.rol == "trabajador":
        trabajadores = [db.query(Trabajador).filter(Trabajador.chat_id == current_user.chat_id).first()]
    else:
        trabajadores = db.query(Trabajador).all()
    
    resultados = []
    
    for trabajador in trabajadores:
        # Obtener los registros diarios
        registros_diarios = db.query(
            Hora.fecha,
            func.sum(Hora.horas_totales).label("horas_totales")
        ).filter(
            Hora.chat_id == trabajador.chat_id,
            Hora.fecha >= primer_dia,
            Hora.fecha <= ultimo_dia
        ).group_by(Hora.fecha).order_by(Hora.fecha).all()
        
        # Convertir a objetos ResumenDiario
        dias = [
            ResumenDiario(
                fecha=registro.fecha,
                horas_totales=registro.horas_totales
            )
            for registro in registros_diarios
        ]
        
        # Calcular el total mensual
        total_mes = sum(dia.horas_totales for dia in dias)
        
        # Crear el resumen mensual
        resumen = ResumenMensual(
            trabajador=trabajador.nombre,
            días=dias,
            total_mes=total_mes
        )
        
        resultados.append(resumen)
    
    return resultados

@router.get("/{movimiento_id}", response_model=HoraSchema)
async def read_hora(
    movimiento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Obtener un registro de horas por su ID
    - Si es un trabajador, solo puede obtener sus propios registros
    - Si es secretaria o admin, puede obtener cualquier registro
    """
    hora = db.query(Hora).filter(Hora.id_movimiento == movimiento_id).first()
    
    if not hora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de horas no encontrado"
        )
    
    # Verificar permisos (trabajador solo puede ver sus propios registros)
    if current_user.rol == "trabajador" and current_user.chat_id != hora.chat_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este registro"
        )
    
    return hora

@router.post("/", response_model=HoraSchema)
async def create_hora(
    hora: HoraCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Crear un nuevo registro de horas
    - Si es un trabajador, solo puede crear registros para sí mismo
    - Si es secretaria o admin, puede crear registros para cualquier trabajador
    - Si es regularización, solo admin/secretaria pueden crearlo.
    """
    # Validaciones de permisos generales
    if current_user.rol == "trabajador" and current_user.chat_id != hora.chat_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear registros para otros trabajadores"
        )

    # Validaciones específicas para regularización
    if hora.es_regularizacion:
        if current_user.rol not in ["admin", "secretaria"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear registros de regularización"
            )
        if hora.horario is not None:
            # Para regularización, el horario no se debe especificar, ya que se ingresan horas totales directamente.
            # El frontend debería enviar horario=None si es_regularizacion=True.
            # Si se recibe un horario, se anula para evitar conflictos o se podría lanzar un error.
            hora.horario = None # Aseguramos que sea None para regularizaciones
    else: # No es regularización
        if not hora.horario:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El campo horario es obligatorio para registros normales."
            )
        # Verificar si la fecha es válida (hoy o ayer) solo para trabajadores y registros normales
        if current_user.rol == "trabajador":
            hoy = date.today()
            ayer = hoy - timedelta(days=1)
            if hora.fecha not in [hoy, ayer]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Solo puedes registrar horas de hoy o ayer"
                )
    
    # Obtener el nombre del trabajador
    trabajador = db.query(Trabajador).filter(Trabajador.chat_id == hora.chat_id).first()
    if not trabajador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trabajador no encontrado"
        )
    
    # Si NO es regularización y SÍ hay horario, verificar solapamiento
    if not hora.es_regularizacion and hora.horario:
        # Comprobar solapamiento con otros registros del mismo día (que no sean regularizaciones)
        # Asumimos que hora.horario es un string simple "HH:MM-HH:MM" o múltiples separados por coma
        # Para simplificar, si hay múltiples tramos, esta lógica de solapamiento necesitaría ser más robusta
        # o el frontend debería enviar cada tramo como un registro individual si se quiere validar solapamiento por tramo.
        # Por ahora, si el horario es una lista de tramos, esta validación simple de abajo podría fallar o ser incompleta.
        # Si 'horario' puede tener múltiples tramos '08:00-12:00,14:00-18:00', la lógica de abajo debe ajustarse.
        # Consideraremos el primer tramo para la validación de solapamiento si hay varios.
        primer_tramo = hora.horario.split(',')[0]
        try:
            horario_inicio_str, horario_fin_str = primer_tramo.split("-")
            # Convertir a objetos time para comparación (asumiendo formato HH:MM)
            # Esta conversión puede fallar si el formato no es exacto.
            # Se necesitaría una validación de formato más robusta para el string de horario.
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de horario '{primer_tramo}' inválido. Use HH:MM-HH:MM."
            )

        # VALIDACIÓN MEJORADA: Asegurarnos de filtrar registros del MISMO DÍA
        # Convertir la fecha a string para comparar correctamente
        fecha_str = hora.fecha.isoformat() if isinstance(hora.fecha, date) else hora.fecha
        
        registros_mismo_dia = db.query(Hora).filter(
            Hora.chat_id == hora.chat_id,
            Hora.fecha == fecha_str,  # Comparar con el formato correcto
            Hora.es_regularizacion == False, # Solo comparar con otros registros normales
            Hora.horario != None
        ).all()
        
        print(f"DEBUG: Verificando solapamiento para {hora.chat_id} en fecha {fecha_str}, encontrados {len(registros_mismo_dia)} registros")
        
        for registro_existente in registros_mismo_dia:
            if not registro_existente.horario: # Saltar si algún registro antiguo no tiene horario por alguna razón
                continue
                
            print(f"DEBUG: Comparando con registro existente: fecha={registro_existente.fecha}, horario={registro_existente.horario}")
            
            # Similarmente, considerar el primer tramo del registro existente
            primer_tramo_existente = registro_existente.horario.split(',')[0]
            try:
                reg_inicio_str, reg_fin_str = primer_tramo_existente.split("-")
                # Aquí una lógica de comparación de intervalos de tiempo sería más precisa
                # Esta comparación de strings es muy básica y propensa a errores con diferentes formatos o lógicas de 24h.
                if (horario_inicio_str < reg_fin_str and horario_fin_str > reg_inicio_str):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Horario solapado con otro registro: {registro_existente.horario} (fecha: {registro_existente.fecha})"
                    )
            except ValueError:
                # Ignorar error de formato en registros existentes mal formados, o loggearlo
                pass
    
    # Convertir nombre_partida
    from app.models.partidas import Partida
    partida = db.query(Partida).filter(Partida.id_partida == hora.id_partida).first()
    if not partida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partida no encontrada"
        )
    
    # Crear el registro
    db_hora_data = {
        "chat_id": hora.chat_id,
        "nombre_trabajador": trabajador.nombre,
        "fecha": hora.fecha,
        "id_obra": hora.id_obra,
        "id_partida": hora.id_partida,
        "nombre_partida": partida.nombre_partida,
        "horas_totales": hora.horas_totales,
        "es_extra": hora.es_extra,
        "tipo_extra": hora.tipo_extra,
        "descripcion_extra": hora.descripcion_extra,
        "es_regularizacion": hora.es_regularizacion
    }

    if not hora.es_regularizacion:
        db_hora_data["horario"] = hora.horario
    else:
        db_hora_data["horario"] = None # Asegurar que horario sea None para regularizaciones

    db_hora = Hora(**db_hora_data)
    
    db.add(db_hora)
    db.commit()
    db.refresh(db_hora)
    return db_hora

@router.put("/{movimiento_id}", response_model=HoraSchema)
async def update_hora(
    movimiento_id: int,
    hora: HoraUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Actualizar un registro de horas
    - Si es un trabajador, solo puede actualizar sus propios registros
    - Si es secretaria o admin, puede actualizar cualquier registro
    """
    # Buscar el registro
    db_hora = db.query(Hora).filter(Hora.id_movimiento == movimiento_id).first()
    if not db_hora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de horas no encontrado"
        )
    
    # Verificar permisos (trabajador solo puede actualizar sus propios registros)
    if current_user.rol == "trabajador" and current_user.chat_id != db_hora.chat_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para actualizar este registro"
        )
    
    # Verificar si la fecha es válida para trabajadores (hoy o ayer)
    if hora.fecha and current_user.rol == "trabajador":
        hoy = date.today()
        ayer = hoy - timedelta(days=1)
        
        if hora.fecha not in [hoy, ayer]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo puedes registrar horas de hoy o ayer"
            )
    
    # Verificar solapamiento si se modifica horario o fecha
    if (hora.horario or hora.fecha) and hora.horario != db_hora.horario:
        horario_a_verificar = hora.horario if hora.horario else db_hora.horario
        fecha_a_verificar = hora.fecha if hora.fecha else db_hora.fecha
        
        # Convertir fecha a string para comparación consistente
        fecha_str = fecha_a_verificar.isoformat() if isinstance(fecha_a_verificar, date) else fecha_a_verificar
        
        try:
            horario_inicio, horario_fin = horario_a_verificar.split("-")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de horario '{horario_a_verificar}' inválido. Use HH:MM-HH:MM."
            )
        
        print(f"DEBUG: Verificando solapamiento para actualización - trabajador: {db_hora.chat_id}, fecha: {fecha_str}")
        
        # Comprobar solapamiento con otros registros del mismo día
        registros_mismo_dia = db.query(Hora).filter(
            Hora.chat_id == db_hora.chat_id,
            Hora.fecha == fecha_str,  # Usar el string de fecha
            Hora.id_movimiento != movimiento_id  # Excluir el registro actual
        ).all()
        
        print(f"DEBUG: Encontrados {len(registros_mismo_dia)} registros potencialmente solapados")
        
        for registro in registros_mismo_dia:
            if not registro.horario:
                continue
                
            print(f"DEBUG: Comparando con registro existente: fecha={registro.fecha}, horario={registro.horario}")
            
            try:
                reg_inicio, reg_fin = registro.horario.split("-")
                if (horario_inicio <= reg_fin and horario_fin >= reg_inicio):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Horario solapado con otro registro: {registro.horario} (fecha: {registro.fecha})"
                    )
            except ValueError:
                # Saltar registros con formato inválido
                pass
    
    # Actualizar campos
    update_data = hora.model_dump(exclude_unset=True)
    
    # Si se modifica la partida, actualizar el nombre
    if "id_partida" in update_data:
        from app.models.partidas import Partida
        partida = db.query(Partida).filter(Partida.id_partida == update_data["id_partida"]).first()
        if not partida:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partida no encontrada"
            )
        update_data["nombre_partida"] = partida.nombre_partida
    
    for key, value in update_data.items():
        setattr(db_hora, key, value)
    
    db.commit()
    db.refresh(db_hora)
    return db_hora

@router.delete("/{movimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hora(
    movimiento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    """
    Eliminar un registro de horas
    - Si es un trabajador, solo puede eliminar sus propios registros
    - Si es secretaria o admin, puede eliminar cualquier registro
    """
    db_hora = db.query(Hora).filter(Hora.id_movimiento == movimiento_id).first()
    if not db_hora:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de horas no encontrado"
        )
    
    # Verificar permisos (trabajador solo puede eliminar sus propios registros)
    if current_user.rol == "trabajador" and current_user.chat_id != db_hora.chat_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar este registro"
        )
    
    # Verificar si la fecha es reciente para trabajadores (hoy o ayer)
    if current_user.rol == "trabajador":
        hoy = date.today()
        ayer = hoy - timedelta(days=1)
        
        if db_hora.fecha not in [hoy, ayer]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo puedes eliminar registros de hoy o ayer"
            )
    
    db.delete(db_hora)
    db.commit()
    return

@router.post("/lote", status_code=201)
async def create_horas_lote(
    data: HorasLoteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    resultados = []
    for tramo in data.tramos:
        # Validación de permisos
        if current_user.rol == "trabajador" and current_user.chat_id != tramo.chat_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para crear registros para otros trabajadores"
            )
        # Validación de solapamiento (puedes mejorarla según tu lógica)
        # Convertir fecha a string para comparación consistente
        fecha_str = tramo.fecha.isoformat() if isinstance(tramo.fecha, date) else tramo.fecha
        
        print(f"DEBUG: Verificando solapamiento para lote - trabajador: {tramo.chat_id}, fecha: {fecha_str}")
        
        registros_mismo_dia = db.query(Hora).filter(
            Hora.chat_id == tramo.chat_id,
            Hora.fecha == fecha_str  # Usar formato string para la fecha
        ).all()
        
        print(f"DEBUG: Encontrados {len(registros_mismo_dia)} registros potencialmente solapados para lote")
        
        for registro in registros_mismo_dia:
            if not registro.horario:
                continue
                
            print(f"DEBUG: Comparando con registro existente (lote): fecha={registro.fecha}, horario={registro.horario}")
            
            try:
                if not (tramo.hora_fin <= registro.hora_inicio or tramo.hora_inicio >= registro.hora_fin):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Horario solapado con otro registro: {registro.hora_inicio}-{registro.hora_fin} (fecha: {registro.fecha})"
                    )
            except (ValueError, AttributeError):
                # Si hay campos faltantes o formatos incorrectos, saltar esta comparación
                continue
        # Obtener nombre del trabajador y partida
        trabajador = db.query(Trabajador).filter(Trabajador.chat_id == tramo.chat_id).first()
        if not trabajador:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trabajador no encontrado"
            )
        from app.models.partidas import Partida
        partida = db.query(Partida).filter(Partida.id_partida == tramo.id_partida).first()
        if not partida:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partida no encontrada"
            )
        # Crear el registro
        db_hora = Hora(
            chat_id=tramo.chat_id,
            nombre_trabajador=trabajador.nombre,
            fecha=tramo.fecha,
            id_obra=tramo.id_obra,
            id_partida=tramo.id_partida,
            nombre_partida=partida.nombre_partida,
            hora_inicio=tramo.hora_inicio,
            hora_fin=tramo.hora_fin,
            horas_totales=tramo.horas_totales,
            es_extra=tramo.es_extra,
            tipo_extra=tramo.tipo_extra,
            descripcion_extra=tramo.descripcion_extra
        )
        db.add(db_hora)
        db.commit()
        db.refresh(db_hora)
        resultados.append(db_hora)
    return resultados 