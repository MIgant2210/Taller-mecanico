import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';

const Clients = () => {
  const [activeTab, setActiveTab] = useState('clients');
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'clients') {
        const response = await api.get('/clientes');
        setClients(response.data);
      } else {
        const response = await api.get('/vehiculos');
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clientColumns = [
    { key: 'nombres', title: 'Nombres' },
    { key: 'apellidos', title: 'Apellidos' },
    { key: 'telefono', title: 'Teléfono' },
    { key: 'email', title: 'Email' },
    { 
      key: 'fecha_registro', 
      title: 'Registro',
      render: (value) => new Date(value).toLocaleDateString('es-ES')
    }
  ];

  const vehicleColumns = [
    { key: 'placa', title: 'Placa' },
    { key: 'marca', title: 'Marca' },
    { key: 'modelo', title: 'Modelo' },
    { key: 'color', title: 'Color' },
    { 
      key: 'cliente', 
      title: 'Cliente',
      render: (value) => value ? `${value.nombres} ${value.apellidos}` : 'N/A'
    }
  ];

  const clientFields = [
    { name: 'nombres', label: 'Nombres', type: 'text', required: true },
    { name: 'apellidos', label: 'Apellidos', type: 'text', required: true },
    { name: 'dpi', label: 'DPI', type: 'text' },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'direccion', label: 'Dirección', type: 'textarea', fullWidth: true }
  ];

  const vehicleFields = [
    { name: 'id_cliente', label: 'Cliente', type: 'select', required: true, 
      options: clients.map(c => ({ value: c.id_cliente, label: `${c.nombres} ${c.apellidos}` })) 
    },
    { name: 'marca', label: 'Marca', type: 'text', required: true },
    { name: 'modelo', label: 'Modelo', type: 'text', required: true },
    { name: 'año', label: 'Año', type: 'number' },
    { name: 'placa', label: 'Placa', type: 'text', required: true },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'numero_chasis', label: 'Número de Chasis', type: 'text' },
    { name: 'numero_motor', label: 'Número de Motor', type: 'text' },
    { name: 'kilometraje', label: 'Kilometraje', type: 'number', min: 0 }
  ];

  const handleSubmit = async (formData) => {
    try {
      if (activeTab === 'clients') {
        if (editingItem) {
          await api.put(`/clientes/${editingItem.id_cliente}`, formData);
        } else {
          await api.post('/clientes', formData);
        }
      } else {
        if (editingItem) {
          await api.put(`/vehiculos/${editingItem.id_vehiculo}`, formData);
        } else {
          await api.post('/vehiculos', formData);
        }
      }
      
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error al guardar los datos');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      if (activeTab === 'clients') {
        await api.delete(`/clientes/${item.id_cliente}`);
      } else {
        await api.delete(`/vehiculos/${item.id_vehiculo}`);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar el registro');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {activeTab === 'clients' ? 'Clientes' : 'Vehículos'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'clients' ? 'Gestión de clientes' : 'Gestión de vehículos'}
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo {activeTab === 'clients' ? 'Cliente' : 'Vehículo'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Clientes
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vehicles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🚗 Vehículos
          </button>
        </nav>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'clients' ? 'Cliente' : 'Vehículo'}
              </h2>
              
              <Form
                fields={activeTab === 'clients' ? clientFields : vehicleFields}
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
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      ) : (
        <Table
          data={activeTab === 'clients' ? clients : vehicles}
          columns={activeTab === 'clients' ? clientColumns : vehicleColumns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage={`No hay ${activeTab === 'clients' ? 'clientes' : 'vehículos'} registrados`}
        />
      )}
    </div>
  );
};

export default Clients;