import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Login from './components/Login'; // ← Debe ser este import
import ClientesPage from './pages/ClientesPage';
import VehiculosPage from './pages/VehiculosPage';
import ReparacionesPage from './pages/ReparacionesPage';
import FacturacionPage from './pages/FacturacionPage';
import { PERMISSIONS } from './utils/auth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/clientes" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.CLIENTES}>
              <ClientesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/vehiculos" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.VEHICULOS}>
              <VehiculosPage />
            </ProtectedRoute>
          } />
          
          <Route path="/reparaciones" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.SERVICIOS}>
              <ReparacionesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/facturacion" element={
            <ProtectedRoute requiredPermission={PERMISSIONS.FACTURACION}>
              <FacturacionPage />
            </ProtectedRoute>
          } />

          {/* Ruta para páginas no encontradas */}
          <Route path="*" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2>Página no encontrada</h2>
              <p>La página que buscas no existe.</p>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;