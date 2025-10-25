import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Download, FileText, FileSpreadsheet, Calendar, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
import { clientsService } from '../services/api';
import Table from '../components/Table';

const ClientMonthlyReport = () => {
  const [data, setData] = useState([]);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const selectedYear = parseInt(year);
      const res = await clientsService.getClients();
      const clientes = res.data || [];

      // Agrupar por mes
      const grouped = Array.from({ length: 12 }, (_, i) => ({
        mes: new Date(0, i).toLocaleString('es-GT', { month: 'long' }),
        mesNumero: i + 1,
        cantidad: 0
      }));

      clientes.forEach((cliente) => {
        if (!cliente.fecha_registro) return;
        
        try {
          const fecha = new Date(cliente.fecha_registro);
          if (!isNaN(fecha.getTime()) && fecha.getFullYear() === selectedYear) {
            const mes = fecha.getMonth();
            grouped[mes].cantidad += 1;
          }
        } catch (err) {
          console.warn('Error procesando fecha de cliente:', cliente.id_cliente);
        }
      });

      // Verificar si hay datos
      const hayDatos = grouped.some(item => item.cantidad > 0);
      if (!hayDatos) {
        // Mostrar alerta y redirigir a la lista de reportes para que el usuario intente con otro filtro
        alert(`No se encontraron registros de clientes para el año ${selectedYear}. Serás redirigido a la pantalla de reportes para aplicar otro filtro.`);
        setData([]);
        // Navegar a la pantalla principal de reportes
        navigate('/reportes');
        setLoading(false);
        return;
      }

      setData(grouped);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('No se pudieron cargar los datos. Por favor, intenta nuevamente.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [year]);

  // Calcular estadísticas
  const totalClientes = data.reduce((sum, item) => sum + item.cantidad, 0);
  const mesConMasRegistros = data.reduce((max, item) => 
    item.cantidad > max.cantidad ? item : max, 
    { mes: '—', cantidad: 0 }
  );
  const promedioPorMes = totalClientes > 0 ? (totalClientes / 12).toFixed(1) : 0;

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    setExportingCSV(true);
    try {
      const headers = ['Mes', 'Clientes Registrados'];
      const csvData = data.map(item => [
        item.mes || '—',
        item.cantidad || '0'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_mensuales_${year}.csv`);
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
      
      // Crear elemento temporal para el reporte
      const reportElement = document.createElement('div');
      reportElement.style.padding = '15px';
      reportElement.style.backgroundColor = 'white';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      reportElement.style.width = '750px';
      
      // Contenido del reporte
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          <h1 style="color: #2563eb; margin-bottom: 3px; font-size: 22px;">📊 Reporte de Clientes por Mes</h1>
          <p style="color: #6b7280; margin: 3px 0; font-size: 12px;">Año: ${year}</p>
          <p style="color: #6b7280; margin: 0; font-size: 10px;">Generado el: ${new Date().toLocaleDateString('es-GT', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}</p>
        </div>

        <!-- Estadísticas Resumen (más compactas) -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
          <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 8px; padding: 12px; text-align: center;">
            <p style="color: #1e40af; font-size: 10px; font-weight: 600; margin: 0 0 5px 0;">TOTAL CLIENTES</p>
            <p style="color: #1e3a8a; font-size: 24px; font-weight: bold; margin: 0;">${totalClientes}</p>
          </div>
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 2px solid #22c55e; border-radius: 8px; padding: 12px; text-align: center;">
            <p style="color: #15803d; font-size: 10px; font-weight: 600; margin: 0 0 5px 0;">PROMEDIO MENSUAL</p>
            <p style="color: #14532d; font-size: 24px; font-weight: bold; margin: 0;">${promedioPorMes}</p>
          </div>
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 8px; padding: 12px; text-align: center;">
            <p style="color: #92400e; font-size: 10px; font-weight: 600; margin: 0 0 5px 0;">MES PICO</p>
            <p style="color: #78350f; font-size: 14px; font-weight: bold; margin: 0;">${mesConMasRegistros.mes}</p>
            <p style="color: #92400e; font-size: 11px; margin: 3px 0 0 0;">(${mesConMasRegistros.cantidad} clientes)</p>
          </div>
        </div>

        <!-- Tabla de datos (más compacta) -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 15px;">
          <thead>
            <tr style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: 600;">Mes</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: 600;">Clientes</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: 600;">% Total</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: 600;">Gráfico</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => {
              const porcentaje = totalClientes > 0 ? ((item.cantidad / totalClientes) * 100).toFixed(1) : 0;
              const barWidth = totalClientes > 0 ? (item.cantidad / totalClientes) * 100 : 0;
              const isEven = index % 2 === 0;
              
              return `
              <tr style="background-color: ${isEven ? '#f9fafb' : 'white'}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600; color: #374151; font-size: 11px;">
                  ${item.mes.charAt(0).toUpperCase() + item.mes.slice(1)}
                </td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 13px; color: ${item.cantidad > 0 ? '#2563eb' : '#9ca3af'};">
                  ${item.cantidad}
                </td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #6b7280; font-size: 11px;">
                  ${porcentaje}%
                </td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <div style="background-color: #e5e7eb; border-radius: 3px; height: 16px; position: relative; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); width: ${barWidth}%; height: 100%; border-radius: 3px;"></div>
                  </div>
                </td>
              </tr>
            `}).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #1f2937; font-size: 11px;">TOTAL</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 13px; color: #2563eb;">${totalClientes}</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #6b7280; font-size: 11px;">100%</td>
              <td style="padding: 8px; border: 1px solid #ddd;"></td>
            </tr>
          </tfoot>
        </table>

        <!-- Footer (más compacto) -->
        <div style="margin-top: 15px; padding: 12px; background-color: #f9fafb; border-radius: 8px; border-left: 3px solid #2563eb;">
          <h3 style="color: #374151; margin: 0 0 8px 0; font-size: 13px;">📈 Análisis del Período</h3>
          <p style="margin: 3px 0; color: #6b7280; font-size: 11px; line-height: 1.5;">
            <strong>Total de clientes registrados en ${year}:</strong> ${totalClientes} clientes
          </p>
          <p style="margin: 3px 0; color: #6b7280; font-size: 11px; line-height: 1.5;">
            <strong>Promedio mensual:</strong> ${promedioPorMes} clientes por mes
          </p>
          <p style="margin: 3px 0; color: #6b7280; font-size: 11px; line-height: 1.5;">
            <strong>Mes con mayor actividad:</strong> ${mesConMasRegistros.mes} con ${mesConMasRegistros.cantidad} registros (${totalClientes > 0 ? ((mesConMasRegistros.cantidad / totalClientes) * 100).toFixed(1) : 0}% del total)
          </p>
        </div>
      `;

      // Agregar al documento temporalmente
      document.body.appendChild(reportElement);
      
      // Capturar como imagen
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Limpiar
      document.body.removeChild(reportElement);
      
      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Primera página
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`clientes_mensuales_${year}.pdf`);
      
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
        ['Reporte de Clientes por Mes - Año ' + year],
        [],
        ['Mes', 'Clientes Registrados', '% del Total'],
        ...data.map(item => {
          const porcentaje = totalClientes > 0 ? ((item.cantidad / totalClientes) * 100).toFixed(1) : 0;
          return [
            item.mes || '—',
            item.cantidad || 0,
            porcentaje + '%'
          ];
        }),
        [],
        ['TOTAL', totalClientes, '100%'],
        [],
        ['Estadísticas'],
        ['Total Clientes:', totalClientes],
        ['Promedio Mensual:', promedioPorMes],
        ['Mes Pico:', mesConMasRegistros.mes + ' (' + mesConMasRegistros.cantidad + ' clientes)']
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Estilos para el título
      ws['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' }
      };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes por Mes');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_mensuales_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      // Fallback a CSV
      handleExportCSV();
    } finally {
      setExportingExcel(false);
    }
  };

  const columns = [
    {
      key: 'mes',
      title: 'Mes',
      render: (value) => (
        <span className="font-semibold text-gray-900 capitalize">
          {value}
        </span>
      )
    },
    {
      key: 'cantidad',
      title: 'Clientes Registrados',
      render: (value) => (
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600">{value}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalClientes > 0 ? (value / totalClientes) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: 'porcentaje',
      title: '% del Total',
      render: (_, item) => {
        const porcentaje = totalClientes > 0 ? ((item.cantidad / totalClientes) * 100).toFixed(1) : 0;
        return (
          <span className="text-sm font-medium text-gray-600">
            {porcentaje}%
          </span>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <Users className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 mt-4 font-medium">Cargando datos de clientes...</p>
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
          onClick={() => fetchClients()}
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
      {/* Header con filtros */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Filtros
        </h2>
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setError(null);
              }}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: currentYear - 1999 }, (_, i) => (
                <option key={2000 + i} value={(2000 + i).toString()}>
                  {2000 + i}
                </option>
              )).reverse()}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchClients}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Clientes</p>
              <p className="text-3xl font-bold text-blue-900">{totalClientes}</p>
              <p className="text-xs text-blue-700 mt-1">Año {year}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Promedio Mensual</p>
              <p className="text-3xl font-bold text-green-900">{promedioPorMes}</p>
              <p className="text-xs text-green-700 mt-1">clientes/mes</p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 mb-1">Mes Pico</p>
              <p className="text-xl font-bold text-yellow-900 capitalize">{mesConMasRegistros.mes}</p>
              <p className="text-xs text-yellow-700 mt-1">{mesConMasRegistros.cantidad} clientes</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Mostrando datos de {year}</span>
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
          emptyMessage="No hay registros de clientes para este año"
          actions={false}
        />
      </div>
    </div>
  );
};

export default ClientMonthlyReport;