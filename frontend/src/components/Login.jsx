import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import tuercaGif from '../assets/images/tuerca.gif';
import '../styles/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Obtener todas las propiedades del contexto de autenticación
  const { 
    login, 
    isAuthenticated, 
    isLoading: authLoading 
  } = useAuth();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, authLoading]);

  // Usuarios de ejemplo
  const demoUsers = [
    {
      email: 'admin@taller.com',
      password: 'ferrari123',
      nombre: 'Administrador Principal',
      rol: 'administrador',
      permisos: ['dashboard', 'clientes', 'vehiculos', 'agenda', 'inventario', 'facturacion', 'servicios', 'empleados', 'usuarios']
    },
    {
      email: 'mecanico@taller.com',
      password: 'ferrari123',
      nombre: 'Juan Mecánico',
      rol: 'mecanico',
      permisos: ['dashboard', 'vehiculos', 'agenda']
    },
    {
      email: 'recepcion@taller.com', 
      password: 'ferrari123',
      nombre: 'María Recepción',
      rol: 'recepcion',
      permisos: ['dashboard', 'clientes', 'agenda', 'facturacion']
    }
  ];

  // Mostrar loading mientras verifica la autenticación
  if (authLoading) {
    return (
      <div className="login-container">
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2>🔄 Cargando...</h2>
          <p>Por favor espere</p>
        </div>
      </div>
    );
  }

  // Si ya está autenticado, no mostrar el formulario
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = login(email, password);
      
      if (result.success) {
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <motion.div 
        className="login-box"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* GIF de tuerca */}
        <div className="tuerca-gif-container">
          <img src={tuercaGif} alt="Tuerca animada" className="tuerca-gif" />
        </div>

        <div className="logo-container">
          <h1>TALLER MECÁNICO</h1>
          <div className="logo-divider"></div>
          <p>Sistema de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="error-message"
            >
              {error}
            </motion.div>
          )}

          <div className="input-group">
            <label>
              <FaUser style={{ marginRight: '8px' }} />
              Usuario
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@taller.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label>
              <FaLock style={{ marginRight: '8px' }} />
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer'
                }}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="login-button"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? 'INICIANDO SESIÓN...' : 'INGRESAR'}
          </motion.button>
        </form>

        <div className="demo-section">
          <h3 style={{ 
            textAlign: 'center', 
            color: '#555', 
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            Usuarios de Demo:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {demoUsers.map((user, index) => (
              <motion.button
                key={user.email}
                type="button"
                style={{
                  padding: '0.6rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: '#2a2a2a'
                }}
                onClick={() => handleDemoLogin(user.email, user.password)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <strong>{user.rol}:</strong> {user.email}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;