import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';

const Services = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'services') {
        const response = await api.get('/servicios');
        setServices(response.data);
      } else {
        const response = await api.get('/categorias-servicios');
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceColumns = [
    { key: 'nombre_servicio', title: 'Servicio' },
    { key: 'precio_base', title: 'Precio', render: (value) => `Q${value}` },
    { 
      key: 'categoria', 
      title: 'Categoría',
      render: (value) => value?.nombre_categoria || 'Sin categoría'
    },
    { key: 'tiempo_estimado_horas', title: 'Tiempo Estimado', render: (value) => value ? `${value}h` : 'N/A' },
    { key: 'activo', title: 'Estado', render: (value) => value ? 'Activo' : 'Inactivo' }
  ];

  const categoryColumns = [
    { key: 'nombre_categoria', title: 'Categoría' },
    { key: 'descripcion', title: 'Descripción' }
  ];

  const serviceFields = [
    { name: 'nombre_servicio', label: 'Nombre del Servicio', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true },
    { name: 'id_categoria_servicio', label: 'Categoría', type: 'select',
      options: categories.map(c => ({ value: c.id_categoria_servicio, label: c.nombre_categoria }))
    },
    { name: 'precio_base', label: 'Precio Base', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'tiempo_estimado_horas', label: 'Tiempo Estimado (horas)', type: 'number', step: '0.5', min: 0 },
    { name: 'activo', label: 'Activo', type: 'checkbox' }
  ];

  const categoryFields = [
    { name: 'nombre_categoria', label: 'Nombre de Categoría', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true }
  ];

  const handleSubmit = async (formData) => {
    try {
      if (activeTab === 'services') {
        if (editingItem) {
          await api.put(`/servicios/${editingItem.id_servicio}`, formData);
        } else {
          await api.post('/servicios', formData);
        }
      } else {
        if (editingItem) {
          // Actualizar categoría
          await api.put(`/categorias-servicios/${editingItem.id_categoria_servicio}`, formData);
        } else {
          await api.post('/categorias-servicios', formData);
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
      if (activeTab === 'services') {
        await api.delete(`/servicios/${item.id_servicio}`);
      } else {
        await api.delete(`/categorias-servicios/${item.id_categoria_servicio}`);
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
            {activeTab === 'services' ? 'Servicios' : 'Categorías'}
          </h1>
          <p className="text-gray-600">
            {activeTab === 'services' ? 'Catálogo de servicios' : 'Categorías de servicios'}
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo {activeTab === 'services' ? 'Servicio' : 'Categoría'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔧 Servicios
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📁 Categorías
          </button>
        </nav>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'services' ? 'Servicio' : 'Categoría'}
              </h2>
              
              <Form
                fields={activeTab === 'services' ? serviceFields : categoryFields}
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
          data={activeTab === 'services' ? services : categories}
          columns={activeTab === 'services' ? serviceColumns : categoryColumns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage={`No hay ${activeTab === 'services' ? 'servicios' : 'categorías'} registrados`}
        />
      )}
    </div>
  );
};

export default Services;