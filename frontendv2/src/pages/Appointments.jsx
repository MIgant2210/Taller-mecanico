import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadRelatedData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/citas');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [clientsRes, vehiclesRes, employeesRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/vehiculos'),
        api.get('/auth/empleados')
      ]);
      setClients(clientsRes.data);
      setVehicles(vehiclesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const appointmentColumns = [
    { 
      key: 'fecha_cita', 
      title: 'Fecha y Hora',
      render: (value) => new Date(value).toLocaleString('es-ES')
    },
    { 
      key: 'cliente', 
      title: 'Cliente',
      render: (value) => value ? `${value.nombres} ${value.apellidos}` : 'N/A'
    },
    { 
      key: 'vehiculo', 
      title: 'Vehículo',
      render: (value) => value ? `${value.marca} ${value.modelo} - ${value.placa}` : 'N/A'
    },
    { 
      key: 'empleado_asignado', 
      title: 'Mecánico',
      render: (value) => value ? `${value.nombres} ${value.apellidos}` : 'Sin asignar'
    },
    { 
      key: 'estado_cita', 
      title: 'Estado',
      render: (value) => {
        const statusMap = {
          programada: '🟡 Programada',
          confirmada: '🟢 Confirmada',
          en_proceso: '🔵 En proceso',
          completada: '✅ Completada',
          cancelada: '🔴 Cancelada'
        };
        return statusMap[value] || value;
      }
    }
  ];

  const appointmentFields = [
    { name: 'id_cliente', label: 'Cliente', type: 'select', required: true,
      options: clients.map(c => ({ value: c.id_cliente, label: `${c.nombres} ${c.apellidos}` }))
    },
    { name: 'id_vehiculo', label: 'Vehículo', type: 'select', required: true,
      options: vehicles.map(v => ({ value: v.id_vehiculo, label: `${v.marca} ${v.modelo} - ${v.placa}` }))
    },
    { name: 'fecha_cita', label: 'Fecha y Hora', type: 'datetime', required: true },
    { name: 'id_empleado_asignado', label: 'Mecánico Asignado', type: 'select',
      options: employees.map(e => ({ value: e.id_empleado, label: `${e.nombres} ${e.apellidos}` }))
    },
    { name: 'descripcion_problema', label: 'Descripción del Problema', type: 'textarea', fullWidth: true },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', fullWidth: true },
    { name: 'estado_cita', label: 'Estado', type: 'select', required: true,
      options: [
        { value: 'programada', label: 'Programada' },
        { value: 'confirmada', label: 'Confirmada' },
        { value: 'en_proceso', label: 'En proceso' },
        { value: 'completada', label: 'Completada' },
        { value: 'cancelada', label: 'Cancelada' }
      ]
    }
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await api.put(`/citas/${editingItem.id_cita}`, formData);
      } else {
        await api.post('/citas', formData);
      }
      
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('Error al guardar la cita');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return;

    try {
      await api.delete(`/citas/${item.id_cita}`);
      loadData();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Error al eliminar la cita');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Citas</h1>
          <p className="text-gray-600">Gestión de citas programadas</p>
        </div>
        
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Cita
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar Cita' : 'Nueva Cita'}
              </h2>
              
              <Form
                fields={appointmentFields}
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Cargando citas...</div>
        </div>
      ) : (
        <Table
          data={appointments}
          columns={appointmentColumns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No hay citas programadas"
        />
      )}
    </div>
  );
};

export default Appointments;