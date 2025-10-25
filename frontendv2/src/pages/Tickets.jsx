import React, { useState, useEffect } from 'react';
import { Ticket, PlusCircle, Search, Edit2, Trash2, X, Eye, User, Car, Wrench, DollarSign, Calendar, FileText, Package, Plus } from 'lucide-react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api, clientsService } from '../services/api';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showPartForm, setShowPartForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    loadRelatedData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [clientsRes, vehiclesRes, employeesRes, servicesRes, partsRes, statusesRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/vehiculos'),
        api.get('/auth/empleados'),
        api.get('/servicios'),
        api.get('/repuestos'),
        api.get('/estados-ticket')
      ]);
      setClients(clientsRes.data);
      setVehicles(vehiclesRes.data);
      setEmployees(employeesRes.data);
      setServices(servicesRes.data);
      setParts(partsRes.data);
      setStatuses(statusesRes.data);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const getStatusColor = (estado) => {
    const colors = {
      'Recibido': 'bg-blue-100 text-blue-700 border-blue-200',
      'En Proceso': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Esperando Repuestos': 'bg-orange-100 text-orange-700 border-orange-200',
      'Completado': 'bg-green-100 text-green-700 border-green-200',
      'Entregado': 'bg-gray-100 text-gray-700 border-gray-200',
      'Cancelado': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[estado] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const ticketColumns = [
    { 
      key: 'numero_ticket', 
      title: 'Ticket',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Ticket className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-mono font-bold text-blue-600">#{value}</span>
        </div>
      )
    },
    { 
      key: 'cliente', 
      title: 'Cliente',
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
            {value?.nombres?.charAt(0)}{value?.apellidos?.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900">
            {value ? `${value.nombres} ${value.apellidos}` : 'N/A'}
          </span>
        </div>
      )
    },
    { 
      key: 'vehiculo', 
      title: 'Vehículo',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-semibold text-gray-900">
              {value ? `${value.marca} ${value.modelo}` : 'N/A'}
            </p>
            {value?.placa && (
              <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-xs inline-block mt-1 border border-blue-300">
                {value.placa}
              </span>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'estado', 
      title: 'Estado',
      render: (value) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(value?.nombre_estado)}`}>
          {value ? value.nombre_estado : 'N/A'}
        </span>
      )
    },
    { 
      key: 'total_general', 
      title: 'Total',
      render: (value) => (
        <span className="font-semibold text-green-600 text-lg">
          Q {parseFloat(value || 0).toFixed(2)}
        </span>
      )
    },
    { 
      key: 'fecha_ingreso', 
      title: 'Fecha Ingreso',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {new Date(value).toLocaleDateString('es-ES', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        </div>
      )
    }
  ];

  const ticketFields = [
    { name: 'id_cliente', label: 'Cliente', type: 'select', required: true,
      options: clients.map(c => ({ 
        value: c.id_cliente, 
        label: `${c.nombres} ${c.apellidos}${c.dpi ? ` - ${c.dpi}` : ''}${c.telefono ? ` - ${c.telefono}` : ''}`
      }))
    },
    { name: 'id_vehiculo', label: 'Vehículo', type: 'select', required: true,
      options: vehicles.map(v => ({ 
        value: v.id_vehiculo, 
        label: `${v.marca} ${v.modelo} - ${v.placa}`, 
        clienteId: v.id_cliente 
      }))
    },
    { name: 'descripcion_problema', label: 'Descripción del Problema', type: 'textarea', required: true, fullWidth: true },
    { name: 'id_empleado_asignado', label: 'Mecánico Asignado', type: 'select',
      options: [
        { value: '', label: 'Sin asignar' },
        ...employees.map(e => ({ value: e.id_empleado, label: `${e.nombres} ${e.apellidos}` }))
      ]
    },
    { name: 'fecha_estimada_entrega', label: 'Fecha Estimada Entrega', type: 'datetime' },
    { name: 'observaciones_cliente', label: 'Observaciones del Cliente', type: 'textarea', fullWidth: true }
  ];

  const serviceFields = [
    { name: 'id_servicio', label: 'Servicio', type: 'select', required: true,
      options: services.filter(s => s.activo).map(s => ({ 
        value: s.id_servicio, 
        label: `${s.nombre_servicio} - Q${parseFloat(s.precio_base).toFixed(2)}` 
      }))
    },
    { name: 'cantidad', label: 'Cantidad', type: 'number', min: 1, required: true, defaultValue: 1 },
    { name: 'precio_unitario', label: 'Precio Unitario (Q)', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', fullWidth: true }
  ];

  const partFields = [
    { name: 'id_repuesto', label: 'Repuesto', type: 'select', required: true,
      options: parts.filter(p => p.activo && p.stock_actual > 0).map(p => ({ 
        value: p.id_repuesto, 
        label: `${p.nombre_repuesto} - Stock: ${p.stock_actual} - Q${parseFloat(p.precio_venta).toFixed(2)}` 
      }))
    },
    { name: 'cantidad', label: 'Cantidad', type: 'number', min: 1, required: true },
    { name: 'precio_unitario', label: 'Precio Unitario (Q)', type: 'number', step: '0.01', min: 0, required: true }
  ];

  // Cargar vehículos del cliente cuando se selecciona uno
  const handleClientChange = async (clientId) => {
    try {
      if (clientId) {
        const response = await clientsService.getClientVehicles(clientId);
        const clientVehicles = response.data || [];
        setVehicles(clientVehicles); // Update vehicles list with client's vehicles
      } else {
        // If no client selected, load all vehicles
        const response = await api.get('/vehiculos');
        setVehicles(response.data || []);
      }
    } catch (error) {
      console.error('Error loading client vehicles:', error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      console.log('📝 Datos del formulario:', formData);
      
      // Procesar datos correctamente
      const processedData = {
        id_cliente: parseInt(formData.id_cliente),
        id_vehiculo: parseInt(formData.id_vehiculo),
        descripcion_problema: formData.descripcion_problema,
        id_empleado_asignado: formData.id_empleado_asignado ? parseInt(formData.id_empleado_asignado) : null,
        fecha_estimada_entrega: formData.fecha_estimada_entrega || null,
        observaciones_cliente: formData.observaciones_cliente || null
      };

      console.log('📤 Datos procesados:', processedData);

      if (editingItem) {
        await api.put(`/tickets/${editingItem.id_ticket}`, processedData);
        alert('✅ Ticket actualizado correctamente');
      } else {
        await api.post('/tickets', processedData);
        alert('✅ Ticket creado correctamente');
      }
      
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('❌ Error saving ticket:', error);
      console.error('Error response:', error.response?.data);
      alert('❌ Error al guardar el ticket: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddService = async (formData) => {
    try {
      const processedData = {
        id_servicio: parseInt(formData.id_servicio),
        cantidad: parseInt(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario),
        observaciones: formData.observaciones || null
      };

      console.log('📤 Agregando servicio:', processedData);
      await api.post(`/tickets/${selectedTicket.id_ticket}/servicios`, processedData);
      
      setShowServiceForm(false);
      alert('✅ Servicio agregado correctamente');
      
      // Recargar el ticket seleccionado
      const response = await api.get(`/tickets/${selectedTicket.id_ticket}`);
      setSelectedTicket(response.data);
      loadData();
    } catch (error) {
      console.error('❌ Error adding service:', error);
      alert('❌ Error al agregar servicio: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddPart = async (formData) => {
    try {
      const processedData = {
        id_repuesto: parseInt(formData.id_repuesto),
        cantidad: parseInt(formData.cantidad),
        precio_unitario: parseFloat(formData.precio_unitario)
      };

      console.log('📤 Agregando repuesto:', processedData);
      await api.post(`/tickets/${selectedTicket.id_ticket}/repuestos`, processedData);
      
      setShowPartForm(false);
      alert('✅ Repuesto agregado correctamente');
      
      // Recargar el ticket seleccionado
      const response = await api.get(`/tickets/${selectedTicket.id_ticket}`);
      setSelectedTicket(response.data);
      loadData();
    } catch (error) {
      console.error('❌ Error adding part:', error);
      alert('❌ Error al agregar repuesto: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleStatusChange = async (ticketId, newStatusId) => {
    try {
      await api.put(`/tickets/${ticketId}/estado?nuevo_estado_id=${newStatusId}`);
      alert('✅ Estado actualizado correctamente');
      
      // Recargar el ticket seleccionado
      const response = await api.get(`/tickets/${ticketId}`);
      setSelectedTicket(response.data);
      loadData();
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('❌ Error al actualizar estado: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleView = async (ticket) => {
    try {
      // Cargar detalles completos del ticket
      const response = await api.get(`/tickets/${ticket.id_ticket}`);
      setSelectedTicket(response.data);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      alert('Error al cargar detalles del ticket');
    }
  };

  const handleCloseDetail = () => {
    setSelectedTicket(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Estás seguro de eliminar este ticket?')) return;

    try {
      await api.delete(`/tickets/${item.id_ticket}`);
      alert('✅ Ticket eliminado correctamente');
      loadData();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('❌ Error al eliminar el ticket: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Filtrado de datos
  const filteredData = () => {
    if (!searchTerm) return tickets;
    
    const searchLower = searchTerm.toLowerCase();
    return tickets.filter(ticket =>
      ticket.numero_ticket?.toString().includes(searchLower) ||
      ticket.cliente?.nombres?.toLowerCase().includes(searchLower) ||
      ticket.cliente?.apellidos?.toLowerCase().includes(searchLower) ||
      ticket.vehiculo?.placa?.toLowerCase().includes(searchLower) ||
      ticket.vehiculo?.marca?.toLowerCase().includes(searchLower) ||
      ticket.estado?.nombre_estado?.toLowerCase().includes(searchLower)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Ticket className="w-7 h-7 text-blue-600" />
                </div>
                Gestión de Tickets
              </h1>
              <p className="text-gray-600">Administra las órdenes de trabajo del taller</p>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <PlusCircle className="w-5 h-5" />
              Nuevo Ticket
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, vehículo o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Form Modal - Crear/Editar Ticket */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all animate-scale-in">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Editar Ticket
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Nuevo Ticket
                    </>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                <Form
                  fields={ticketFields}
                  initialData={editingItem || {}}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  submitText={editingItem ? 'Actualizar' : 'Crear'}
                  onFieldChange={(field, value) => {
                    if (field === 'id_cliente') {
                      handleClientChange(value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Ticket className="w-6 h-6" />
                  Ticket #{selectedTicket.numero_ticket}
                </h2>
                <button
                  onClick={handleCloseDetail}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información del Cliente
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Cliente:</strong> {selectedTicket.cliente?.nombres} {selectedTicket.cliente?.apellidos}</p>
                      <p><strong>Vehículo:</strong> {selectedTicket.vehiculo?.marca} {selectedTicket.vehiculo?.modelo}</p>
                      <p><strong>Placa:</strong> <span className="bg-blue-600 text-white px-2 py-1 rounded font-mono">{selectedTicket.vehiculo?.placa}</span></p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Información del Ticket
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Estado:</strong> <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedTicket.estado?.nombre_estado)}`}>{selectedTicket.estado?.nombre_estado}</span></p>
                      <p><strong>Fecha Ingreso:</strong> {new Date(selectedTicket.fecha_ingreso).toLocaleString('es-ES')}</p>
                      <p><strong>Total:</strong> <span className="text-green-600 font-bold text-lg">Q {parseFloat(selectedTicket.total_general || 0).toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Descripción del Problema
                  </h3>
                  <p className="text-gray-700">{selectedTicket.descripcion_problema}</p>
                </div>

                {/* Services Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      Servicios Aplicados
                    </h3>
                    <button
                      onClick={() => setShowServiceForm(true)}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Servicio
                    </button>
                  </div>
                  {selectedTicket.servicios?.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {selectedTicket.servicios.map((service, index) => (
                        <div key={service.id_ticket_servicio} className={`p-4 ${index !== selectedTicket.servicios.length - 1 ? 'border-b border-gray-200' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{service.servicio?.nombre_servicio}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Cantidad: <span className="font-medium">{service.cantidad}</span> | 
                                Precio: <span className="font-medium">Q{parseFloat(service.precio_unitario).toFixed(2)}</span>
                              </p>
                              {service.observaciones && (
                                <p className="text-sm text-gray-500 mt-2 italic">Obs: {service.observaciones}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">Q{parseFloat(service.subtotal).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                      <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No hay servicios aplicados</p>
                    </div>
                  )}
                </div>

                {/* Parts Section */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-600" />
                      Repuestos Utilizados
                    </h3>
                    <button
                      onClick={() => setShowPartForm(true)}
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Repuesto
                    </button>
                  </div>
                  {selectedTicket.repuestos?.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {selectedTicket.repuestos.map((part, index) => (
                        <div key={part.id_ticket_repuesto} className={`p-4 ${index !== selectedTicket.repuestos.length - 1 ? 'border-b border-gray-200' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{part.repuesto?.nombre_repuesto}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Cantidad: <span className="font-medium">{part.cantidad}</span> | 
                                Precio: <span className="font-medium">Q{parseFloat(part.precio_unitario).toFixed(2)}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">Q{parseFloat(part.subtotal).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No hay repuestos utilizados</p>
                    </div>
                  )}
                </div>

                {/* Status Change */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
                    <FileText className="w-5 h-5" />
                    Cambiar Estado del Ticket
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(status => (
                      <button
                        key={status.id_estado}
                        onClick={() => handleStatusChange(selectedTicket.id_ticket, status.id_estado)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${getStatusColor(status.nombre_estado)} hover:shadow-md`}
                      >
                        {status.nombre_estado}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Form Modal */}
        {showServiceForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Servicio
                </h2>
                <button
                  onClick={() => setShowServiceForm(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <Form
                  fields={serviceFields}
                  onSubmit={handleAddService}
                  onCancel={() => setShowServiceForm(false)}
                  submitText="Agregar"
                />
              </div>
            </div>
          </div>
        )}

        {/* Part Form Modal */}
        {showPartForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Repuesto
                </h2>
                <button
                  onClick={() => setShowPartForm(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <Form
                  fields={partFields}
                  onSubmit={handleAddPart}
                  onCancel={() => setShowPartForm(false)}
                  submitText="Agregar"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Cargando tickets...</p>
            </div>
          ) : filteredData().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Ticket className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg font-medium">
                {searchTerm ? 'No se encontraron tickets' : 'No hay tickets registrados'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando un nuevo ticket'}
              </p>
            </div>
          ) : (
            <Table
              data={filteredData()}
              columns={ticketColumns}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;