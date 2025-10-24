import React, { useEffect, useState } from 'react';
import { Wrench, AlertTriangle, Download, FileText, FileSpreadsheet, Calendar, RefreshCw, DollarSign, Package, TrendingUp } from 'lucide-react';
import { servicesService } from '../services/api';
import Table from '../components/Table';

const ServiceReport = () => {
  const [data, setData] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await servicesService.getServices(params);
      
      // Mapear y limpiar los datos
      const servicesData = (res.data || []).map(service => ({
        ...service,
        nombre: service.nombre_servicio || service.nombre || '—',
        categoria: service.categoria?.nombre_categoria || service.categoria?.nombre || service.categoria_nombre || '—',
        precio: service.precio_base || service.precio || 0,
        descripcion: service.descripcion || 'Sin descripción'
      }));
      
      setData(servicesData);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setError('No se pudieron cargar los servicios. Por favor, intenta nuevamente.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Calcular estadísticas
  const totalServicios = data.length;
  const precioTotal = data.reduce((sum, item) => {
    const precio = Number(item.precio) || Number(item.precio_base) || 0;
    return sum + precio;
  }, 0);
  const precioPromedio = totalServicios > 0 ? precioTotal / totalServicios : 0;
  
  // Agrupar por categoría
  const serviciosPorCategoria = data.reduce((acc, service) => {
    const cat = service.categoria || 'Sin categoría';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    setExportingCSV(true);
    try {
      const headers = ['Servicio', 'Categoría', 'Precio', 'Descripción'];
      const csvData = data.map(item => [
        item.nombre || '—',
        item.categoria || '—',
        item.precio || '0',
        (item.descripcion || '—').replace(/,/g, ';') // Escapar comas
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `servicios_${new Date().toISOString().split('T')[0]}.csv`);
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
      // Importar jsPDF y autoTable
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      
      // Importar autoTable
      await import('jspdf-autotable');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // ==================== HEADER ====================
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Título principal
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE DE SERVICIOS', pageWidth / 2, 18, { align: 'center' });
      
      // Subtítulo
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const periodoText = fechaInicio && fechaFin 
        ? `Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}` 
        : 'Todos los servicios disponibles';
      pdf.text(periodoText, pageWidth / 2, 27, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.text(`Generado el: ${new Date().toLocaleDateString('es-GT', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, 33, { align: 'center' });

      yPos = 50;

      // ==================== CAJAS DE ESTADÍSTICAS ====================
      const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
      const boxHeight = 28;
      
      // Función para dibujar caja de estadística
      const drawStatBox = (x, bgColor, borderColor, label, value, isLarge = false) => {
        // Fondo con gradiente simulado
        pdf.setFillColor(...bgColor);
        pdf.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
        
        // Borde
        pdf.setDrawColor(...borderColor);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'S');
        
        // Label
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...borderColor);
        pdf.text(label, x + boxWidth / 2, yPos + 10, { align: 'center' });
        
        // Value
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(isLarge ? 24 : 16);
        const textColor = [...borderColor].map(c => Math.max(0, c - 40));
        pdf.setTextColor(...textColor);
        pdf.text(value, x + boxWidth / 2, yPos + 21, { align: 'center' });
      };

      // Box 1: Total Servicios
      drawStatBox(margin, [237, 233, 254], [124, 58, 237], 'TOTAL SERVICIOS', totalServicios.toString(), true);
      
      // Box 2: Precio Promedio
      drawStatBox(margin + boxWidth + 5, [220, 252, 231], [34, 197, 94], 'PRECIO PROMEDIO', formatCurrency(precioPromedio));
      
      // Box 3: Valor Total
      drawStatBox(margin + (boxWidth + 5) * 2, [219, 234, 254], [59, 130, 246], 'VALOR TOTAL', formatCurrency(precioTotal));

      yPos += boxHeight + 15;

      // ==================== TABLA DE SERVICIOS ====================
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(55, 65, 81);
      pdf.text('Detalle de Servicios', margin, yPos);
      yPos += 5;

      // Preparar datos para la tabla
      const tableData = data.map((item, index) => [
        (index + 1).toString(),
        item.nombre || '—',
        item.categoria || 'Sin categoría',
        formatCurrency(item.precio || 0)
      ]);

      // Agregar fila de total
      tableData.push([
        '',
        { content: 'TOTAL', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatCurrency(precioTotal), styles: { fontStyle: 'bold', fillColor: [237, 233, 254], textColor: [124, 58, 237] } }
      ]);

      // Generar tabla con autoTable
      pdf.autoTable({
        startY: yPos,
        head: [['#', 'Servicio', 'Categoría', 'Precio']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 45 },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [124, 58, 237] }
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          // Footer en cada página
          pdf.setFontSize(8);
          pdf.setTextColor(156, 163, 175);
          pdf.setFont('helvetica', 'normal');
          
          const pageCount = pdf.internal.pages.length - 1;
          const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
          
          pdf.text(
            `Página ${currentPage} de ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
          
          pdf.text(
            'Sistema de Gestión de Servicios',
            margin,
            pageHeight - 10
          );
          
          pdf.text(
            new Date().toLocaleDateString('es-GT'),
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
          );
        }
      });

      yPos = pdf.lastAutoTable.finalY + 10;

      // ==================== RESUMEN POR CATEGORÍA ====================
      if (Object.keys(serviciosPorCategoria).length > 0 && yPos + 50 < pageHeight - 20) {
        // Título del resumen
        pdf.setFillColor(124, 58, 237);
        pdf.rect(margin, yPos, pageWidth - margin * 2, 8, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Distribución por Categoría', margin + 3, yPos + 5.5);
        
        yPos += 12;

        // Preparar datos para gráfico de texto
        const categorias = Object.entries(serviciosPorCategoria).sort((a, b) => b[1] - a[1]);
        
        categorias.forEach(([cat, count]) => {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }
          
          const porcentaje = ((count / totalServicios) * 100).toFixed(1);
          const barWidth = (count / totalServicios) * (pageWidth - margin * 2 - 80);
          
          // Nombre de categoría
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(55, 65, 81);
          pdf.text(cat, margin + 2, yPos + 4);
          
          // Barra de progreso
          pdf.setFillColor(229, 231, 235);
          pdf.roundedRect(margin + 60, yPos, pageWidth - margin * 2 - 80, 6, 2, 2, 'F');
          
          pdf.setFillColor(124, 58, 237);
          if (barWidth > 0) {
            pdf.roundedRect(margin + 60, yPos, Math.max(barWidth, 2), 6, 2, 2, 'F');
          }
          
          // Cantidad y porcentaje
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(124, 58, 237);
          pdf.text(`${count} (${porcentaje}%)`, pageWidth - margin - 2, yPos + 4, { align: 'right' });
          
          yPos += 10;
        });
      }

      // Guardar PDF
      pdf.save(`reporte_servicios_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el PDF. Error: ' + err.message);
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
        ['Reporte de Servicios'],
        [],
        ['Servicio', 'Categoría', 'Precio', 'Descripción'],
        ...data.map(item => [
          item.nombre || '—',
          item.categoria || '—',
          item.precio || 0,
          item.descripcion || '—'
        ]),
        [],
        ['Resumen'],
        ['Total Servicios:', totalServicios],
        ['Precio Promedio:', precioPromedio],
        ['Valor Total:', precioTotal]
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `servicios_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      handleExportCSV();
    } finally {
      setExportingExcel(false);
    }
  };

  const columns = [
    {
      key: 'nombre',
      title: 'Servicio',
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{item.nombre || '—'}</div>
            <div className="text-xs text-gray-500">{item.categoria || 'Sin categoría'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'precio',
      title: 'Precio',
      render: (value) => (
        <span className="font-bold text-lg text-purple-600">
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'descripcion',
      title: 'Descripción',
      render: (value) => (
        <span className="text-gray-700 text-sm">
          {value || 'Sin descripción'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <Wrench className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 mt-4 font-medium">Cargando servicios...</p>
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
          onClick={() => fetchServices()}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={fetchServices}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Total Servicios</p>
              <p className="text-3xl font-bold text-purple-900">{totalServicios}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl">
              <Wrench className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Precio Promedio</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(precioPromedio)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(precioTotal)}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Wrench className="w-4 h-4" />
          <span>Mostrando {totalServicios} servicios</span>
          {(fechaInicio || fechaFin) && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
              Filtrado
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
          emptyMessage="No se encontraron servicios en el rango seleccionado"
          actions={false}
        />
      </div>
    </div>
  );
};

export default ServiceReport;