import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Solo admin puede acceder - CORREGIDO
  if (user?.rol?.nombre_rol !== 'Administrador') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
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
    try {
      if (activeTab === 'users') {
        const response = await api.get('/auth/users');
        setUsers(response.data);
      } else {
        const response = await api.get('/auth/empleados');
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    { key: 'activo', title: 'Estado', render: (value) => value ? 'Activo' : 'Inactivo' },
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
    { key: 'activo', title: 'Estado', render: (value) => value ? 'Activo' : 'Inactivo' }
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
          // Para actualizar, no enviar password si está vacío
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
      if (activeTab === 'users') {
        await api.delete(`/auth/users/${item.id_usuario}`);
      } else {
        await api.delete(`/auth/empleados/${item.id_empleado}`);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar el registro');
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'users': return 'Usuarios';
      case 'employees': return 'Empleados';
      default: return '';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getTabTitle()}</h1>
          <p className="text-gray-600">
            {activeTab === 'users' && 'Gestión de usuarios del sistema'}
            {activeTab === 'employees' && 'Gestión de empleados'}
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo {activeTab === 'users' ? 'Usuario' : 'Empleado'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👤 Usuarios
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Empleados
          </button>
        </nav>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'users' ? 'Usuario' : 'Empleado'}
              </h2>
              
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

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      ) : (
        <Table
          data={activeTab === 'users' ? users : employees}
          columns={activeTab === 'users' ? userColumns : employeeColumns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage={`No hay ${getTabTitle().toLowerCase()} registrados`}
        />
      )}
    </div>
  );
};

export default Admin;