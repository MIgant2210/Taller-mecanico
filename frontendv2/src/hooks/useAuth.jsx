import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Configurar el token en las cabeceras de axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verificar si el token es válido obteniendo el usuario actual
        const response = await api.get('/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      const { access_token, user_info } = response.data;
      
      // Guardar token en localStorage
      localStorage.setItem('token', access_token);
      
      // Configurar cabecera de autorización
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Establecer usuario
      setUser(user_info);
      
      return user_info;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    // Remover token
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    
    // Limpiar usuario
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await api.put('/auth/change-password', null, {
        params: { old_password: oldPassword, new_password: newPassword }
      });
      return true;
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};