import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  CalendarDays,
  Ticket,
  AlertTriangle,
  Package,
  UserPlus,
  ClipboardPlus,
  Wrench,
  Boxes,
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    citas_hoy: 0,
    tickets_activos: 0,
    tickets_hoy: 0,
    repuestos_stock_bajo: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get("/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Citas Hoy",
      value: stats.citas_hoy,
      icon: CalendarDays,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Tickets Activos",
      value: stats.tickets_activos,
      icon: Ticket,
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Tickets Hoy",
      value: stats.tickets_hoy,
      icon: ClipboardPlus,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Stock Bajo",
      value: stats.repuestos_stock_bajo,
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-lg text-gray-600">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Bienvenido al panel de control de tu taller.
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all p-6 relative overflow-hidden"
            >
              {/* Efecto decorativo de fondo */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}
              ></div>

              <div className="flex items-center relative">
                <div
                  className={`bg-gradient-to-br ${stat.color} text-white p-3 rounded-lg shadow-md`}
                >
                  <Icon size={26} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Wrench className="text-blue-700" size={22} />
          Acciones Rápidas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <a
            href="/clients"
            className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 text-center hover:shadow-md hover:scale-[1.02] transition-transform"
          >
            <UserPlus className="text-blue-700 mb-3" size={28} />
            <p className="font-medium text-blue-800">Nuevo Cliente</p>
          </a>

          <a
            href="/appointments"
            className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 text-center hover:shadow-md hover:scale-[1.02] transition-transform"
          >
            <CalendarDays className="text-green-700 mb-3" size={28} />
            <p className="font-medium text-green-800">Nueva Cita</p>
          </a>

          <a
            href="/tickets"
            className="flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6 text-center hover:shadow-md hover:scale-[1.02] transition-transform"
          >
            <Ticket className="text-orange-700 mb-3" size={28} />
            <p className="font-medium text-orange-800">Nuevo Ticket</p>
          </a>

          <a
            href="/inventory"
            className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 text-center hover:shadow-md hover:scale-[1.02] transition-transform"
          >
            <Boxes className="text-purple-700 mb-3" size={28} />
            <p className="font-medium text-purple-800">Ver Inventario</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
