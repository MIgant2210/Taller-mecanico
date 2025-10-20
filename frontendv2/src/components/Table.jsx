import React from 'react';
import { Edit2, Trash2, Eye, AlertCircle, Download, FileText } from 'lucide-react';
import jsPDF from "jspdf";
import "jspdf-autotable";

const Table = ({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete, 
  onView,
  actions = true,
  emptyMessage = "No hay datos disponibles",
  // Nuevas props para cotizaciones
  cotizacionMode = false,
  onExportPDF,
  searchPlaceholder = "Buscar..."
}) => {
  // Formateador de moneda para quetzales (específico para cotizaciones)
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  // Función para exportar PDF de cotizaciones
  const handleExportPDF = () => {
    if (!cotizacionMode || data.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("📄 Cotizaciones", 105, 15, { align: "center" });

    const tableData = data.map((c) => [
      `${c.cliente?.nombres || ""} ${c.cliente?.apellidos || ""}`,
      new Date(c.fecha_cotizacion).toLocaleDateString(),
      formatCurrency(c.subtotal),
      formatCurrency(c.impuestos),
      formatCurrency(c.descuentos),
      formatCurrency(c.total),
    ]);

    doc.autoTable({
      startY: 25,
      head: [["Cliente", "Fecha", "Subtotal", "Impuestos", "Descuentos", "Total"]],
      body: tableData,
      theme: "grid",
      styles: { halign: "right" },
      headStyles: {
        fillColor: [55, 71, 79],
        textColor: [255, 255, 255],
        halign: "center",
      },
      columnStyles: {
        0: { halign: "left" }, // Cliente
        1: { halign: "left" }, // Fecha
      },
    });

    doc.save("cotizaciones.pdf");
  };

  // Columnas específicas para cotizaciones
  const getCotizacionColumns = () => [
    {
      key: 'cliente',
      title: 'Cliente',
      render: (value, item) => (
        <div className="font-medium text-gray-900">
          {item.cliente?.nombres} {item.cliente?.apellidos}
        </div>
      )
    },
    {
      key: 'fecha_cotizacion',
      title: 'Fecha',
      render: (value) => (
        <div className="text-gray-700">
          {new Date(value).toLocaleDateString('es-GT')}
        </div>
      )
    },
    {
      key: 'subtotal',
      title: 'Subtotal',
      render: (value) => (
        <div className="text-right font-medium text-gray-900">
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'impuestos',
      title: 'Impuestos',
      render: (value) => (
        <div className="text-right text-gray-700">
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'descuentos',
      title: 'Descuentos',
      render: (value) => (
        <div className="text-right text-red-600">
          -{formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'total',
      title: 'Total',
      render: (value) => (
        <div className="text-right font-bold text-green-700">
          {formatCurrency(value)}
        </div>
      )
    }
  ];

  // Determinar qué columnas usar
  const tableColumns = cotizacionMode ? getCotizacionColumns() : columns;

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-gray-200 rounded-full mb-4">
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg font-medium">{emptyMessage}</p>
          <p className="text-gray-400 text-sm mt-2">No se encontraron registros para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Header con búsqueda y exportación para cotizaciones */}
      {cotizacionMode && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                // Aquí puedes agregar lógica de filtrado si lo deseas
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-gray-900 hover:shadow-lg transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      )}

      {/* Tabla principal */}
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              {tableColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${
                    column.key === 'subtotal' || column.key === 'impuestos' || 
                    column.key === 'descuentos' || column.key === 'total' ? 'text-right' : ''
                  }`}
                >
                  {column.title}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr 
                key={item.id_cotizacion || item.id || index} 
                className="hover:bg-blue-50/50 transition-all duration-200 group"
              >
                {tableColumns.map((column) => (
                  <td 
                    key={column.key} 
                    className={`px-6 py-4 text-sm ${
                      column.key === 'subtotal' || column.key === 'impuestos' || 
                      column.key === 'descuentos' || column.key === 'total' ? 'text-right' : 'text-gray-900'
                    }`}
                  >
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="group/btn relative p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 hover:scale-110 hover:shadow-md"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Ver
                          </span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="group/btn relative p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all duration-200 hover:scale-110 hover:shadow-md"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Editar
                          </span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="group/btn relative p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 hover:scale-110 hover:shadow-md"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Eliminar
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer con información */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200 rounded-b-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold text-gray-900">{data.length}</span> {data.length === 1 ? 'registro' : 'registros'}
          </p>
          {cotizacionMode && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>Lista de cotizaciones</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Table;