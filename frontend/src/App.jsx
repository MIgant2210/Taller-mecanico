import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/LoginPage';
import ClientesPage from './pages/ClientesPage';
import VehiculosPage from './pages/VehiculosPage';
import ReparacionesPage from './pages/ReparacionesPage';
import FacturacionPage from './pages/FacturacionPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Nuevas rutas para módulos */}
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/vehiculos" element={<VehiculosPage />} />
        <Route path="/reparaciones" element={<ReparacionesPage />} />
        <Route path="/facturacion" element={<FacturacionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;