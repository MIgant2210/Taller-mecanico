import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser, FaLock, FaEye, FaEyeSlash,
  FaTools, FaClipboardList, FaUserTie,
  FaMoneyBillWave, FaChartLine, FaUserAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import tuercaGif from '../assets/images/tuerca.gif';
import '../styles/login.css';

const roles = [
  { id: 'mecanico', label: 'Mecánico', icon: <FaTools /> },
  { id: 'recepcion', label: 'Recepción', icon: <FaClipboardList /> },
  { id: 'administrador', label: 'Administrador', icon: <FaUserTie /> },
  { id: 'finanzas', label: 'Finanzas', icon: <FaMoneyBillWave /> },
  { id: 'inteligencia', label: 'Inteligencia', icon: <FaChartLine /> },
  { id: 'cliente', label: 'Cliente', icon: <FaUserAlt /> }
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // PASA el selectedRole al login
      const result = login(email, password, selectedRole);
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

  if (authLoading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>🔄 Cargando...</h2>
          <p>Por favor espere</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="login-container">
      <div className="login-background"></div>

      <div className="logo-header">
        <img src={tuercaGif} alt="Logo Turbo Garage" style={{ width: '50px', marginBottom: '1rem' }} />
        <h1>TURBO GARAGE</h1>
      </div>

      {!selectedRole ? (
        <motion.div
          className="worker-selection"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 style={{ textAlign: 'center', color: 'var(--accent-orange)' }}>¿Quién eres?</h2>
          <div className="role-grid">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                className="role-circle"
                onClick={() => setSelectedRole(role.id)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <i>{role.icon}</i>
                <span>{role.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="login-box"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Login - {roles.find(r => r.id === selectedRole)?.label}</h2>

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
              <label><FaUser /> Usuario</label>
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
              <label><FaLock /> Contraseña</label>
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
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
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

          <button
            type="button"
            onClick={() => setSelectedRole(null)}
            style={{
              marginTop: '1.5rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-orange)',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ← Cambiar rol
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Login;