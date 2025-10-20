import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Plus, Users, AlertCircle, Loader } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  if (user?.rol?.nombre_rol !== 'Administrador') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
    loadRelatedData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'users') {
        const response = await api.get('/auth/users');
        setUsers(response.data);
      } else {
        const response = await api.get('/auth/empleados');
        setEmployees(response.data);
      }
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [rolesRes, positionsRes] = await Promise.all([
        api.get('/auth/roles'),
        api.get('/auth/puestos')
      ]);
      setRoles(rolesRes.data);
      setPositions(positionsRes.data);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  const userColumns = [
    { key: 'username', title: 'Usuario' },
    { 
      key: 'empleado', 
      title: 'Empleado',
      render: (value) => value ? `${value.nombres} ${value.apellidos}` : 'N/A'
    },
    { 
      key: 'rol', 
      title: 'Rol',
      render: (value) => value?.nombre_rol || 'N/A'
    },
    { 
      key: 'activo', 
      title: 'Estado', 
      render: (value) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          value 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {value ? '● Activo' : '● Inactivo'}
        </span>
      )
    },
    { 
      key: 'ultimo_acceso', 
      title: 'Último Acceso',
      render: (value) => value ? new Date(value).toLocaleString('es-ES') : 'Nunca'
    }
  ];

  const employeeColumns = [
    { key: 'nombres', title: 'Nombres' },
    { key: 'apellidos', title: 'Apellidos' },
    { key: 'dpi', title: 'DPI' },
    { key: 'telefono', title: 'Teléfono' },
    { key: 'email', title: 'Email' },
    { 
      key: 'puesto', 
      title: 'Puesto',
      render: (value) => value?.nombre_puesto || 'N/A'
    },
    { 
      key: 'activo', 
      title: 'Estado', 
      render: (value) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          value 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {value ? '● Activo' : '● Inactivo'}
        </span>
      )
    }
  ];

  const userFields = [
    { name: 'username', label: 'Usuario', type: 'text', required: true },
    { name: 'password', label: 'Contraseña', type: 'password', required: !editingItem },
    { name: 'id_empleado', label: 'Empleado', type: 'select', required: true,
      options: employees
        .filter(e => e.activo)
        .filter(e => !users.some(u => u.id_empleado === e.id_empleado && u.id_usuario !== (editingItem?.id_usuario)))
        .map(e => ({ value: e.id_empleado, label: `${e.nombres} ${e.apellidos}` }))
    },
    { name: 'id_rol', label: 'Rol', type: 'select', required: true,
      options: roles.map(r => ({ value: r.id_rol, label: r.nombre_rol }))
    },
    { name: 'activo', label: 'Activo', type: 'checkbox' }
  ];

  const employeeFields = [
    { name: 'nombres', label: 'Nombres', type: 'text', required: true },
    { name: 'apellidos', label: 'Apellidos', type: 'text', required: true },
    { name: 'dpi', label: 'DPI', type: 'text', required: true },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'direccion', label: 'Dirección', type: 'textarea', fullWidth: true },
    { name: 'id_puesto', label: 'Puesto', type: 'select', required: true,
      options: positions.map(p => ({ value: p.id_puesto, label: p.nombre_puesto }))
    },
    { name: 'fecha_ingreso', label: 'Fecha de Ingreso', type: 'date' },
    { name: 'salario', label: 'Salario', type: 'number', step: '0.01', min: 0 },
    { name: 'activo', label: 'Activo', type: 'checkbox' }
  ];

  const handleSubmit = async (formData) => {
    try {
      if (activeTab === 'users') {
        if (editingItem) {
          if (!formData.password) {
            delete formData.password;
          }
          await api.put(`/auth/users/${editingItem.id_usuario}`, formData);
        } else {
          await api.post('/auth/users', formData);
        }
      } else {
        if (editingItem) {
          await api.put(`/auth/empleados/${editingItem.id_empleado}`, formData);
        } else {
          await api.post('/auth/empleados', formData);
        }
      }
      
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      setError('Error al guardar los datos');
      console.error('Error saving data:', err);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;

    try {
      if (activeTab === 'users') {
        await api.delete(`/auth/users/${item.id_usuario}`);
      } else {
        await api.delete(`/auth/empleados/${item.id_empleado}`);
      }
      loadData();
    } catch (err) {
      setError('Error al eliminar el registro');
      console.error('Error deleting:', err);
    }
  };

  const tabConfig = {
    users: { icon: '👤', title: 'Usuarios', description: 'Gestión de usuarios del sistema' },
    employees: { icon: '👥', title: 'Empleados', description: 'Gestión de empleados' }
  };

  const currentTab = tabConfig[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentTab.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">{currentTab.title}</h1>
          </div>
          <p className="text-gray-600">{currentTab.description}</p>
        </div>
        
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          Nuevo {activeTab === 'users' ? 'Usuario' : 'Empleado'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {Object.entries(tabConfig).map(([key, { icon, title }]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {icon} {title}
            </button>
          ))}
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-900 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Editar' : 'Crear'} {activeTab === 'users' ? 'Usuario' : 'Empleado'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <Form
                fields={activeTab === 'users' ? userFields : employeeFields}
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

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">Cargando {currentTab.title.toLowerCase()}...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <Table
            data={activeTab === 'users' ? users : employees}
            columns={activeTab === 'users' ? userColumns : employeeColumns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            emptyMessage={`No hay ${currentTab.title.toLowerCase()} registrados`}
          />
        </div>
      )}
    </div>
  );
};

export default Admin;