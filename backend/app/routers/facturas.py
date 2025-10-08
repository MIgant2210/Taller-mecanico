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
# FORMAS DE PAGO
# =============================================

@router.get("/formas-pago", response_model=list[schemas.FormaPagoResponse])
def get_formas_pago(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener formas de pago disponibles"""
    return crud.get_formas_pago(db)

# =============================================
# FACTURAS
# =============================================

@router.get("/facturas", response_model=list[schemas.FacturaResponse])
def get_facturas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    fecha_inicio: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_fin: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    estado_pago: Optional[schemas.EstadoPagoEnum] = Query(None, description="Filtrar por estado de pago"),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener lista de facturas con filtros"""
    facturas = crud.get_facturas(db, skip=skip, limit=limit, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
    
    if estado_pago:
        facturas = [f for f in facturas if f.estado_pago == estado_pago]
    
    if cliente_id:
        facturas = [f for f in facturas if f.id_cliente == cliente_id]
    
    return facturas

@router.get("/facturas/{factura_id}", response_model=schemas.FacturaResponse)
def get_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener factura por ID con todos los detalles"""
    factura = crud.get_factura(db, factura_id)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    return factura

@router.get("/facturas/numero/{numero_factura}", response_model=schemas.FacturaResponse)
def get_factura_by_numero(
    numero_factura: str,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener factura por número"""
    factura = db.query(crud.models.Factura).options(
        crud.joinedload(crud.models.Factura.cliente),
        crud.joinedload(crud.models.Factura.ticket),
        crud.joinedload(crud.models.Factura.forma_pago),
        crud.joinedload(crud.models.Factura.empleado_factura),
        crud.joinedload(crud.models.Factura.detalles)
    ).filter(crud.models.Factura.numero_factura == numero_factura).first()
    
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    return factura

@router.post("/facturas", response_model=schemas.FacturaResponse, status_code=status.HTTP_201_CREATED)
def create_factura(
    factura_data: schemas.FacturaCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Generar factura basada en un ticket"""
    # Verificar que el ticket existe
    ticket = crud.get_ticket(db, factura_data.id_ticket)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    
    # Verificar que el ticket tiene servicios o repuestos
    if not ticket.servicios and not ticket.repuestos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ticket debe tener al menos un servicio o repuesto para facturar"
        )
    
    # Verificar que no existe factura para este ticket
    factura_existente = db.query(crud.models.Factura).filter(
        crud.models.Factura.id_ticket == factura_data.id_ticket
    ).first()
    
    if factura_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una factura para este ticket"
        )
    
    # Verificar forma de pago
    forma_pago = db.query(crud.models.FormaPago).filter(
        crud.models.FormaPago.id_forma_pago == factura_data.id_forma_pago
    ).first()
    
    if not forma_pago:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forma de pago no encontrada"
        )
    
    try:
        return crud.create_factura(db, factura_data, current_user.id_empleado)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear factura: {str(e)}"
        )

@router.put("/facturas/{factura_id}", response_model=schemas.FacturaResponse)
def update_factura(
    factura_id: int,
    factura_update: schemas.FacturaUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Actualizar factura (principalmente estado de pago)"""
    factura = crud.update_factura(db, factura_id, factura_update)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    return factura

@router.post("/facturas/generar-desde-ticket/{ticket_id}", response_model=schemas.FacturaResponse, status_code=status.HTTP_201_CREATED)
def generar_factura_desde_ticket(
    ticket_id: int,
    forma_pago_id: int,
    impuestos: float = 0,
    descuentos: float = 0,
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Generar factura automáticamente desde un ticket"""
    ticket = crud.get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket no encontrado"
        )
    
    # Crear detalles automáticamente desde servicios y repuestos del ticket
    detalles = []
    
    # Agregar servicios
    for servicio_ticket in ticket.servicios:
        detalle = schemas.DetalleFacturaCreate(
            tipo_item=schemas.TipoItemEnum.servicio,
            id_item=servicio_ticket.id_servicio,
            descripcion=servicio_ticket.servicio.nombre_servicio,
            cantidad=servicio_ticket.cantidad,
            precio_unitario=servicio_ticket.precio_unitario
        )
        detalles.append(detalle)
    
    # Agregar repuestos
    for repuesto_ticket in ticket.repuestos:
        detalle = schemas.DetalleFacturaCreate(
            tipo_item=schemas.TipoItemEnum.repuesto,
            id_item=repuesto_ticket.id_repuesto,
            descripcion=repuesto_ticket.repuesto.nombre_repuesto,
            cantidad=repuesto_ticket.cantidad,
            precio_unitario=repuesto_ticket.precio_unitario
        )
        detalles.append(detalle)
    
    # Calcular totales
    subtotal = ticket.total_general
    total = subtotal + impuestos - descuentos
    
    factura_data = schemas.FacturaCreate(
        id_ticket=ticket_id,
        id_forma_pago=forma_pago_id,
        subtotal=subtotal,
        impuestos=impuestos,
        descuentos=descuentos,
        total=total,
        observaciones=observaciones,
        detalles=detalles
    )
    
    try:
        return crud.create_factura(db, factura_data, current_user.id_empleado)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al generar factura: {str(e)}"
        )

# =============================================
# REPORTES FINANCIEROS
# =============================================

@router.get("/reportes/ventas", response_model=schemas.ReporteVentas)
def get_reporte_ventas(
    fecha_inicio: date = Query(..., description="Fecha inicio del reporte"),
    fecha_fin: date = Query(..., description="Fecha fin del reporte"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Generar reporte de ventas por período"""
    if fecha_inicio > fecha_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fecha de inicio debe ser menor o igual a fecha fin"
        )
    
    try:
        return crud.get_reporte_ventas(db, fecha_inicio, fecha_fin)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar reporte: {str(e)}"
        )

@router.get("/reportes/estadisticas-generales", response_model=schemas.EstadisticasGenerales)
def get_estadisticas_generales(
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener estadísticas generales del sistema"""
    try:
        return crud.get_estadisticas_generales(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )


@router.get("/reportes/ventas-mensuales")
def get_ventas_mensuales(
    año: int = Query(..., description="Año para el reporte"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener ventas mensuales por año"""
    ventas_mensuales = []
    
    for mes in range(1, 13):
        fecha_inicio = date(año, mes, 1)
        if mes == 12:
            fecha_fin = date(año + 1, 1, 1)
        else:
            fecha_fin = date(año, mes + 1, 1)
        
        # Obtener facturas del mes
        facturas_mes = db.query(crud.models.Factura).filter(
            crud.func.date(crud.models.Factura.fecha_factura) >= fecha_inicio,
            crud.func.date(crud.models.Factura.fecha_factura) < fecha_fin
        ).all()
        
        total_mes = sum(f.total for f in facturas_mes)
        cantidad_facturas = len(facturas_mes)
        
        ventas_mensuales.append({
            "mes": mes,
            "nombre_mes": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][mes-1],
            "total_ventas": float(total_mes),
            "cantidad_facturas": cantidad_facturas
        })
    
    return {
        "año": año,
        "ventas_mensuales": ventas_mensuales,
        "total_anual": sum(v["total_ventas"] for v in ventas_mensuales)
    }

@router.get("/reportes/top-servicios")
def get_top_servicios(
    limite: int = Query(10, ge=1, le=50, description="Cantidad de servicios top"),
    fecha_inicio: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_fin: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener servicios más vendidos"""
    query = db.query(
        crud.models.Servicio.nombre_servicio,
        crud.func.count(crud.models.TicketServicio.id_servicio).label('cantidad_vendida'),
        crud.func.sum(crud.models.TicketServicio.subtotal).label('total_ingresos')
    ).join(
        crud.models.TicketServicio, crud.models.Servicio.id_servicio == crud.models.TicketServicio.id_servicio
    ).join(
        crud.models.TicketAtencion, crud.models.TicketServicio.id_ticket == crud.models.TicketAtencion.id_ticket
    )
    
    if fecha_inicio:
        query = query.filter(crud.func.date(crud.models.TicketAtencion.fecha_ingreso) >= fecha_inicio)
    if fecha_fin:
        query = query.filter(crud.func.date(crud.models.TicketAtencion.fecha_ingreso) <= fecha_fin)
    
    top_servicios = query.group_by(
        crud.models.Servicio.id_servicio
    ).order_by(
        crud.func.count(crud.models.TicketServicio.id_servicio).desc()
    ).limit(limite).all()
    
    return [
        {
            "nombre_servicio": nombre,
            "cantidad_vendida": cantidad,
            "total_ingresos": float(total)
        }
        for nombre, cantidad, total in top_servicios
    ]

@router.get("/reportes/top-repuestos")
def get_top_repuestos(
    limite: int = Query(10, ge=1, le=50, description="Cantidad de repuestos top"),
    fecha_inicio: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_fin: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener repuestos más vendidos"""
    query = db.query(
        crud.models.Repuesto.nombre_repuesto,
        crud.func.sum(crud.models.TicketRepuesto.cantidad).label('cantidad_vendida'),
        crud.func.sum(crud.models.TicketRepuesto.subtotal).label('total_ingresos')
    ).join(
        crud.models.TicketRepuesto, crud.models.Repuesto.id_repuesto == crud.models.TicketRepuesto.id_repuesto
    ).join(
        crud.models.TicketAtencion, crud.models.TicketRepuesto.id_ticket == crud.models.TicketAtencion.id_ticket
    )
    
    if fecha_inicio:
        query = query.filter(crud.func.date(crud.models.TicketAtencion.fecha_ingreso) >= fecha_inicio)
    if fecha_fin:
        query = query.filter(crud.func.date(crud.models.TicketAtencion.fecha_ingreso) <= fecha_fin)
    
    top_repuestos = query.group_by(
        crud.models.Repuesto.id_repuesto
    ).order_by(
        crud.func.sum(crud.models.TicketRepuesto.cantidad).desc()
    ).limit(limite).all()
    
    return [
        {
            "nombre_repuesto": nombre,
            "cantidad_vendida": int(cantidad),
            "total_ingresos": float(total)
        }
        for nombre, cantidad, total in top_repuestos
    ]

# =============================================
# GESTIÓN DE PAGOS
# =============================================

@router.put("/facturas/{factura_id}/marcar-pagada")
def marcar_factura_pagada(
    factura_id: int,
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Marcar factura como pagada"""
    factura = crud.get_factura(db, factura_id)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    factura.estado_pago = schemas.EstadoPagoEnum.pagada
    if observaciones:
        factura.observaciones = (factura.observaciones or "") + f"\nPago registrado: {observaciones}"
    
    db.commit()
    
    return {"message": "Factura marcada como pagada"}

@router.put("/facturas/{factura_id}/anular")
def anular_factura(
    factura_id: int,
    motivo: str = Query(..., description="Motivo de anulación"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(require_admin_or_jefe)
):
    """Anular factura (Solo Admin/Jefe)"""
    factura = crud.get_factura(db, factura_id)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    if factura.estado_pago == schemas.EstadoPagoEnum.pagada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede anular una factura pagada"
        )
    
    factura.estado_pago = schemas.EstadoPagoEnum.anulada
    factura.observaciones = (factura.observaciones or "") + f"\nAnulada el {datetime.now().strftime('%Y-%m-%d %H:%M')}: {motivo}"
    
    db.commit()
    
    return {"message": "Factura anulada correctamente"}

# =============================================
# BÚSQUEDAS Y FILTROS AVANZADOS
# =============================================

@router.get("/facturas/buscar")
def buscar_facturas(
    q: Optional[str] = Query(None, description="Buscar por número, cliente, etc."),
    estado_pago: Optional[schemas.EstadoPagoEnum] = Query(None),
    forma_pago_id: Optional[int] = Query(None),
    monto_min: Optional[float] = Query(None, ge=0),
    monto_max: Optional[float] = Query(None, ge=0),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Búsqueda avanzada de facturas"""
    query = db.query(crud.models.Factura).options(
        crud.joinedload(crud.models.Factura.cliente),
        crud.joinedload(crud.models.Factura.forma_pago)
    )
    
    if q:
        query = query.filter(
            crud.or_(
                crud.models.Factura.numero_factura.contains(q),
                crud.models.Cliente.nombres.contains(q),
                crud.models.Cliente.apellidos.contains(q)
            )
        ).join(crud.models.Cliente)
    
    if estado_pago:
        query = query.filter(crud.models.Factura.estado_pago == estado_pago)
    
    if forma_pago_id:
        query = query.filter(crud.models.Factura.id_forma_pago == forma_pago_id)
    
    if monto_min is not None:
        query = query.filter(crud.models.Factura.total >= monto_min)
    
    if monto_max is not None:
        query = query.filter(crud.models.Factura.total <= monto_max)
    
    return query.order_by(crud.models.Factura.fecha_factura.desc()).offset(skip).limit(limit).all()

@router.get("/facturas/pendientes", response_model=list[schemas.FacturaResponse])
def get_facturas_pendientes(
    dias_vencidas: Optional[int] = Query(None, description="Filtrar facturas vencidas hace X días"),
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Obtener facturas pendientes de pago"""
    query = db.query(crud.models.Factura).options(
        crud.joinedload(crud.models.Factura.cliente),
        crud.joinedload(crud.models.Factura.ticket)
    ).filter(
        crud.models.Factura.estado_pago == schemas.EstadoPagoEnum.pendiente
    )
    
    if dias_vencidas is not None:
        fecha_limite = datetime.now().date() - crud.timedelta(days=dias_vencidas)
        query = query.filter(
            crud.models.Factura.fecha_vencimiento <= fecha_limite
        )
    
    return query.order_by(crud.models.Factura.fecha_vencimiento.asc()).all()

# =============================================
# EXPORTAR DATOS
# =============================================

@router.get("/facturas/{factura_id}/pdf")
def generar_pdf_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UsuarioResponse = Depends(get_current_active_user)
):
    """Generar PDF de factura (endpoint placeholder)"""
    factura = crud.get_factura(db, factura_id)
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Factura no encontrada"
        )
    
    # Aquí se implementaría la generación del PDF
    # Por ahora, retornamos la información de la factura
    return {
        "message": "PDF generation not implemented yet",
        "factura_data": factura,
        "url_pdf": f"/api/v1/facturas/{factura_id}/download-pdf"
    }