from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date
from decimal import Decimal
import models
import schemas

# =============================================
# CRUD BÁSICO GENÉRICO
# =============================================

def get_item(db: Session, model, item_id: int):
    """Obtener item por ID"""
    return db.query(model).filter(model.id == item_id).first()

def get_items(db: Session, model, skip: int = 0, limit: int = 100):
    """Obtener lista de items con paginación"""
    return db.query(model).offset(skip).limit(limit).all()

# =============================================
# ROLES Y PUESTOS
# =============================================

def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Rol).offset(skip).limit(limit).all()

def create_rol(db: Session, rol: schemas.RolCreate):
    db_rol = models.Rol(**rol.dict())
    db.add(db_rol)
    db.commit()
    db.refresh(db_rol)
    return db_rol

def get_puestos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Puesto).offset(skip).limit(limit).all()

def create_puesto(db: Session, puesto: schemas.PuestoCreate):
    db_puesto = models.Puesto(**puesto.dict())
    db.add(db_puesto)
    db.commit()
    db.refresh(db_puesto)
    return db_puesto

# =============================================
# EMPLEADOS Y USUARIOS
# =============================================

def get_empleados(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Empleado).options(joinedload(models.Empleado.puesto)).offset(skip).limit(limit).all()

def get_empleado(db: Session, empleado_id: int):
    return db.query(models.Empleado).options(joinedload(models.Empleado.puesto)).filter(models.Empleado.id_empleado == empleado_id).first()

def create_empleado(db: Session, empleado: schemas.EmpleadoCreate):
    db_empleado = models.Empleado(**empleado.dict())
    db.add(db_empleado)
    db.commit()
    db.refresh(db_empleado)
    return db_empleado

def get_usuarios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Usuario).options(
        joinedload(models.Usuario.empleado),
        joinedload(models.Usuario.rol)
    ).offset(skip).limit(limit).all()

def get_usuario_by_username(db: Session, username: str):
    return db.query(models.Usuario).options(
        joinedload(models.Usuario.empleado),
        joinedload(models.Usuario.rol)
    ).filter(models.Usuario.username == username).first()

# =============================================
# CLIENTES Y VEHÍCULOS
# =============================================

def get_clientes(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(models.Cliente)
    
    if search:
        query = query.filter(
            or_(
                models.Cliente.nombres.contains(search),
                models.Cliente.apellidos.contains(search),
                models.Cliente.cedula.contains(search),
                models.Cliente.telefono.contains(search)
            )
        )
    
    return query.offset(skip).limit(limit).all()

def get_cliente(db: Session, cliente_id: int):
    return db.query(models.Cliente).filter(models.Cliente.id_cliente == cliente_id).first()

def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    db_cliente = models.Cliente(**cliente.dict())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def update_cliente(db: Session, cliente_id: int, cliente_update: schemas.ClienteUpdate):
    db_cliente = get_cliente(db, cliente_id)
    if db_cliente:
        update_data = cliente_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_cliente, key, value)
        db.commit()
        db.refresh(db_cliente)
    return db_cliente

def get_vehiculos_by_cliente(db: Session, cliente_id: int):
    return db.query(models.Vehiculo).options(
        joinedload(models.Vehiculo.cliente)
    ).filter(models.Vehiculo.id_cliente == cliente_id).all()

def get_vehiculo(db: Session, vehiculo_id: int):
    return db.query(models.Vehiculo).options(
        joinedload(models.Vehiculo.cliente)
    ).filter(models.Vehiculo.id_vehiculo == vehiculo_id).first()

def create_vehiculo(db: Session, vehiculo: schemas.VehiculoCreate):
    db_vehiculo = models.Vehiculo(**vehiculo.dict())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

# =============================================
# SERVICIOS
# =============================================

def get_categorias_servicios(db: Session):
    return db.query(models.CategoriaServicio).all()

def create_categoria_servicio(db: Session, categoria: schemas.CategoriaServicioCreate):
    db_categoria = models.CategoriaServicio(**categoria.dict())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

def get_servicios(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Servicio).options(
        joinedload(models.Servicio.categoria)
    ).filter(models.Servicio.activo == True).offset(skip).limit(limit).all()

def get_servicio(db: Session, servicio_id: int):
    return db.query(models.Servicio).options(
        joinedload(models.Servicio.categoria)
    ).filter(models.Servicio.id_servicio == servicio_id).first()

def create_servicio(db: Session, servicio: schemas.ServicioCreate):
    db_servicio = models.Servicio(**servicio.dict())
    db.add(db_servicio)
    db.commit()
    db.refresh(db_servicio)
    return db_servicio

# =============================================
# INVENTARIO
# =============================================

def get_proveedores(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Proveedor).filter(models.Proveedor.activo == True).offset(skip).limit(limit).all()

def create_proveedor(db: Session, proveedor: schemas.ProveedorCreate):
    db_proveedor = models.Proveedor(**proveedor.dict())
    db.add(db_proveedor)
    db.commit()
    db.refresh(db_proveedor)
    return db_proveedor

def get_categorias_repuestos(db: Session):
    return db.query(models.CategoriaRepuesto).all()

def create_categoria_repuesto(db: Session, categoria: schemas.CategoriaRepuestoCreate):
    db_categoria = models.CategoriaRepuesto(**categoria.dict())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

def get_repuestos(db: Session, skip: int = 0, limit: int = 100, search: str = None, categoria_id: int = None):
    query = db.query(models.Repuesto).options(
        joinedload(models.Repuesto.categoria),
        joinedload(models.Repuesto.proveedor)
    ).filter(models.Repuesto.activo == True)
    
    if search:
        query = query.filter(
            or_(
                models.Repuesto.codigo_repuesto.contains(search),
                models.Repuesto.nombre_repuesto.contains(search)
            )
        )
    
    if categoria_id:
        query = query.filter(models.Repuesto.id_categoria_repuesto == categoria_id)
    
    return query.offset(skip).limit(limit).all()

def get_repuesto(db: Session, repuesto_id: int):
    return db.query(models.Repuesto).options(
        joinedload(models.Repuesto.categoria),
        joinedload(models.Repuesto.proveedor)
    ).filter(models.Repuesto.id_repuesto == repuesto_id).first()

def get_repuesto_by_codigo(db: Session, codigo: str):
    return db.query(models.Repuesto).filter(models.Repuesto.codigo_repuesto == codigo).first()

def create_repuesto(db: Session, repuesto: schemas.RepuestoCreate):
    db_repuesto = models.Repuesto(**repuesto.dict())
    db.add(db_repuesto)
    db.commit()
    db.refresh(db_repuesto)
    return db_repuesto

def update_repuesto(db: Session, repuesto_id: int, repuesto_update: schemas.RepuestoUpdate):
    db_repuesto = get_repuesto(db, repuesto_id)
    if db_repuesto:
        update_data = repuesto_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_repuesto, key, value)
        db.commit()
        db.refresh(db_repuesto)
    return db_repuesto

def get_repuestos_stock_bajo(db: Session):
    """Obtener repuestos con stock bajo el mínimo"""
    return db.query(models.Repuesto).filter(
        models.Repuesto.stock_actual <= models.Repuesto.stock_minimo,
        models.Repuesto.activo == True
    ).all()

def actualizar_stock_repuesto(db: Session, repuesto_id: int, nueva_cantidad: int, tipo_movimiento_id: int, empleado_id: int, observaciones: str = None):
    """Actualizar stock de repuesto y crear movimiento"""
    repuesto = get_repuesto(db, repuesto_id)
    if not repuesto:
        return None
    
    stock_anterior = repuesto.stock_actual
    repuesto.stock_actual = nueva_cantidad
    
    # Crear movimiento de inventario
    movimiento = models.MovimientoInventario(
        id_repuesto=repuesto_id,
        id_tipo_movimiento=tipo_movimiento_id,
        cantidad=abs(nueva_cantidad - stock_anterior),
        stock_anterior=stock_anterior,
        stock_nuevo=nueva_cantidad,
        observaciones=observaciones,
        id_empleado=empleado_id
    )
    
    db.add(movimiento)
    db.commit()
    db.refresh(repuesto)
    
    return repuesto

# =============================================
# CITAS
# =============================================

def get_citas(db: Session, skip: int = 0, limit: int = 100, fecha_inicio: date = None, fecha_fin: date = None):
    query = db.query(models.Cita).options(
        joinedload(models.Cita.cliente),
        joinedload(models.Cita.vehiculo),
        joinedload(models.Cita.empleado_asignado)
    )
    
    if fecha_inicio:
        query = query.filter(func.date(models.Cita.fecha_cita) >= fecha_inicio)
    if fecha_fin:
        query = query.filter(func.date(models.Cita.fecha_cita) <= fecha_fin)
    
    return query.order_by(models.Cita.fecha_cita).offset(skip).limit(limit).all()

def get_cita(db: Session, cita_id: int):
    return db.query(models.Cita).options(
        joinedload(models.Cita.cliente),
        joinedload(models.Cita.vehiculo),
        joinedload(models.Cita.empleado_asignado)
    ).filter(models.Cita.id_cita == cita_id).first()

def create_cita(db: Session, cita: schemas.CitaCreate):
    db_cita = models.Cita(**cita.dict())
    db.add(db_cita)
    db.commit()
    db.refresh(db_cita)
    return db_cita

def update_cita(db: Session, cita_id: int, cita_update: schemas.CitaUpdate):
    db_cita = get_cita(db, cita_id)
    if db_cita:
        update_data = cita_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_cita, key, value)
        db.commit()
        db.refresh(db_cita)
    return db_cita

def get_citas_by_fecha(db: Session, fecha: date):
    """Obtener citas por fecha específica"""
    return db.query(models.Cita).options(
        joinedload(models.Cita.cliente),
        joinedload(models.Cita.vehiculo)
    ).filter(func.date(models.Cita.fecha_cita) == fecha).all()

# =============================================
# TICKETS DE ATENCIÓN
# =============================================

def get_estados_ticket(db: Session):
    return db.query(models.EstadoTicket).all()

def get_tickets(db: Session, skip: int = 0, limit: int = 100, estado_id: int = None, cliente_id: int = None):
    query = db.query(models.TicketAtencion).options(
        joinedload(models.TicketAtencion.cliente),
        joinedload(models.TicketAtencion.vehiculo),
        joinedload(models.TicketAtencion.estado),
        joinedload(models.TicketAtencion.empleado_asignado)
    )
    
    if estado_id:
        query = query.filter(models.TicketAtencion.id_estado == estado_id)
    if cliente_id:
        query = query.filter(models.TicketAtencion.id_cliente == cliente_id)
    
    return query.order_by(models.TicketAtencion.fecha_ingreso.desc()).offset(skip).limit(limit).all()

def get_ticket(db: Session, ticket_id: int):
    return db.query(models.TicketAtencion).options(
        joinedload(models.TicketAtencion.cliente),
        joinedload(models.TicketAtencion.vehiculo),
        joinedload(models.TicketAtencion.cita),
        joinedload(models.TicketAtencion.empleado_recepcion),
        joinedload(models.TicketAtencion.empleado_asignado),
        joinedload(models.TicketAtencion.estado),
        joinedload(models.TicketAtencion.servicios).joinedload(models.TicketServicio.servicio),
        joinedload(models.TicketAtencion.repuestos).joinedload(models.TicketRepuesto.repuesto)
    ).filter(models.TicketAtencion.id_ticket == ticket_id).first()

def create_ticket(db: Session, ticket: schemas.TicketCreate, empleado_recepcion_id: int):
    # Generar número de ticket
    count = db.query(models.TicketAtencion).filter(
        func.date(models.TicketAtencion.fecha_ingreso) == date.today()
    ).count()
    
    numero_ticket = f"TK{datetime.now().strftime('%Y%m%d')}-{str(count + 1).zfill(3)}"
    
    db_ticket = models.TicketAtencion(
        numero_ticket=numero_ticket,
        id_empleado_recepcion=empleado_recepcion_id,
        **ticket.dict()
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def update_ticket(db: Session, ticket_id: int, ticket_update: schemas.TicketUpdate):
    db_ticket = get_ticket(db, ticket_id)
    if db_ticket:
        update_data = ticket_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_ticket, key, value)
        db.commit()
        db.refresh(db_ticket)
    return db_ticket

def add_servicio_to_ticket(db: Session, ticket_id: int, servicio_data: schemas.TicketServicioCreate):
    """Agregar servicio a un ticket"""
    subtotal = servicio_data.precio_unitario * servicio_data.cantidad
    
    db_ticket_servicio = models.TicketServicio(
        id_ticket=ticket_id,
        subtotal=subtotal,
        **servicio_data.dict()
    )
    
    db.add(db_ticket_servicio)
    
    # Actualizar total del ticket
    ticket = get_ticket(db, ticket_id)
    if ticket:
        total_servicios = db.query(func.sum(models.TicketServicio.subtotal)).filter(
            models.TicketServicio.id_ticket == ticket_id
        ).scalar() or 0
        
        ticket.total_servicios = total_servicios
        ticket.total_general = ticket.total_servicios + ticket.total_repuestos
    
    db.commit()
    db.refresh(db_ticket_servicio)
    return db_ticket_servicio

def add_repuesto_to_ticket(db: Session, ticket_id: int, repuesto_data: schemas.TicketRepuestoCreate):
    """Agregar repuesto a un ticket y actualizar stock"""
    subtotal = repuesto_data.precio_unitario * repuesto_data.cantidad
    
    # Verificar stock disponible
    repuesto = get_repuesto(db, repuesto_data.id_repuesto)
    if not repuesto:
        raise ValueError("Repuesto no encontrado")
    if repuesto.stock_actual < repuesto_data.cantidad:
        raise ValueError("Stock insuficiente")
    
    db_ticket_repuesto = models.TicketRepuesto(
        id_ticket=ticket_id,
        subtotal=subtotal,
        **repuesto_data.dict()
    )
    
    db.add(db_ticket_repuesto)
    
    # Actualizar stock
    repuesto.stock_actual -= repuesto_data.cantidad
    
    # Crear movimiento de inventario (tipo salida = 2)
    movimiento = models.MovimientoInventario(
        id_repuesto=repuesto_data.id_repuesto,
        id_tipo_movimiento=2,  # Venta
        cantidad=repuesto_data.cantidad,
        precio_unitario=repuesto_data.precio_unitario,
        stock_anterior=repuesto.stock_actual + repuesto_data.cantidad,
        stock_nuevo=repuesto.stock_actual,
        referencia_documento=f"TK-{ticket_id}",
        id_empleado=1  # Esto debería venir del usuario actual
    )
    db.add(movimiento)
    
    # Actualizar total del ticket
    ticket = get_ticket(db, ticket_id)
    if ticket:
        total_repuestos = db.query(func.sum(models.TicketRepuesto.subtotal)).filter(
            models.TicketRepuesto.id_ticket == ticket_id
        ).scalar() or 0
        
        ticket.total_repuestos = total_repuestos
        ticket.total_general = ticket.total_servicios + ticket.total_repuestos
    
    db.commit()
    db.refresh(db_ticket_repuesto)
    return db_ticket_repuesto

# =============================================
# FACTURACIÓN
# =============================================

def get_formas_pago(db: Session):
    return db.query(models.FormaPago).filter(models.FormaPago.activo == True).all()

def get_facturas(db: Session, skip: int = 0, limit: int = 100, fecha_inicio: date = None, fecha_fin: date = None):
    query = db.query(models.Factura).options(
        joinedload(models.Factura.cliente),
        joinedload(models.Factura.ticket),
        joinedload(models.Factura.forma_pago)
    )
    
    if fecha_inicio:
        query = query.filter(func.date(models.Factura.fecha_factura) >= fecha_inicio)
    if fecha_fin:
        query = query.filter(func.date(models.Factura.fecha_factura) <= fecha_fin)
    
    return query.order_by(models.Factura.fecha_factura.desc()).offset(skip).limit(limit).all()

def get_factura(db: Session, factura_id: int):
    return db.query(models.Factura).options(
        joinedload(models.Factura.cliente),
        joinedload(models.Factura.ticket),
        joinedload(models.Factura.forma_pago),
        joinedload(models.Factura.empleado_factura),
        joinedload(models.Factura.detalles)
    ).filter(models.Factura.id_factura == factura_id).first()

def create_factura(db: Session, factura_data: schemas.FacturaCreate, empleado_id: int):
    """Crear factura basada en un ticket"""
    # Generar número de factura
    count = db.query(models.Factura).filter(
        func.date(models.Factura.fecha_factura) == date.today()
    ).count()
    
    numero_factura = f"FC{datetime.now().strftime('%Y%m%d')}-{str(count + 1).zfill(4)}"
    
    # Obtener datos del ticket
    ticket = get_ticket(db, factura_data.id_ticket)
    if not ticket:
        raise ValueError("Ticket no encontrado")
    
    db_factura = models.Factura(
        numero_factura=numero_factura,
        id_cliente=ticket.id_cliente,
        id_empleado_factura=empleado_id,
        **factura_data.dict(exclude={'detalles'})
    )
    
    db.add(db_factura)
    db.flush()  # Para obtener el ID
    
    # Crear detalles de factura
    for detalle_data in factura_data.detalles:
        detalle = models.DetalleFactura(
            id_factura=db_factura.id_factura,
            subtotal=detalle_data.precio_unitario * detalle_data.cantidad,
            **detalle_data.dict()
        )
        db.add(detalle)
    
    db.commit()
    db.refresh(db_factura)
    return db_factura

def update_factura(db: Session, factura_id: int, factura_update: schemas.FacturaUpdate):
    db_factura = get_factura(db, factura_id)
    if db_factura:
        update_data = factura_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_factura, key, value)
        db.commit()
        db.refresh(db_factura)
    return db_factura

# =============================================
# REPORTES Y ESTADÍSTICAS
# =============================================

def get_reporte_ventas(db: Session, fecha_inicio: date, fecha_fin: date):
    """Generar reporte de ventas por período"""
    facturas = db.query(models.Factura).filter(
        func.date(models.Factura.fecha_factura) >= fecha_inicio,
        func.date(models.Factura.fecha_factura) <= fecha_fin
    ).all()
    
    total_facturas = len(facturas)
    total_ventas = sum(f.total for f in facturas)
    facturas_pagadas = len([f for f in facturas if f.estado_pago == 'pagada'])
    facturas_pendientes = len([f for f in facturas if f.estado_pago == 'pendiente'])
    
    # Calcular totales por servicios y repuestos
    total_servicios = 0
    total_repuestos = 0
    
    for factura in facturas:
        for detalle in factura.detalles:
            if detalle.tipo_item == 'servicio':
                total_servicios += detalle.subtotal
            else:
                total_repuestos += detalle.subtotal
    
    return schemas.ReporteVentas(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        total_facturas=total_facturas,
        total_ventas=total_ventas,
        total_servicios=total_servicios,
        total_repuestos=total_repuestos,
        facturas_pendientes=facturas_pendientes,
        facturas_pagadas=facturas_pagadas
    )

def get_estadisticas_generales(db: Session):
    """Obtener estadísticas generales del sistema"""
    total_clientes = db.query(models.Cliente).count()
    total_vehiculos = db.query(models.Vehiculo).filter(models.Vehiculo.activo == True).count()
    
    tickets_activos = db.query(models.TicketAtencion).filter(
        models.TicketAtencion.id_estado.in_([1, 2, 3, 4])  # Estados activos
    ).count()
    
    tickets_completados = db.query(models.TicketAtencion).filter(
        models.TicketAtencion.id_estado.in_([5, 6])  # Estados completados
    ).count()
    
    citas_programadas = db.query(models.Cita).filter(
        models.Cita.estado_cita.in_(['programada', 'confirmada']),
        models.Cita.fecha_cita >= datetime.now()
    ).count()
    
    stock_bajo_minimo = db.query(models.Repuesto).filter(
        models.Repuesto.stock_actual <= models.Repuesto.stock_minimo,
        models.Repuesto.activo == True
    ).count()
    
    return schemas.EstadisticasGenerales(
        total_clientes=total_clientes,
        total_vehiculos=total_vehiculos,
        tickets_activos=tickets_activos,
        tickets_completados=tickets_completados,
        citas_programadas=citas_programadas,
        stock_bajo_minimo=stock_bajo_minimo
    )

# =============================================
# MOVIMIENTOS DE INVENTARIO
# =============================================

def get_tipos_movimiento(db: Session):
    return db.query(models.TipoMovimientoInventario).all()

def get_movimientos_inventario(db: Session, repuesto_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.MovimientoInventario).options(
        joinedload(models.MovimientoInventario.repuesto),
        joinedload(models.MovimientoInventario.tipo_movimiento),
        joinedload(models.MovimientoInventario.empleado)
    )
    
    if repuesto_id:
        query = query.filter(models.MovimientoInventario.id_repuesto == repuesto_id)
    
    return query.order_by(models.MovimientoInventario.fecha_movimiento.desc()).offset(skip).limit(limit).all()

def create_movimiento_inventario(db: Session, movimiento: schemas.MovimientoInventarioCreate, empleado_id: int):
    """Crear movimiento de inventario y actualizar stock"""
    repuesto = get_repuesto(db, movimiento.id_repuesto)
    if not repuesto:
        raise ValueError("Repuesto no encontrado")
    
    tipo_mov = db.query(models.TipoMovimientoInventario).filter(
        models.TipoMovimientoInventario.id_tipo_movimiento == movimiento.id_tipo_movimiento
    ).first()
    
    if not tipo_mov:
        raise ValueError("Tipo de movimiento no encontrado")
    
    stock_anterior = repuesto.stock_actual
    
    if tipo_mov.tipo == 'entrada':
        stock_nuevo = stock_anterior + movimiento.cantidad
    else:
        stock_nuevo = stock_anterior - movimiento.cantidad
        if stock_nuevo < 0:
            raise ValueError("Stock no puede ser negativo")
    
    repuesto.stock_actual = stock_nuevo
    
    db_movimiento = models.MovimientoInventario(
        stock_anterior=stock_anterior,
        stock_nuevo=stock_nuevo,
        id_empleado=empleado_id,
        **movimiento.dict()
    )
    
    db.add(db_movimiento)
    db.commit()
    db.refresh(db_movimiento)
    
    return db_movimiento