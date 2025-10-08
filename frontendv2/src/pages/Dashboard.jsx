import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    citas_hoy: 0,
    tickets_activos: 0,
    tickets_hoy: 0,
    repuestos_stock_bajo: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Citas Hoy',
      value: stats.citas_hoy,
      icon: '📅',
      color: 'bg-blue-500'
    },
    {
      title: 'Tickets Activos',
      value: stats.tickets_activos,
      icon: '🎫',
      color: 'bg-orange-500'
    },
    {
      title: 'Tickets Hoy',
      value: stats.tickets_hoy,
      icon: '🆕',
      color: 'bg-green-500'
    },
    {
      title: 'Stock Bajo',
      value: stats.repuestos_stock_bajo,
      icon: '⚠️',
      color: 'bg-red-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen general del taller</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/clients" className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:bg-blue-100 transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <p className="font-medium text-blue-700">Nuevo Cliente</p>
          </a>
          <a href="/appointments" className="bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:bg-green-100 transition-colors">
            <div className="text-2xl mb-2">📅</div>
            <p className="font-medium text-green-700">Nueva Cita</p>
          </a>
          <a href="/tickets" className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center hover:bg-orange-100 transition-colors">
            <div className="text-2xl mb-2">🎫</div>
            <p className="font-medium text-orange-700">Nuevo Ticket</p>
          </a>
          <a href="/inventory" className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center hover:bg-purple-100 transition-colors">
            <div className="text-2xl mb-2">📦</div>
            <p className="font-medium text-purple-700">Ver Inventario</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;