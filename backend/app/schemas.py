from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import enum

# =============================================
# ENUMS
# =============================================

class EstadoCitaEnum(str, enum.Enum):
    programada = "programada"
    confirmada = "confirmada"
    en_proceso = "en_proceso"
    completada = "completada"
    cancelada = "cancelada"

class TipoItemEnum(str, enum.Enum):
    servicio = "servicio"
    repuesto = "repuesto"

class EstadoPagoEnum(str, enum.Enum):
    pendiente = "pendiente"
    pagada = "pagada"
    parcial = "parcial"
    anulada = "anulada"

class TipoMovimientoEnum(str, enum.Enum):
    entrada = "entrada"
    salida = "salida"

# =============================================
# SCHEMAS BASE
# =============================================

class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# =============================================
# AUTENTICACIÓN Y USUARIOS
# =============================================

class RolBase(BaseModel):
    nombre_rol: str
    descripcion: Optional[str] = None

class RolCreate(RolBase):
    pass

class RolResponse(RolBase):
    id_rol: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class PuestoBase(BaseModel):
    nombre_puesto: str
    descripcion: Optional[str] = None
    salario_base: Optional[Decimal] = None

class PuestoCreate(PuestoBase):
    pass

class PuestoResponse(PuestoBase):
    id_puesto: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class EmpleadoBase(BaseModel):
    nombres: str
    apellidos: str
    dpi: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    salario: Optional[Decimal] = None
    activo: bool = True

class EmpleadoCreate(EmpleadoBase):
    id_puesto: Optional[int] = None

class EmpleadoResponse(EmpleadoBase):
    id_empleado: int
    id_puesto: Optional[int] = None
    fecha_creacion: datetime
    puesto: Optional[PuestoResponse] = None
    
    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    username: str
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str
    id_empleado: int
    id_rol: int

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    id_empleado: int
    id_rol: int
    ultimo_acceso: Optional[datetime] = None
    fecha_creacion: datetime
    empleado: Optional[EmpleadoResponse] = None
    rol: Optional[RolResponse] = None
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_info: UsuarioResponse

# =============================================
# CLIENTES Y VEHÍCULOS
# =============================================

class ClienteBase(BaseModel):
    nombres: str
    apellidos: str
    dpi: Optional[str] = None
    telefono: str
    email: Optional[str] = None
    direccion: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    dpi: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None

class ClienteResponse(ClienteBase):
    id_cliente: int
    fecha_registro: datetime
    
    class Config:
        from_attributes = True

class VehiculoBase(BaseModel):
    marca: str
    modelo: str
    año: Optional[int] = None
    placa: str
    color: Optional[str] = None
    numero_chasis: Optional[str] = None
    numero_motor: Optional[str] = None
    kilometraje: int = 0
    activo: bool = True

class VehiculoCreate(VehiculoBase):
    id_cliente: int

class VehiculoResponse(VehiculoBase):
    id_vehiculo: int
    id_cliente: int
    fecha_registro: datetime
    cliente: Optional[ClienteResponse] = None
    
    class Config:
        from_attributes = True

# =============================================
# SERVICIOS
# =============================================

class CategoriaServicioBase(BaseModel):
    nombre_categoria: str
    descripcion: Optional[str] = None

class CategoriaServicioCreate(CategoriaServicioBase):
    pass

class CategoriaServicioResponse(CategoriaServicioBase):
    id_categoria_servicio: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class ServicioBase(BaseModel):
    nombre_servicio: str
    descripcion: Optional[str] = None
    precio_base: Decimal
    tiempo_estimado_horas: Optional[Decimal] = None
    activo: bool = True

class ServicioCreate(ServicioBase):
    id_categoria_servicio: Optional[int] = None

class ServicioResponse(ServicioBase):
    id_servicio: int
    id_categoria_servicio: Optional[int] = None
    fecha_creacion: datetime
    categoria: Optional[CategoriaServicioResponse] = None
    
    class Config:
        from_attributes = True

# =============================================
# INVENTARIO Y PROVEEDORES
# =============================================

class ProveedorBase(BaseModel):
    nombre_empresa: str
    contacto_principal: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool = True

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorResponse(ProveedorBase):
    id_proveedor: int
    fecha_registro: datetime
    
    class Config:
        from_attributes = True

class CategoriaRepuestoBase(BaseModel):
    nombre_categoria: str
    descripcion: Optional[str] = None

class CategoriaRepuestoCreate(CategoriaRepuestoBase):
    pass

class CategoriaRepuestoResponse(CategoriaRepuestoBase):
    id_categoria_repuesto: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class RepuestoBase(BaseModel):
    codigo_repuesto: str
    nombre_repuesto: str
    descripcion: Optional[str] = None
    precio_compra: Optional[Decimal] = None
    precio_venta: Decimal
    stock_minimo: int = 5
    stock_actual: int = 0
    ubicacion_almacen: Optional[str] = None
    activo: bool = True

class RepuestoCreate(RepuestoBase):
    id_categoria_repuesto: Optional[int] = None
    id_proveedor: Optional[int] = None

class RepuestoUpdate(BaseModel):
    nombre_repuesto: Optional[str] = None
    descripcion: Optional[str] = None
    precio_compra: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    stock_minimo: Optional[int] = None
    ubicacion_almacen: Optional[str] = None
    activo: Optional[bool] = None
    id_categoria_repuesto: Optional[int] = None
    id_proveedor: Optional[int] = None

class RepuestoResponse(RepuestoBase):
    id_repuesto: int
    id_categoria_repuesto: Optional[int] = None
    id_proveedor: Optional[int] = None
    fecha_creacion: datetime
    categoria: Optional[CategoriaRepuestoResponse] = None
    proveedor: Optional[ProveedorResponse] = None
    
    class Config:
        from_attributes = True

class StockUpdate(BaseModel):
    cantidad: int
    tipo_movimiento: str
    observaciones: Optional[str] = None

# =============================================
# CITAS Y TICKETS
# =============================================

class CitaBase(BaseModel):
    fecha_cita: datetime
    descripcion_problema: Optional[str] = None
    observaciones: Optional[str] = None

class CitaCreate(CitaBase):
    id_cliente: int
    id_vehiculo: int
    id_empleado_asignado: Optional[int] = None

class CitaUpdate(BaseModel):
    fecha_cita: Optional[datetime] = None
    descripcion_problema: Optional[str] = None
    observaciones: Optional[str] = None
    id_empleado_asignado: Optional[int] = None
    estado_cita: Optional[EstadoCitaEnum] = None

class CitaResponse(CitaBase):
    id_cita: int
    id_cliente: int
    id_vehiculo: int
    id_empleado_asignado: Optional[int] = None
    estado_cita: EstadoCitaEnum
    fecha_creacion: datetime
    cliente: Optional[ClienteResponse] = None
    vehiculo: Optional[VehiculoResponse] = None
    empleado_asignado: Optional[EmpleadoResponse] = None
    
    class Config:
        from_attributes = True

class EstadoTicketBase(BaseModel):
    nombre_estado: str
    descripcion: Optional[str] = None
    color_identificacion: Optional[str] = None

class EstadoTicketResponse(EstadoTicketBase):
    id_estado: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    descripcion_problema: str
    fecha_estimada_entrega: Optional[datetime] = None
    diagnostico: Optional[str] = None
    observaciones_internas: Optional[str] = None
    observaciones_cliente: Optional[str] = None

class TicketCreate(TicketBase):
    id_cliente: int
    id_vehiculo: int
    id_cita: Optional[int] = None
    id_empleado_asignado: Optional[int] = None

class TicketUpdate(BaseModel):
    descripcion_problema: Optional[str] = None
    fecha_estimada_entrega: Optional[datetime] = None
    fecha_entrega_real: Optional[datetime] = None
    diagnostico: Optional[str] = None
    observaciones_internas: Optional[str] = None
    observaciones_cliente: Optional[str] = None
    id_empleado_asignado: Optional[int] = None
    id_estado: Optional[int] = None

class TicketServicioBase(BaseModel):
    cantidad: int = 1
    observaciones: Optional[str] = None

class TicketServicioCreate(TicketServicioBase):
    id_servicio: int
    precio_unitario: Decimal

class TicketServicioResponse(TicketServicioBase):
    id_ticket_servicio: int
    id_ticket: int
    id_servicio: int
    precio_unitario: Decimal
    subtotal: Decimal
    fecha_aplicacion: datetime
    servicio: Optional[ServicioResponse] = None
    
    class Config:
        from_attributes = True

class TicketRepuestoBase(BaseModel):
    cantidad: int

class TicketRepuestoCreate(TicketRepuestoBase):
    id_repuesto: int
    precio_unitario: Decimal

class TicketRepuestoResponse(TicketRepuestoBase):
    id_ticket_repuesto: int
    id_ticket: int
    id_repuesto: int
    precio_unitario: Decimal
    subtotal: Decimal
    fecha_aplicacion: datetime
    repuesto: Optional[RepuestoResponse] = None
    
    class Config:
        from_attributes = True

class TicketResponse(TicketBase):
    id_ticket: int
    numero_ticket: str
    id_cliente: int
    id_vehiculo: int
    id_cita: Optional[int] = None
    fecha_ingreso: datetime
    fecha_entrega_real: Optional[datetime] = None
    id_empleado_recepcion: int
    id_empleado_asignado: Optional[int] = None
    id_estado: int
    total_servicios: Decimal
    total_repuestos: Decimal
    total_general: Decimal
    fecha_actualizacion: datetime
    cliente: Optional[ClienteResponse] = None
    vehiculo: Optional[VehiculoResponse] = None
    cita: Optional[CitaResponse] = None
    empleado_recepcion: Optional[EmpleadoResponse] = None
    empleado_asignado: Optional[EmpleadoResponse] = None
    estado: Optional[EstadoTicketResponse] = None
    servicios: List[TicketServicioResponse] = []
    repuestos: List[TicketRepuestoResponse] = []
    
    class Config:
        from_attributes = True

# =============================================
# FACTURACIÓN
# =============================================

class FormaPagoBase(BaseModel):
    nombre_forma_pago: str
    descripcion: Optional[str] = None
    activo: bool = True

class FormaPagoCreate(FormaPagoBase):
    pass

class FormaPagoResponse(FormaPagoBase):
    id_forma_pago: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class DetalleFacturaBase(BaseModel):
    tipo_item: TipoItemEnum
    id_item: int
    descripcion: str
    cantidad: int
    precio_unitario: Decimal

class DetalleFacturaCreate(DetalleFacturaBase):
    pass

class DetalleFacturaResponse(DetalleFacturaBase):
    id_detalle: int
    id_factura: int
    subtotal: Decimal
    
    class Config:
        from_attributes = True

class FacturaBase(BaseModel):
    subtotal: Decimal
    impuestos: Decimal = Decimal('0')
    descuentos: Decimal = Decimal('0')
    total: Decimal
    observaciones: Optional[str] = None
    fecha_vencimiento: Optional[date] = None

class FacturaCreate(FacturaBase):
    id_ticket: int
    id_forma_pago: int
    detalles: List[DetalleFacturaCreate]

class FacturaUpdate(BaseModel):
    estado_pago: Optional[EstadoPagoEnum] = None
    observaciones: Optional[str] = None

class FacturaResponse(FacturaBase):
    id_factura: int
    numero_factura: str
    id_ticket: int
    id_cliente: int
    fecha_factura: datetime
    id_forma_pago: int
    estado_pago: EstadoPagoEnum
    id_empleado_factura: int
    ticket: Optional[TicketResponse] = None
    cliente: Optional[ClienteResponse] = None
    forma_pago: Optional[FormaPagoResponse] = None
    empleado_factura: Optional[EmpleadoResponse] = None
    detalles: List[DetalleFacturaResponse] = []
    
    class Config:
        from_attributes = True

# =============================================
# INVENTARIO Y MOVIMIENTOS
# =============================================

class TipoMovimientoInventarioBase(BaseModel):
    nombre_movimiento: str
    tipo: TipoMovimientoEnum
    descripcion: Optional[str] = None

class TipoMovimientoInventarioResponse(TipoMovimientoInventarioBase):
    id_tipo_movimiento: int
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class MovimientoInventarioBase(BaseModel):
    cantidad: int
    precio_unitario: Optional[Decimal] = None
    referencia_documento: Optional[str] = None
    observaciones: Optional[str] = None

class MovimientoInventarioCreate(MovimientoInventarioBase):
    id_repuesto: int
    id_tipo_movimiento: int

class MovimientoInventarioResponse(MovimientoInventarioBase):
    id_movimiento: int
    id_repuesto: int
    id_tipo_movimiento: int
    stock_anterior: int
    stock_nuevo: int
    id_empleado: int
    fecha_movimiento: datetime
    repuesto: Optional[RepuestoResponse] = None
    tipo_movimiento: Optional[TipoMovimientoInventarioResponse] = None
    empleado: Optional[EmpleadoResponse] = None
    
    class Config:
        from_attributes = True

# =============================================
# REPORTES Y ESTADÍSTICAS
# =============================================

class ReporteVentas(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    total_facturas: int
    total_ventas: Decimal
    total_servicios: Decimal
    total_repuestos: Decimal
    facturas_pendientes: int
    facturas_pagadas: int

class EstadisticasGenerales(BaseModel):
    total_clientes: int
    total_vehiculos: int
    tickets_activos: int
    tickets_completados: int
    citas_programadas: int
    stock_bajo_minimo: int

# =============================================
# COTIZACIONES
# =============================================
class DetalleCotizacionBase(BaseModel):
    tipo_item: TipoItemEnum
    id_item: int
    descripcion: str
    cantidad: int
    precio_unitario: Decimal

class DetalleCotizacionCreate(DetalleCotizacionBase):
    pass

class DetalleCotizacionResponse(DetalleCotizacionBase):
    id_detalle: int
    id_cotizacion: int
    subtotal: Decimal

    class Config:
        from_attributes = True

class CotizacionBase(BaseModel):
    impuestos: Decimal = Decimal('0')
    descuentos: Decimal = Decimal('0')
    observaciones: Optional[str] = None

class CotizacionCreate(CotizacionBase):
    id_cliente: int
    detalles: List[DetalleCotizacionCreate]

class CotizacionUpdate(CotizacionBase):
    id_cliente: Optional[int] = None
    estado: Optional[str] = None
    detalles: Optional[List[DetalleCotizacionCreate]] = None

class CotizacionResponse(CotizacionBase):
    id_cotizacion: int
    fecha_cotizacion: datetime
    subtotal: Decimal
    total: Decimal
    cliente: Optional[ClienteResponse]
    detalles: List[DetalleCotizacionResponse]

    class Config:
        from_attributes = True
