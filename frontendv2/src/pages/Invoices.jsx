import React, { useState, useEffect } from 'react';
import { FileText, PlusCircle, Search, Edit2, Trash2, X, Eye, DollarSign, Calendar, TrendingUp, CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react';
import Table from '../components/Table';
import Form from '../components/Form';
import { api } from '../services/api';

const Invoices = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadData();
    loadRelatedData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const response = await api.get('/facturas');
        setInvoices(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [ticketsRes, paymentMethodsRes] = await Promise.all([
        api.get('/tickets'),
        api.get('/formas-pago')
      ]);
      setTickets(ticketsRes.data);
      setPaymentMethods(paymentMethodsRes.data);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  // Función para calcular los totales basados en el ticket seleccionado
  const calculateTotals = (ticketId, impuestos = 0, descuentos = 0) => {
    const ticket = tickets.find(t => t.id_ticket === parseInt(ticketId));
    if (!ticket) return { subtotal: 0, total: 0 };

    // Calcular subtotal desde los servicios y repuestos del ticket
    const subtotalServicios = ticket.servicios?.reduce(
      (sum, servicio) => sum + parseFloat(servicio.precio || 0),
      0
    ) || 0;

    const subtotalRepuestos = ticket.repuestos?.reduce(
      (sum, repuesto) =>
        sum +
        (parseFloat(repuesto.precio_unitario || 0) *
          parseFloat(repuesto.cantidad || 0)),
      0
    ) || 0;

    const subtotal = subtotalServicios + subtotalRepuestos;

    // Calcular impuestos y aplicar descuentos
    const montoImpuestos = subtotal * (parseFloat(impuestos) / 100);
    const total = subtotal + montoImpuestos - parseFloat(descuentos);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      montoImpuestos: parseFloat(montoImpuestos.toFixed(2)),
    };
  };

  // ✅ FUNCIÓN CORREGIDA - Reemplaza la función existente
  const generateInvoiceDetails = (ticketId) => {
    const ticket = tickets.find(t => t.id_ticket === parseInt(ticketId));
    if (!ticket) return [];

    const detalles = [];

    // Agregar servicios al detalle
    if (ticket.servicios) {
      ticket.servicios.forEach(servicio => {
        detalles.push({
          tipo_item: 'servicio', // ✅ Cambiado de 'tipo' a 'tipo_item'
          id_item: servicio.id_servicio, // ✅ Agregar id_item
          descripcion: servicio.descripcion_servicio || 'Servicio',
          cantidad: 1,
          precio_unitario: parseFloat(servicio.precio || 0),
          total: parseFloat(servicio.precio || 0),
        });
      });
    }

    // Agregar repuestos al detalle
    if (ticket.repuestos) {
      ticket.repuestos.forEach(repuesto => {
        detalles.push({
          tipo_item: 'repuesto', // ✅ Cambiado de 'tipo' a 'tipo_item'
          id_item: repuesto.id_repuesto, // ✅ Agregar id_item
          descripcion: repuesto.descripcion_repuesto || 'Repuesto',
          cantidad: parseFloat(repuesto.cantidad || 1),
          precio_unitario: parseFloat(repuesto.precio_unitario || 0),
          total: parseFloat(
            (repuesto.precio_unitario || 0) * (repuesto.cantidad || 1)
          ),
        });
      });
    }

    return detalles;
  };

  const getPaymentStatusConfig = (status) => {
    const configs = {
      pendiente: {
        label: 'Pendiente',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600'
      },
      pagada: {
        label: 'Pagada',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
        iconColor: 'text-green-600'
      },
      parcial: {
        label: 'Parcial',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Clock,
        iconColor: 'text-blue-600'
      },
      anulada: {
        label: 'Anulada',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
        iconColor: 'text-red-600'
      }
    };
    return configs[status] || configs.pendiente;
  };

  const invoiceColumns = [
    { 
      key: 'numero_factura', 
      title: 'Factura',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-mono font-bold text-blue-600">#{value}</span>
        </div>
      )
    },
    { 
      key: 'cliente', 
      title: 'Cliente',
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
            {value?.nombres?.charAt(0)}{value?.apellidos?.charAt(0)}
          </div>
          <span className="font-semibold text-gray-900">
            {value ? `${value.nombres} ${value.apellidos}` : 'N/A'}
          </span>
        </div>
      )
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
      key: 'estado_pago', 
      title: 'Estado',
      render: (value) => {
        const config = getPaymentStatusConfig(value);
        const StatusIcon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
              {config.label}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'fecha_factura', 
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
      key: 'forma_pago', 
      title: 'Forma de Pago',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-500" />
          <span className="text-sm text-gray-700">{value?.nombre_forma_pago || 'N/A'}</span>
        </div>
      )
    }
  ];

  const invoiceFields = [
    { 
      name: 'id_ticket', 
      label: 'Ticket', 
      type: 'select', 
      required: true,
      options: tickets
        .filter(t => !t.facturas || t.facturas.length === 0)
        .map(t => ({ 
          value: t.id_ticket, 
          label: `Ticket #${t.numero_ticket} - ${t.cliente?.nombres} ${t.cliente?.apellidos} - Q${parseFloat(t.total_general || 0).toFixed(2)}` 
        })),
      onChange: (value) => {
        setSelectedTicket(value);
        const ticket = tickets.find(t => t.id_ticket === parseInt(value));
        if (ticket) {
          console.log('🎫 Ticket seleccionado:', ticket);
        }
      }
    },
    { 
      name: 'id_forma_pago', 
      label: 'Forma de Pago', 
      type: 'select', 
      required: true,
      options: paymentMethods.map(p => ({ value: p.id_forma_pago, label: p.nombre_forma_pago }))
    },
    { 
      name: 'impuestos', 
      label: 'Impuestos (%)', 
      type: 'number', 
      step: '0.01', 
      min: 0, 
      defaultValue: 0,
      helpText: 'Ingrese el porcentaje de impuestos (ej: 12 para 12%)',
      onChange: (value, formData) => {
        if (formData.id_ticket) {
          const totals = calculateTotals(formData.id_ticket, value, formData.descuentos || 0);
          console.log('📊 Totales recalculados (impuestos):', totals);
        }
      }
    },
    { 
      name: 'descuentos', 
      label: 'Descuentos (Q)', 
      type: 'number', 
      step: '0.01', 
      min: 0, 
      defaultValue: 0,
      helpText: 'Ingrese el monto del descuento en Quetzales',
      onChange: (value, formData) => {
        if (formData.id_ticket) {
          const totals = calculateTotals(formData.id_ticket, formData.impuestos || 0, value);
          console.log('📊 Totales recalculados (descuentos):', totals);
        }
      }
    },
    { 
      name: 'observaciones', 
      label: 'Observaciones', 
      type: 'textarea', 
      fullWidth: true 
    },
    { 
      name: 'fecha_vencimiento', 
      label: 'Fecha Vencimiento', 
      type: 'date' 
    }
  ];

  const reportFields = [
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true }
  ];

  const handleSubmit = async (formData) => {
    try {
      console.log('📝 Datos del formulario:', formData);
      
      if (editingItem) {
        // Actualizar factura existente
        const processedData = {
          id_forma_pago: parseInt(formData.id_forma_pago),
          impuestos: parseFloat(formData.impuestos || 0),
          descuentos: parseFloat(formData.descuentos || 0),
          observaciones: formData.observaciones || null,
          fecha_vencimiento: formData.fecha_vencimiento || null
        };
        
        console.log('📤 Actualizando factura:', processedData);
        await api.put(`/facturas/${editingItem.id_factura}`, processedData);
        alert('✅ Factura actualizada correctamente');
      } else {
        // ✅ CORRECCIÓN: Calcular subtotal, total y generar detalles automáticamente
        const { subtotal, total } = calculateTotals(
          formData.id_ticket, 
          formData.impuestos || 0, 
          formData.descuentos || 0
        );
        
        const detalles = generateInvoiceDetails(formData.id_ticket);
        
        const requestData = {
          id_ticket: parseInt(formData.id_ticket),
          id_forma_pago: parseInt(formData.id_forma_pago),
          subtotal: subtotal,
          total: total,
          impuestos: parseFloat(formData.impuestos || 0),
          descuentos: parseFloat(formData.descuentos || 0),
          observaciones: formData.observaciones || null,
          fecha_vencimiento: formData.fecha_vencimiento || null,
          detalles: detalles
        };
        
        console.log('📤 Creando factura:', requestData);
        console.log('📋 Detalles de la factura:', detalles);
        
        // Enviar en el body de la petición
        await api.post('/facturas', requestData);
        
        alert('✅ Factura creada correctamente');
      }
      
      setShowForm(false);
      setEditingItem(null);
      setSelectedTicket(null);
      loadData();
      loadRelatedData();
    } catch (error) {
      console.error('❌ Error saving invoice:', error);
      console.error('Error response:', error.response?.data);
      console.error('🔍 DETALLE COMPLETO:', JSON.stringify(error.response?.data, null, 2));
      alert('❌ Error al guardar la factura: ' + (error.response?.data?.detail || error.response?.data?.message || error.message));
    }
  };

  const handleReportSubmit = async (formData) => {
    try {
      console.log('📊 Generando reporte:', formData);
      const response = await api.get('/reportes/ventas', {
        params: formData
      });
      setReportData(response.data);
      setShowReportForm(false);
      alert('✅ Reporte generado correctamente');
    } catch (error) {
      console.error('❌ Error generating report:', error);
      alert('❌ Error al generar reporte: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMarkPaid = async (invoice) => {
    if (!confirm('¿Marcar esta factura como pagada?')) return;
    
    try {
      await api.put(`/facturas/${invoice.id_factura}/marcar-pagada`);
      alert('✅ Factura marcada como pagada');
      loadData();
    } catch (error) {
      console.error('❌ Error marking as paid:', error);
      alert('❌ Error al marcar como pagada: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleView = (invoice) => {
    const statusConfig = getPaymentStatusConfig(invoice.estado_pago);
    alert(
      `📄 FACTURA #${invoice.numero_factura}\n\n` +
      `👤 Cliente: ${invoice.cliente?.nombres} ${invoice.cliente?.apellidos}\n` +
      `💰 Subtotal: Q${parseFloat(invoice.subtotal || 0).toFixed(2)}\n` +
      `📈 Impuestos: Q${parseFloat(invoice.impuestos || 0).toFixed(2)}\n` +
      `🎁 Descuentos: Q${parseFloat(invoice.descuentos || 0).toFixed(2)}\n` +
      `💵 TOTAL: Q${parseFloat(invoice.total || 0).toFixed(2)}\n\n` +
      `📊 Estado: ${statusConfig.label}\n` +
      `💳 Forma de Pago: ${invoice.forma_pago?.nombre_forma_pago || 'N/A'}\n` +
      `📅 Fecha: ${new Date(invoice.fecha_factura).toLocaleDateString('es-ES')}`
    );
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;

    try {
      await api.delete(`/facturas/${item.id_factura}`);
      alert('✅ Factura eliminada correctamente');
      loadData();
    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      alert('❌ Error al eliminar la factura: ' + (error.response?.data?.detail || error.message));
    }
  };

  // Filtrado de datos
  const filteredData = () => {
    if (!searchTerm) return invoices;
    
    const searchLower = searchTerm.toLowerCase();
    return invoices.filter(invoice =>
      invoice.numero_factura?.toLowerCase().includes(searchLower) ||
      invoice.cliente?.nombres?.toLowerCase().includes(searchLower) ||
      invoice.cliente?.apellidos?.toLowerCase().includes(searchLower) ||
      invoice.estado_pago?.toLowerCase().includes(searchLower)
    );
  };

  // Estadísticas
  const stats = {
    total: invoices.length,
    pendientes: invoices.filter(i => i.estado_pago === 'pendiente').length,
    pagadas: invoices.filter(i => i.estado_pago === 'pagada').length,
    parciales: invoices.filter(i => i.estado_pago === 'parcial').length,
    anuladas: invoices.filter(i => i.estado_pago === 'anulada').length,
    total_ventas: invoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className={`p-2 ${activeTab === 'invoices' ? 'bg-blue-100' : 'bg-green-100'} rounded-xl`}>
                  {activeTab === 'invoices' ? (
                    <FileText className="w-7 h-7 text-blue-600" />
                  ) : (
                    <TrendingUp className="w-7 h-7 text-green-600" />
                  )}
                </div>
                {activeTab === 'invoices' ? 'Gestión de Facturas' : 'Reportes Financieros'}
              </h1>
              <p className="text-gray-600">
                {activeTab === 'invoices' 
                  ? 'Administra las facturas y pagos del taller' 
                  : 'Analiza las ventas y estadísticas financieras'}
              </p>
            </div>

            {activeTab === 'invoices' ? (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setSelectedTicket(null);
                  setShowForm(true);
                }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                <PlusCircle className="w-5 h-5" />
                Nueva Factura
              </button>
            ) : (
              <button
                onClick={() => setShowReportForm(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                <TrendingUp className="w-5 h-5" />
                Generar Reporte
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'invoices'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-5 h-5" /> 
              Facturas
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {invoices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === 'reports'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-5 h-5" /> 
              Reportes
            </button>
          </div>
        </div>

        {/* Stats Cards - Solo en tab de facturas */}
        {activeTab === 'invoices' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 shadow-md border border-yellow-200 hover:shadow-lg transition-shadow">
              <p className="text-xs text-yellow-700 mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-200 hover:shadow-lg transition-shadow">
              <p className="text-xs text-green-700 mb-1">Pagadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.pagadas}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-200 hover:shadow-lg transition-shadow">
              <p className="text-xs text-blue-700 mb-1">Parciales</p>
              <p className="text-2xl font-bold text-blue-600">{stats.parciales}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 shadow-md border border-red-200 hover:shadow-lg transition-shadow">
              <p className="text-xs text-red-700 mb-1">Anuladas</p>
              <p className="text-2xl font-bold text-red-600">{stats.anuladas}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 shadow-md border border-emerald-200 hover:shadow-lg transition-shadow">
              <p className="text-xs text-emerald-700 mb-1">Total Ventas</p>
              <p className="text-lg font-bold text-emerald-600">Q{stats.total_ventas.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Search Bar - Solo en tab de facturas */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número, cliente o estado..."
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

        {/* Invoice Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all animate-scale-in">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingItem ? (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Editar Factura
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      Nueva Factura
                    </>
                  )}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setSelectedTicket(null);
                  }}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {/* Vista previa de cálculos */}
                {selectedTicket && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">📊 Vista previa de cálculos</h3>
                    {(() => {
                      const ticket = tickets.find(t => t.id_ticket === parseInt(selectedTicket));
                      const totals = calculateTotals(
                        selectedTicket, 
                        0, // Sin impuestos para la vista base
                        0  // Sin descuentos para la vista base
                      );
                      
                      return (
                        <div className="text-sm text-blue-700 space-y-1">
                          <p><strong>Ticket:</strong> #{ticket?.numero_ticket}</p>
                          <p><strong>Subtotal base:</strong> Q{totals.subtotal.toFixed(2)}</p>
                          <p><strong>Cliente:</strong> {ticket?.cliente?.nombres} {ticket?.cliente?.apellidos}</p>
                          <p className="text-xs text-blue-600 mt-2">
                            * Los impuestos y descuentos se aplicarán al crear la factura
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <Form
                  fields={invoiceFields}
                  initialData={editingItem || {}}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    setSelectedTicket(null);
                  }}
                  submitText={editingItem ? 'Actualizar' : 'Crear'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Report Form Modal */}
        {showReportForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Generar Reporte
                </h2>
                <button
                  onClick={() => setShowReportForm(false)}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <Form
                  fields={reportFields}
                  onSubmit={handleReportSubmit}
                  onCancel={() => setShowReportForm(false)}
                  submitText="Generar Reporte"
                />
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium">Cargando facturas...</p>
              </div>
            ) : filteredData().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-lg font-medium">
                  {searchTerm ? 'No se encontraron facturas' : 'No hay facturas registradas'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza creando una nueva factura'}
                </p>
              </div>
            ) : (
              <Table
                data={filteredData()}
                columns={invoiceColumns}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            {reportData ? (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Reporte de Ventas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-blue-700">Total Facturas</p>
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{reportData.total_facturas}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-green-700">Total Ventas</p>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-900">Q{parseFloat(reportData.total_ventas || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-orange-700">Total Servicios</p>
                      <DollarSign className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-orange-900">Q{parseFloat(reportData.total_servicios || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-purple-700">Total Repuestos</p>
                      <DollarSign className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900">Q{parseFloat(reportData.total_repuestos || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-yellow-700">Facturas Pendientes</p>
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-900">{reportData.facturas_pendientes}</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border-2 border-teal-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-teal-700">Facturas Pagadas</p>
                      <CheckCircle className="w-8 h-8 text-teal-600" />
                    </div>
                    <p className="text-3xl font-bold text-teal-900">{reportData.facturas_pagadas}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="p-4 bg-gray-200 rounded-full mb-4 inline-block">
                  <TrendingUp className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600 mb-2">No hay reportes generados</p>
                <p className="text-sm text-gray-500">Genera un reporte para ver las estadísticas de ventas</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
);
};

export default Invoices;