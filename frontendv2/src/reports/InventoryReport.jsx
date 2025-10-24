import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingDown, Download, Printer, RefreshCw, Calendar, FileText, FileSpreadsheet } from 'lucide-react';
import { inventoryService } from '../services/api';
import Table from '../components/Table';

const InventoryReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    totalValue: 0
  });
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  const columns = [
    {
      key: 'nombre_repuesto',
      title: 'Repuesto',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{value}</div>
            {item.descripcion && (
              <div className="text-xs text-gray-500">{item.descripcion}</div>
            )}
            <div className="text-xs text-gray-500">Código: {item.codigo_repuesto}</div>
          </div>
        </div>
      )
    },
    {
      key: 'categoria',
      title: 'Categoría',
      render: (value, item) => (
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          {item.categoria?.nombre_categoria || 'Sin categoría'}
        </span>
      )
    },
    {
      key: 'proveedor',
      title: 'Proveedor',
      render: (value, item) => (
        <span className="text-gray-700">
          {item.proveedor?.nombre_empresa || 'Sin proveedor'}
        </span>
      )
    },
    {
      key: 'stock_actual',
      title: 'Stock',
      render: (value, item) => {
        const isLow = value < (item.stock_minimo || 5);
        return (
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
              {value}
            </span>
            {isLow && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                <AlertTriangle className="w-3 h-3" />
                Bajo
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'precio_venta',
      title: 'Precio Unitario',
      render: (value) => (
        <div className="text-right font-medium text-gray-700">
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'valor_total',
      title: 'Valor Total',
      render: (value, item) => {
        const total = (item.stock_actual || 0) * (item.precio_venta || 0);
        return (
          <div className="text-right font-bold text-green-700">
            {formatCurrency(total)}
          </div>
        );
      }
    }
  ];

  const fetchData = async (conFechas = false) => {
    setLoading(true);
    setError(null);
    try {
      let partsResponse;
      let statsResponse;

      if (conFechas && fechaInicio && fechaFin) {
        // Obtener movimientos para encontrar repuestos con actividad en el rango
        const movimientosResponse = await inventoryService.getMovements({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        });
        
        const movimientos = movimientosResponse.data || [];
        const repuestosIds = [...new Set(movimientos.map(mov => mov.id_repuesto))];

        if (repuestosIds.length > 0) {
          // Obtener todos los repuestos y luego filtrar por los IDs que tienen movimientos
          partsResponse = await inventoryService.getParts();
          const allParts = partsResponse.data || [];
          const inventoryData = allParts.filter(part => repuestosIds.includes(part.id_repuesto));
          setData(inventoryData);
          calcularEstadisticasLocales(inventoryData);
        } else {
          setData([]);
          setStats({
            totalItems: 0,
            lowStock: 0,
            totalValue: 0
          });
        }
      } else {
        // Obtener todos los repuestos y el resumen
        [partsResponse, statsResponse] = await Promise.all([
          inventoryService.getParts(),
          inventoryService.getInventorySummary()
        ]);

        const parts = partsResponse.data || [];
        setData(parts);

        // Procesar estadísticas si están disponibles
        const stats = statsResponse?.data;
        if (stats && typeof stats === 'object') {
          setStats({
            totalItems: stats.total_repuestos || parts.length,
            lowStock: stats.repuestos_stock_bajo || parts.filter(p => p.stock_actual < (p.stock_minimo || 5)).length,
            totalValue: stats.valor_total_inventario || parts.reduce((sum, p) => sum + ((p.stock_actual || 0) * (p.precio_venta || 0)), 0)
          });
        } else {
          calcularEstadisticasLocales(parts);
        }
      }
      
    } catch (error) {
      console.error('Error al cargar el reporte de inventario:', error);
      setError('No se pudo cargar el reporte. Por favor, intenta nuevamente.');
      setData([]);
      setStats({
        totalItems: 0,
        lowStock: 0,
        totalValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticasLocales = (inventoryData) => {
    const totalValue = inventoryData.reduce(
      (sum, item) => sum + ((item.stock_actual || 0) * (item.precio_venta || 0)), 
      0
    );
    const lowStockCount = inventoryData.filter(
      item => (item.stock_actual || 0) < (item.stock_minimo || 5)
    ).length;

    setStats({
      totalItems: inventoryData.length,
      lowStock: lowStockCount,
      totalValue: totalValue
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFiltrarPorFecha = () => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor selecciona ambas fechas');
      return;
    }
    fetchData(true);
  };

  const handleLimpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    fetchData(false);
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    // Crear CSV simple para exportación
    setExportingCSV(true);
    const headers = ['Código', 'Repuesto', 'Categoría', 'Proveedor', 'Stock Actual', 'Stock Mínimo', 'Precio Venta', 'Valor Total'];
    const csvData = data.map(item => [
      item.codigo_repuesto || 'N/A',
      `"${item.nombre_repuesto}"`,
      `"${item.categoria?.nombre_categoria || 'Sin categoría'}"`,
      `"${item.proveedor?.nombre_empresa || 'Sin proveedor'}"`,
      item.stock_actual || 0,
      item.stock_minimo || 5,
      formatCurrency(item.precio_venta || 0),
      formatCurrency((item.stock_actual || 0) * (item.precio_venta || 0))
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_${fechaInicio && fechaFin ? `${fechaInicio}_a_${fechaFin}` : new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportingCSV(false);
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
        <h1 style="color: #2563eb; margin-bottom: 5px;">Reporte de Inventario</h1>
        <p style="color: #6b7280; margin: 0;">Fecha: ${new Date().toLocaleDateString('es-GT')}</p>
        ${fechaInicio && fechaFin ? `<p style="color: #6b7280; margin: 0;">Período: ${fechaInicio} a ${fechaFin}</p>` : ''}
      </div>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: #2563eb; color: white;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Código</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Repuesto</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Categoría</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Proveedor</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Stock</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Precio</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px; border: 1px solid #ddd;">${item.codigo_repuesto || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${item.nombre_repuesto || ''}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${item.categoria?.nombre_categoria || 'Sin categoría'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${item.proveedor?.nombre_empresa || 'Sin proveedor'}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center; ${item.stock_actual < (item.stock_minimo || 5) ? 'color: red; font-weight: bold;' : ''}">${item.stock_actual || 0}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(item.precio_venta || 0)}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency((item.stock_actual || 0) * (item.precio_venta || 0))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
        <h3 style="color: #374151; margin-bottom: 10px;">Resumen</h3>
        <p style="margin: 5px 0;"><strong>Total Items:</strong> ${stats.totalItems}</p>
        <p style="margin: 5px 0; color: red;"><strong>Stock Bajo:</strong> ${stats.lowStock}</p>
        <p style="margin: 5px 0; color: green;"><strong>Valor Total:</strong> ${formatCurrency(stats.totalValue)}</p>
      </div>
    `;

    // Agregar al documento temporalmente
    document.body.appendChild(reportElement);
    
    // Capturar como imagen
    const canvas = await html2canvas(reportElement, {
      scale: 2, // Mejor calidad
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
    pdf.save(`inventario_${fechaInicio && fechaFin ? `${fechaInicio}_a_${fechaFin}` : new Date().toISOString().split('T')[0]}.pdf`);
    
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
      // cargar xlsx dinámicamente (ESM import) en entorno Vite/browser
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule && XLSXModule.default ? XLSXModule.default : XLSXModule;

      const wsData = [
        ['Código', 'Repuesto', 'Categoría', 'Proveedor', 'Stock Actual', 'Stock Mínimo', 'Precio Venta', 'Valor Total'],
        ...data.map(item => [
          item.codigo_repuesto || 'N/A',
          item.nombre_repuesto || '',
          item.categoria?.nombre_categoria || '',
          item.proveedor?.nombre_empresa || '',
          item.stock_actual || 0,
          item.stock_minimo || 0,
          item.precio_venta || 0,
          (item.stock_actual || 0) * (item.precio_venta || 0)
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${fechaInicio && fechaFin ? `${fechaInicio}_a_${fechaFin}` : new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      // fallback a CSV
      handleExport();
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Package className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 mt-4 font-medium">Cargando datos del inventario...</p>
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
          onClick={() => fetchData(false)}
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
      {/* Filtros por Fecha */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Filtros de Fecha (Movimientos)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={handleFiltrarPorFecha}
              disabled={!fechaInicio || !fechaFin}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              Filtrar por Movimientos
            </button>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleLimpiarFiltros}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Mostrar Todo
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {fechaInicio && fechaFin 
            ? `Mostrando repuestos con movimientos entre ${fechaInicio} y ${fechaFin}`
            : 'Mostrando todo el inventario actual'
          }
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Items</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalItems}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Stock Bajo</p>
              <p className="text-3xl font-bold text-red-900">{stats.lowStock}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-xl">
              <TrendingDown className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalValue)}</p>
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
          <Package className="w-4 h-4" />
          <span>Mostrando {data.length} repuestos</span>
          {(fechaInicio && fechaFin) && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              Filtrado por movimientos
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
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
            onClick={handleExport}
            disabled={data.length === 0 || exportingCSV}
            aria-busy={exportingCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all shadow-sm hover:shadow"
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
          emptyMessage={
            fechaInicio && fechaFin 
              ? "No hay movimientos de inventario en el rango de fechas seleccionado"
              : "No hay repuestos en inventario"
          } 
          actions={false}
        />
      </div>

      {/* Alertas de Stock Bajo */}
      {stats.lowStock > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">
                Atención: {stats.lowStock} {stats.lowStock === 1 ? 'repuesto tiene' : 'repuestos tienen'} stock bajo
              </h4>
              <p className="text-sm text-amber-700">
                Se recomienda realizar pedidos para mantener niveles óptimos de inventario.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;