import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Inventory from './pages/Inventory';
import Appointments from './pages/Appointments';
import Tickets from './pages/Tickets';
import Invoices from './pages/Invoices';
import Admin from './pages/Admin';
import Cotizaciones from './pages/Cotizaciones';
import Reportes from './pages/Reportes';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (solo para no autenticados)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Rutas protegidas */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/clients" 
          element={
            <ProtectedRoute>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/services" 
          element={
            <ProtectedRoute>
              <Layout>
                <Services />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/inventory" 
          element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/appointments" 
          element={
            <ProtectedRoute>
              <Layout>
                <Appointments />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tickets" 
          element={
            <ProtectedRoute>
              <Layout>
                <Tickets />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/invoices" 
          element={
            <ProtectedRoute>
              <Layout>
                <Invoices />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/cotizaciones" 
          element={
            <ProtectedRoute>
              <Layout>
                <Cotizaciones />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Layout>
                <Admin />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/reportes" 
          element={
            <ProtectedRoute>
              <Layout>
                <Reportes />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Ruta por defecto para páginas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;