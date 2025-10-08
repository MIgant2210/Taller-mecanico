import React, { useState, useEffect } from 'react';
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
    { key: 'codigo_repuesto', title: 'Código' },
    { key: 'nombre_repuesto', title: 'Repuesto' },
    { key: 'precio_venta', title: 'Precio Venta', render: (value) => `Q${value}` },
    { 
      key: 'stock_actual', 
      title: 'Stock', 
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${
            item.stock_actual <= item.stock_minimo ? 'text-red-600' : 'text-green-600'
          }`}>
            {value}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStockClick(item);
            }}
            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
            title="Actualizar stock"
          >
            📦
          </button>
        </div>
      )
    },
    { key: 'stock_minimo', title: 'Stock Mínimo' },
    { 
      key: 'categoria', 
      title: 'Categoría',
      render: (value) => value?.nombre_categoria || 'Sin categoría'
    },
    { 
      key: 'proveedor', 
      title: 'Proveedor',
      render: (value) => value?.nombre_empresa || 'Sin proveedor'
    },
    { key: 'activo', title: 'Estado', render: (value) => value ? 'Activo' : 'Inactivo' }
  ];

  const supplierColumns = [
    { key: 'nombre_empresa', title: 'Empresa' },
    { key: 'contacto_principal', title: 'Contacto' },
    { key: 'telefono', title: 'Teléfono' },
    { key: 'email', title: 'Email' },
    { key: 'activo', title: 'Estado', render: (value) => value ? 'Activo' : 'Inactivo' }
  ];

  const categoryColumns = [
    { key: 'nombre_categoria', title: 'Nombre de Categoría' },
    { key: 'descripcion', title: 'Descripción' },
    { 
      key: 'fecha_creacion', 
      title: 'Fecha de Creación', 
      render: (value) => new Date(value).toLocaleDateString('es-ES')
    }
  ];

  const movementColumns = [
    { key: 'fecha_movimiento', title: 'Fecha', render: (value) => new Date(value).toLocaleDateString('es-ES') },
    { 
      key: 'repuesto', 
      title: 'Repuesto',
      render: (value) => value?.nombre_repuesto || 'N/A'
    },
    { 
      key: 'tipo_movimiento', 
      title: 'Tipo',
      render: (value) => value?.nombre_movimiento || 'N/A'
    },
    { key: 'cantidad', title: 'Cantidad' },
    { key: 'stock_anterior', title: 'Stock Anterior' },
    { key: 'stock_nuevo', title: 'Stock Nuevo' }
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
    { name: 'precio_compra', label: 'Precio Compra', type: 'number', step: '0.01', min: 0 },
    { name: 'precio_venta', label: 'Precio Venta', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'stock_actual', label: 'Stock Inicial', type: 'number', min: 0, required: true, defaultValue: 0 },
    { name: 'stock_minimo', label: 'Stock Mínimo', type: 'number', min: 0, required: true, defaultValue: 5 },
    { name: 'ubicacion_almacen', label: 'Ubicación en Almacén', type: 'text' },
    { name: 'activo', label: 'Activo', type: 'checkbox', defaultValue: true }
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
    { name: 'precio_compra', label: 'Precio Compra', type: 'number', step: '0.01', min: 0 },
    { name: 'precio_venta', label: 'Precio Venta', type: 'number', step: '0.01', min: 0, required: true },
    { name: 'stock_minimo', label: 'Stock Mínimo', type: 'number', min: 0, required: true },
    { name: 'ubicacion_almacen', label: 'Ubicación en Almacén', type: 'text' },
    { name: 'activo', label: 'Activo', type: 'checkbox' }
  ];

  const supplierFields = [
    { name: 'nombre_empresa', label: 'Nombre de Empresa', type: 'text', required: true },
    { name: 'contacto_principal', label: 'Contacto Principal', type: 'text' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'direccion', label: 'Dirección', type: 'textarea', fullWidth: true },
    { name: 'activo', label: 'Activo', type: 'checkbox', defaultValue: true }
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
        { value: 'entrada', label: 'Entrada de Stock' },
        { value: 'salida', label: 'Salida de Stock' }
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
      console.log('📝 Datos recibidos del formulario:', formData);

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

      console.log('📤 Datos procesados para enviar:', processedData);

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
      console.error('Error details:', error.response?.data);
      alert('Error al guardar los datos: ' + (error.response?.data?.detail || error.message));
    }
  };

const handleUpdateStock = async (formData) => {
  try {
    console.log('📦 Actualizando stock:', formData);
    
    // Usar el endpoint específico para stock
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
    console.error('Error details:', error.response?.data);
    alert('Error al actualizar stock: ' + (error.response?.data?.detail || error.message));
  }
};

  const handleEdit = (item) => {
    console.log('✏️ Editando item:', item);
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

  const getTabTitle = () => {
    switch (activeTab) {
      case 'parts': return 'Repuestos';
      case 'suppliers': return 'Proveedores';
      case 'categories': return 'Categorías';
      case 'movements': return 'Movimientos';
      default: return '';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'parts': return 'Gestión de repuestos e inventario';
      case 'suppliers': return 'Gestión de proveedores';
      case 'categories': return 'Gestión de categorías de repuestos';
      case 'movements': return 'Historial de movimientos de inventario';
      default: return '';
    }
  };

  const showAddButton = activeTab !== 'movements';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getTabTitle()}</h1>
          <p className="text-gray-600">{getTabDescription()}</p>
        </div>
        
        {showAddButton && (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nuevo{' '}
            {activeTab === 'parts' ? 'Repuesto' : 
             activeTab === 'suppliers' ? 'Proveedor' : 
             activeTab === 'categories' ? 'Categoría' : ''}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('parts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'parts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📦 Repuestos
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏢 Proveedores
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏷️ Categorías
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'movements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Movimientos
          </button>
        </nav>
      </div>

      {/* Form Modal para información general */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar' : 'Nuevo'}{' '}
                {activeTab === 'parts' ? 'Repuesto' : 
                 activeTab === 'suppliers' ? 'Proveedor' : 
                 activeTab === 'categories' ? 'Categoría' : ''}
              </h2>
              
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                Actualizar Stock - {selectedPart.nombre_repuesto}
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium">Información actual:</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="font-semibold">Stock actual:</span>
                    <span className={`ml-2 font-bold ${
                      selectedPart.stock_actual <= selectedPart.stock_minimo ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {selectedPart.stock_actual}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Stock mínimo:</span>
                    <span className="ml-2">{selectedPart.stock_minimo}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Código:</span>
                    <span className="ml-2">{selectedPart.codigo_repuesto}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Ubicación:</span>
                    <span className="ml-2">{selectedPart.ubicacion_almacen || 'No especificada'}</span>
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
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      ) : (
        <Table
          data={
            activeTab === 'parts' ? parts :
            activeTab === 'suppliers' ? suppliers :
            activeTab === 'categories' ? categories : movements
          }
          columns={
            activeTab === 'parts' ? partColumns :
            activeTab === 'suppliers' ? supplierColumns :
            activeTab === 'categories' ? categoryColumns : movementColumns
          }
          onEdit={activeTab !== 'movements' ? handleEdit : undefined}
          onDelete={activeTab !== 'movements' ? handleDelete : undefined}
          actions={activeTab !== 'movements'}
          emptyMessage={`No hay ${getTabTitle().toLowerCase()} registrados`}
        />
      )}
    </div>
  );
};

export default Inventory;