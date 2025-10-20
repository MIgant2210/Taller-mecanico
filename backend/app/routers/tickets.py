from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from database import get_db
from auth import get_current_active_user, require_admin_or_jefe
import schemas
import crud

router = APIRouter()

# =============================================
# CITAS
# =============================================

@router.get("/citas", response_model=list[schemas.CitaResponse])
def get_citas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    fecha_inicio: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_fin: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    estado: Optional[schemas.EstadoCitaEnum] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener lista de citas"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from database import get_db
from auth import get_current_active_user, require_admin_or_jefe
import schemas
import crud

router = APIRouter()

# =============================================
# CITAS
# =============================================

@router.get("/citas", response_model=list[schemas.CitaResponse])
def get_citas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    fecha_inicio: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_fin: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    estado: Optional[schemas.EstadoCitaEnum] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener lista de citas"""
    citas = crud.get_citas(db, skip=skip, limit=limit, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
    
    if estado:
        citas = [cita for cita in citas if cita.estado_cita == estado]
    
    return citas

@router.get("/citas/{cita_id}", response_model=schemas.CitaResponse)
def get_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener cita por ID"""
    cita = crud.get_cita(db, cita_id)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    return cita

@router.post("/citas", response_model=schemas.CitaResponse, status_code=status.HTTP_201_CREATED)
def create_cita(
    cita_data: schemas.CitaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Agendar nueva cita"""
    # Verificar que el cliente y vehículo existen
    cliente = crud.get_cliente(db, cita_data.id_cliente)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    vehiculo = crud.get_vehiculo(db, cita_data.id_vehiculo)
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Verificar que el vehículo pertenece al cliente
    if vehiculo.id_cliente != cita_data.id_cliente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El vehículo no pertenece al cliente especificado"
        )
    
    try:
        return crud.create_cita(db, cita_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear cita: {str(e)}"
        )

@router.put("/citas/{cita_id}", response_model=schemas.CitaResponse)
def update_cita(
    cita_id: int,
    cita_update: schemas.CitaUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Actualizar cita"""
    cita = crud.update_cita(db, cita_id, cita_update)
    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )
    return cita

@router.get("/citas/fecha/{fecha}", response_model=list[schemas.CitaResponse])
def get_citas_by_fecha(
    fecha: date,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener citas de una fecha específica"""
    return crud.get_citas_by_fecha(db, fecha)

# =============================================
# ESTADOS DE TICKETS
# =============================================

@router.get("/estados-ticket", response_model=list[schemas.EstadoTicketResponse])
def get_estados_ticket(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener estados de tickets disponibles"""
    return crud.get_estados_ticket(db)

# =============================================
# TICKETS DE ATENCIÓN
# =============================================

@router.get("/tickets", response_model=list[schemas.TicketResponse])
def get_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado_id: Optional[int] = Query(None, description="Filtrar por estado"),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    empleado_id: Optional[int] = Query(None, description="Filtrar por empleado asignado"),
    fecha_inicio: Optional[date] = Query(None, description="Filtrar desde fecha"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener lista de tickets de atención"""
    return crud.get_tickets(db, skip=skip, limit=limit, estado_id=estado_id, cliente_id=cliente_id)

@router.get("/tickets/{ticket_id}", response_model=schemas.TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener ticket por ID con todos los detalles"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    return ticket

@router.post("/tickets", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Crear nuevo ticket de atención"""
    # Verificar que el cliente y vehículo existen
    cliente = crud.get_cliente(db, ticket_data.id_cliente)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    vehiculo = crud.get_vehiculo(db, ticket_data.id_vehiculo)
    if not vehiculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehículo no encontrado"
        )
    
    # Verificar que el vehículo pertenece al cliente
    if vehiculo.id_cliente != ticket_data.id_cliente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El vehículo no pertenece al cliente especificado"
        )
    
    try:
        return crud.create_ticket(db, ticket_data, current_user.id_empleado)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear ticket: {str(e)}"
        )

@router.put("/tickets/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Actualizar ticket de atención"""
    ticket = crud.update_ticket(db, ticket_id, ticket_update)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    return ticket

@router.put("/tickets/{ticket_id}/estado")
def update_ticket_estado(
    ticket_id: int,
    nuevo_estado_id: int,
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Cambiar estado del ticket"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    
    # Verificar que el estado existe
    estado = db.query(crud.models.EstadoTicket).filter(
        crud.models.EstadoTicket.id_estado == nuevo_estado_id
    ).first()
    
    if not estado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estado no válido"
        )
    
    ticket.id_estado = nuevo_estado_id
    if observaciones:
        ticket.observaciones_internas = (ticket.observaciones_internas or "") + f"\n{datetime.now().strftime('%Y-%m-%d %H:%M')}: {observaciones}"
    
    # Si es estado "Entregado", marcar fecha de entrega
    if estado.nombre_estado.lower() == "entregado":
        ticket.fecha_entrega_real = datetime.now()
    
    db.commit()
    
    return {"message": f"Estado cambiado a: {estado.nombre_estado}"}

# =============================================
# SERVICIOS EN TICKETS
# =============================================

@router.post("/tickets/{ticket_id}/servicios", response_model=schemas.TicketServicioResponse, status_code=status.HTTP_201_CREATED)
def add_servicio_to_ticket(
    ticket_id: int,
    servicio_data: schemas.TicketServicioCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Agregar servicio a un ticket"""
    # Verificar que el ticket existe
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    
    # Verificar que el servicio existe
    servicio = crud.get_servicio(db, servicio_data.id_servicio)
    if not servicio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Servicio no encontrado"
        )
    
    try:
        return crud.add_servicio_to_ticket(db, ticket_id, servicio_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al agregar servicio: {str(e)}"
        )

@router.get("/tickets/{ticket_id}/servicios", response_model=list[schemas.TicketServicioResponse])
def get_servicios_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener servicios aplicados a un ticket"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    
    return ticket.servicios

# =============================================
# REPUESTOS EN TICKETS
# =============================================

@router.post("/tickets/{ticket_id}/repuestos", response_model=schemas.TicketRepuestoResponse, status_code=status.HTTP_201_CREATED)
def add_repuesto_to_ticket(
    ticket_id: int,
    repuesto_data: schemas.TicketRepuestoCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Agregar repuesto a un ticket"""
    # Verificar que el ticket existe
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    
    # Verificar que el repuesto existe
    repuesto = crud.get_repuesto(db, repuesto_data.id_repuesto)
    if not repuesto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repuesto no encontrado"
        )
    
    try:
        return crud.add_repuesto_to_ticket(db, ticket_id, repuesto_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al agregar repuesto: {str(e)}"
        )

@router.get("/tickets/{ticket_id}/repuestos", response_model=list[schemas.TicketRepuestoResponse])
def get_repuestos_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener repuestos utilizados en un ticket"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    
    return ticket.repuestos

# =============================================
# REPORTES Y ESTADÍSTICAS
# =============================================

@router.get("/tickets/estadisticas")
def get_estadisticas_tickets(
    fecha_inicio: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_fin: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener estadísticas de tickets"""
    query = db.query(crud.models.TicketAtencion)
    
    if fecha_inicio:
        query = query.filter(crud.func.date(crud.models.TicketAtencion.fecha_ingreso) >= fecha_inicio)
    if fecha_fin:
        query = query.filter(crud.func.date(crud.models.TicketAtencion.fecha_ingreso) <= fecha_fin)
    
    tickets = query.all()
    
    # Estadísticas por estado
    estados_count = {}
    for ticket in tickets:
        estado_nombre = ticket.estado.nombre_estado
        estados_count[estado_nombre] = estados_count.get(estado_nombre, 0) + 1
    
    # Tiempo promedio de resolución
    tickets_completados = [t for t in tickets if t.fecha_entrega_real and t.fecha_ingreso]
    tiempo_promedio = None
    
    if tickets_completados:
        tiempos = [(t.fecha_entrega_real - t.fecha_ingreso).total_seconds() / 3600 for t in tickets_completados]
        tiempo_promedio = sum(tiempos) / len(tiempos)
    
    return {
        "total_tickets": len(tickets),
        "tickets_por_estado": estados_count,
        "tiempo_promedio_horas": tiempo_promedio,
        "tickets_completados": len(tickets_completados),
        "fecha_reporte": datetime.now().isoformat()
    }

@router.get("/dashboard")
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener datos para dashboard principal"""
    today = date.today()
    
    # Citas de hoy
    citas_hoy = len(crud.get_citas_by_fecha(db, today))
    
    # Tickets activos (no completados)
    tickets_activos = db.query(crud.models.TicketAtencion).filter(
        crud.models.TicketAtencion.id_estado.in_([1, 2, 3, 4])  # Estados activos
    ).count()
    
    # Tickets de hoy
    tickets_hoy = db.query(crud.models.TicketAtencion).filter(
        crud.func.date(crud.models.TicketAtencion.fecha_ingreso) == today
    ).count()
    
    # Stock bajo
    stock_bajo = len(crud.get_repuestos_stock_bajo(db))
    
    return {
        "citas_hoy": citas_hoy,
        "tickets_activos": tickets_activos,
        "tickets_hoy": tickets_hoy,
        "repuestos_stock_bajo": stock_bajo,
        "fecha": today.isoformat()
    }