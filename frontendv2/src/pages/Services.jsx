import React, { useState, useEffect } from 'react';
import { Wrench, FolderOpen, PlusCircle, Search, Edit2, Trash2, X, Clock, DollarSign, Tag, CheckCircle, XCircle } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    // Cargar categorías en background para que el select de categoría en el formulario
    // muestre opciones aunque estemos en la pestaña 'services'
    const loadCategoriesAlways = async () => {
      try {
        const res = await api.get('/categorias-servicios');
        setCategories(res.data);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategoriesAlways();
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
    { 
      key: 'nombre_servicio', 
      title: 'Servicio',
      render: (value, row) => (
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg mt-1">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            {row.descripcion && (
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">{row.descripcion}</p>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'categoria', 
      title: 'Categoría',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-purple-500" />
          <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            {value?.nombre_categoria || 'Sin categoría'}
          </span>
        </div>
      )
    },
    { 
      key: 'precio_base', 
      title: 'Precio',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-green-600 text-lg">
            Q {parseFloat(value).toFixed(2)}
          </span>
        </div>
      )
    },
    { 
      key: 'tiempo_estimado_horas', 
      title: 'Tiempo Estimado',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-gray-700">
            {value ? `${value} horas` : 'No especificado'}
          </span>
        </div>
      )
    },
    { 
      key: 'activo', 
      title: 'Estado',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Activo
              </span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-gray-400" />
              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                Inactivo
              </span>
            </>
          )}
        </div>
      )
    }
  ];

  const categoryColumns = [
    { 
      key: 'nombre_categoria', 
      title: 'Categoría',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FolderOpen className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">ID: {row.id_categoria_servicio}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'descripcion', 
      title: 'Descripción',
      render: (value) => (
        <p className="text-sm text-gray-600 max-w-md line-clamp-2">
          {value || 'Sin descripción'}
        </p>
      )
    }
  ];

  const serviceFields = [
    { name: 'nombre_servicio', label: 'Nombre del Servicio', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true },
    { name: 'id_categoria_servicio', label: 'Categoría', type: 'select',
      options: categories.map(c => ({ value: c.id_categoria_servicio, label: c.nombre_categoria }))
    },
    { name: 'precio_base', label: 'Precio Base (Q)', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'tiempo_estimado_horas', label: 'Tiempo Estimado (horas)', type: 'number', step: '0.5', min: 0 },
    { name: 'activo', label: 'Servicio Activo', type: 'checkbox', checkboxLabel: 'Marcar como activo' }
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

  // Filtrado de datos
  const filteredData = () => {
    const data = activeTab === 'services' ? services : categories;
    if (!searchTerm) return data;
    
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      if (activeTab === 'services') {
        return (
          item.nombre_servicio?.toLowerCase().includes(searchLower) ||
          item.descripcion?.toLowerCase().includes(searchLower) ||
          item.categoria?.nombre_categoria?.toLowerCase().includes(searchLower)
        );
      } else {
        return (
          item.nombre_categoria?.toLowerCase().includes(searchLower) ||
          item.descripcion?.toLowerCase().includes(searchLower)
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                {activeTab === 'services' ? (
                  <>
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Wrench className="w-7 h-7 text-blue-600" />
                    </div>
                    Gestión de Servicios
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <FolderOpen className="w-7 h-7 text-purple-600" />
                    </div>
                    Categorías de Servicios
                  </>
                )}
              </h1>
              <p className="text-gray-600">
                {activeTab === 'services'
                  ? 'Administra el catálogo de servicios del taller'
                  : 'Organiza tus servicios por categorías'}
              </p>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <PlusCircle className="w-5 h-5" />
              {activeTab === 'services' ? 'Nuevo Servicio' : 'Nueva Categoría'}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'services'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Wrench className="w-5 h-5" /> 
              Servicios
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {services.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FolderOpen className="w-5 h-5" /> 
              Categorías
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {categories.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'services' ? 'servicio por nombre, descripción o categoría' : 'categoría por nombre o descripción'}...`}
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all animate-scale-in">
              <div className={`${activeTab === 'services' ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'} text-white px-6 py-4 flex items-center justify-between`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Editar {activeTab === 'services' ? 'Servicio' : 'Categoría'}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Nuevo {activeTab === 'services' ? 'Servicio' : 'Categoría'}
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Cargando datos...</p>
            </div>
          ) : filteredData().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                {activeTab === 'services' ? (
                  <Wrench className="w-12 h-12 text-gray-400" />
                ) : (
                  <FolderOpen className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <p className="text-lg font-medium">
                {searchTerm 
                  ? 'No se encontraron resultados' 
                  : `No hay ${activeTab === 'services' ? 'servicios' : 'categorías'} registrados`}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : `Comienza agregando ${activeTab === 'services' ? 'un nuevo servicio' : 'una nueva categoría'}`}
              </p>
            </div>
          ) : (
            <Table
              data={filteredData()}
              columns={activeTab === 'services' ? serviceColumns : categoryColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Services;