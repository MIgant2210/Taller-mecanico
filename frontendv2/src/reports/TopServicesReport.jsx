import React, { useEffect, useState } from 'react';
import { Download, FileText, RefreshCw, TrendingUp, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { billingService } from '../services/api';
import Table from '../components/Table';

const TopServicesReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await billingService.getTopServices({ limite: 10 });
      const items = res?.data?.value || res?.data || [];
      const validData = Array.isArray(items) ? items : [];
      
      // Normalizar y enumerar datos
      const normalizedData = validData.map((item, index) => ({
        posicion: index + 1,
        nombre_servicio: item.nombre_servicio || item.nombre || 'Sin nombre',
        cantidad_vendida: Number(item.cantidad_vendida ?? item.veces_usado ?? 0),
        total_ingresos: Number(item.total_ingresos ?? 0)
      }));
      
      setData(normalizedData);
    } catch (error) {
      console.error('Error al cargar top servicios:', error);
      setError('No se pudieron cargar los servicios. Por favor, intenta nuevamente.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTopServices(); 
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-GT', { 
      style: 'currency', 
      currency: 'GTQ', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-GT').format(Number(value || 0));
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    setExportingCSV(true);
    try {
      const headers = ['Posición', 'Servicio', 'Veces Usado', 'Total Ingresos (GTQ)'];
      const csvData = data.map(item => [
        item.posicion,
        item.nombre_servicio,
        item.cantidad_vendida,
        item.total_ingresos
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `top_servicios_${new Date().toISOString().split('T')[0]}.csv`);
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
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    setExportingPDF(true);
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      await import('jspdf-autotable');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Calcular totales
      const totalVeces = data.reduce((sum, item) => sum + item.cantidad_vendida, 0);
      const totalIngresos = data.reduce((sum, item) => sum + item.total_ingresos, 0);
      
      // Encabezado con fondo azul
      doc.setFillColor(37, 99, 235); // bg-blue-600
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('REPORTE DE SERVICIOS', pageWidth / 2, 20, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Top 10 Servicios Más Utilizados', pageWidth / 2, 28, { align: 'center' });
      
      // Fecha
      doc.setFontSize(10);
      const currentDate = new Date().toLocaleDateString('es-GT', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generado: ${currentDate}`, pageWidth / 2, 38, { align: 'center' });
      
      // Resumen ejecutivo
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen Ejecutivo', 15, 55);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);
      
      const resumenY = 62;
      doc.text(`Total de servicios analizados: ${data.length}`, 15, resumenY);
      doc.text(`Usos acumulados: ${formatNumber(totalVeces)}`, 15, resumenY + 5);
      doc.text(`Ingresos totales: ${formatCurrency(totalIngresos)}`, 15, resumenY + 10);
      
      // Línea separadora
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, resumenY + 15, pageWidth - 15, resumenY + 15);
      
      // Tabla de datos
      const tableBody = data.map((item) => [
        item.posicion.toString(),
        item.nombre_servicio,
        formatNumber(item.cantidad_vendida),
        formatCurrency(item.total_ingresos)
      ]);
      
      doc.autoTable({
        startY: resumenY + 20,
        head: [['#', 'Servicio', 'Veces Usado', 'Total Ingresos']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [31, 41, 55],
          cellPadding: 4
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
          1: { halign: 'left', cellWidth: 85 },
          2: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
          3: { halign: 'right', cellWidth: 45, fontStyle: 'bold', textColor: [5, 150, 105] }
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          // Pie de página
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      });
      
      // Nota final
      const finalY = doc.lastAutoTable.finalY || resumenY + 20;
      if (finalY < pageHeight - 40) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.setFont(undefined, 'italic');
        doc.text(
          'Este documento ha sido generado automáticamente por el sistema de gestión.',
          pageWidth / 2,
          pageHeight - 20,
          { align: 'center' }
        );
      }
      
      doc.save(`top_servicios_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el PDF. Por favor, intenta nuevamente.');
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
        ['Posición', 'Servicio', 'Veces Usado', 'Total Ingresos'],
        ...data.map(item => [
          item.posicion,
          item.nombre_servicio,
          item.cantidad_vendida,
          item.total_ingresos
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Top Servicios');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `top_servicios_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const columns = [
    { 
      key: 'posicion', 
      title: '#', 
      render: (value) => (
        <div className="text-center font-bold text-gray-700 text-lg">
          {value}
        </div>
      )
    },
    { 
      key: 'nombre_servicio', 
      title: 'Servicio', 
      render: (value) => (
        <div className="font-medium text-gray-900">
          {value}
        </div>
      )
    },
    { 
      key: 'cantidad_vendida', 
      title: 'Veces Usado', 
      render: (value) => (
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
            {formatNumber(value)}
          </span>
        </div>
      )
    },
    { 
      key: 'total_ingresos', 
      title: 'Total Ingresos', 
      render: (value) => (
        <div className="text-right font-semibold text-green-700">
          {formatCurrency(value)}
        </div>
      )
    }
  ];

  // Calcular totales
  const totalVeces = data.reduce((sum, item) => sum + item.cantidad_vendida, 0);
  const totalIngresos = data.reduce((sum, item) => sum + item.total_ingresos, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <TrendingUp className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 mt-4 font-medium">Cargando top servicios...</p>
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
          onClick={() => fetchTopServices()}
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
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total de Servicios</p>
              <p className="text-3xl font-bold text-blue-900">{data.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Usos Totales</p>
              <p className="text-3xl font-bold text-purple-900">{formatNumber(totalVeces)}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Ingresos Totales</p>
              <p className="text-3xl font-bold text-green-900">{formatCurrency(totalIngresos)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>Mostrando {data.length} servicios más utilizados</span>
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
          emptyMessage="No hay servicios registrados"
          actions={false}
        />
      </div>
    </div>
  );
};

export default TopServicesReport;