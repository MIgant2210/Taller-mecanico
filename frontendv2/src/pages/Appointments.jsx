import React, { useState, useEffect } from 'react';
import { CalendarDays, PlusCircle, Search, Edit2, Trash2, X, User, Car, Wrench, Clock, AlertCircle, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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

  const getStatusConfig = (status) => {
    const configs = {
      programada: {
        label: 'Programada',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600'
      },
      confirmada: {
        label: 'Confirmada',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
        iconColor: 'text-green-600'
      },
      en_proceso: {
        label: 'En Proceso',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: PlayCircle,
        iconColor: 'text-blue-600'
      },
      completada: {
        label: 'Completada',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: CheckCircle,
        iconColor: 'text-gray-600'
      },
      cancelada: {
        label: 'Cancelada',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
        iconColor: 'text-red-600'
      }
    };
    return configs[status] || configs.programada;
  };

  const appointmentColumns = [
    { 
      key: 'fecha_cita', 
      title: 'Fecha y Hora',
      render: (value) => {
        const date = new Date(value);
        return (
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {date.toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-600">
                {date.toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        );
      }
    },
    { 
      key: 'cliente', 
      title: 'Cliente',
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
            {value?.nombres?.charAt(0)}{value?.apellidos?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {value ? `${value.nombres} ${value.apellidos}` : 'N/A'}
            </p>
            {value?.telefono && (
              <p className="text-xs text-gray-500">📞 {value.telefono}</p>
            )}
          </div>
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
              <div className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-xs inline-block mt-1 border border-blue-300">
                {value.placa}
              </div>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'empleado_asignado', 
      title: 'Mecánico',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <Wrench className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-sm text-gray-700">
            {value ? `${value.nombres} ${value.apellidos}` : (
              <span className="text-gray-400 italic">Sin asignar</span>
            )}
          </span>
        </div>
      )
    },
    { 
      key: 'descripcion_problema', 
      title: 'Problema',
      render: (value) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-600 line-clamp-2">
            {value || <span className="text-gray-400 italic">Sin descripción</span>}
          </p>
        </div>
      )
    },
    { 
      key: 'estado_cita', 
      title: 'Estado',
      render: (value) => {
        const config = getStatusConfig(value);
        const StatusIcon = config.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${config.color.replace('bg-', 'bg-')} shadow-sm`}>
              <StatusIcon className={`${config.iconColor} w-4 h-4`} />
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${config.color} bg-white/40`}> 
              {config.label}
            </span>
          </div>
        );
      }
    }
  ];

  const appointmentFields = [
    { name: 'id_cliente', label: 'Cliente', type: 'select', required: true,
      options: clients.map(c => ({ value: c.id_cliente, label: `${c.nombres} ${c.apellidos}` }))
    },
    { name: 'id_vehiculo', label: 'Vehículo', type: 'select', required: true,
      // Incluimos clienteId para poder filtrar los vehículos por cliente en el componente Form
      options: vehicles.map(v => ({ value: v.id_vehiculo, label: `${v.marca} ${v.modelo} - ${v.placa}`, clienteId: v.id_cliente }))
    },
    { name: 'fecha_cita', label: 'Fecha y Hora', type: 'datetime', required: true },
    { name: 'id_empleado_asignado', label: 'Mecánico Asignado', type: 'select',
      options: [
        { value: '', label: 'Sin asignar' },
        ...employees.map(e => ({ value: e.id_empleado, label: `${e.nombres} ${e.apellidos}` }))
      ]
    },
    { name: 'descripcion_problema', label: 'Descripción del Problema', type: 'textarea', fullWidth: true },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', fullWidth: true },
    { name: 'estado_cita', label: 'Estado', type: 'select', required: true,
      options: [
        { value: 'programada', label: '🟡 Programada' },
        { value: 'confirmada', label: '🟢 Confirmada' },
        { value: 'en_proceso', label: '🔵 En Proceso' },
        { value: 'completada', label: '✅ Completada' },
        { value: 'cancelada', label: '🔴 Cancelada' }
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
      alert('✅ Cita guardada correctamente');
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
      alert('✅ Cita eliminada correctamente');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Error al eliminar la cita');
    }
  };

  // Filtrado de datos
  const filteredData = () => {
    let filtered = appointments;

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.estado_cita === filterStatus);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.cliente?.nombres?.toLowerCase().includes(searchLower) ||
        app.cliente?.apellidos?.toLowerCase().includes(searchLower) ||
        app.vehiculo?.placa?.toLowerCase().includes(searchLower) ||
        app.vehiculo?.marca?.toLowerCase().includes(searchLower) ||
        app.vehiculo?.modelo?.toLowerCase().includes(searchLower) ||
        app.empleado_asignado?.nombres?.toLowerCase().includes(searchLower) ||
        app.descripcion_problema?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  // Estadísticas
  const stats = {
    total: appointments.length,
    programadas: appointments.filter(a => a.estado_cita === 'programada').length,
    confirmadas: appointments.filter(a => a.estado_cita === 'confirmada').length,
    en_proceso: appointments.filter(a => a.estado_cita === 'en_proceso').length,
    completadas: appointments.filter(a => a.estado_cita === 'completada').length,
    canceladas: appointments.filter(a => a.estado_cita === 'cancelada').length
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
                  <CalendarDays className="w-7 h-7 text-blue-600" />
                </div>
                Gestión de Citas
              </h1>
              <p className="text-gray-600">Administra las citas programadas del taller</p>
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Cita
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-md border border-yellow-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-yellow-700 mb-1">Programadas</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.programadas}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-green-700 mb-1">Confirmadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmadas}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-blue-700 mb-1">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600">{stats.en_proceso}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-gray-700 mb-1">Completadas</p>
            <p className="text-2xl font-bold text-gray-600">{stats.completadas}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-md border border-red-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-red-700 mb-1">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">{stats.canceladas}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por cliente, vehículo, mecánico o descripción..."
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

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="programada">🟡 Programada</option>
              <option value="confirmada">🟢 Confirmada</option>
              <option value="en_proceso">🔵 En Proceso</option>
              <option value="completada">✅ Completada</option>
              <option value="cancelada">🔴 Cancelada</option>
            </select>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all animate-scale-in">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Editar Cita
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Nueva Cita
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Cargando citas...</p>
            </div>
          ) : filteredData().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <CalendarDays className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg font-medium">
                {searchTerm || filterStatus !== 'all'
                  ? 'No se encontraron citas' 
                  : 'No hay citas programadas'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || filterStatus !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza creando una nueva cita'}
              </p>
            </div>
          ) : (
            <Table
              data={filteredData()}
              columns={appointmentColumns}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;