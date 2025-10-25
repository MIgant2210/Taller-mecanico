import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Plus, Users, AlertCircle, Loader, UserCircle, Briefcase, Shield } from 'lucide-react';

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
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
            <Shield className="w-10 h-10 text-red-600 relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 max-w-md mx-auto">No tienes los permisos necesarios para acceder a esta sección administrativa</p>
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
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          value 
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' 
            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
          {value ? 'Activo' : 'Inactivo'}
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
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          value 
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' 
            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
          {value ? 'Activo' : 'Inactivo'}
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
    users: { 
      icon: UserCircle, 
      title: 'Usuarios', 
      description: 'Gestión de usuarios del sistema',
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    employees: { 
      icon: Briefcase, 
      title: 'Empleados', 
      description: 'Gestión de empleados',
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    }
  };

  const currentTab = tabConfig[activeTab];
  const Icon = currentTab.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className={`${currentTab.bgColor} ${currentTab.textColor} p-3 rounded-xl shadow-sm ring-1 ${currentTab.borderColor}`}>
                <Icon size={28} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{currentTab.title}</h1>
                <p className="text-gray-600">{currentTab.description}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              <Plus size={20} strokeWidth={2.5} />
              Nuevo {activeTab === 'users' ? 'Usuario' : 'Empleado'}
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
            <nav className="flex gap-1">
              {Object.entries(tabConfig).map(([key, { icon: TabIcon, title }]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <TabIcon size={18} strokeWidth={2} />
                  {title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="bg-red-100 rounded-lg p-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-red-700 text-sm mt-0.5">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <span className="text-lg">×</span>
            </button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Icon size={20} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {editingItem ? 'Editar' : 'Crear'} {activeTab === 'users' ? 'Usuario' : 'Empleado'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-lg p-1.5"
                >
                  <span className="text-xl font-light">×</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-medium">Cargando {currentTab.title.toLowerCase()}</p>
                <p className="text-gray-500 text-sm mt-1">Por favor espera un momento</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
    </div>
  );
};

export default Admin;