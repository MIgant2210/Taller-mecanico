import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileSpreadsheet, PlusCircle, Search, Edit2, Trash2, X, Eye, Download, Calendar, User, DollarSign, Package, Wrench, AlertCircle, CheckCircle } from 'lucide-react';
import Table from '../components/Table';
import Form from '../components/Form';
import { cotizacionesService, clientsService, servicesService, inventoryService } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Componente para manejar el estado de la cotización
const EstadoCotizacion = ({ value, item, onUpdate, showAlert, setLoading, loading }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  
  const estados = {
    pendiente: { 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      hoverColor: 'hover:bg-yellow-50',
      label: '⏳ Pendiente',
      icon: '⏳'
    },
    aprobada: { 
      color: 'bg-green-100 text-green-700 border-green-300',
      hoverColor: 'hover:bg-green-50',
      label: '✅ Aprobada',
      icon: '✅'
    },
    rechazada: { 
      color: 'bg-red-100 text-red-700 border-red-300',
      hoverColor: 'hover:bg-red-50',
      label: '❌ Rechazada',
      icon: '❌'
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const estadoActual = value || 'pendiente';
  const config = estados[estadoActual] || estados.pendiente;

  const handleEstadoChange = async (nuevoEstado) => {
    if (nuevoEstado === estadoActual || loading) {
      setShowMenu(false);
      return;
    }

    try {
      setLoading(true);
      const response = await cotizacionesService.updateCotizacion(item.id_cotizacion, {
        id_cotizacion: item.id_cotizacion,
        id_cliente: item.id_cliente || item.cliente?.id_cliente,
        estado: nuevoEstado,
        // Mantener el resto de campos sin cambios
        subtotal: item.subtotal,
        total: item.total,
        impuestos: item.impuestos,
        descuentos: item.descuentos,
        observaciones: item.observaciones,
        detalles: item.detalles
      });

      if (response.status === 200) {
        onUpdate(nuevoEstado);
        showAlert(`Estado actualizado a: ${estados[nuevoEstado].label}`, 'success');
      } else {
        throw new Error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      let errorMsg = 'Error al actualizar el estado';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      showAlert(`❌ ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        className={`
          inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium 
          border-2 ${config.color} cursor-pointer hover:shadow-md transition-all
          ${showMenu ? 'ring-2 ring-purple-400 ring-offset-2' : ''}
        `}
      >
        {config.label}
      </button>
      
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-10 min-w-[160px] animate-fade-in-down"
        >
          {Object.entries(estados).map(([key, est]) => (
            <button
              key={key}
              onClick={() => handleEstadoChange(key)}
              className={`
                w-full px-4 py-2 text-left text-sm ${est.hoverColor} transition-colors
                first:rounded-t-lg last:rounded-b-lg flex items-center gap-2
                ${key === estadoActual ? 'font-bold' : ''}
              `}
              disabled={loading}
            >
              <span className="w-4">{est.icon}</span>
              {est.label}
              {key === estadoActual && (
                <span className="ml-auto text-purple-600">•</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);
  const [cotizacionItems, setCotizacionItems] = useState([]);
  const [exportData, setExportData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cotizacionesRes, clientsRes, servicesRes, partsRes] = await Promise.all([
        cotizacionesService.getCotizaciones(),
        clientsService.getClients(),
        servicesService.getServices(),
        inventoryService.getParts()
      ]);
      
      // CORRECCIÓN: Manejar estructura de respuesta
      const cotizacionesData = cotizacionesRes.data?.data || cotizacionesRes.data || [];
      const clientsData = clientsRes.data?.data || clientsRes.data || [];
      const servicesData = servicesRes.data?.data || servicesRes.data || [];
      const partsData = partsRes.data?.data || partsRes.data || [];
      
      setCotizaciones(Array.isArray(cotizacionesData) ? cotizacionesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setParts(Array.isArray(partsData) ? partsData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      showAlert('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sistema de alertas personalizado
  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  // Calcular totales
  const calcularTotales = (items, impuestos = 0, descuentos = 0) => {
    const subtotal = items.reduce((sum, item) => 
      sum + (parseFloat(item.precio_unitario || 0) * parseFloat(item.cantidad || 0)), 0
    );
    const montoImpuestos = (subtotal * parseFloat(impuestos || 0)) / 100;
    const montoDescuentos = (subtotal * parseFloat(descuentos || 0)) / 100;
    const total = subtotal + montoImpuestos - montoDescuentos;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      montoImpuestos: parseFloat(montoImpuestos.toFixed(2)),
      montoDescuentos: parseFloat(montoDescuentos.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };

  // CORRECCIÓN: Campos del formulario con clients actualizados
  const getCotizacionFields = () => [
    {
      name: 'id_cliente',
      label: 'Cliente',
      type: 'select',
      required: true,
      options: Array.isArray(clients) ? clients.map(c => ({
        value: c.id_cliente?.toString(),
        label: `${c.nombres} ${c.apellidos}`
      })) : []
    },
    {
      name: 'impuestos',
      label: 'Impuestos (%)',
      type: 'number',
      step: '0.01',
      min: 0,
      defaultValue: 0
    },
    {
      name: 'descuentos',
      label: 'Descuentos (%)',
      type: 'number',
      step: '0.01',
      min: 0,
      defaultValue: 0
    },
    {
      name: 'observaciones',
      label: 'Observaciones',
      type: 'textarea',
      fullWidth: true
    }
  ];

  // CORRECCIÓN: Columnas usando id_cotizacion en lugar de numero_cotizacion
  const cotizacionColumns = [
    {
      key: 'id_cotizacion',
      title: 'Número',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          </div>
          <span className="font-mono font-bold text-purple-600">#{value}</span>
        </div>
      )
    },
{
  key: 'cliente',
  title: 'Cliente',
  render: (value, item, extraData) => {
    // Intentar obtener el cliente de diferentes fuentes
    let clienteInfo = null;
    
    // 1. Si viene el objeto cliente completo en el item
    if (item.cliente && typeof item.cliente === 'object' && item.cliente.nombres) {
      clienteInfo = item.cliente;
    }
    // 2. Si tenemos extraData con clients
    else if (extraData?.clients && Array.isArray(extraData.clients)) {
      clienteInfo = extraData.clients.find(c => c.id_cliente === item.id_cliente);
    }
    // 3. Usar el array de clients del scope (fallback)
    else if (Array.isArray(clients)) {
      clienteInfo = clients.find(c => c.id_cliente === item.id_cliente);
    }
    
    const iniciales = clienteInfo ? 
      `${clienteInfo.nombres?.charAt(0) || 'C'}${clienteInfo.apellidos?.charAt(0) || 'L'}` : 
      'CL';
    
    const nombreCompleto = clienteInfo ? 
      `${clienteInfo.nombres} ${clienteInfo.apellidos}` : 
      'Cliente no encontrado';
    
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
          {iniciales}
        </div>
        <div>
          <span className="font-semibold text-gray-900 block">
            {nombreCompleto}
          </span>
          {clienteInfo?.email && (
            <span className="text-xs text-gray-500">
              {clienteInfo.email}
            </span>
          )}
        </div>
      </div>
    );
  }
},
    {
      key: 'subtotal',
      title: 'Subtotal',
      render: (value) => (
        <span className="text-sm text-gray-600">
          Q {parseFloat(value || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'total',
      title: 'Total',
      render: (value) => (
        <span className="font-semibold text-green-600 text-lg">
          Q {parseFloat(value || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'fecha_cotizacion',
      title: 'Fecha',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700">
            {new Date(value).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      )
    },
{
  key: 'estado',
  title: 'Estado',
  render: (value, item) => <EstadoCotizacion 
    value={value} 
    item={item} 
    onUpdate={(nuevoEstado) => {
      const cotizacionesActualizadas = cotizaciones.map(c => 
        c.id_cotizacion === item.id_cotizacion 
          ? { ...c, estado: nuevoEstado }
          : c
      );
      setCotizaciones(cotizacionesActualizadas);
    }}
    showAlert={showAlert}
    setLoading={setLoading}
    loading={loading}
  />
}
  ];

  const handleSubmit = async (formData) => {
    try {
      if (cotizacionItems.length === 0) {
        showAlert('Debes agregar al menos un item a la cotización', 'error');
        return;
      }

      const totals = calcularTotales(
        cotizacionItems,
        formData.impuestos || 0,
        formData.descuentos || 0
      );

      const payload = {
        id_cliente: parseInt(formData.id_cliente),
        subtotal: totals.subtotal,
        total: totals.total,
        impuestos: parseFloat(formData.impuestos || 0),
        descuentos: parseFloat(formData.descuentos || 0),
        observaciones: formData.observaciones || null,
        detalles: cotizacionItems.map(item => ({
          tipo_item: item.tipo_item,
          id_item: parseInt(item.id_item),
          descripcion: item.descripcion,
          cantidad: parseFloat(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.cantidad) * parseFloat(item.precio_unitario)
        }))
      };

      console.log('📤 Enviando cotización:', payload);

      if (editingItem) {
        // CORRECCIÓN: Usar cotizacionesService en lugar de api directo
        await cotizacionesService.updateCotizacion(editingItem.id_cotizacion, payload);
        showAlert('✅ Cotización actualizada correctamente', 'success');
      } else {
        await cotizacionesService.createCotizacion(payload);
        showAlert('✅ Cotización creada correctamente', 'success');
      }

      setShowForm(false);
      setEditingItem(null);
      setCotizacionItems([]);
      loadData();
    } catch (error) {
      console.error('❌ Error saving cotizacion:', error);
      showAlert('❌ Error al guardar la cotización', 'error');
    }
  };

  const handleView = (cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setShowDetailModal(true);
  };

  const handleEdit = (cotizacion) => {
    setEditingItem(cotizacion);
    setCotizacionItems(cotizacion.detalles || []);
    setShowForm(true);
  };

 const handleDelete = async (cotizacion) => {
  try {
    // Validación inicial
    if (!cotizacion?.id_cotizacion) {
      throw new Error('Cotización inválida');
    }

    // Obtener cliente
    const clientId = cotizacion.id_cliente || cotizacion.cliente?.id_cliente;
    const cliente = clients.find(c => c.id_cliente === clientId);
    
    if (!cliente) {
      throw new Error('No se puede eliminar: Cliente no encontrado');
    }

    // Confirmar eliminación con detalles de la cotización
    const confirmMessage = [
      `¿Eliminar cotización #${cotizacion.id_cotizacion}?`,
      '',
      `Cliente: ${cliente.nombres} ${cliente.apellidos}`,
      `Email: ${cliente.email || 'No disponible'}`,
      `Teléfono: ${cliente.telefono || 'No disponible'}`,
      `Fecha: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })}`,
      `Estado: ${cotizacion.estado || 'Pendiente'}`,
      `Total: Q${parseFloat(cotizacion.total).toFixed(2)}`,
      '',
      'Esta acción no se puede deshacer.'
    ].join('\n');

    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    
    // Eliminar cotización
    const response = await cotizacionesService.deleteCotizacion(cotizacion.id_cotizacion);
    
    if (response.status === 200) {
      // Actualizar estado local inmediatamente
      setCotizaciones(prevCotizaciones => 
        prevCotizaciones.filter(c => c.id_cotizacion !== cotizacion.id_cotizacion)
      );
      showAlert('✅ Cotización eliminada correctamente', 'success');
    } else {
      throw new Error('Error al eliminar la cotización');
    }
  } catch (error) {
    console.error('❌ Error eliminando cotización:', error);
    
    let errorMsg = 'Error al eliminar la cotización';
    
    if (error.response?.status === 404) {
      errorMsg = 'La cotización ya no existe';
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    showAlert(`❌ ${errorMsg}`, 'error');
  } finally {
    setLoading(false);
  }
};

  const handleAddItem = (type) => {
    const item = {
      tipo_item: type,
      id_item: '',
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0
    };
    setCotizacionItems([...cotizacionItems, item]);
  };

  const handleRemoveItem = (index) => {
    setCotizacionItems(cotizacionItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...cotizacionItems];
    newItems[index][field] = value;

    // Si cambia el id_item, actualizar descripción y precio
    if (field === 'id_item') {
      let item = null;
      
      if (newItems[index].tipo_item === 'servicio') {
        item = Array.isArray(services) ? 
          services.find(s => s.id_servicio === parseInt(value)) : null;
          
        if (item) {
          newItems[index].descripcion = item.nombre_servicio;
          newItems[index].precio_unitario = parseFloat(item.precio_base || 0);
        }
      } else {
        item = Array.isArray(parts) ? 
          parts.find(p => p.id_repuesto === parseInt(value)) : null;
          
        if (item) {
          newItems[index].descripcion = item.nombre_repuesto;
          newItems[index].precio_unitario = parseFloat(item.precio_venta || 0);
        }
      }
      
      // Si no se encuentra el item, limpiar los campos
      if (!item) {
        newItems[index].descripcion = '';
        newItems[index].precio_unitario = 0;
      }
    }
    
    // Actualizar subtotal cuando cambia cantidad o precio
    if (field === 'cantidad' || field === 'precio_unitario') {
      const cantidad = parseFloat(field === 'cantidad' ? value : newItems[index].cantidad) || 0;
      const precio = parseFloat(field === 'precio_unitario' ? value : newItems[index].precio_unitario) || 0;
      newItems[index].subtotal = cantidad * precio;
    }

    setCotizacionItems(newItems);
  };

  // CORRECCIÓN: Función de exportación PDF sin jspdf-autotable
const exportToPDF = (cotizacion) => {
  const clienteData = Array.isArray(clients) ? 
    clients.find(c => c.id_cliente === (cotizacion.id_cliente || cotizacion.cliente?.id_cliente)) : null;

  if (!clienteData) {
    showAlert('❌ No se pudo generar el PDF: Información del cliente no encontrada.', 'error');
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // =================================================================
  // DIBUJAR DISEÑO BASE (HEADER Y FOOTER)
  // =================================================================
  const drawBaseLayout = () => {
    // Header background
    doc.setFillColor(41, 51, 61); // Dark gray
    doc.rect(0, 0, pageWidth, 30, 'F');

    // Footer background
    doc.setFillColor(41, 51, 61);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

    // Logo/Nombre del Taller
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('AUTOPRO', 20, 20);

    // Footer text
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Gracias por su confianza | www.autopro.com | (502) 1234-5678', pageWidth / 2, pageHeight - 8, { align: 'center' });
  };

  drawBaseLayout();

  // =================================================================
  // TÍTULO Y DATOS DE LA COTIZACIÓN
  // =================================================================
  let yPos = 45;
  doc.setFontSize(26);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(41, 51, 61);
  doc.text('COTIZACIÓN', 20, yPos);

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Número de Cotización:', pageWidth - 70, yPos - 10);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(79, 70, 229); // Purple
  doc.text(`#${cotizacion.id_cotizacion}`, pageWidth - 20, yPos - 10, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha de Emisión: ${new Date(cotizacion.fecha_cotizacion).toLocaleDateString('es-ES')}`, pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 10;

  // =================================================================
  // INFORMACIÓN DEL CLIENTE
  // =================================================================
  doc.setFillColor(240, 242, 245); // Light gray background
  doc.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');
  
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(41, 51, 61);
  doc.text('CLIENTE:', 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);
  
  doc.text('Nombre:', 20, yPos + 8);
  doc.text(`${clienteData.nombres} ${clienteData.apellidos}`, 50, yPos + 8);
  
  doc.text('Teléfono:', 20, yPos + 14);
  doc.text(clienteData.telefono || 'N/A', 50, yPos + 14);
  
  doc.text('Email:', pageWidth / 2, yPos + 8);
  doc.text(clienteData.email || 'N/A', pageWidth / 2 + 20, yPos + 8);
  
  yPos += 35;

  // =================================================================
  // TABLA DE DETALLES
  // =================================================================
  const tableHeaders = [['#', 'Descripción', 'Tipo', 'Cant.', 'Precio Unit.', 'Subtotal']];
  const tableData = (cotizacion.detalles || []).map((d, i) => [
    i + 1,
    d.descripcion,
    d.tipo_item.charAt(0).toUpperCase() + d.tipo_item.slice(1),
    d.cantidad,
    `Q ${parseFloat(d.precio_unitario || 0).toFixed(2)}`,
    `Q ${parseFloat(d.subtotal || 0).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 51, 61], // Dark Gray
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 65 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    },
    didDrawPage: (data) => {
      // Redraw header and footer on new pages
      if (data.pageNumber > 1) {
        drawBaseLayout();
      }
    }
  });

  // When using autoTable(doc, ...) the plugin stores lastAutoTable on the doc instance
  // but in some bundlers it may be attached differently; guard access below.
  yPos = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 15 : yPos + 15;

  // =================================================================
  // TOTALES
  // =================================================================
  const subtotal = parseFloat(cotizacion.subtotal || 0);
  const impuestos = (subtotal * parseFloat(cotizacion.impuestos || 0)) / 100;
  const descuentos = (subtotal * parseFloat(cotizacion.descuentos || 0)) / 100;
  const total = parseFloat(cotizacion.total || 0);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(80, 80, 80);

  const totalsX = pageWidth - 80;
  const valuesX = pageWidth - 20;

  doc.text('Subtotal:', totalsX, yPos);
  doc.text(`Q ${subtotal.toFixed(2)}`, valuesX, yPos, { align: 'right' });
  yPos += 7;

  doc.text(`Impuestos (${cotizacion.impuestos || 0}%):`, totalsX, yPos);
  doc.text(`Q ${impuestos.toFixed(2)}`, valuesX, yPos, { align: 'right' });
  yPos += 7;

  doc.setTextColor(220, 38, 38); // Red for discount
  doc.text(`Descuentos (${cotizacion.descuentos || 0}%):`, totalsX, yPos);
  doc.text(`- Q ${descuentos.toFixed(2)}`, valuesX, yPos, { align: 'right' });
  yPos += 7;

  doc.setDrawColor(180, 180, 180);
  doc.line(totalsX - 5, yPos, valuesX, yPos);
  yPos += 5;

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(41, 51, 61);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(`Q ${total.toFixed(2)}`, valuesX, yPos, { align: 'right' });

  // =================================================================
  // OBSERVACIONES Y PIE DE PÁGINA
  // =================================================================
  yPos = doc.lastAutoTable.finalY + 15;
  
  if (cotizacion.observaciones) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(41, 51, 61);
    doc.text('Observaciones:', 20, yPos);
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    const obsLines = doc.splitTextToSize(cotizacion.observaciones, pageWidth - 120);
    doc.text(obsLines, 20, yPos + 5);
  }

  const finalY = pageHeight - 25;
  doc.setFontSize(9);
  doc.setFont(undefined, 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Esta cotización es válida por 30 días.', pageWidth / 2, finalY, { align: 'center' });
  doc.text('Los precios no incluyen imprevistos y están sujetos a cambios sin previo aviso.', pageWidth / 2, finalY + 5, { align: 'center' });

  // =================================================================
  // GUARDAR EL DOCUMENTO
  // =================================================================
  doc.save(`Cotizacion_AutoPro_${cotizacion.id_cotizacion}.pdf`);
  showAlert('✅ PDF generado con éxito', 'success');
};

  const filteredData = useCallback(() => {
    if (!Array.isArray(cotizaciones)) return [];
    
    let filtered = [...cotizaciones];
    
    // Aplicar filtro de búsqueda si existe
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(cot => {
        // Buscar el cliente correspondiente
        const clienteMatch = Array.isArray(clients) ? 
          clients.find(c => c.id_cliente === (cot.id_cliente || cot.cliente?.id_cliente)) : null;
        
        // Búsqueda por número de cotización
        const matchesNumero = cot.id_cotizacion?.toString().includes(searchLower);
        
        // Búsqueda en campos del cliente
        const matchesCliente = clienteMatch && [
          clienteMatch.nombres,
          clienteMatch.apellidos,
          `${clienteMatch.nombres} ${clienteMatch.apellidos}`,
          clienteMatch.email,
          clienteMatch.telefono
        ].some(field => field?.toLowerCase().includes(searchLower));
        
        // Búsqueda en otros campos
        const matchesOtros = [
          cot.estado,
          cot.observaciones
        ].some(field => field?.toLowerCase().includes(searchLower));
        
        return matchesNumero || matchesCliente || matchesOtros;
      });
    }
    
    // Ordenar por fecha más reciente
    filtered.sort((a, b) => new Date(b.fecha_cotizacion) - new Date(a.fecha_cotizacion));
    
    return filtered;
  }, [cotizaciones, searchTerm, clients]);

const stats = {
  total: cotizaciones.length,
  pendientes: cotizaciones.filter(c => (c.estado || 'pendiente') === 'pendiente').length,
  aprobadas: cotizaciones.filter(c => c.estado === 'aprobada').length,
  rechazadas: cotizaciones.filter(c => c.estado === 'rechazada').length,
  total_monto: cotizaciones.reduce((sum, c) => sum + parseFloat(c.total || 0), 0)
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Alert personalizado */}
        {alert && (
          <div className={`fixed top-4 right-4 z-50 animate-fade-in ${
            alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3`}>
            {alert.type === 'success' ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span className="font-medium">{alert.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <FileSpreadsheet className="w-7 h-7 text-purple-600" />
                </div>
                Gestión de Cotizaciones
              </h1>
              <p className="text-gray-600">Administra las cotizaciones de servicios y repuestos</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setCotizacionItems([]);
                  setShowForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                <PlusCircle className="w-5 h-5" />
                Nueva Cotización
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - RESTAURADO */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-md border border-yellow-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-yellow-700 mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-green-700 mb-1">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.aprobadas}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-md border border-red-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-red-700 mb-1">Rechazadas</p>
            <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-md border border-purple-200 hover:shadow-lg transition-shadow">
            <p className="text-xs text-purple-700 mb-1">Total Monto</p>
            <p className="text-lg font-bold text-purple-600">Q{stats.total_monto.toFixed(2)}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-lg font-medium">Cargando cotizaciones...</p>
            </div>
          ) : filteredData().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <FileSpreadsheet className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg font-medium">
                {searchTerm ? 'No se encontraron cotizaciones' : 'No hay cotizaciones registradas'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando una nueva cotización'}
              </p>
            </div>
          ) : (
            <Table
              data={filteredData()}
              columns={cotizacionColumns}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              extraData={{ clients }}
            />
          )}
        </div>

        {/* Form Modal - RESTAURADO COMPLETO */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden max-h-[90vh]">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Editar Cotización
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Nueva Cotización
                    </>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setCotizacionItems([]);
                  }}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* CORRECCIÓN: Usar getCotizacionFields() para campos actualizados */}
                <Form
                  fields={getCotizacionFields()}
                  initialData={editingItem || {}}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setCotizacionItems([]);
                  }}
                  submitText={editingItem ? 'Actualizar' : 'Crear'}
                />

                {/* Items Section */}
                <div className="mt-6 border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Items de la Cotización</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddItem('servicio')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Wrench className="w-4 h-4" />
                        Agregar Servicio
                      </button>
                      <button
                        onClick={() => handleAddItem('repuesto')}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        Agregar Repuesto
                      </button>
                    </div>
                  </div>

                  {cotizacionItems.length > 0 ? (
                    <div className="space-y-3">
                      {cotizacionItems.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                              <span className={`inline-block px-3 py-2 rounded text-sm font-medium ${
                                item.tipo_item === 'servicio'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {item.tipo_item === 'servicio' ? '🔧 Servicio' : '📦 Repuesto'}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                              <select
                                value={item.id_item}
                                onChange={(e) => handleItemChange(index, 'id_item', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="">Seleccionar...</option>
                                {item.tipo_item === 'servicio'
                                  ? services.map(s => (
                                      <option key={s.id_servicio} value={s.id_servicio}>
                                        {s.nombre_servicio}
                                      </option>
                                    ))
                                  : parts.map(p => (
                                      <option key={p.id_repuesto} value={p.id_repuesto}>
                                        {p.nombre_repuesto}
                                      </option>
                                    ))
                                }
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                              <input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unit.</label>
                              <input
                                type="number"
                                value={item.precio_unitario}
                                onChange={(e) => handleItemChange(index, 'precio_unitario', e.target.value)}
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Totales */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
                        {(() => {
                          const formData = editingItem || {};
                          const totals = calcularTotales(
                            cotizacionItems,
                            formData.impuestos || 0,
                            formData.descuentos || 0
                          );
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Subtotal:</span>
                                <span className="font-semibold">Q {totals.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Impuestos:</span>
                                <span className="font-semibold">Q {totals.montoImpuestos.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Descuentos:</span>
                                <span className="font-semibold">- Q {totals.montoDescuentos.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-lg font-bold text-purple-900 pt-2 border-t-2 border-purple-300">
                                <span>TOTAL:</span>
                                <span>Q {totals.total.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500">No hay items agregados</p>
                      <p className="text-sm text-gray-400 mt-1">Agrega servicios o repuestos a la cotización</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal - RESTAURADO COMPLETO */}
        {showDetailModal && selectedCotizacion && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6" />
                  {/* CORRECCIÓN: Usar id_cotizacion */}
                  Cotización #{selectedCotizacion.id_cotizacion}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToPDF(selectedCotizacion)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedCotizacion(null);
                    }}
                    className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Encabezado de la cotización */}
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">COTIZACIÓN</h3>
                      {/* CORRECCIÓN: Usar id_cotizacion */}
                      <p className="text-gray-600">#{selectedCotizacion.id_cotizacion}</p>
                      <p className="text-sm text-gray-500">
                        Fecha: {new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">AutoPro</p>
                      <p className="text-sm text-gray-600">Sistema de Gestión</p>
                      <p className="text-sm text-gray-600">Taller Mecánico</p>
                    </div>
                  </div>

                  {/* Información del cliente */}
                  {/* Información del cliente */}
<div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
  <div className="flex items-center gap-3 mb-3">
    <User className="w-6 h-6 text-blue-600" />
    <h4 className="text-lg font-semibold text-blue-900">Información del Cliente</h4>
  </div>
  {(() => {
    // CORRECCIÓN: Manejar tanto cliente completo como solo id_cliente
    let clienteInfo = selectedCotizacion.cliente;
    
    if (!clienteInfo || typeof clienteInfo === 'number' || (typeof clienteInfo === 'object' && !clienteInfo.nombres)) {
      clienteInfo = Array.isArray(clients) ? 
        clients.find(c => c.id_cliente === selectedCotizacion.id_cliente) : null;
    }
    
    return (
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Nombre:</p>
          <p className="font-semibold text-gray-900">
            {clienteInfo ? `${clienteInfo.nombres} ${clienteInfo.apellidos}` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Teléfono:</p>
          <p className="font-semibold text-gray-900">
            {clienteInfo?.telefono || 'N/A'}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-600">Email:</p>
          <p className="font-semibold text-gray-900">
            {clienteInfo?.email || 'N/A'}
          </p>
        </div>
      </div>
    );
  })()}
</div>
                </div>

                {/* Detalles de items */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalle de Servicios y Repuestos</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Tipo</th>
                          <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Cantidad</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Precio Unit.</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedCotizacion.detalles?.map((detalle, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{detalle.descripcion}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                detalle.tipo_item === 'servicio'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {detalle.tipo_item === 'servicio' ? (
                                  <><Wrench className="w-3 h-3" /> Servicio</>
                                ) : (
                                  <><Package className="w-3 h-3" /> Repuesto</>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-900">{detalle.cantidad}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">
                              Q {parseFloat(detalle.precio_unitario).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              Q {parseFloat(detalle.subtotal).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totales */}
                <div className="flex justify-end">
                  <div className="w-80 bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-semibold">Q {parseFloat(selectedCotizacion.subtotal).toFixed(2)}</span>
                      </div>
                      {selectedCotizacion.impuestos > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Impuestos ({selectedCotizacion.impuestos}%):</span>
                          <span className="font-semibold">
                            Q {((parseFloat(selectedCotizacion.subtotal) * parseFloat(selectedCotizacion.impuestos)) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {selectedCotizacion.descuentos > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Descuentos ({selectedCotizacion.descuentos}%):</span>
                          <span className="font-semibold text-red-600">
                            - Q {((parseFloat(selectedCotizacion.subtotal) * parseFloat(selectedCotizacion.descuentos)) / 100).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xl font-bold text-purple-900 pt-3 border-t-2 border-purple-300">
                        <span>TOTAL:</span>
                        <span>Q {parseFloat(selectedCotizacion.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                {selectedCotizacion.observaciones && (
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Observaciones:</p>
                    <p className="text-sm text-gray-600">{selectedCotizacion.observaciones}</p>
                  </div>
                )}

                {/* Pie de página */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                  <p>Esta cotización tiene una validez de 30 días a partir de la fecha de emisión.</p>
                  <p className="mt-1">AutoPro - Sistema de Gestión de Taller Mecánico</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal - CORREGIDO */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Exportar Cotizaciones
                </h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Selecciona el rango de fechas para exportar las cotizaciones a PDF
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={exportData?.startDate || ''}
                      onChange={(e) => setExportData(prev => ({...prev, startDate: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={exportData?.endDate || ''}
                      onChange={(e) => setExportData(prev => ({...prev, endDate: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      setExportData(null);
                    }}
                    className="flex-1 px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (!exportData?.startDate || !exportData?.endDate) {
                        showAlert('❌ Por favor selecciona ambas fechas', 'error');
                        return;
                      }

                      const start = new Date(exportData.startDate);
                      const end = new Date(exportData.endDate);
                      end.setHours(23, 59, 59);

                      if (start > end) {
                        showAlert('❌ La fecha de inicio debe ser anterior a la fecha final', 'error');
                        return;
                      }

                      const cotizacionesFiltradas = cotizaciones.filter(cot => {
                        const fecha = new Date(cot.fecha_cotizacion);
                        return fecha >= start && fecha <= end;
                      });

                      if (cotizacionesFiltradas.length === 0) {
                        showAlert('❌ No hay cotizaciones en el rango de fechas seleccionado', 'error');
                        return;
                      }

                      showAlert('📄 Generando reporte PDF...', 'success');
                      
                      // Generar PDF para cada cotización
                      cotizacionesFiltradas.forEach(cotizacion => {
                        exportToPDF(cotizacion);
                      });

                      setShowExportModal(false);
                      setExportData(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Exportar {exportData?.startDate && exportData?.endDate ? 
                      `(${cotizaciones.filter(cot => {
                        const fecha = new Date(cot.fecha_cotizacion);
                        const start = new Date(exportData.startDate);
                        const end = new Date(exportData.endDate);
                        end.setHours(23, 59, 59);
                        return fecha >= start && fecha <= end;
                      }).length} cotizaciones)` : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cotizaciones;