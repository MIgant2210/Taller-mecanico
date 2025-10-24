import React, { useEffect, useState } from 'react';
import { DollarSign, AlertTriangle, Download, FileText, FileSpreadsheet, Calendar, RefreshCw, TrendingUp, CreditCard, Package, Wrench } from 'lucide-react';
import { billingService } from '../services/api';
import Table from '../components/Table';

const FinanceReport = () => {
  // Estados
  const [invoiceData, setInvoiceData] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [topParts, setTopParts] = useState([]);
  const [stats, setStats] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Validación de fechas
  const validateDates = () => {
    if (!fechaInicio || !fechaFin) return 'Las fechas de inicio y fin son requeridas';
    if (new Date(fechaInicio) > new Date(fechaFin)) return 'La fecha de inicio debe ser anterior a la fecha fin';
    return null;
  };

  // Fetch principal
  const fetchAllFinanceData = async () => {
    setLoading(true);
    setError(null);
    setHasFetched(false);
    setShowLoginPrompt(false);
    const dateError = validateDates();
    if (dateError) {
      setError(dateError);
      setLoading(false);
      return;
    }
    try {
      const params = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      };
      const [salesRes, invoicesRes, monthlyRes, servicesRes, partsRes, statsRes] = await Promise.all([
        billingService.getSalesReport(params),
        billingService.getInvoices(params),
        billingService.getMonthlySales(new Date().getFullYear()),
        billingService.getTopServices({ limite: 5, ...params }),
        billingService.getTopParts({ limite: 5, ...params }),
        billingService.getGeneralStats()
      ]);
      // Logs para debugging de la API (se pueden quitar luego)
      // eslint-disable-next-line no-console
      console.debug('salesRes (stats):', salesRes);
      // eslint-disable-next-line no-console
      console.debug('invoicesRes (list):', invoicesRes);
      // eslint-disable-next-line no-console
      console.debug('monthlyRes:', monthlyRes);
      // eslint-disable-next-line no-console
      console.debug('servicesRes:', servicesRes);
      // eslint-disable-next-line no-console
      console.debug('partsRes:', partsRes);
      // eslint-disable-next-line no-console
      console.debug('statsRes:', statsRes);
      // Logs para debugging de la API (se pueden quitar luego)
      // eslint-disable-next-line no-console
      console.debug('salesRes:', salesRes);
      // eslint-disable-next-line no-console
      console.debug('monthlyRes:', monthlyRes);
      // eslint-disable-next-line no-console
      console.debug('servicesRes:', servicesRes);
      // eslint-disable-next-line no-console
      console.debug('partsRes:', partsRes);
      // eslint-disable-next-line no-console
      console.debug('statsRes:', statsRes);
      // Facturas y stats
      let facturas = [];
      let statsObj = null;
      // Extraer estadísticas de salesRes (reportes/ventas)
      const salesData = salesRes?.data || salesRes || {};
      statsObj = {
        total_facturas: salesData.total_facturas ?? salesData.total ?? null,
        total_ventas: salesData.total_ventas ?? salesData.total_ventas ?? null,
        total_servicios: salesData.total_servicios ?? null,
        total_repuestos: salesData.total_repuestos ?? null,
        facturas_pendientes: salesData.facturas_pendientes ?? null,
        facturas_pagadas: salesData.facturas_pagadas ?? null
      };

      // Extraer lista de facturas desde invoicesRes (endpoint /facturas)
      const invData = invoicesRes?.data || invoicesRes || {};
      if (invData) {
        if (Array.isArray(invData)) {
          facturas = invData;
        } else if (Array.isArray(invData.data)) {
          facturas = invData.data;
        } else if (Array.isArray(invData.results)) {
          facturas = invData.results;
        } else if (Array.isArray(invData.facturas)) {
          facturas = invData.facturas;
        } else {
          facturas = [];
        }
      }
      setInvoiceData(facturas);
      setStats(statsObj);
      setMonthlyData(monthlyRes?.data || null);
      setTopServices(Array.isArray(servicesRes?.data) ? servicesRes.data : []);
      setTopParts(Array.isArray(partsRes?.data) ? partsRes.data : []);
      setHasFetched(true);
    } catch (error) {
      console.error('Error al cargar datos financieros:', error);
      // Manejo específico para 401 (no autenticado)
      if (error.response?.status === 401) {
        setShowLoginPrompt(true);
        setError('No autenticado. Por favor inicia sesión para ver este reporte.');
      } else {
        const errorMessage = error.response?.data?.detail || error.message;
        setError(errorMessage || 'No se pudieron cargar los datos financieros. Por favor, intenta nuevamente.');
      }
      setInvoiceData([]);
      setMonthlyData(null);
      setTopServices([]);
      setTopParts([]);
      setStats(null);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFinanceData();
    // eslint-disable-next-line
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(Number(value || 0));

  // Calcular totales robustos
  const totalFacturado = invoiceData.length > 0
    ? invoiceData.reduce((sum, item) => sum + Number(item.total || 0), 0)
    : 0;
  const facturasPagadas = invoiceData.length > 0
    ? invoiceData.filter(f => f.estado === 'pagada').length
    : 0;
  const facturasPendientes = invoiceData.length > 0
    ? invoiceData.filter(f => f.estado === 'pendiente').length
    : 0;
  const totalPagado = invoiceData.length > 0
    ? invoiceData.filter(f => f.estado === 'pagada').reduce((sum, item) => sum + Number(item.total || 0), 0)
    : 0;
  const totalPendiente = invoiceData.length > 0
    ? invoiceData.filter(f => f.estado === 'pendiente').reduce((sum, item) => sum + Number(item.total || 0), 0)
    : 0;

  const handleExportCSV = () => {
    if (invoiceData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    setExportingCSV(true);
    try {
      const headers = ['Fecha', 'Factura', 'Cliente', 'Estado', 'Total'];
      const csvData = invoiceData.map(item => [
        new Date(item.fecha).toLocaleDateString('es-GT'),
        item.numero || '—',
        `${item.cliente?.nombres || ''} ${item.cliente?.apellidos || ''}`.trim() || '—',
        item.estado || '—',
        item.total || '0'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_financiero_${new Date().toISOString().split('T')[0]}.csv`);
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
    if (invoiceData.length === 0 && !stats) {
      alert('No hay datos para exportar');
      return;
    }
    setExportingPDF(true);
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      await import('jspdf-autotable');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // ==================== HEADER ====================
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE FINANCIERO', pageWidth / 2, 18, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const periodoText = fechaInicio && fechaFin 
        ? `Período: ${new Date(fechaInicio).toLocaleDateString('es-GT')} - ${new Date(fechaFin).toLocaleDateString('es-GT')}` 
        : 'Resumen General';
      pdf.text(periodoText, pageWidth / 2, 27, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.text(`Generado el: ${new Date().toLocaleDateString('es-GT', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, pageWidth / 2, 33, { align: 'center' });

      yPos = 50;

      // ==================== ESTADÍSTICAS PRINCIPALES ====================
      const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
      const boxHeight = 28;
      
      const drawStatBox = (x, bgColor, borderColor, label, value, subtitle = '') => {
        pdf.setFillColor(...bgColor);
        pdf.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'F');
        pdf.setDrawColor(...borderColor);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'S');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...borderColor);
        pdf.text(label, x + boxWidth / 2, yPos + 9, { align: 'center' });
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        const textColor = [...borderColor].map(c => Math.max(0, c - 40));
        pdf.setTextColor(...textColor);
        pdf.text(value, x + boxWidth / 2, yPos + 19, { align: 'center' });
        
        if (subtitle) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(...borderColor);
          pdf.text(subtitle, x + boxWidth / 2, yPos + 24, { align: 'center' });
        }
      };

      drawStatBox(margin, [209, 250, 229], [16, 185, 129], 'TOTAL FACTURADO', formatCurrency(totalFacturado));
      drawStatBox(margin + boxWidth + 5, [254, 249, 195], [234, 179, 8], 'TOTAL PENDIENTE', formatCurrency(totalPendiente));
      drawStatBox(margin + (boxWidth + 5) * 2, [219, 234, 254], [59, 130, 246], 'FACTURAS', invoiceData.length.toString(), `${facturasPagadas} pagadas`);

      yPos += boxHeight + 12;

      // ==================== TOP SERVICIOS Y REPUESTOS ====================
      if ((topServices.length > 0 || topParts.length > 0) && yPos + 60 < pageHeight - 20) {
        const sectionWidth = (pageWidth - margin * 2 - 10) / 2;
        
        // Top Servicios
        if (topServices.length > 0) {
          pdf.setFillColor(16, 185, 129);
          pdf.rect(margin, yPos, sectionWidth, 7, 'F');
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text('Top 5 Servicios', margin + 3, yPos + 5);
          
          let serviceY = yPos + 12;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(55, 65, 81);
          
          topServices.slice(0, 5).forEach((service, idx) => {
            const serviceName = (service.nombre_servicio || service.nombre || 'Servicio').substring(0, 25);
            const amount = formatCurrency(service.total_ingresos || 0);
            
            pdf.text(`${idx + 1}. ${serviceName}`, margin + 2, serviceY);
            pdf.setFont('helvetica', 'bold');
            pdf.text(amount, margin + sectionWidth - 2, serviceY, { align: 'right' });
            pdf.setFont('helvetica', 'normal');
            
            serviceY += 6;
          });
        }

        // Top Repuestos
        if (topParts.length > 0) {
          pdf.setFillColor(59, 130, 246);
          pdf.rect(margin + sectionWidth + 10, yPos, sectionWidth, 7, 'F');
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          pdf.text('Top 5 Repuestos', margin + sectionWidth + 13, yPos + 5);
          
          let partsY = yPos + 12;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(55, 65, 81);
          
          topParts.slice(0, 5).forEach((part, idx) => {
            const partName = (part.nombre_repuesto || part.nombre || 'Repuesto').substring(0, 25);
            const amount = formatCurrency(part.total_ingresos || 0);
            
            pdf.text(`${idx + 1}. ${partName}`, margin + sectionWidth + 12, partsY);
            pdf.setFont('helvetica', 'bold');
            pdf.text(amount, margin + pageWidth - margin - 2, partsY, { align: 'right' });
            pdf.setFont('helvetica', 'normal');
            
            partsY += 6;
          });
        }

        yPos += Math.max(
          topServices.length > 0 ? 12 + (topServices.slice(0, 5).length * 6) : 0,
          topParts.length > 0 ? 12 + (topParts.slice(0, 5).length * 6) : 0
        ) + 10;
      }

      // ==================== TABLA DE FACTURAS ====================
      if (invoiceData.length > 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(55, 65, 81);
        pdf.text('Detalle de Facturas', margin, yPos);
        yPos += 5;

        const tableData = invoiceData.map((item, index) => [
          (index + 1).toString(),
          new Date(item.fecha).toLocaleDateString('es-GT'),
          item.numero || '—',
          `${item.cliente?.nombres || ''} ${item.cliente?.apellidos || ''}`.trim() || 'Sin cliente',
          item.estado ? item.estado.charAt(0).toUpperCase() + item.estado.slice(1) : '—',
          formatCurrency(item.total || 0)
        ]);

        // Agregar fila de total
        tableData.push([
          '',
          '',
          { content: 'TOTAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
          { content: formatCurrency(totalFacturado), styles: { fontStyle: 'bold', fillColor: [209, 250, 229], textColor: [16, 185, 129] } }
        ]);

        pdf.autoTable({
          startY: yPos,
          head: [['#', 'Fecha', 'Factura', 'Cliente', 'Estado', 'Total']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 4
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 'auto' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          margin: { left: margin, right: margin },
          didParseCell: function(data) {
            // Colorear estados
            if (data.column.index === 4 && data.cell.raw && data.row.index < tableData.length - 1) {
              const estado = data.cell.raw.toLowerCase();
              if (estado === 'pagada') {
                data.cell.styles.textColor = [22, 163, 74];
                data.cell.styles.fillColor = [220, 252, 231];
              } else if (estado === 'pendiente') {
                data.cell.styles.textColor = [202, 138, 4];
                data.cell.styles.fillColor = [254, 249, 195];
              } else if (estado === 'anulada') {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fillColor = [254, 226, 226];
              }
            }
          },
          didDrawPage: (data) => {
            const pageCount = pdf.internal.pages.length - 1;
            const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
            
            pdf.setFontSize(8);
            pdf.setTextColor(156, 163, 175);
            pdf.setFont('helvetica', 'normal');
            
            pdf.text(`Página ${currentPage} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.text('Sistema de Gestión Financiera', margin, pageHeight - 10);
            pdf.text(new Date().toLocaleDateString('es-GT'), pageWidth - margin, pageHeight - 10, { align: 'right' });
          }
        });

        yPos = pdf.lastAutoTable.finalY + 10;
      }

      // ==================== RESUMEN FINAL ====================
      if (yPos + 35 < pageHeight - 20) {
        pdf.setFillColor(243, 244, 246);
        pdf.roundedRect(margin, yPos, pageWidth - margin * 2, 30, 3, 3, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(55, 65, 81);
        pdf.text('Resumen Financiero', margin + 5, yPos + 8);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        
        const col1X = margin + 5;
        const col2X = pageWidth / 2;
        
        pdf.text(`Total facturado: ${formatCurrency(totalFacturado)}`, col1X, yPos + 16);
        pdf.text(`Facturas pagadas: ${facturasPagadas} (${formatCurrency(totalPagado)})`, col1X, yPos + 22);
        
        pdf.text(`Total pendiente: ${formatCurrency(totalPendiente)}`, col2X, yPos + 16);
        pdf.text(`Facturas pendientes: ${facturasPendientes}`, col2X, yPos + 22);
      }

      pdf.save(`reporte_financiero_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el PDF. Error: ' + err.message);
    } finally {
      setExportingPDF(false);
    }
  };

  const exportExcel = async () => {
    if (invoiceData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      setExportingExcel(true);
      const XLSXModule = await import('xlsx');
      const XLSX = XLSXModule && XLSXModule.default ? XLSXModule.default : XLSXModule;

      const wsData = [
        ['Reporte Financiero'],
        [],
        ['Fecha', 'Factura', 'Cliente', 'Estado', 'Total'],
        ...invoiceData.map(item => [
          new Date(item.fecha).toLocaleDateString('es-GT'),
          item.numero || '—',
          `${item.cliente?.nombres || ''} ${item.cliente?.apellidos || ''}`.trim() || '—',
          item.estado || '—',
          item.total || 0
        ]),
        [],
        ['', '', 'TOTAL', '', totalFacturado],
        [],
        ['Resumen'],
        ['Total Facturado:', totalFacturado],
        ['Total Pagado:', totalPagado],
        ['Total Pendiente:', totalPendiente],
        ['Facturas Pagadas:', facturasPagadas],
        ['Facturas Pendientes:', facturasPendientes]
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reporte Financiero');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_financiero_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      key: 'fecha',
      title: 'Fecha',
      render: (_, item) => {
        const d = item?.fecha_factura || item?.fecha || item?.fecha_ingreso || null;
        return (
          <span className="text-gray-700">
            {d ? new Date(d).toLocaleDateString('es-GT') : '—'}
          </span>
        );
      }
    },
    {
      key: 'numero',
      title: 'Factura',
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-green-600" />
          </div>
          <span className="font-semibold text-gray-900">{item.numero_factura || item.numero || '—'}</span>
        </div>
      )
    },
    {
      key: 'cliente',
      title: 'Cliente',
      render: (_, item) => (
        <span className="text-gray-700">
          {`${item.cliente?.nombres || ''} ${item.cliente?.apellidos || ''}`.trim() || 'Sin cliente'}
        </span>
      )
    },
    {
      key: 'estado',
      title: 'Estado',
      render: (_, item) => {
        const raw = item.estado_pago || item.estado || item.ticket?.estado?.nombre_estado || '';
        const value = (raw || '').toString().toLowerCase();
        const estados = {
          'pagada': 'bg-green-100 text-green-700',
          'pendiente': 'bg-yellow-100 text-yellow-700',
          'anulada': 'bg-red-100 text-red-700'
        };
        const color = estados[value] || 'bg-gray-100 text-gray-700';
        const label = raw ? (typeof raw === 'string' ? (raw.charAt(0).toUpperCase() + raw.slice(1)) : String(raw)) : '—';
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
            {label}
          </span>
        );
      }
    },
    {
      key: 'total',
      title: 'Total',
      render: (value) => (
        <span className="font-bold text-lg text-green-600">
          {formatCurrency(value)}
        </span>
      )
    }
  ];

  // UI: loading, error, empty, data
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <DollarSign className="w-8 h-8 text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-600 mt-4 font-medium">Cargando datos financieros...</p>
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
          onClick={fetchAllFinanceData}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
        {showLoginPrompt && (
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="mt-3 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Iniciar Sesión
          </button>
        )}
      </div>
    );
  }

  // Empty state: no facturas after fetch
  if (hasFetched && (!invoiceData || invoiceData.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-yellow-100 rounded-full p-4 mb-4">
          <AlertTriangle className="w-12 h-12 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No se encontraron facturas</h3>
        <p className="text-gray-600 mb-6">No hay facturas en el rango seleccionado. Prueba con otras fechas o verifica los datos en el sistema.</p>
        <button
          onClick={fetchAllFinanceData}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all"
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
          <Calendar className="w-5 h-5 text-green-600" />
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={fetchAllFinanceData}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Total Facturado</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalFacturado)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Pagado</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPagado)}</p>
              <p className="text-xs text-blue-700 mt-1">{facturasPagadas} facturas</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 mb-1">Total Pendiente</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(totalPendiente)}</p>
              <p className="text-xs text-yellow-700 mt-1">{facturasPendientes} facturas</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Total Facturas</p>
              <p className="text-3xl font-bold text-purple-900">{invoiceData.length}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Servicios y Repuestos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Servicios */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-600" />
            Top 5 Servicios
          </h3>
          {topServices.length > 0 ? (
            <div className="space-y-3">
              {topServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{service.nombre_servicio || service.nombre || 'Servicio'}</span>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(service.total_ingresos || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No hay datos de servicios</p>
          )}
        </div>

        {/* Top Repuestos */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Top 5 Repuestos
          </h3>
          {topParts.length > 0 ? (
            <div className="space-y-3">
              {topParts.map((part, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{part.nombre_repuesto || part.nombre || 'Repuesto'}</span>
                  </div>
                  <span className="font-bold text-blue-600">{formatCurrency(part.total_ingresos || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No hay datos de repuestos</p>
          )}
        </div>
      </div>

      {/* Ventas Mensuales */}
      {monthlyData && monthlyData.ventas_mensuales && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Ventas Mensuales {monthlyData.año}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthlyData.ventas_mensuales.map((mes) => (
              <div key={mes.mes} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <p className="text-sm font-semibold text-gray-600 mb-1">{mes.nombre_mes}</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(mes.total_ventas || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">{mes.cantidad_facturas || 0} facturas</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="w-4 h-4" />
          <span>Mostrando {invoiceData.length} facturas</span>
          {(fechaInicio || fechaFin) && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              Filtrado
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportPDF}
            disabled={invoiceData.length === 0 || exportingPDF}
            aria-busy={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <FileText className="w-4 h-4" />
            {exportingPDF ? 'Generando PDF...' : 'Exportar PDF'}
          </button>

          <button
            onClick={exportExcel}
            disabled={invoiceData.length === 0 || exportingExcel}
            aria-busy={exportingExcel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg font-medium hover:from-yellow-700 hover:to-yellow-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingExcel ? 'Generando Excel...' : 'Exportar Excel'}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={invoiceData.length === 0 || exportingCSV}
            aria-busy={exportingCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
          >
            <Download className="w-4 h-4" />
            {exportingCSV ? 'Generando CSV...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Facturas del Período
          </h3>
        </div>
        <Table
          data={invoiceData}
          columns={columns}
          emptyMessage="No se encontraron facturas en el rango seleccionado"
          actions={false}
        />
      </div>
    </div>
  );
};

export default FinanceReport;