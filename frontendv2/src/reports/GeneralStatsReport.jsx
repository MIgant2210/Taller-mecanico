import React, { useEffect, useState } from 'react';
import { billingService } from '../services/api';
import { FileText, Download, RefreshCw, BarChart3, FileSpreadsheet, AlertTriangle, TrendingUp, DollarSign, Package, Users } from 'lucide-react';

const GeneralStatsReport = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await billingService.getGeneralStats(params);
      // debugging: mostrar respuesta cruda para ayudar a identificar problemas de mapeo
      // eslint-disable-next-line no-console
      console.debug('getGeneralStats response:', res);

      let payload = res?.data ?? res ?? {};

      // Manejar patrones comunes de respuesta
      if (payload.stats && typeof payload.stats === 'object') {
        payload = payload.stats;
      } else if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        payload = payload.data;
      } else if (payload.value && typeof payload.value === 'object') {
        payload = payload.value;
      }

      // Si API devuelve un array de indicadores [{ key, value }] convertir a objeto
      if (Array.isArray(payload)) {
        const obj = {};
        payload.forEach(item => {
          if (item.key && (item.value !== undefined)) obj[item.key] = item.value;
          else if (item.name && (item.value !== undefined)) obj[item.name] = item.value;
          else if (item.nombre && (item.cantidad !== undefined)) obj[item.nombre] = item.cantidad;
        });
        payload = obj;
      }

      if (!payload || (typeof payload === 'object' && Object.keys(payload).length === 0)) {
        setError('No se encontraron estadísticas en la respuesta del servidor. Revisa la consola para más detalles.');
        setStats(null);
      } else {
        setStats(payload);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas generales:', error);
      setError('No se pudieron cargar las estadísticas. Por favor, intenta nuevamente.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchStats(); 
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

  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (key, value) => {
    const keyLower = key.toLowerCase();
    
    // Solo formatear como moneda si contiene palabras específicas de dinero
    // Y NO contiene palabras que indiquen cantidad
    const isMoneyField = (
      (keyLower.includes('ingreso') || 
       keyLower.includes('precio') ||
       keyLower.includes('monto') ||
       keyLower.includes('costo') ||
       keyLower.includes('pago') ||
       keyLower.includes('ganancia') ||
       keyLower.includes('venta') && keyLower.includes('total')) &&
      !keyLower.includes('cantidad') &&
      !keyLower.includes('numero') &&
      !keyLower.includes('total_') && keyLower !== 'total'
    );
    
    if (isMoneyField) {
      return formatCurrency(value);
    }
    
    // Si es un número, formatearlo con separadores
    if (!isNaN(value) && value !== '' && typeof value === 'number') {
      return formatNumber(value);
    }
    
    return String(value);
  };

  const getIconForKey = (key) => {
    const keyLower = key.toLowerCase();
    
    // Icono de dinero solo para campos monetarios
    if (keyLower.includes('ingreso') || 
        keyLower.includes('precio') || 
        keyLower.includes('monto') ||
        keyLower.includes('costo') ||
        keyLower.includes('pago') ||
        keyLower.includes('ganancia')) {
      return <DollarSign className="w-6 h-6" />;
    }
    
    // Icono de trending para servicios
    if (keyLower.includes('servicio') || keyLower.includes('factura')) {
      return <TrendingUp className="w-6 h-6" />;
    }
    
    // Icono de paquete para repuestos/productos
    if (keyLower.includes('repuesto') || keyLower.includes('producto') || keyLower.includes('inventario')) {
      return <Package className="w-6 h-6" />;
    }
    
    // Icono de usuarios para clientes
    if (keyLower.includes('cliente') || keyLower.includes('usuario')) {
      return <Users className="w-6 h-6" />;
    }
    
    // Icono de gráfica para totales
    if (keyLower.includes('total')) {
      return <BarChart3 className="w-6 h-6" />;
    }
    
    // Icono por defecto
    return <BarChart3 className="w-6 h-6" />;
  };

  const getColorForKey = (key) => {
    const keyLower = String(key || '').toLowerCase();

    // Verde solo para campos monetarios específicos
    if (keyLower.includes('ingreso') || 
        keyLower.includes('precio') || 
        keyLower.includes('monto') ||
        keyLower.includes('costo') ||
        keyLower.includes('pago') ||
        keyLower.includes('ganancia')) {
      return {
        bg: 'from-green-50 to-green-100',
        border: 'border-green-200',
        iconBg: 'bg-green-500',
        text: 'text-green-600',
        value: 'text-green-900'
      };
    }

    // Azul para servicios y facturas
    if (keyLower.includes('servicio') || keyLower.includes('factura')) {
      return {
        bg: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
        iconBg: 'bg-blue-500',
        text: 'text-blue-600',
        value: 'text-blue-900'
      };
    }

    // Púrpura para repuestos y productos
    if (keyLower.includes('repuesto') || keyLower.includes('producto') || keyLower.includes('inventario')) {
      return {
        bg: 'from-purple-50 to-purple-100',
        border: 'border-purple-200',
        iconBg: 'bg-purple-500',
        text: 'text-purple-600',
        value: 'text-purple-900'
      };
    }

    // Naranja para clientes y usuarios
    if (keyLower.includes('cliente') || keyLower.includes('usuario')) {
      return {
        bg: 'from-orange-50 to-orange-100',
        border: 'border-orange-200',
        iconBg: 'bg-orange-500',
        text: 'text-orange-600',
        value: 'text-orange-900'
      };
    }

    // Cyan para totales generales
    if (keyLower.includes('total')) {
      return {
        bg: 'from-cyan-50 to-cyan-100',
        border: 'border-cyan-200',
        iconBg: 'bg-cyan-500',
        text: 'text-cyan-600',
        value: 'text-cyan-900'
      };
    }

    // Fallback: asignar colores determinísticos desde una paleta para cualquier clave desconocida
    const palette = [
      { bg: 'from-rose-50 to-rose-100', border: 'border-rose-200', iconBg: 'bg-rose-500', text: 'text-rose-600', value: 'text-rose-900' },
      { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', iconBg: 'bg-emerald-500', text: 'text-emerald-600', value: 'text-emerald-900' },
      { bg: 'from-lime-50 to-lime-100', border: 'border-lime-200', iconBg: 'bg-lime-500', text: 'text-lime-600', value: 'text-lime-900' },
      { bg: 'from-sky-50 to-sky-100', border: 'border-sky-200', iconBg: 'bg-sky-500', text: 'text-sky-600', value: 'text-sky-900' },
      { bg: 'from-fuchsia-50 to-fuchsia-100', border: 'border-fuchsia-200', iconBg: 'bg-fuchsia-500', text: 'text-fuchsia-600', value: 'text-fuchsia-900' },
      { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', iconBg: 'bg-amber-500', text: 'text-amber-600', value: 'text-amber-900' },
      { bg: 'from-teal-50 to-teal-100', border: 'border-teal-200', iconBg: 'bg-teal-500', text: 'text-teal-600', value: 'text-teal-900' },
      { bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', iconBg: 'bg-indigo-500', text: 'text-indigo-600', value: 'text-indigo-900' }
    ];

    // Hash simple y determinístico para escoger color según la clave
    let h = 0;
    for (let i = 0; i < keyLower.length; i++) {
      h = ((h << 5) - h) + keyLower.charCodeAt(i);
      h |= 0; // forzar entero 32-bit
    }
    const idx = Math.abs(h) % palette.length;
    return palette[idx];
  };

  const handleExportCSV = () => {
    if (!stats || Object.keys(stats).length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    setExportingCSV(true);
    try {
      const headers = ['Estadística', 'Valor'];
      const csvData = Object.entries(stats).map(([key, value]) => [
        formatLabel(key),
        value
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `estadisticas_generales_${new Date().toISOString().split('T')[0]}.csv`);
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
    if (!stats || Object.keys(stats).length === 0) {
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
      
      // Encabezado con fondo azul
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('ESTADÍSTICAS GENERALES', pageWidth / 2, 20, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Resumen de Indicadores Clave del Sistema', pageWidth / 2, 28, { align: 'center' });
      
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
      
      // Información general
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Métricas del Sistema', 15, 55);
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(`Total de indicadores: ${Object.keys(stats).length}`, 15, 62);
      
      // Línea separadora
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.5);
      doc.line(15, 67, pageWidth - 15, 67);
      
      // Tabla de estadísticas
      const tableBody = Object.entries(stats).map(([key, value]) => [
        formatLabel(key),
        formatValue(key, value)
      ]);
      
      doc.autoTable({
        startY: 72,
        head: [['Estadística', 'Valor']],
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
          0: { halign: 'left', cellWidth: 100, fontStyle: 'bold' },
          1: { halign: 'right', cellWidth: 80 }
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
      const finalY = doc.lastAutoTable.finalY || 72;
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
      
      doc.save(`estadisticas_generales_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setExportingPDF(false);
    }
  };

  const exportExcel = async () => {
    if (!stats || Object.keys(stats).length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      setExportingExcel(true);
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule && XLSXModule.default ? XLSXModule.default : XLSXModule;

      const wsData = [
        ['Estadística', 'Valor'],
        ...Object.entries(stats).map(([key, value]) => [
          formatLabel(key),
          value
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estadisticas_generales_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <BarChart3 className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 mt-4 font-medium">Cargando estadísticas generales...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Error al Cargar las Estadísticas</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => fetchStats()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  const statsEntries = stats ? Object.entries(stats) : [];

  return (
    <div className="space-y-6">
      {/* Filtros opcionales: rango de fechas */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-md font-semibold text-gray-800 mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Desde</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hasta</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-center">
            <button onClick={fetchStats} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Aplicar</button>
            <button onClick={() => { setFechaInicio(''); setFechaFin(''); fetchStats(); }} className="ml-3 px-3 py-2 bg-gray-100 rounded-lg">Limpiar</button>
          </div>
        </div>
      </div>
      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BarChart3 className="w-4 h-4" />
          <span>Mostrando {statsEntries.length} estadísticas del sistema</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            disabled={statsEntries.length === 0 || exportingPDF}
            aria-busy={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <FileText className="w-4 h-4" />
            {exportingPDF ? 'Generando PDF...' : 'Exportar PDF'}
          </button>

          <button
            onClick={exportExcel}
            disabled={statsEntries.length === 0 || exportingExcel}
            aria-busy={exportingExcel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg font-medium hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingExcel ? 'Generando Excel...' : 'Exportar Excel'}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={statsEntries.length === 0 || exportingCSV}
            aria-busy={exportingCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <Download className="w-4 h-4" />
            {exportingCSV ? 'Generando CSV...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      {statsEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsEntries.map(([key, value]) => {
            const colors = getColorForKey(key);
            const icon = getIconForKey(key);
            
            return (
              <div 
                key={key} 
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-6 transition-transform hover:scale-105`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${colors.text} mb-1`}>
                      {formatLabel(key)}
                    </p>
                    <p className={`text-2xl font-bold ${colors.value} break-words`}>
                      {formatValue(key, value)}
                    </p>
                  </div>
                  <div className={`${colors.iconBg} p-3 rounded-xl text-white flex-shrink-0 ml-4`}>
                    {icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
          <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay estadísticas disponibles</h3>
          <p className="text-gray-500">No se encontraron datos para mostrar en este momento.</p>
        </div>
      )}
    </div>
  );
};

export default GeneralStatsReport;