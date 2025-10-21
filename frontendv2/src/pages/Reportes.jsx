import React, { useState } from 'react';
import { 
  Package, 
  TrendingUp, 
  Users, 
  Wrench, 
  DollarSign, 
  ArrowLeft, 
  FileBarChart,
  AlertCircle
} from 'lucide-react';
import InventoryReport from '../reports/InventoryReport';
import Layout from '../components/Layout';

const reportOptions = [
  {
    key: 'inventory',
    title: 'Inventario Actual',
    description: 'Visualiza el estado actual de tu inventario',
    icon: Package,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
    component: InventoryReport
  },
  {
    key: 'movements',
    title: 'Movimientos de Inventario',
    description: 'Seguimiento de entradas y salidas',
    icon: TrendingUp,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'from-emerald-50 to-emerald-100',
    component: null
  },
  {
    key: 'clients',
    title: 'Clientes por Mes',
    description: 'Análisis de clientes y tendencias',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100',
    component: null
  },
  {
    key: 'services',
    title: 'Servicios Realizados',
    description: 'Reporte de servicios completados',
    icon: Wrench,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'from-orange-50 to-orange-100',
    component: null
  },
  {
    key: 'finance',
    title: 'Ingresos y Gastos',
    description: 'Análisis financiero detallado',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    bgColor: 'from-green-50 to-green-100',
    component: null
  }
];

const ComingSoonPlaceholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full p-6 mb-6">
      <AlertCircle className="w-16 h-16 text-blue-600" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">Próximamente Disponible</h3>
    <p className="text-gray-600 text-center max-w-md mb-6">
      El reporte <span className="font-semibold text-gray-800">"{title}"</span> estará disponible en una próxima actualización.
    </p>
    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
      <FileBarChart className="w-4 h-4" />
      <span>Estamos trabajando en nuevas funcionalidades</span>
    </div>
  </div>
);

const Reportes = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const handleReportSelect = (report) => {
    setSelectedReport(report);
  };

  const handleBackToMenu = () => {
    setSelectedReport(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <FileBarChart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Módulo de Reportes</h1>
                <p className="text-gray-600">Analiza y visualiza la información de tu negocio</p>
              </div>
            </div>
          </div>

          {/* Vista del Menú de Reportes */}
          {!selectedReport ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportOptions.map((report) => {
                const IconComponent = report.icon;
                return (
                  <button
                    key={report.key}
                    onClick={() => handleReportSelect(report)}
                    className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300"
                  >
                    {/* Background decorativo */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${report.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    {/* Contenido */}
                    <div className="relative p-6 flex flex-col items-start gap-4">
                      {/* Icono */}
                      <div className={`bg-gradient-to-br ${report.color} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>

                      {/* Texto */}
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-gray-900">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">
                          {report.description}
                        </p>
                      </div>

                      {/* Indicador de disponibilidad */}
                      {!report.component && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Próximamente
                          </span>
                        </div>
                      )}

                      {/* Flecha */}
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Vista del Reporte Seleccionado */
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header del Reporte */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`bg-gradient-to-br ${selectedReport.color} p-3 rounded-xl shadow-lg`}>
                      {React.createElement(selectedReport.icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedReport.title}</h2>
                      <p className="text-gray-600 text-sm">{selectedReport.description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleBackToMenu}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </button>
                </div>
              </div>

              {/* Contenido del Reporte */}
              <div className="p-6 bg-gray-50">
                {selectedReport.component ? (
                  <selectedReport.component />
                ) : (
                  <ComingSoonPlaceholder title={selectedReport.title} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default Reportes;