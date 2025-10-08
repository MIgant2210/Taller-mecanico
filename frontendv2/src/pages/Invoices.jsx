import React, { useState, useEffect } from 'react';
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

  const invoiceColumns = [
    { key: 'numero_factura', title: 'Número' },
    { 
      key: 'cliente', 
      title: 'Cliente',
      render: (value) => value ? `${value.nombres} ${value.apellidos}` : 'N/A'
    },
    { key: 'total', title: 'Total', render: (value) => `Q${value}` },
    { 
      key: 'estado_pago', 
      title: 'Estado Pago',
      render: (value) => {
        const statusMap = {
          pendiente: '🟡 Pendiente',
          pagada: '🟢 Pagada',
          parcial: '🔵 Parcial',
          anulada: '🔴 Anulada'
        };
        return statusMap[value] || value;
      }
    },
    { 
      key: 'fecha_factura', 
      title: 'Fecha',
      render: (value) => new Date(value).toLocaleDateString('es-ES')
    },
    { 
      key: 'forma_pago', 
      title: 'Forma de Pago',
      render: (value) => value?.nombre_forma_pago || 'N/A'
    }
  ];

  const invoiceFields = [
    { name: 'id_ticket', label: 'Ticket', type: 'select', required: true,
      options: tickets
        .filter(t => !t.facturas || t.facturas.length === 0)
        .map(t => ({ value: t.id_ticket, label: `Ticket #${t.numero_ticket} - ${t.cliente?.nombres}` }))
    },
    { name: 'id_forma_pago', label: 'Forma de Pago', type: 'select', required: true,
      options: paymentMethods.map(p => ({ value: p.id_forma_pago, label: p.nombre_forma_pago }))
    },
    { name: 'impuestos', label: 'Impuestos', type: 'number', step: '0.01', min: 0, defaultValue: 0 },
    { name: 'descuentos', label: 'Descuentos', type: 'number', step: '0.01', min: 0, defaultValue: 0 },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea', fullWidth: true },
    { name: 'fecha_vencimiento', label: 'Fecha Vencimiento', type: 'date' }
  ];

  const reportFields = [
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true }
  ];

  const handleSubmit = async (formData) => {
    try {
      if (editingItem) {
        await api.put(`/facturas/${editingItem.id_factura}`, formData);
      } else {
        // Para nueva factura, generar desde ticket
        const ticket = tickets.find(t => t.id_ticket === formData.id_ticket);
        if (ticket) {
          await api.post(`/facturas/generar-desde-ticket/${formData.id_ticket}`, {
            forma_pago_id: formData.id_forma_pago,
            impuestos: formData.impuestos || 0,
            descuentos: formData.descuentos || 0,
            observaciones: formData.observaciones
          });
        }
      }
      
      setShowForm(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error al guardar la factura');
    }
  };

  const handleReportSubmit = async (formData) => {
    try {
      const response = await api.get('/reportes/ventas', {
        params: formData
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte');
    }
  };

  const handleMarkPaid = async (invoice) => {
    try {
      await api.put(`/facturas/${invoice.id_factura}/marcar-pagada`);
      loadData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error al marcar como pagada');
    }
  };

  const handleView = (invoice) => {
    // Aquí se podría implementar la vista detallada de factura
    alert(`Factura #${invoice.numero_factura}\nCliente: ${invoice.cliente?.nombres}\nTotal: Q${invoice.total}`);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'invoices': return 'Facturas';
      case 'reports': return 'Reportes';
      default: return '';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getTabTitle()}</h1>
          <p className="text-gray-600">
            {activeTab === 'invoices' && 'Gestión de facturas y pagos'}
            {activeTab === 'reports' && 'Reportes financieros'}
          </p>
        </div>
        
        {activeTab === 'invoices' && (
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nueva Factura
          </button>
        )}
        
        {activeTab === 'reports' && (
          <button
            onClick={() => setShowReportForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 Generar Reporte
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🧾 Facturas
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📈 Reportes
          </button>
        </nav>
      </div>

      {/* Invoice Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar Factura' : 'Nueva Factura'}
              </h2>
              
              <Form
                fields={invoiceFields}
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

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Generar Reporte de Ventas</h2>
              
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
        loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Cargando facturas...</div>
          </div>
        ) : (
          <Table
            data={invoices}
            columns={invoiceColumns}
            onView={handleView}
            onEdit={handleEdit}
            actions={true}
            emptyMessage="No hay facturas registradas"
          />
        )
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          {reportData ? (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Reporte de Ventas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-600">Total Facturas</p>
                  <p className="text-2xl font-bold">{reportData.total_facturas}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-green-600">Total Ventas</p>
                  <p className="text-2xl font-bold">Q{reportData.total_ventas}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                  <p className="text-sm text-orange-600">Total Servicios</p>
                  <p className="text-2xl font-bold">Q{reportData.total_servicios}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-sm text-purple-600">Total Repuestos</p>
                  <p className="text-2xl font-bold">Q{reportData.total_repuestos}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-sm text-yellow-600">Facturas Pendientes</p>
                  <p className="text-2xl font-bold">{reportData.facturas_pendientes}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded">
                  <p className="text-sm text-teal-600">Facturas Pagadas</p>
                  <p className="text-2xl font-bold">{reportData.facturas_pagadas}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Genera un reporte para ver las estadísticas de ventas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Invoices;