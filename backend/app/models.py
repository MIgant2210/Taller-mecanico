from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, Boolean, Date, Enum, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# =============================================
# ENUMS
# =============================================

class EstadoCita(str, enum.Enum):
    programada = "programada"
    confirmada = "confirmada"
    en_proceso = "en_proceso"
    completada = "completada"
    cancelada = "cancelada"

class TipoItem(str, enum.Enum):
    servicio = "servicio"
    repuesto = "repuesto"

class EstadoPago(str, enum.Enum):
    pendiente = "pendiente"
    pagada = "pagada"
    parcial = "parcial"
    anulada = "anulada"

class TipoMovimiento(str, enum.Enum):
    entrada = "entrada"
    salida = "salida"

# =============================================
# MÓDULO DE SEGURIDAD Y USUARIOS
# =============================================

class Rol(Base):
    __tablename__ = "roles"
    
    id_rol = Column(Integer, primary_key=True, autoincrement=True)
    nombre_rol = Column(String(50), nullable=False, unique=True)
    descripcion = Column(Text)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    usuarios = relationship("Usuario", back_populates="rol")

class Puesto(Base):
    __tablename__ = "puestos"
    
    id_puesto = Column(Integer, primary_key=True, autoincrement=True)
    nombre_puesto = Column(String(100), nullable=False)
    descripcion = Column(Text)
    salario_base = Column(DECIMAL(10, 2))
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    empleados = relationship("Empleado", back_populates="puesto")

class Empleado(Base):
    __tablename__ = "empleados"
    
    id_empleado = Column(Integer, primary_key=True, autoincrement=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    cedula = Column(String(20), unique=True, nullable=False)
    telefono = Column(String(15))
    email = Column(String(100))
    direccion = Column(Text)
    id_puesto = Column(Integer, ForeignKey("puestos.id_puesto"))
    fecha_ingreso = Column(Date)
    salario = Column(DECIMAL(10, 2))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    puesto = relationship("Puesto", back_populates="empleados")
    usuario = relationship("Usuario", back_populates="empleado", uselist=False)
    citas_asignadas = relationship("Cita", back_populates="empleado_asignado")
    tickets_recepcion = relationship("TicketAtencion", back_populates="empleado_recepcion", foreign_keys="TicketAtencion.id_empleado_recepcion")
    tickets_asignados = relationship("TicketAtencion", back_populates="empleado_asignado", foreign_keys="TicketAtencion.id_empleado_asignado")
    facturas = relationship("Factura", back_populates="empleado_factura")
    movimientos = relationship("MovimientoInventario", back_populates="empleado")

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado"), unique=True)
    id_rol = Column(Integer, ForeignKey("roles.id_rol"))
    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(TIMESTAMP)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    empleado = relationship("Empleado", back_populates="usuario")
    rol = relationship("Rol", back_populates="usuarios")

# =============================================
# MÓDULO DE CLIENTES
# =============================================

class Cliente(Base):
    __tablename__ = "clientes"
    
    id_cliente = Column(Integer, primary_key=True, autoincrement=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    cedula = Column(String(20), unique=True)
    telefono = Column(String(15), nullable=False)
    email = Column(String(100))
    direccion = Column(Text)
    fecha_registro = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    vehiculos = relationship("Vehiculo", back_populates="cliente")
    citas = relationship("Cita", back_populates="cliente")
    tickets = relationship("TicketAtencion", back_populates="cliente")
    facturas = relationship("Factura", back_populates="cliente")

class Vehiculo(Base):
    __tablename__ = "vehiculos"
    
    id_vehiculo = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    marca = Column(String(50), nullable=False)
    modelo = Column(String(50), nullable=False)
    año = Column(Integer)
    placa = Column(String(20), unique=True, nullable=False)
    color = Column(String(30))
    numero_chasis = Column(String(50))
    numero_motor = Column(String(50))
    kilometraje = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="vehiculos")
    citas = relationship("Cita", back_populates="vehiculo")
    tickets = relationship("TicketAtencion", back_populates="vehiculo")

# =============================================
# MÓDULO DE SERVICIOS Y PRODUCTOS
# =============================================

class CategoriaServicio(Base):
    __tablename__ = "categorias_servicios"
    
    id_categoria_servicio = Column(Integer, primary_key=True, autoincrement=True)
    nombre_categoria = Column(String(100), nullable=False)
    descripcion = Column(Text)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    servicios = relationship("Servicio", back_populates="categoria")

class Servicio(Base):
    __tablename__ = "servicios"
    
    id_servicio = Column(Integer, primary_key=True, autoincrement=True)
    nombre_servicio = Column(String(150), nullable=False)
    descripcion = Column(Text)
    id_categoria_servicio = Column(Integer, ForeignKey("categorias_servicios.id_categoria_servicio"))
    precio_base = Column(DECIMAL(10, 2), nullable=False)
    tiempo_estimado_horas = Column(DECIMAL(4, 2))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    categoria = relationship("CategoriaServicio", back_populates="servicios")
    ticket_servicios = relationship("TicketServicio", back_populates="servicio")

class Proveedor(Base):
    __tablename__ = "proveedores"
    
    id_proveedor = Column(Integer, primary_key=True, autoincrement=True)
    nombre_empresa = Column(String(150), nullable=False)
    contacto_principal = Column(String(100))
    telefono = Column(String(15))
    email = Column(String(100))
    direccion = Column(Text)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    repuestos = relationship("Repuesto", back_populates="proveedor")

class CategoriaRepuesto(Base):
    __tablename__ = "categorias_repuestos"
    
    id_categoria_repuesto = Column(Integer, primary_key=True, autoincrement=True)
    nombre_categoria = Column(String(100), nullable=False)
    descripcion = Column(Text)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    repuestos = relationship("Repuesto", back_populates="categoria")

class Repuesto(Base):
    __tablename__ = "repuestos"
    
    id_repuesto = Column(Integer, primary_key=True, autoincrement=True)
    codigo_repuesto = Column(String(50), unique=True, nullable=False)
    nombre_repuesto = Column(String(150), nullable=False)
    descripcion = Column(Text)
    id_categoria_repuesto = Column(Integer, ForeignKey("categorias_repuestos.id_categoria_repuesto"))
    id_proveedor = Column(Integer, ForeignKey("proveedores.id_proveedor"))
    precio_compra = Column(DECIMAL(10, 2))
    precio_venta = Column(DECIMAL(10, 2), nullable=False)
    stock_minimo = Column(Integer, default=5)
    stock_actual = Column(Integer, default=0)
    ubicacion_almacen = Column(String(100))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    categoria = relationship("CategoriaRepuesto", back_populates="repuestos")
    proveedor = relationship("Proveedor", back_populates="repuestos")
    ticket_repuestos = relationship("TicketRepuesto", back_populates="repuesto")
    movimientos = relationship("MovimientoInventario", back_populates="repuesto")

# =============================================
# MÓDULO OPERATIVO
# =============================================

class EstadoTicket(Base):
    __tablename__ = "estados_ticket"
    
    id_estado = Column(Integer, primary_key=True, autoincrement=True)
    nombre_estado = Column(String(50), nullable=False)
    descripcion = Column(Text)
    color_identificacion = Column(String(20))
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    tickets = relationship("TicketAtencion", back_populates="estado")

class Cita(Base):
    __tablename__ = "citas"
    
    id_cita = Column(Integer, primary_key=True, autoincrement=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    id_vehiculo = Column(Integer, ForeignKey("vehiculos.id_vehiculo"), nullable=False)
    fecha_cita = Column(DateTime, nullable=False)
    descripcion_problema = Column(Text)
    observaciones = Column(Text)
    id_empleado_asignado = Column(Integer, ForeignKey("empleados.id_empleado"))
    estado_cita = Column(Enum(EstadoCita), default=EstadoCita.programada)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="citas")
    vehiculo = relationship("Vehiculo", back_populates="citas")
    empleado_asignado = relationship("Empleado", back_populates="citas_asignadas")
    tickets = relationship("TicketAtencion", back_populates="cita")

class TicketAtencion(Base):
    __tablename__ = "tickets_atencion"
    
    id_ticket = Column(Integer, primary_key=True, autoincrement=True)
    numero_ticket = Column(String(20), unique=True, nullable=False)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    id_vehiculo = Column(Integer, ForeignKey("vehiculos.id_vehiculo"), nullable=False)
    id_cita = Column(Integer, ForeignKey("citas.id_cita"))
    fecha_ingreso = Column(DateTime, server_default=func.current_timestamp())
    fecha_estimada_entrega = Column(DateTime)
    fecha_entrega_real = Column(DateTime)
    descripcion_problema = Column(Text, nullable=False)
    diagnostico = Column(Text)
    observaciones_internas = Column(Text)
    observaciones_cliente = Column(Text)
    id_empleado_recepcion = Column(Integer, ForeignKey("empleados.id_empleado"), nullable=False)
    id_empleado_asignado = Column(Integer, ForeignKey("empleados.id_empleado"))
    id_estado = Column(Integer, ForeignKey("estados_ticket.id_estado"), default=1)
    total_servicios = Column(DECIMAL(10, 2), default=0)
    total_repuestos = Column(DECIMAL(10, 2), default=0)
    total_general = Column(DECIMAL(10, 2), default=0)
    fecha_actualizacion = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="tickets")
    vehiculo = relationship("Vehiculo", back_populates="tickets")
    cita = relationship("Cita", back_populates="tickets")
    empleado_recepcion = relationship("Empleado", back_populates="tickets_recepcion", foreign_keys=[id_empleado_recepcion])
    empleado_asignado = relationship("Empleado", back_populates="tickets_asignados", foreign_keys=[id_empleado_asignado])
    estado = relationship("EstadoTicket", back_populates="tickets")
    servicios = relationship("TicketServicio", back_populates="ticket")
    repuestos = relationship("TicketRepuesto", back_populates="ticket")
    facturas = relationship("Factura", back_populates="ticket")

class TicketServicio(Base):
    __tablename__ = "ticket_servicios"
    
    id_ticket_servicio = Column(Integer, primary_key=True, autoincrement=True)
    id_ticket = Column(Integer, ForeignKey("tickets_atencion.id_ticket"), nullable=False)
    id_servicio = Column(Integer, ForeignKey("servicios.id_servicio"), nullable=False)
    cantidad = Column(Integer, default=1)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    observaciones = Column(Text)
    fecha_aplicacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    ticket = relationship("TicketAtencion", back_populates="servicios")
    servicio = relationship("Servicio", back_populates="ticket_servicios")

class TicketRepuesto(Base):
    __tablename__ = "ticket_repuestos"
    
    id_ticket_repuesto = Column(Integer, primary_key=True, autoincrement=True)
    id_ticket = Column(Integer, ForeignKey("tickets_atencion.id_ticket"), nullable=False)
    id_repuesto = Column(Integer, ForeignKey("repuestos.id_repuesto"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    fecha_aplicacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    ticket = relationship("TicketAtencion", back_populates="repuestos")
    repuesto = relationship("Repuesto", back_populates="ticket_repuestos")

# =============================================
# MÓDULO FINANCIERO
# =============================================

class FormaPago(Base):
    __tablename__ = "formas_pago"
    
    id_forma_pago = Column(Integer, primary_key=True, autoincrement=True)
    nombre_forma_pago = Column(String(50), nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    facturas = relationship("Factura", back_populates="forma_pago")

class Factura(Base):
    __tablename__ = "facturas"
    
    id_factura = Column(Integer, primary_key=True, autoincrement=True)
    numero_factura = Column(String(20), unique=True, nullable=False)
    id_ticket = Column(Integer, ForeignKey("tickets_atencion.id_ticket"), nullable=False)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"), nullable=False)
    fecha_factura = Column(DateTime, server_default=func.current_timestamp())
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    impuestos = Column(DECIMAL(10, 2), default=0)
    descuentos = Column(DECIMAL(10, 2), default=0)
    total = Column(DECIMAL(10, 2), nullable=False)
    id_forma_pago = Column(Integer, ForeignKey("formas_pago.id_forma_pago"), nullable=False)
    estado_pago = Column(Enum(EstadoPago), default=EstadoPago.pendiente)
    observaciones = Column(Text)
    id_empleado_factura = Column(Integer, ForeignKey("empleados.id_empleado"), nullable=False)
    fecha_vencimiento = Column(Date)
    
    # Relaciones
    ticket = relationship("TicketAtencion", back_populates="facturas")
    cliente = relationship("Cliente", back_populates="facturas")
    forma_pago = relationship("FormaPago", back_populates="facturas")
    empleado_factura = relationship("Empleado", back_populates="facturas")
    detalles = relationship("DetalleFactura", back_populates="factura")

class DetalleFactura(Base):
    __tablename__ = "detalle_facturas"
    
    id_detalle = Column(Integer, primary_key=True, autoincrement=True)
    id_factura = Column(Integer, ForeignKey("facturas.id_factura"), nullable=False)
    tipo_item = Column(Enum(TipoItem), nullable=False)
    id_item = Column(Integer, nullable=False)
    descripcion = Column(String(200), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    
    # Relaciones
    factura = relationship("Factura", back_populates="detalles")

# =============================================
# MÓDULO DE INVENTARIO
# =============================================

class TipoMovimientoInventario(Base):
    __tablename__ = "tipos_movimiento"
    
    id_tipo_movimiento = Column(Integer, primary_key=True, autoincrement=True)
    nombre_movimiento = Column(String(50), nullable=False)
    tipo = Column(Enum(TipoMovimiento), nullable=False)
    descripcion = Column(Text)
    fecha_creacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    movimientos = relationship("MovimientoInventario", back_populates="tipo_movimiento")

class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    
    id_movimiento = Column(Integer, primary_key=True, autoincrement=True)
    id_repuesto = Column(Integer, ForeignKey("repuestos.id_repuesto"), nullable=False)
    id_tipo_movimiento = Column(Integer, ForeignKey("tipos_movimiento.id_tipo_movimiento"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2))
    stock_anterior = Column(Integer, nullable=False)
    stock_nuevo = Column(Integer, nullable=False)
    referencia_documento = Column(String(100))
    observaciones = Column(Text)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado"), nullable=False)
    fecha_movimiento = Column(TIMESTAMP, server_default=func.current_timestamp())
    
    # Relaciones
    repuesto = relationship("Repuesto", back_populates="movimientos")
    tipo_movimiento = relationship("TipoMovimientoInventario", back_populates="movimientos")
    empleado = relationship("Empleado", back_populates="movimientos")