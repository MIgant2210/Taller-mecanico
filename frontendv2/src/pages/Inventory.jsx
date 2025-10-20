import React, { useState, useEffect } from 'react';
import { Package, Building2, FolderOpen, TrendingUp, PlusCircle, Search, Edit2, Trash2, X, AlertTriangle, CheckCircle, XCircle, MapPin, Barcode } from 'lucide-react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('parts');
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
    if (activeTab === 'parts') {
      loadSuppliers();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'parts') {
        const response = await api.get('/repuestos');
        setParts(response.data);
      } else if (activeTab === 'suppliers') {
        const response = await api.get('/proveedores');
        setSuppliers(response.data);
      } else if (activeTab === 'categories') {
        const response = await api.get('/categorias-repuestos');
        setCategories(response.data);
      } else {
        const response = await api.get('/movimientos-inventario');
        setMovements(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/proveedores');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const partColumns = [
    { 
      key: 'codigo_repuesto', 
      title: 'Repuesto',
      render: (value, row) => (
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg mt-1">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-xs text-gray-500">{value}</span>
            </div>
            <p className="font-semibold text-gray-900 mt-1">{row.nombre_repuesto}</p>
            {row.descripcion && (
              <p className="text-xs text-gray-500 line-clamp-1 mt-1">{row.descripcion}</p>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'precio_venta', 
      title: 'Precio Venta',
      render: (value) => (
        <span className="font-semibold text-green-600 text-lg">
          Q {parseFloat(value).toFixed(2)}
        </span>
      )
    },
    { 
      key: 'stock_actual', 
      title: 'Stock', 
      render: (value, item) => (
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className={`font-bold text-lg ${
              item.stock_actual <= item.stock_minimo ? 'text-red-600' : 'text-green-600'
            }`}>
              {value}
            </span>
            <span className="text-xs text-gray-500">Mín: {item.stock_minimo}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStockClick(item);
            }}
            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all duration-200 hover:scale-110"
            title="Actualizar stock"
          >
            <Package className="w-4 h-4" />
          </button>
        </div>
      )
    },
    { 
      key: 'categoria', 
      title: 'Categoría',
      render: (value) => (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          <FolderOpen className="w-3 h-3" />
          {value?.nombre_categoria || 'Sin categoría'}
        </span>
      )
    },
    { 
      key: 'proveedor', 
      title: 'Proveedor',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {value?.nombre_empresa || 'Sin proveedor'}
          </span>
        </div>
      )
    },
    { 
      key: 'ubicacion_almacen', 
      title: 'Ubicación',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-gray-600">
            {value || 'No especificada'}
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

  const supplierColumns = [
    { 
      key: 'nombre_empresa', 
      title: 'Proveedor',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{row.contacto_principal || 'Sin contacto'}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'telefono', 
      title: 'Contacto',
      render: (value, row) => (
        <div className="space-y-1">
          {value && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>📞</span>
              <span>{value}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>✉️</span>
              <span>{row.email}</span>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'direccion', 
      title: 'Dirección',
      render: (value) => (
        <div className="flex items-start gap-2 max-w-xs">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
          <span className="text-sm text-gray-600 line-clamp-2">{value || 'No registrada'}</span>
        </div>
      )
    },
    { 
      key: 'activo', 
      title: 'Estado',
      render: (value) => (
        value ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Inactivo
          </span>
        )
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
            <p className="text-xs text-gray-500">ID: {row.id_categoria_repuesto}</p>
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

  const movementColumns = [
    { 
      key: 'fecha_movimiento', 
      title: 'Fecha',
      render: (value) => (
        <span className="text-sm text-gray-700">
          {new Date(value).toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    { 
      key: 'repuesto', 
      title: 'Repuesto',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-900">
            {value?.nombre_repuesto || 'N/A'}
          </span>
        </div>
      )
    },
    { 
      key: 'tipo_movimiento', 
      title: 'Tipo',
      render: (value) => {
        const tipo = value?.nombre_movimiento || 'N/A';
        const isEntrada = tipo.toLowerCase().includes('entrada');
        return (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            isEntrada 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isEntrada ? '📥' : '📤'}
            {tipo}
          </span>
        );
      }
    },
    { 
      key: 'cantidad', 
      title: 'Cantidad',
      render: (value) => (
        <span className="font-semibold text-gray-900">{value}</span>
      )
    },
    { 
      key: 'stock_anterior', 
      title: 'Stock',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{value}</span>
          <span className="text-gray-400">→</span>
          <span className="text-sm font-semibold text-gray-900">{row.stock_nuevo}</span>
        </div>
      )
    }
  ];

  // Función para procesar valores de selects
  const processSelectValue = (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const numValue = parseInt(value);
    return isNaN(numValue) ? null : numValue;
  };

  // Campos para nuevo repuesto
  const partFields = [
    { name: 'codigo_repuesto', label: 'Código', type: 'text', required: true },
    { name: 'nombre_repuesto', label: 'Nombre del Repuesto', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true },
    { 
      name: 'id_categoria_repuesto', 
      label: 'Categoría', 
      type: 'select',
      options: [
        { value: '', label: 'Seleccionar categoría' },
        ...categories.map(c => ({ 
          value: c.id_categoria_repuesto, 
          label: c.nombre_categoria 
        }))
      ]
    },
    { 
      name: 'id_proveedor', 
      label: 'Proveedor', 
      type: 'select',
      options: [
        { value: '', label: 'Seleccionar proveedor' },
        ...suppliers.filter(s => s.activo).map(s => ({ 
          value: s.id_proveedor, 
          label: s.nombre_empresa 
        }))
      ]
    },
    { name: 'precio_compra', label: 'Precio Compra (Q)', type: 'number', step: '0.01', min: 0 },
    { name: 'precio_venta', label: 'Precio Venta (Q)', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'stock_actual', label: 'Stock Inicial', type: 'number', min: 0, required: true, defaultValue: 0 },
    { name: 'stock_minimo', label: 'Stock Mínimo', type: 'number', min: 0, required: true, defaultValue: 5 },
    { name: 'ubicacion_almacen', label: 'Ubicación en Almacén', type: 'text' },
    { name: 'activo', label: 'Repuesto Activo', type: 'checkbox', checkboxLabel: 'Marcar como activo', defaultValue: true }
  ];

  // Campos para editar repuesto
  const partEditFields = [
    { name: 'codigo_repuesto', label: 'Código', type: 'text', required: true },
    { name: 'nombre_repuesto', label: 'Nombre del Repuesto', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true },
    { 
      name: 'id_categoria_repuesto', 
      label: 'Categoría', 
      type: 'select',
      options: [
        { value: '', label: 'Seleccionar categoría' },
        ...categories.map(c => ({ 
          value: c.id_categoria_repuesto, 
          label: c.nombre_categoria 
        }))
      ]
    },
    { 
      name: 'id_proveedor', 
      label: 'Proveedor', 
      type: 'select',
      options: [
        { value: '', label: 'Seleccionar proveedor' },
        ...suppliers.filter(s => s.activo).map(s => ({ 
          value: s.id_proveedor, 
          label: s.nombre_empresa 
        }))
      ]
    },
    { name: 'precio_compra', label: 'Precio Compra (Q)', type: 'number', step: '0.01', min: 0 },
    { name: 'precio_venta', label: 'Precio Venta (Q)', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'stock_minimo', label: 'Stock Mínimo', type: 'number', min: 0, required: true },
    { name: 'ubicacion_almacen', label: 'Ubicación en Almacén', type: 'text' },
    { name: 'activo', label: 'Repuesto Activo', type: 'checkbox', checkboxLabel: 'Marcar como activo' }
  ];

  const supplierFields = [
    { name: 'nombre_empresa', label: 'Nombre de Empresa', type: 'text', required: true },
    { name: 'contacto_principal', label: 'Contacto Principal', type: 'text' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'direccion', label: 'Dirección', type: 'textarea', fullWidth: true },
    { name: 'activo', label: 'Proveedor Activo', type: 'checkbox', checkboxLabel: 'Marcar como activo', defaultValue: true }
  ];

  const categoryFields = [
    { name: 'nombre_categoria', label: 'Nombre de Categoría', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', fullWidth: true }
  ];

  const stockFields = [
    { 
      name: 'tipo_movimiento', 
      label: 'Tipo de Movimiento', 
      type: 'select', 
      required: true,
      options: [
        { value: 'entrada', label: '📥 Entrada de Stock' },
        { value: 'salida', label: '📤 Salida de Stock' }
      ]
    },
    { 
      name: 'cantidad', 
      label: 'Cantidad', 
      type: 'number', 
      min: 1, 
      required: true 
    },
    { 
      name: 'observaciones', 
      label: 'Observaciones', 
      type: 'textarea', 
      fullWidth: true 
    }
  ];

  const handleSubmit = async (formData) => {
    try {
      let processedData = { ...formData };

      if (activeTab === 'parts') {
        processedData = {
          ...formData,
          id_categoria_repuesto: processSelectValue(formData.id_categoria_repuesto),
          id_proveedor: processSelectValue(formData.id_proveedor),
          precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
          precio_venta: parseFloat(formData.precio_venta),
          stock_minimo: parseInt(formData.stock_minimo),
          ...(!editingItem && { 
            stock_actual: parseInt(formData.stock_actual || 0) 
          })
        };

        if (editingItem) {
          if (formData.id_categoria_repuesto === '') {
            processedData.id_categoria_repuesto = null;
          }
          if (formData.id_proveedor === '') {
            processedData.id_proveedor = null;
          }
        }
      }

      if (activeTab === 'parts') {
        if (editingItem) {
          await api.put(`/repuestos/${editingItem.id_repuesto}`, processedData);
        } else {
          await api.post('/repuestos', processedData);
        }
      } else if (activeTab === 'suppliers') {
        if (editingItem) {
          await api.put(`/proveedores/${editingItem.id_proveedor}`, formData);
        } else {
          await api.post('/proveedores', formData);
        }
      } else if (activeTab === 'categories') {
        if (editingItem) {
          await api.put(`/categorias-repuestos/${editingItem.id_categoria_repuesto}`, formData);
        } else {
          await api.post('/categorias-repuestos', formData);
        }
      }
      
      setShowForm(false);
      setEditingItem(null);
      loadData();
      alert('✅ Datos guardados correctamente');
    } catch (error) {
      console.error('❌ Error saving data:', error);
      alert('Error al guardar los datos: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateStock = async (formData) => {
    try {
      await api.put(`/repuestos/${selectedPart.id_repuesto}/stock`, {
        cantidad: parseInt(formData.cantidad),
        tipo_movimiento: formData.tipo_movimiento,
        observaciones: formData.observaciones || `Movimiento de stock: ${formData.tipo_movimiento}`
      });

      setShowStockForm(false);
      setSelectedPart(null);
      loadData();
      alert('✅ Stock actualizado correctamente');
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      alert('Error al actualizar stock: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleUpdateStockClick = (item) => {
    setSelectedPart(item);
    setShowStockForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      if (activeTab === 'parts') {
        await api.delete(`/repuestos/${item.id_repuesto}`);
      } else if (activeTab === 'suppliers') {
        await api.delete(`/proveedores/${item.id_proveedor}`);
      } else if (activeTab === 'categories') {
        await api.delete(`/categorias-repuestos/${item.id_categoria_repuesto}`);
      }
      loadData();
      alert('✅ Registro eliminado correctamente');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar el registro: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getTabConfig = () => {
    switch (activeTab) {
      case 'parts': 
        return {
          title: 'Gestión de Inventario',
          description: 'Administra repuestos y stock del taller',
          icon: Package,
          color: 'blue',
          buttonText: 'Nuevo Repuesto'
        };
      case 'suppliers': 
        return {
          title: 'Gestión de Proveedores',
          description: 'Administra la información de tus proveedores',
          icon: Building2,
          color: 'indigo',
          buttonText: 'Nuevo Proveedor'
        };
      case 'categories': 
        return {
          title: 'Categorías de Repuestos',
          description: 'Organiza tus repuestos por categorías',
          icon: FolderOpen,
          color: 'purple',
          buttonText: 'Nueva Categoría'
        };
      case 'movements': 
        return {
          title: 'Historial de Movimientos',
          description: 'Registro de entradas y salidas de inventario',
          icon: TrendingUp,
          color: 'green',
          buttonText: null
        };
      default: 
        return {};
    }
  };

  // Filtrado de datos
  const filteredData = () => {
    let data;
    switch (activeTab) {
      case 'parts': data = parts; break;
      case 'suppliers': data = suppliers; break;
      case 'categories': data = categories; break;
      case 'movements': data = movements; break;
      default: data = [];
    }
    
    if (!searchTerm) return data;
    
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      if (activeTab === 'parts') {
        return (
          item.codigo_repuesto?.toLowerCase().includes(searchLower) ||
          item.nombre_repuesto?.toLowerCase().includes(searchLower) ||
          item.categoria?.nombre_categoria?.toLowerCase().includes(searchLower)
        );
      } else if (activeTab === 'suppliers') {
        return (
          item.nombre_empresa?.toLowerCase().includes(searchLower) ||
          item.contacto_principal?.toLowerCase().includes(searchLower)
        );
      } else if (activeTab === 'categories') {
        return (
          item.nombre_categoria?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  };

  const tabConfig = getTabConfig();
  const Icon = tabConfig.icon;
  const showAddButton = activeTab !== 'movements';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className={`p-2 bg-${tabConfig.color}-100 rounded-xl`}>
                  <Icon className={`w-7 h-7 text-${tabConfig.color}-600`} />
                </div>
                {tabConfig.title}
              </h1>
              <p className="text-gray-600">{tabConfig.description}</p>
            </div>

            {showAddButton && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                <PlusCircle className="w-5 h-5" />
                {tabConfig.buttonText}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 flex-wrap">
            <button
              onClick={() => setActiveTab('parts')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'parts'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="w-5 h-5" /> 
              Repuestos
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {parts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'suppliers'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-5 h-5" /> 
              Proveedores
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {suppliers.length}
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
            <button
              onClick={() => setActiveTab('movements')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'movements'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-5 h-5" /> 
              Movimientos
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {movements.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {activeTab !== 'movements' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Buscar ${
                  activeTab === 'parts' ? 'repuesto por código, nombre o categoría' : 
                  activeTab === 'suppliers' ? 'proveedor por nombre o contacto' : 
                  'categoría por nombre'
                }...`}
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
        )}

        {/* Form Modal para información general */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all animate-scale-in">
              <div className={`bg-gradient-to-r ${
                activeTab === 'parts' ? 'from-blue-600 to-blue-700' :
                activeTab === 'suppliers' ? 'from-indigo-600 to-indigo-700' :
                'from-purple-600 to-purple-700'
              } text-white px-6 py-4 flex items-center justify-between`}>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Editar {tabConfig.buttonText?.replace('Nuevo ', '').replace('Nueva ', '')}
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      {tabConfig.buttonText}
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
                  fields={
                    activeTab === 'parts' 
                      ? (editingItem ? partEditFields : partFields) 
                      : activeTab === 'suppliers' 
                      ? supplierFields 
                      : categoryFields
                  }
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

        {/* Form Modal para actualizar stock */}
        {showStockForm && selectedPart && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-scale-in">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Actualizar Stock
                </h2>
                <button
                  onClick={() => {
                    setShowStockForm(false);
                    setSelectedPart(null);
                  }}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl mb-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-6 h-6 text-blue-600" />
                    <p className="font-semibold text-gray-900">{selectedPart.nombre_repuesto}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Stock Actual</p>
                      <p className={`font-bold text-lg ${
                        selectedPart.stock_actual <= selectedPart.stock_minimo ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {selectedPart.stock_actual}
                        {selectedPart.stock_actual <= selectedPart.stock_minimo && (
                          <AlertTriangle className="w-4 h-4 inline ml-1" />
                        )}
                      </p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Stock Mínimo</p>
                      <p className="font-bold text-lg text-gray-900">{selectedPart.stock_minimo}</p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Código</p>
                      <p className="font-mono font-semibold text-gray-900">{selectedPart.codigo_repuesto}</p>
                    </div>
                    <div className="bg-white/60 p-3 rounded-lg">
                      <p className="text-gray-600 text-xs mb-1">Ubicación</p>
                      <p className="font-semibold text-gray-900">{selectedPart.ubicacion_almacen || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <Form
                  fields={stockFields}
                  onSubmit={handleUpdateStock}
                  onCancel={() => {
                    setShowStockForm(false);
                    setSelectedPart(null);
                  }}
                  submitText="Actualizar Stock"
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
                <Icon className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg font-medium">
                {searchTerm 
                  ? 'No se encontraron resultados' 
                  : `No hay ${activeTab === 'parts' ? 'repuestos' : activeTab === 'suppliers' ? 'proveedores' : activeTab === 'categories' ? 'categorías' : 'movimientos'} registrados`}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : showAddButton ? `Comienza agregando ${tabConfig.buttonText?.toLowerCase()}` : 'No hay movimientos registrados aún'}
              </p>
            </div>
          ) : (
            <Table
              data={filteredData()}
              columns={
                activeTab === 'parts' ? partColumns :
                activeTab === 'suppliers' ? supplierColumns :
                activeTab === 'categories' ? categoryColumns : movementColumns
              }
              onEdit={activeTab !== 'movements' ? handleEdit : undefined}
              onDelete={activeTab !== 'movements' ? handleDelete : undefined}
              actions={activeTab !== 'movements'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;