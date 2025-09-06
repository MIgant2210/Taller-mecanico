import React from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/auth';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2>🔄 Verificando autenticación...</h2>
          <p>Por favor espere</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    // Usar timeout para evitar loops de renderizado
    setTimeout(() => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }, 100);
    
    return null;
  }

  // Si requiere un permiso específico y no lo tiene
  if (requiredPermission && !hasPermission(currentUser, requiredPermission)) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        background: 'white',
        borderRadius: '15px',
        margin: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h2>🚫 Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p>Tu rol: <strong>{currentUser?.rol}</strong></p>
        <p>Permiso requerido: <strong>{requiredPermission}</strong></p>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;