// Enums y constantes del sistema
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// Estados de Cita
export const APPOINTMENT_STATUS = {
  programada: { label: 'Programada', color: 'bg-yellow-100 text-yellow-800' },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  completada: { label: 'Completada', color: 'bg-gray-100 text-gray-800' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
};

// Estados de Pago
export const PAYMENT_STATUS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  pagada: { label: 'Pagada', color: 'bg-green-100 text-green-800' },
  parcial: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
  anulada: { label: 'Anulada', color: 'bg-red-100 text-red-800' }
};

// Tipos de Movimiento de Inventario
export const MOVEMENT_TYPES = {
  entrada: { label: 'Entrada', color: 'bg-green-100 text-green-800' },
  salida: { label: 'Salida', color: 'bg-red-100 text-red-800' }
};

// Tipos de Items
export const ITEM_TYPES = {
  servicio: 'servicio',
  repuesto: 'repuesto'
};

// Roles del Sistema - CORREGIDOS según tu backend
export const USER_ROLES = {
  admin: 'Administrador',
  jefe: 'Jefe de Taller',
  mecanico: 'Mecánico',
  recepcion: 'Recepcionista'
};

// Configuración de la aplicación
export const APP_CONFIG = {
  name: 'Taller Mecánico',
  version: '1.0.0',
  defaultPageSize: 10,
  maxPageSize: 100,
  dateFormat: 'es-ES',
  currency: 'GTQ'
};

// Navegación principal - CORREGIDA con roles actualizados
export const NAVIGATION = [
  { path: '/', name: 'Dashboard', icon: '📊', roles: ['Administrador', 'Jefe de Taller', 'Mecánico', 'Recepcionista'] },
  { path: '/clients', name: 'Clientes', icon: '👥', roles: ['Administrador', 'Jefe de Taller', 'Recepcionista'] },
  { path: '/services', name: 'Servicios', icon: '🔧', roles: ['Administrador', 'Jefe de Taller', 'Mecánico'] },
  { path: '/inventory', name: 'Inventario', icon: '📦', roles: ['Administrador', 'Jefe de Taller', 'Mecánico'] },
  { path: '/appointments', name: 'Citas', icon: '📅', roles: ['Administrador', 'Jefe de Taller', 'Recepcionista'] },
  { path: '/tickets', name: 'Tickets', icon: '🎫', roles: ['Administrador', 'Jefe de Taller', 'Mecánico', 'Recepcionista'] },
  { path: '/invoices', name: 'Facturas', icon: '🧾', roles: ['Administrador', 'Jefe de Taller', 'Recepcionista'] },
  { path: '/admin', name: 'Admin', icon: '⚙️', roles: ['Administrador'] }
];