import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Usuarios de demo - CONTRASEÑA: ferrari123
  const demoUsers = [
    {
      id: 1,
      nombre: 'Administrador Principal',
      email: 'admin@taller.com',
      password: 'ferrari123',
      rol: 'administrador',
      permisos: ['dashboard', 'clientes', 'vehiculos', 'agenda', 'inventario', 'facturacion', 'servicios', 'empleados', 'usuarios'],
      activo: true
    },
    {
      id: 2,
      nombre: 'Juan Mecánico',
      email: 'mecanico@taller.com',
      password: 'ferrari123',
      rol: 'mecanico',
      permisos: ['dashboard', 'vehiculos', 'agenda'],
      activo: true
    },
    {
      id: 3,
      nombre: 'María Recepción',
      email: 'recepcion@taller.com',
      password: 'ferrari123',
      rol: 'recepcion',
      permisos: ['dashboard', 'clientes', 'agenda', 'facturacion'],
      activo: true
    },
    // Agregar más usuarios para los roles faltantes
    {
      id: 4,
      nombre: 'Ana Finanzas',
      email: 'finanzas@taller.com',
      password: 'ferrari123',
      rol: 'finanzas',
      permisos: ['dashboard', 'facturacion'],
      activo: true
    },
    {
      id: 5,
      nombre: 'Carlos Inteligencia',
      email: 'inteligencia@taller.com',
      password: 'ferrari123',
      rol: 'inteligencia',
      permisos: ['dashboard', 'clientes', 'vehiculos', 'agenda'],
      activo: true
    },
    {
      id: 6,
      nombre: 'Cliente Ejemplo',
      email: 'cliente@taller.com',
      password: 'ferrari123',
      rol: 'cliente',
      permisos: ['dashboard'],
      activo: true
    }
  ];

  // Verificar autenticación al inicializar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedAuth = localStorage.getItem('isAuthenticated');
      
      if (storedUser && storedAuth === 'true') {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (email, password, selectedRole = null) => {
    // Buscar usuario
    const user = demoUsers.find(u => 
      u.email === email && 
      u.password === password && 
      u.activo
    );
    
    if (user) {
      // VERIFICAR que el rol seleccionado coincida con el rol real del usuario
      if (selectedRole && user.rol !== selectedRole) {
        return { 
          success: false, 
          error: `Este usuario no tiene permisos de ${roles.find(r => r.id === selectedRole)?.label}. Selecciona el rol correcto.` 
        };
      }
      
      // Remover password antes de guardar el usuario
      const { password: _, ...userWithoutPassword } = user;
      
      setCurrentUser(userWithoutPassword);
      setIsAuthenticated(true);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      localStorage.setItem('isAuthenticated', 'true');
      
      return { success: true, user: userWithoutPassword };
    }
    
    return { success: false, error: 'Credenciales inválidas' };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
  };

  // Función para verificar permisos
  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.permisos) return false;
    return currentUser.permisos.includes(permission);
  };

  // Función para verificar rol
  const hasRole = (role) => {
    return currentUser?.rol === role;
  };

  // Función para obtener módulos permitidos
  const getAllowedModules = () => {
    if (!currentUser || !currentUser.permisos) return [];
    return currentUser.permisos;
  };

  // Función para filtrar menú según permisos
  const getFilteredMenu = (menuItems) => {
    if (!currentUser || hasRole('administrador')) return menuItems;
    
    return menuItems.filter(item => {
      const permissionMap = {
        'inicio': 'dashboard',
        'clientes': 'clientes',
        'vehiculos': 'vehiculos',
        'agenda': 'agenda',
        'inventario': 'inventario',
        'facturacion': 'facturacion',
        'servicios': 'servicios',
        'empleados': 'empleados',
        'usuarios': 'usuarios'
      };
      
      return hasPermission(permissionMap[item.tab]);
    });
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    getAllowedModules,
    getFilteredMenu
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Agregar esta constante fuera del componente para usarla en la validación
const roles = [
  { id: 'mecanico', label: 'Mecánico' },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'administrador', label: 'Administrador' },
  { id: 'finanzas', label: 'Finanzas' },
  { id: 'inteligencia', label: 'Inteligencia' },
  { id: 'cliente', label: 'Cliente' }
];

export default AuthContext;