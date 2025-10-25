import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, Download, FileText, FileSpreadsheet, Calendar, RefreshCw } from 'lucide-react';
import { inventoryService } from '../services/api';
import Table from '../components/Table';

const MovementReport = () => {
  const [data, setData] = useState([]);
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validar que la fecha final no sea menor que la fecha inicial
      if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
        setError('La fecha final no puede ser menor que la fecha inicial');
        setData([]);
        return;
      }

      const params = {};
      // Modificar los datos para que coincidan con lo que espera el backend
      if (tipo) params.tipo_movimiento = tipo === 'entrada' ? 1 : 2;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await inventoryService.getMovements(params);
       const movementData = (res.data || []).map(movement => ({
         ...movement,
         tipo: movement.tipo_movimiento?.id === 1 ? 'entrada' : 'salida',
         fecha: movement.fecha_movimiento,
         descripcion: movement.observaciones || 'Sin observaciones',
         repuesto: movement.repuesto,
         repuesto_nombre: movement.repuesto?.nombre_repuesto || movement.repuesto?.nombre || '—',
         cantidad: movement.tipo_movimiento?.id === 2 ? -movement.cantidad : movement.cantidad
       }));
       setData(movementData);
      setError(null);
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      setError('No se pudieron cargar los movimientos. Por favor, intenta nuevamente.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    setExportingCSV(true);
    try {
      const headers = ['Fecha', 'Tipo', 'Repuesto', 'Cantidad', 'Descripción'];
      const csvData = data.map(item => [
        new Date(item.fecha).toLocaleDateString('es-GT'),
        item.tipo || '—',
        item.repuesto_nombre || item.repuesto?.nombre_repuesto || '—',
        item.cantidad || '0',
        item.descripcion || '—'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `movimientos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exportando CSV:', err);
      alert('No se pudo exportar el CSV. Por favor, intenta nuevamente.');
    } finally {
      setExportingCSV(false);
    }
  };

  const exportPDF = async () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    setExportingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      // Crear un elemento temporal para el reporte
      const reportElement = document.createElement('div');
      reportElement.style.padding = '20px';
      reportElement.style.backgroundColor = 'white';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      
      // Contenido del reporte
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 5px;">Reporte de Movimientos</h1>
          <p style="color: #6b7280; margin: 0;">Fecha: ${new Date().toLocaleDateString('es-GT')}</p>
          ${tipo ? `<p style="color: #6b7280; margin: 0;">Tipo: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>` : ''}
          ${fechaInicio && fechaFin ? `<p style="color: #6b7280; margin: 0;">Período: ${fechaInicio} a ${fechaFin}</p>` : ''}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #2563eb; color: white;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fecha</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tipo</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Repuesto</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Cantidad</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; border: 1px solid #ddd;">${new Date(item.fecha).toLocaleDateString('es-GT')}</td>
                <td style="padding: 8px; border: 1px solid #ddd; ${
                  item.tipo === 'entrada' ? 'color: #047857;' : 'color: #dc2626;'
                }">${item.tipo ? item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1) : '—'}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.repuesto_nombre || item.repuesto?.nombre_repuesto || '—'}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; ${
                  item.cantidad > 0 ? 'color: #047857;' : 'color: #dc2626;'
                }">${item.cantidad > 0 ? `+${item.cantidad}` : item.cantidad}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.descripcion || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
          <h3 style="color: #374151; margin-bottom: 10px;">Resumen</h3>
          <p style="margin: 5px 0;"><strong>Total Movimientos:</strong> ${data.length}</p>
          <p style="margin: 5px 0;"><strong>Entradas:</strong> ${data.filter(item => item.tipo === 'entrada').length}</p>
          <p style="margin: 5px 0;"><strong>Salidas:</strong> ${data.filter(item => item.tipo === 'salida').length}</p>
        </div>
      `;

      // Agregar al documento temporalmente
      document.body.appendChild(reportElement);
      
      // Capturar como imagen
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // Limpiar
      document.body.removeChild(reportElement);
      
      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el PDF. Revisa la consola.');
    } finally {
      setExportingPDF(false);
    }
  };

  const exportExcel = async () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      setExportingExcel(true);
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule && XLSXModule.default ? XLSXModule.default : XLSXModule;

      const wsData = [
        ['Fecha', 'Tipo', 'Repuesto', 'Cantidad', 'Descripción'],
        ...data.map(item => [
          new Date(item.fecha).toLocaleDateString('es-GT'),
          item.tipo || '—',
          item.repuesto_nombre || item.repuesto?.nombre_repuesto || '—',
          item.cantidad || '0',
          item.descripcion || '—'
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movimientos_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      // fallback a CSV
      handleExportCSV();
    } finally {
      setExportingExcel(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [tipo, fechaInicio, fechaFin]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  const columns = [
    {
      key: 'fecha',
      title: 'Fecha',
       render: (value) => value ? new Date(value).toLocaleDateString('es-GT') : '—'
    },
    {
      key: 'tipo',
      title: 'Tipo',
      render: (value) => {
        if (!value) return '—';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'repuesto',
      title: 'Repuesto',
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.repuesto_nombre || item.repuesto?.nombre_repuesto || item.repuesto?.nombre || '—'}</div>
            <div className="text-xs text-gray-500">Código: {item.repuesto?.codigo_repuesto || item.repuesto?.codigo || '—'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'cantidad',
      title: 'Cantidad',
      render: (value) => (
        <span className={`font-bold text-lg ${value > 0 ? 'text-green-700' : 'text-red-700'}`}>
          {value > 0 ? `+${value}` : value}
        </span>
      )
    },
    {
      key: 'descripcion',
      title: 'Descripción',
      render: (value) => (
        <span className="text-gray-700">{value || '—'}</span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Package className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 mt-4 font-medium">Cargando movimientos de inventario...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Error al Cargar el Reporte</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => fetchMovements()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              max={fechaFin || undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio || undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchMovements}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Movimientos</p>
              <p className="text-3xl font-bold text-blue-900">{data.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Entradas</p>
              <p className="text-3xl font-bold text-green-900">
                {data.filter(item => item.tipo === 'entrada').length}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Salidas</p>
              <p className="text-3xl font-bold text-red-900">
                {data.filter(item => item.tipo === 'salida').length}
              </p>
            </div>
            <div className="bg-red-500 p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>Mostrando {data.length} movimientos</span>
          {tipo && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              Filtrado por: {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            disabled={data.length === 0 || exportingPDF}
            aria-busy={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <FileText className="w-4 h-4" />
            {exportingPDF ? 'Generando PDF...' : 'Exportar PDF'}
          </button>

          <button
            onClick={exportExcel}
            disabled={data.length === 0 || exportingExcel}
            aria-busy={exportingExcel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg font-medium hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingExcel ? 'Generando Excel...' : 'Exportar Excel'}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={data.length === 0 || exportingCSV}
            aria-busy={exportingCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <Download className="w-4 h-4" />
            {exportingCSV ? 'Generando CSV...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <Table
          data={data}
          columns={columns}
          emptyMessage="No se encontraron movimientos"
          actions={false}
        />
      </div>
    </div>
  );
};

export default MovementReport;
