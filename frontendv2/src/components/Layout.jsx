import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NAVIGATION } from '../utils/constants';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  // Filtrar menú según roles - CORREGIDO
  const menuItems = NAVIGATION.filter(item => 
    item.roles.includes(user?.rol?.nombre_rol)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          <h1 className="text-white text-xl font-bold">Taller Mecánico</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex items-center px-4 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </a>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="font-medium">{user?.empleado?.nombres}</p>
              <p className="text-sm text-blue-200">{user?.rol?.nombre_rol}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-blue-700 rounded transition-colors"
              title="Cerrar sesión"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ☰
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;