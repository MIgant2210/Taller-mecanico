// Utilitarios para manejo de roles y permisos
export const ROLES = {
  ADMIN: 'administrador',
  MECANICO: 'mecanico',
  RECEPCION: 'recepcion'
};

export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  CLIENTES: 'clientes',
  VEHICULOS: 'vehiculos',
  AGENDA: 'agenda',
  INVENTARIO: 'inventario',
  FACTURACION: 'facturacion',
  SERVICIOS: 'servicios',
  EMPLEADOS: 'empleados',
  USUARIOS: 'usuarios'
};

// Verificar si usuario tiene permiso para ver un módulo
export const hasPermission = (user, permission) => {
  if (!user || !user.permisos) return false;
  return user.permisos.includes(permission);
};

// Verificar si usuario tiene rol específico
export const hasRole = (user, role) => {
  if (!user || !user.rol) return false;
  return user.rol === role;
};

// Obtener módulos permitidos para un usuario
export const getAllowedModules = (user) => {
  if (!user || !user.permisos) return [];
  return user.permisos;
};

// Filtrar menú según permisos del usuario
export const getFilteredMenu = (user, menuItems) => {
  if (!user || hasRole(user, ROLES.ADMIN)) return menuItems;
  
  return menuItems.filter(item => {
    const permissionMap = {
      'inicio': PERMISSIONS.DASHBOARD,
      'clientes': PERMISSIONS.CLIENTES,
      'vehiculos': PERMISSIONS.VEHICULOS,
      'agenda': PERMISSIONS.AGENDA,
      'inventario': PERMISSIONS.INVENTARIO,
      'facturacion': PERMISSIONS.FACTURACION,
      'servicios': PERMISSIONS.SERVICIOS,
      'empleados': PERMISSIONS.EMPLEADOS,
      'usuarios': PERMISSIONS.USUARIOS
    };
    
    return hasPermission(user, permissionMap[item.tab]);
  });
};