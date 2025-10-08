import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';

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

  const ticketColumns = [
    { key: 'numero_ticket', title: 'Número' },
    { 
      key: 'cliente', 
      title: 'Cliente',
      render: (value) => value ? `${value.nombres} ${value.apellidos}` : 'N/A'
    },
    { 
      key: 'vehiculo', 
      title: 'Vehículo',
      render: (value) => value ? `${value.marca} ${value.modelo}` : 'N/A'
    },
    { 
      key: 'estado', 
      title: 'Estado',
      render: (value) => value ? value.nombre_estado : 'N/A'
    },
    { key: 'total_general', title: 'Total', render: (value) => `Q${value}` },
    { 
      key: 'fecha_ingreso', 
      title: 'Fecha Ingreso',
      render: (value) => new Date(value).toLocaleDateString('es-ES')
    }
  ];

  const ticketFields = [
    { name: 'id_cliente', label: 'Cliente', type: 'select', required: true,
      options: clients.map(c => ({ value: c.id_cliente, label: `${c.nombres} ${c.apellidos}` }))
    },
    { name: 'id_vehiculo', label: 'Vehículo', type: 'select', required: true,
      options: vehicles.map(v => ({ value: v.id_vehiculo, label: `${v.marca} ${v.modelo} - ${v.placa}` }))
    },
    { name: 'descripcion_problema', label: 'Descripción del Problema', type: 'textarea', required: true, fullWidth: true },
    { name: 'id_empleado_asignado', label: 'Mecánico Asignado', type: 'select',
      options: employees.map(e => ({ value: e.id_empleado, label: `${e.nombres} ${e.apellidos}` }))
    },
    { name: 'fecha_estimada_entrega', label: 'Fecha Estimada Entrega', type: 'datetime' },
    { name: 'observaciones_cliente', label: 'Observaciones del Cliente', type: 'textarea', fullWidth: true }
  ];

  const serviceFields = [
    { name: 'id_servicio', label: 'Servicio', type: 'select', required: true,
      options: services.map(s => ({ value: s.id_servicio, label: `${s.nombre_servicio} - Q${s.precio_base}` }))
    },
    { name: 'cantidad', label: 'Cantidad', type: 'number', min: 1, required: true, defaultValue: 1 },
    { name: 'precio_unitario', label: 'Precio Unitario', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', fullWidth: true }
  ];

  const partFields = [
    { name: 'id_repuesto', label: 'Repuesto', type: 'select', required: true,
      options: parts.map(p => ({ value: p.id_repuesto, label: `${p.nombre_repuesto} - Stock: ${p.stock_actual}` }))
    },
    { name: 'cantidad', label: 'Cantidad', type: 'number', min: 1, required: true },
    { name: 'precio_unitario', label: 'Precio Unitario', type: 'number', step: '0.01', min: 0, required: true }
  ];

  const handleSubmit = async (formData) => {
    try {
      // Procesar datos para el backend
      const processedData = {
        ...formData,
        fecha_estimada_entrega: formData.fecha_estimada_entrega 
          ? new Date(formData.fecha_estimada_entrega).toISOString()
          : null
      };

      if (editingItem) {
        await api.put(`/tickets/${editingItem.id_ticket}`, processedData);
      } else {
        await api.post('/tickets', processedData);
      }
      
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Error al guardar el ticket: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddService = async (formData) => {
    try {
      const processedData = {
        ...formData,
        precio_unitario: parseFloat(formData.precio_unitario),
        cantidad: parseInt(formData.cantidad)
      };

      await api.post(`/tickets/${selectedTicket.id_ticket}/servicios`, processedData);
      setShowServiceForm(false);
      loadData();
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Error al agregar servicio: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddPart = async (formData) => {
    try {
      const processedData = {
        ...formData,
        precio_unitario: parseFloat(formData.precio_unitario),
        cantidad: parseInt(formData.cantidad)
      };

      await api.post(`/tickets/${selectedTicket.id_ticket}/repuestos`, processedData);
      setShowPartForm(false);
      loadData();
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Error al agregar repuesto: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = async (ticketId, newStatusId) => {
    try {
      // CORRECCIÓN: Enviar como parámetro de query según el endpoint del backend
      await api.put(`/tickets/${ticketId}/estado?nuevo_estado_id=${newStatusId}`);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error details:', error.response?.data);
      alert('Error al actualizar estado: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleView = (ticket) => {
    setSelectedTicket(ticket);
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
      loadData();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Error al eliminar el ticket: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets de Atención</h1>
          <p className="text-gray-600">Gestión de tickets y servicios</p>
        </div>
        
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo Ticket
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar Ticket' : 'Nuevo Ticket'}
              </h2>
              
              <Form
                fields={ticketFields}
                initialData={editingItem || {}}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                submitText={editingItem ? 'Actualizar' : 'Crear'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Ticket #{selectedTicket.numero_ticket}</h2>
                <button
                  onClick={handleCloseDetail}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Información del Cliente</h3>
                  <p><strong>Cliente:</strong> {selectedTicket.cliente?.nombres} {selectedTicket.cliente?.apellidos}</p>
                  <p><strong>Vehículo:</strong> {selectedTicket.vehiculo?.marca} {selectedTicket.vehiculo?.modelo}</p>
                  <p><strong>Placa:</strong> {selectedTicket.vehiculo?.placa}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Información del Ticket</h3>
                  <p><strong>Estado:</strong> {selectedTicket.estado?.nombre_estado}</p>
                  <p><strong>Fecha Ingreso:</strong> {new Date(selectedTicket.fecha_ingreso).toLocaleString('es-ES')}</p>
                  <p><strong>Total:</strong> Q{selectedTicket.total_general}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Descripción del Problema</h3>
                <p className="text-gray-700">{selectedTicket.descripcion_problema}</p>
              </div>

              {/* Services Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Servicios Aplicados</h3>
                  <button
                    onClick={() => setShowServiceForm(true)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    + Agregar Servicio
                  </button>
                </div>
                {selectedTicket.servicios?.length > 0 ? (
                  <div className="bg-gray-50 rounded p-4">
                    {selectedTicket.servicios.map(service => (
                      <div key={service.id_ticket_servicio} className="border-b border-gray-200 py-2 last:border-b-0">
                        <p><strong>{service.servicio?.nombre_servicio}</strong></p>
                        <p>Cantidad: {service.cantidad} | Precio: Q{service.precio_unitario} | Subtotal: Q{service.subtotal}</p>
                        {service.observaciones && <p className="text-sm text-gray-600">Obs: {service.observaciones}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay servicios aplicados</p>
                )}
              </div>

              {/* Parts Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Repuestos Utilizados</h3>
                  <button
                    onClick={() => setShowPartForm(true)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    + Agregar Repuesto
                  </button>
                </div>
                {selectedTicket.repuestos?.length > 0 ? (
                  <div className="bg-gray-50 rounded p-4">
                    {selectedTicket.repuestos.map(part => (
                      <div key={part.id_ticket_repuesto} className="border-b border-gray-200 py-2 last:border-b-0">
                        <p><strong>{part.repuesto?.nombre_repuesto}</strong></p>
                        <p>Cantidad: {part.cantidad} | Precio: Q{part.precio_unitario} | Subtotal: Q{part.subtotal}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay repuestos utilizados</p>
                )}
              </div>

              {/* Status Change */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Cambiar Estado</h3>
                <div className="flex space-x-2">
                  {statuses.map(status => (
                    <button
                      key={status.id_estado}
                      onClick={() => handleStatusChange(selectedTicket.id_ticket, status.id_estado)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Agregar Servicio</h2>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Agregar Repuesto</h2>
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
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Cargando tickets...</div>
        </div>
      ) : (
        <Table
          data={tickets}
          columns={ticketColumns}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No hay tickets registrados"
        />
      )}
    </div>
  );
};

export default Tickets;