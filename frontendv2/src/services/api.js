import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para incluir el token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('❌ Error en response:', error.response?.data || error.message);
    
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Servicios de Autenticación
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', null, { params: data }),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  getEmployees: () => api.get('/auth/empleados'),
  createEmployee: (data) => api.post('/auth/empleados', data),
  updateEmployee: (id, data) => api.put(`/auth/empleados/${id}`, data),
  deleteEmployee: (id) => api.delete(`/auth/empleados/${id}`),
  getRoles: () => api.get('/auth/roles'),
  getPositions: () => api.get('/auth/puestos')
};

// Servicios de Clientes
export const clientsService = {
  getClients: (params = {}) => api.get('/clientes', { params }),
  getClient: (id) => api.get(`/clientes/${id}`),
  createClient: (data) => api.post('/clientes', data),
  updateClient: (id, data) => api.put(`/clientes/${id}`, data),
  deleteClient: (id) => api.delete(`/clientes/${id}`),
  getClientVehicles: (id) => api.get(`/clientes/${id}/vehiculos`)
};

// Servicios de Vehículos
export const vehiclesService = {
  getVehicles: (params = {}) => api.get('/vehiculos', { params }),
  getVehicle: (id) => api.get(`/vehiculos/${id}`),
  createVehicle: (data) => api.post('/vehiculos', data),
  updateVehicle: (id, data) => api.put(`/vehiculos/${id}`, data),
  deleteVehicle: (id) => api.delete(`/vehiculos/${id}`)
};

// Servicios de Servicios
export const servicesService = {
  getServices: (params = {}) => api.get('/servicios', { params }),
  getService: (id) => api.get(`/servicios/${id}`),
  createService: (data) => api.post('/servicios', data),
  updateService: (id, data) => api.put(`/servicios/${id}`, data),
  deleteService: (id) => api.delete(`/servicios/${id}`),
  searchServices: (params) => api.get('/servicios/buscar', { params }),
  getCategories: () => api.get('/categorias-servicios'),
  createCategory: (data) => api.post('/categorias-servicios', data)
};

// Servicios de Inventario
export const inventoryService = {
  // Repuestos
  getParts: (params = {}) => api.get('/repuestos', { params }),
  getPart: (id) => api.get(`/repuestos/${id}`),
  getPartByCode: (code) => api.get(`/repuestos/codigo/${code}`),
  createPart: (data) => api.post('/repuestos', data),
  updatePart: (id, data) => api.put(`/repuestos/${id}`, data),
  deletePart: (id) => api.delete(`/repuestos/${id}`),
  updateStock: (id, data) => api.put(`/repuestos/${id}/stock`, data),
  getLowStock: () => api.get('/repuestos/stock-bajo'),
  
  // Proveedores
  getSuppliers: (params = {}) => api.get('/proveedores', { params }),
  createSupplier: (data) => api.post('/proveedores', data),
  updateSupplier: (id, data) => api.put(`/proveedores/${id}`, data),
  deleteSupplier: (id) => api.delete(`/proveedores/${id}`),
  
  // Categorías
  getPartCategories: () => api.get('/categorias-repuestos'),
  createPartCategory: (data) => api.post('/categorias-repuestos', data),
  
  // Movimientos
  getMovements: (params = {}) => api.get('/movimientos-inventario', { params }),
  createMovement: (data) => api.post('/movimientos-inventario', data),
  getMovementTypes: () => api.get('/tipos-movimiento'),
  
  // Reportes
  getInventorySummary: () => api.get('/inventario/resumen')
};

// Servicios de Operaciones
export const operationsService = {
  // Citas
  getAppointments: (params = {}) => api.get('/citas', { params }),
  getAppointment: (id) => api.get(`/citas/${id}`),
  createAppointment: (data) => api.post('/citas', data),
  updateAppointment: (id, data) => api.put(`/citas/${id}`, data),
  deleteAppointment: (id) => api.delete(`/citas/${id}`),
  getAppointmentsByDate: (date) => api.get(`/citas/fecha/${date}`),
  
  // Tickets
  getTickets: (params = {}) => api.get('/tickets', { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  createTicket: (data) => api.post('/tickets', data),
  updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
  updateTicketStatus: (id, data) => api.put(`/tickets/${id}/estado`, data),
  
  // Servicios en Tickets
  addServiceToTicket: (ticketId, data) => api.post(`/tickets/${ticketId}/servicios`, data),
  getTicketServices: (ticketId) => api.get(`/tickets/${ticketId}/servicios`),
  
  // Repuestos en Tickets
  addPartToTicket: (ticketId, data) => api.post(`/tickets/${ticketId}/repuestos`, data),
  getTicketParts: (ticketId) => api.get(`/tickets/${ticketId}/repuestos`),
  
  // Estados
  getTicketStatuses: () => api.get('/estados-ticket'),
  
  // Reportes
  getTicketStats: (params = {}) => api.get('/tickets/estadisticas', { params })
};

// Servicios de Facturación
export const billingService = {
  // Facturas
  getInvoices: (params = {}) => api.get('/facturas', { params }),
  getInvoice: (id) => api.get(`/facturas/${id}`),
  getInvoiceByNumber: (number) => api.get(`/facturas/numero/${number}`),
  createInvoice: (data) => api.post('/facturas', data),
  updateInvoice: (id, data) => api.put(`/facturas/${id}`, data),
  deleteInvoice: (id) => api.delete(`/facturas/${id}`),
  markInvoicePaid: (id, data) => api.put(`/facturas/${id}/marcar-pagada`, data),
  generateInvoiceFromTicket: (ticketId, data) => api.post(`/facturas/generar-desde-ticket/${ticketId}`, data),
  
  // Formas de Pago
  getPaymentMethods: () => api.get('/formas-pago'),
  
  // Reportes
  getSalesReport: (params) => api.get('/reportes/ventas', { params }),
  getGeneralStats: (params = {}) => api.get('/reportes/estadisticas-generales', { params }),
  getMonthlySales: (year) => api.get('/reportes/ventas-mensuales', { params: { año: year } }),
  getTopServices: (params) => api.get('/reportes/top-servicios', { params }),
  getTopParts: (params) => api.get('/reportes/top-repuestos', { params }),
  
  // Búsquedas
  searchInvoices: (params) => api.get('/facturas/buscar', { params }),
  getPendingInvoices: (params) => api.get('/facturas/pendientes', { params })
};

// Servicios de Cotizaciones (COMPLETO)
export const cotizacionesService = {
  getCotizaciones: (params = {}) => api.get('/cotizaciones', { params }),
  getCotizacion: (id) => api.get(`/cotizaciones/${id}`),
  createCotizacion: (data) => api.post('/cotizaciones', data),
  updateCotizacion: (id, data) => api.put(`/cotizaciones/${id}`, data),
  deleteCotizacion: (id) => api.delete(`/cotizaciones/${id}`)
};

// Servicio del Dashboard
export const dashboardService = {
  getDashboardData: () => api.get('/dashboard')
};

// Exportar axios instance por si se necesita directamente
export { api };

// Exportar todos los servicios en un objeto para importación conveniente
export default {
  auth: authService,
  clients: clientsService,
  vehicles: vehiclesService,
  services: servicesService,
  inventory: inventoryService,
  operations: operationsService,
  billing: billingService,
  cotizaciones: cotizacionesService,
  dashboard: dashboardService
};