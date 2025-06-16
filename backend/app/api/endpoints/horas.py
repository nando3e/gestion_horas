from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, timedelta, time

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
from app.models.partidas import Partida  # Import Partida model
from sqlalchemy.exc import IntegrityError # Import for commit error handling

router = APIRouter()

@router.get("", response_model=List[HoraSchema])
async def read_horas(
    skip: int = 0,
    limit: int = 1000,
    trabajador_id: Optional[str] = None,
    chat_id: Optional[str] = None,
    id_obra: Optional[int] = None,
    id_partida: Optional[int] = None,
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
    
    # Aplicar filtros de trabajador/chat_id
    target_chat_id = chat_id or trabajador_id  # Priorizar chat_id sobre trabajador_id
    
    if target_chat_id:
        # Verificar permisos (trabajador solo puede ver sus propios registros)
        if current_user.rol == "trabajador" and current_user.chat_id != target_chat_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver registros de otros trabajadores"
            )
        query = query.filter(Hora.chat_id == target_chat_id)
    elif current_user.rol == "trabajador":
        # Si es trabajador y no especifica id, filtrar por su propio id
        query = query.filter(Hora.chat_id == current_user.chat_id)
    
    # Aplicar filtros de obra y partida
    if id_obra:
        query = query.filter(Hora.id_obra == id_obra)
    
    if id_partida:
        query = query.filter(Hora.id_partida == id_partida)
    
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


@router.post("/lote", response_model=List[HoraSchema], summary="Crear múltiples registros de horas (lote)")
async def create_horas_lote(
    lote_data: HorasLoteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_trabajador_user)
):
    created_horas = []
    processed_tramos_in_lote = [] # Para validar solapamientos dentro del mismo lote

    # Obtener todos los chat_id y fechas únicas del lote para una consulta eficiente
    trabajador_fechas_map = {}
    for tramo_idx, tramo_data in enumerate(lote_data.tramos):
        if not isinstance(tramo_data.fecha, date):
            try:
                tramo_data.fecha = datetime.strptime(str(tramo_data.fecha), "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Formato de fecha inválido para el tramo {tramo_idx}. Usar YYYY-MM-DD.")
        if not isinstance(tramo_data.hora_inicio, time):
            try:
                tramo_data.hora_inicio = datetime.strptime(str(tramo_data.hora_inicio), "%H:%M:%S").time()
            except ValueError:
                 try:
                    tramo_data.hora_inicio = datetime.strptime(str(tramo_data.hora_inicio), "%H:%M").time()
                 except ValueError:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Formato de hora_inicio inválido para el tramo {tramo_idx}. Usar HH:MM:SS o HH:MM.")
        if not isinstance(tramo_data.hora_fin, time):
            try:
                tramo_data.hora_fin = datetime.strptime(str(tramo_data.hora_fin), "%H:%M:%S").time()
            except ValueError:
                try:
                    tramo_data.hora_fin = datetime.strptime(str(tramo_data.hora_fin), "%H:%M").time()
                except ValueError:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Formato de hora_fin inválido para el tramo {tramo_idx}. Usar HH:MM:SS o HH:MM.")

        if tramo_data.chat_id not in trabajador_fechas_map:
            trabajador_fechas_map[tramo_data.chat_id] = set()
        trabajador_fechas_map[tramo_data.chat_id].add(tramo_data.fecha)

    # Obtener registros existentes para validación de solapamiento
    existing_records_map = {}
    for chat_id_key, fechas_set in trabajador_fechas_map.items():
        for fecha_val_key in fechas_set:
            records = db.query(Hora).filter(
                Hora.chat_id == chat_id_key,
                Hora.fecha == fecha_val_key,
                Hora.es_regularizacion == False
            ).all()
            existing_records_map[(chat_id_key, fecha_val_key)] = records

    for idx, tramo in enumerate(lote_data.tramos):
        # VALIDACIONES DE PERMISOS Y FECHA
        if current_user.rol == "trabajador":
            if current_user.chat_id != tramo.chat_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Tramo {idx}: No tienes permisos para crear horas para otro trabajador.")
            # Validar fecha (no anterior a ayer para trabajadores)
            if tramo.fecha < (date.today() - timedelta(days=1)):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tramo {idx}: Como trabajador, solo puedes registrar horas de hoy o ayer.")
        elif current_user.rol not in ["secretaria", "admin"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Tramo {idx}: Rol no autorizado.")

        # OBTENER NOMBRE_TRABAJADOR Y NOMBRE_PARTIDA
        trabajador_obj = db.query(Trabajador).filter(Trabajador.chat_id == tramo.chat_id).first()
        if not trabajador_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tramo {idx}: Trabajador con chat_id {tramo.chat_id} no encontrado.")
        nombre_trabajador = trabajador_obj.nombre

        nombre_partida = None
        if tramo.id_partida:
            partida_obj = db.query(Partida).filter(Partida.id_partida == tramo.id_partida).first()
            if not partida_obj:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tramo {idx}: Partida con id {tramo.id_partida} no encontrada.")
            nombre_partida = partida_obj.nombre_partida

        # VALIDACIÓN DE SOLAPAMIENTO HORARIO
        current_tramo_start_dt = datetime.combine(tramo.fecha, tramo.hora_inicio)
        current_tramo_end_dt = datetime.combine(tramo.fecha, tramo.hora_fin)

        if current_tramo_start_dt >= current_tramo_end_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tramo {idx} ({tramo.chat_id} en {tramo.fecha}): La hora de inicio ({tramo.hora_inicio}) no puede ser posterior o igual a la hora de fin ({tramo.hora_fin})."
            )

        # a) Contra registros existentes en BD
        map_key = (tramo.chat_id, tramo.fecha)
        if map_key in existing_records_map:
            for record in existing_records_map[map_key]:
                if record.hora_inicio and record.hora_fin: # Solo si el registro tiene tiempos definidos
                    record_start_dt = datetime.combine(record.fecha, record.hora_inicio)
                    record_end_dt = datetime.combine(record.fecha, record.hora_fin)
                    if (current_tramo_start_dt < record_end_dt and record_start_dt < current_tramo_end_dt):
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Tramo {idx} ({tramo.chat_id} en {tramo.fecha}): El tramo {tramo.hora_inicio}-{tramo.hora_fin} se solapa con el registro existente {record.hora_inicio}-{record.hora_fin} (ID: {record.id_movimiento})."
                        )
        
        # b) Contra tramos ya procesados en este mismo lote
        for processed_tramo_data in processed_tramos_in_lote:
            if processed_tramo_data['chat_id'] == tramo.chat_id and processed_tramo_data['fecha'] == tramo.fecha:
                proc_start_dt = datetime.combine(processed_tramo_data['fecha'], processed_tramo_data['hora_inicio'])
                proc_end_dt = datetime.combine(processed_tramo_data['fecha'], processed_tramo_data['hora_fin'])
                if (current_tramo_start_dt < proc_end_dt and proc_start_dt < current_tramo_end_dt):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Tramo {idx} ({tramo.chat_id} en {tramo.fecha}): Solapamiento DENTRO DEL LOTE. El tramo {tramo.hora_inicio}-{tramo.hora_fin} se solapa con {processed_tramo_data['hora_inicio']}-{processed_tramo_data['hora_fin']} del mismo lote."
                    )

        # CREAR OBJETO Hora
        db_hora_data = {
            "chat_id": tramo.chat_id,
            "nombre_trabajador": nombre_trabajador,
            "fecha": tramo.fecha,
            "id_obra": tramo.id_obra,
            "nombre_partida": nombre_partida,
            "horario": f"{tramo.hora_inicio.strftime('%H:%M')}-{tramo.hora_fin.strftime('%H:%M')}",
            "hora_inicio": tramo.hora_inicio,
            "hora_fin": tramo.hora_fin,
            "horas_totales": tramo.horas_totales,
            "es_extra": tramo.es_extra,
            "tipo_extra": tramo.tipo_extra,
            "descripcion_extra": tramo.descripcion_extra,
            "id_partida": tramo.id_partida,
            "es_regularizacion": False
        }
        
        db_hora = Hora(**db_hora_data)
        db.add(db_hora)
        created_horas.append(db_hora)
        
        processed_tramos_in_lote.append({
            "chat_id": tramo.chat_id, "fecha": tramo.fecha,
            "hora_inicio": tramo.hora_inicio, "hora_fin": tramo.hora_fin
        })

    try:
        db.commit()
        for hora_obj in created_horas:
            db.refresh(hora_obj)
    except IntegrityError as e:
        db.rollback()
        # Considera loggear el error 'e' para depuración
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de integridad al guardar los registros: {e.args}"
        )
    except Exception as e:
        db.rollback()
        # Considera loggear el error 'e' para depuración
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al procesar el lote: {e.args}"
        )

    return created_horas

@router.post("", response_model=HoraSchema)
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

    # Determinar hora_inicio_obj y hora_fin_obj (tipo time)
    hora_inicio_obj: Optional[time] = None
    hora_fin_obj: Optional[time] = None

    if hora.hora_inicio is not None and hora.hora_fin is not None:
        # Priorizar campos de tiempo explícitos
        if isinstance(hora.hora_inicio, str):
            try: hora.hora_inicio = datetime.strptime(hora.hora_inicio, '%H:%M:%S').time()
            except ValueError: hora.hora_inicio = datetime.strptime(hora.hora_inicio, '%H:%M').time()
        if isinstance(hora.hora_fin, str):
            try: hora.hora_fin = datetime.strptime(hora.hora_fin, '%H:%M:%S').time()
            except ValueError: hora.hora_fin = datetime.strptime(hora.hora_fin, '%H:%M').time()
        hora_inicio_obj = hora.hora_inicio
        hora_fin_obj = hora.hora_fin
    elif hora.horario:
        # Fallback a parsear el string horario
        try:
            inicio_str, fin_str = hora.horario.split('-')
            hora_inicio_obj = datetime.strptime(inicio_str.strip(), '%H:%M').time()
            hora_fin_obj = datetime.strptime(fin_str.strip(), '%H:%M').time()
        except ValueError:
            if not hora.es_regularizacion: # Para regularizaciones, el horario puede ser solo horas totales
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Formato de horario '{hora.horario}' inválido. Usar HH:MM-HH:MM o proveer hora_inicio/hora_fin.")
    
    if hora_inicio_obj and hora_fin_obj and hora_inicio_obj >= hora_fin_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"La hora de inicio ({hora_inicio_obj}) no puede ser posterior o igual a la hora de fin ({hora_fin_obj}).")

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
        if not hora_inicio_obj or not hora_fin_obj: # Si después de los intentos no tenemos tiempos y no es regularización
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Se requiere hora_inicio y hora_fin, o un string 'horario' válido para registros normales."
            )

        # Validación de fecha (no anterior a ayer para trabajadores)
        if current_user.rol == "trabajador" and hora.fecha < (date.today() - timedelta(days=1)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Como trabajador, solo puedes registrar horas de hoy o ayer"
            )
    
    # Obtener el nombre del trabajador
    trabajador = db.query(Trabajador).filter(Trabajador.chat_id == hora.chat_id).first()
    if not trabajador:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trabajador no encontrado"
        )
    
    # Validación de solapamiento de horas (usando hora_inicio_obj y hora_fin_obj)
    if not hora.es_regularizacion and hora_inicio_obj and hora_fin_obj:
        current_start_dt = datetime.combine(hora.fecha, hora_inicio_obj)
        current_end_dt = datetime.combine(hora.fecha, hora_fin_obj)

        existing_horas_for_overlap = db.query(Hora).filter(
            Hora.chat_id == hora.chat_id,
            Hora.fecha == hora.fecha,
            Hora.es_regularizacion == False,
            Hora.hora_inicio != None, # Solo considerar registros con tiempos definidos
            Hora.hora_fin != None
        ).all()

        for record in existing_horas_for_overlap:
            # Asegurarse que el record tiene hora_inicio y hora_fin antes de combinar
            if record.hora_inicio and record.hora_fin:
                record_start_dt = datetime.combine(record.fecha, record.hora_inicio)
                record_end_dt = datetime.combine(record.fecha, record.hora_fin)
                
                # Comprobar solapamiento: (StartA < EndB) and (StartB < EndA)
                if (current_start_dt < record_end_dt and record_start_dt < current_end_dt):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Solapamiento detectado: El tramo {hora_inicio_obj.strftime('%H:%M')}-{hora_fin_obj.strftime('%H:%M')} se solapa con el registro existente {record.hora_inicio.strftime('%H:%M')}-{record.hora_fin.strftime('%H:%M')} (ID: {record.id_movimiento})"
                    )
    
    # Convertir nombre_partida
    from app.models.partidas import Partida
    partida = db.query(Partida).filter(Partida.id_partida == hora.id_partida).first()
    if not partida:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Partida no encontrada"
        )
    
    # Crear el registro
    # Preparar datos para guardar, priorizando los objetos time
    final_horario_str = hora.horario # Mantener el string original si se proporcionó
    if hora_inicio_obj and hora_fin_obj and not final_horario_str:
        # Si no se proporcionó horario string pero sí tiempos, formatearlo para el campo 'horario'
        final_horario_str = f"{hora_inicio_obj.strftime('%H:%M')}-{hora_fin_obj.strftime('%H:%M')}"

    db_hora_data = {
        "chat_id": hora.chat_id,
        "nombre_trabajador": trabajador.nombre_apellidos,
        "fecha": hora.fecha,
        "id_obra": hora.id_obra,
        "id_partida": hora.id_partida,
        "nombre_partida": partida.nombre_partida,
        "hora_inicio": hora_inicio_obj, # Guardar el objeto time
        "hora_fin": hora_fin_obj,     # Guardar el objeto time
        "horario": final_horario_str, # Guardar el string de horario (original o formateado)
        "horas_totales": hora.horas_totales,
        "es_extra": hora.es_extra,
        "tipo_extra": hora.tipo_extra,
        "descripcion_extra": hora.descripcion_extra,
        "es_regularizacion": hora.es_regularizacion
    }

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
            primer_tramo_a_verificar = horario_a_verificar.split(',')[0]
            horario_inicio, horario_fin = primer_tramo_a_verificar.split("-")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de horario '{primer_tramo_a_verificar}' inválido. Use HH:MM-HH:MM."
            )
        
        print(f"DEBUG: Verificando solapamiento para actualización - trabajador: {db_hora.chat_id}, fecha: {fecha_str}")
        
        # VALIDACIÓN DE SOLAPAMIENTO HORARIO PARA UPDATE
        hora_inicio_actualizada_obj: Optional[time] = None
        hora_fin_actualizada_obj: Optional[time] = None
        fecha_actualizada: date = hora.fecha if hora.fecha else db_hora.fecha # Usar nueva fecha o la original

        # Determinar si los tiempos se están actualizando y obtener los nuevos valores
        nuevos_tiempos_provistos = False
        if hora.hora_inicio is not None and hora.hora_fin is not None:
            nuevos_tiempos_provistos = True
            if isinstance(hora.hora_inicio, str):
                try: hora.hora_inicio = datetime.strptime(hora.hora_inicio, '%H:%M:%S').time()
                except ValueError: hora.hora_inicio = datetime.strptime(hora.hora_inicio, '%H:%M').time()
            if isinstance(hora.hora_fin, str):
                try: hora.hora_fin = datetime.strptime(hora.hora_fin, '%H:%M:%S').time()
                except ValueError: hora.hora_fin = datetime.strptime(hora.hora_fin, '%H:%M').time()
            hora_inicio_actualizada_obj = hora.hora_inicio
            hora_fin_actualizada_obj = hora.hora_fin
        elif hora.horario:
            nuevos_tiempos_provistos = True
            try:
                inicio_str, fin_str = hora.horario.split('-')
                hora_inicio_actualizada_obj = datetime.strptime(inicio_str.strip(), '%H:%M').time()
                hora_fin_actualizada_obj = datetime.strptime(fin_str.strip(), '%H:%M').time()
            except ValueError:
                if not db_hora.es_regularizacion: # Si es reg, el horario puede ser solo total horas
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Formato de horario '{hora.horario}' inválido para actualización. Usar HH:MM-HH:MM o proveer hora_inicio/hora_fin.")
        else: # No se proporcionaron nuevos tiempos explícitos, usar los existentes del registro si los hay
            if db_hora.hora_inicio and db_hora.hora_fin:
                 hora_inicio_actualizada_obj = db_hora.hora_inicio
                 hora_fin_actualizada_obj = db_hora.hora_fin

        if hora_inicio_actualizada_obj and hora_fin_actualizada_obj and hora_inicio_actualizada_obj >= hora_fin_actualizada_obj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"La hora de inicio ({hora_inicio_actualizada_obj}) no puede ser posterior o igual a la hora de fin ({hora_fin_actualizada_obj}).")

        # Solo realizar validación de solapamiento si no es regularización y tenemos tiempos válidos
        if not db_hora.es_regularizacion and hora_inicio_actualizada_obj and hora_fin_actualizada_obj:
            current_start_dt = datetime.combine(fecha_actualizada, hora_inicio_actualizada_obj)
            current_end_dt = datetime.combine(fecha_actualizada, hora_fin_actualizada_obj)

            existing_horas_for_overlap = db.query(Hora).filter(
                Hora.id_movimiento != movimiento_id,  # Excluir el propio registro
                Hora.chat_id == db_hora.chat_id,
                Hora.fecha == fecha_actualizada,
                Hora.es_regularizacion == False,
                Hora.hora_inicio != None,
                Hora.hora_fin != None
            ).all()

            for record in existing_horas_for_overlap:
                if record.hora_inicio and record.hora_fin: # Doble chequeo por si acaso
                    record_start_dt = datetime.combine(record.fecha, record.hora_inicio)
                    record_end_dt = datetime.combine(record.fecha, record.hora_fin)
                    if (current_start_dt < record_end_dt and record_start_dt < current_end_dt):
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Solapamiento detectado al actualizar: El tramo {hora_inicio_actualizada_obj.strftime('%H:%M')}-{hora_fin_actualizada_obj.strftime('%H:%M')} en {fecha_actualizada.strftime('%Y-%m-%d')} se solapa con el registro existente {record.hora_inicio.strftime('%H:%M')}-{record.hora_fin.strftime('%H:%M')} (ID: {record.id_movimiento})"
                        )
    
    # --- INICIO SECCIÓN DE ACTUALIZACIÓN DE CAMPOS ---

    # 1. Obtener el diccionario base de los campos enviados por el cliente.
    #    Usamos model_dump para Pydantic v2.x, ya que se vio en el código original.
    update_dict = hora.model_dump(exclude_unset=True)

    # 2. Consolidar campos de tiempo (hora_inicio, hora_fin, horario string)
    #    Las variables 'hora_inicio_actualizada_obj' y 'hora_fin_actualizada_obj'
    #    (calculadas previamente durante la validación de solapamiento) ya contienen los tiempos parseados
    #    o los originales si no se cambiaron explícitamente (pueden ser None).
    
    update_dict['hora_inicio'] = hora_inicio_actualizada_obj
    update_dict['hora_fin'] = hora_fin_actualizada_obj

    # Calcular el string 'horario' basado en los tiempos de inicio/fin actualizados
    final_horario_str = None
    if hora_inicio_actualizada_obj and hora_fin_actualizada_obj:
        final_horario_str = f"{hora_inicio_actualizada_obj.strftime('%H:%M')}-{hora_fin_actualizada_obj.strftime('%H:%M')}"
    
    # Determinar el estado de regularización para la lógica de 'horario'
    # Si 'es_regularizacion' está en el payload (update_dict), se usa ese valor.
    # Si no, se usa el valor existente en el registro de la BD (db_hora.es_regularizacion).
    es_regularizacion_final = db_hora.es_regularizacion
    if 'es_regularizacion' in update_dict:
        es_regularizacion_final = update_dict['es_regularizacion']

    if es_regularizacion_final:
        # Para regularizaciones, el campo 'horario' es flexible: puede ser None o un texto descriptivo.
        # No debe ser el formato HH:MM-HH:MM calculado.
        # Si el payload original (hora) contenía un 'horario' y es_regularizacion es True,
        # ese 'horario' original se mantendrá a través de update_dict, a menos que se anule aquí.
        # Por seguridad, si se convierte en regularización o ya lo es, y no se especifica horario, se pone a None.
        if 'horario' not in update_dict: # Si no se proveyó horario explícitamente para la regularización
             update_dict['horario'] = None
        # Si 'horario' SÍ vino en el payload para una regularización, se respeta.
    else:
        # Para no regularizaciones, usar el string de horario HH:MM-HH:MM calculado.
        update_dict['horario'] = final_horario_str

    # 3. Consolidar id_partida y nombre_partida
    if "id_partida" in update_dict: # Si id_partida viene en el payload
        if update_dict["id_partida"] is not None:
            partida_obj = db.query(Partida).filter(Partida.id_partida == update_dict["id_partida"]).first()
            if not partida_obj:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Partida con id {update_dict['id_partida']} no encontrada al actualizar.")
            update_dict["nombre_partida"] = partida_obj.nombre_partida
        else: # Si id_partida se envía explícitamente como None
            update_dict["nombre_partida"] = None
    
    # 4. Aplicar todos los cambios consolidados en update_dict a db_hora
    for key, value in update_dict.items():
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