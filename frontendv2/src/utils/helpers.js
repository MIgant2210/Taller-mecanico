// Funciones helper utilitarias

/**
 * Formatea una fecha a formato local
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  return new Date(dateString).toLocaleDateString('es-ES', { ...defaultOptions, ...options });
};

/**
 * Formatea una fecha y hora a formato local
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea una cantidad monetaria
 */
export const formatCurrency = (amount, currency = 'GTQ') => {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return 'N/A';
  
  return new Intl.NumberFormat('es-GT').format(number);
};

/**
 * Recorta un texto si excede la longitud máxima
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza la primera letra de un texto
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Valida si un email tiene formato válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si un teléfono tiene formato válido (Guatemala)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Genera un color aleatorio para avatares
 */
export const generateRandomColor = () => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Obtiene las iniciales de un nombre
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Calcula el subtotal de un item
 */
export const calculateSubtotal = (quantity, unitPrice) => {
  return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);
};

/**
 * Calcula el total de una factura
 */
export const calculateInvoiceTotal = (subtotal, taxes = 0, discounts = 0) => {
  return (parseFloat(subtotal) || 0) + (parseFloat(taxes) || 0) - (parseFloat(discounts) || 0);
};

/**
 * Filtra elementos por búsqueda de texto
 */
export const filterBySearch = (items, searchTerm, fields = ['name']) => {
  if (!searchTerm) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    fields.some(field => 
      String(item[field] || '').toLowerCase().includes(term)
    )
  );
};

/**
 * Ordena elementos por campo
 */
export const sortByField = (items, field, direction = 'asc') => {
  return [...items].sort((a, b) => {
    let aValue = a[field];
    let bValue = b[field];
    
    // Manejar valores nulos
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Comparar
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Descarga un archivo
 */
export const downloadFile = (data, filename, type = 'text/plain') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Debounce function para optimizar búsquedas
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};