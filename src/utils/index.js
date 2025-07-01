// src/utils/index.js
// Funciones utilitarias para el sistema DTE

import { config } from '../config';

// Formatear moneda
export const formatCurrency = (amount, currency = config.format.currency) => {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Formatear fecha
export const formatDate = (date, format = config.format.dateFormat) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Formatear hora
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toTimeString().split(' ')[0]; // HH:mm:ss
};

// Generar UUID v4
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
};

// Validar NIT
export const validateNIT = (nit) => {
  if (!nit) return false;
  // Remover guiones y espacios
  const cleanNIT = nit.replace(/[-\s]/g, '');
  // Debe tener exactamente 14 dígitos
  return /^\d{14}$/.test(cleanNIT);
};

// Validar DUI
export const validateDUI = (dui) => {
  if (!dui) return false;
  // Formato: 12345678-9
  return /^\d{8}-?\d{1}$/.test(dui);
};

// Validar email
export const validateEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validar UUID
export const validateUUID = (uuid) => {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
};

// Redondear moneda según reglas de El Salvador
export const roundMoney = (amount) => {
  return Math.round((amount || 0) * 100) / 100;
};

// Convertir número a palabras (para totales en letras)
export const numberToWords = (amount) => {
  // Implementación básica - en producción usar librería especializada
  const formatter = new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD'
  });
  
  const formatted = formatter.format(amount);
  return formatted.toUpperCase().replace('US$', '') + ' DÓLARES';
};

// Validar archivo por extensión
export const validateFileExtension = (fileName, allowedExtensions) => {
  if (!fileName || !allowedExtensions) return false;
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
};

// Obtener tamaño de archivo legible
export const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function
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

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Limpiar y formatear texto
export const sanitizeText = (text) => {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
};

// Obtener correlativo siguiente
export const getNextCorrelative = (current) => {
  if (!current) return 'DTE-01-00000001-000000000000001';
  
  // Extraer número y incrementar
  const parts = current.split('-');
  if (parts.length >= 4) {
    const number = parseInt(parts[3]) + 1;
    parts[3] = number.toString().padStart(15, '0');
    return parts.join('-');
  }
  
  return current;
};

// Exportar datos a JSON
export const exportToJSON = (data, filename = 'export.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Manejar errores de API
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.name === 'NetworkError' || !error.response) {
    return config.messages.networkError;
  }
  
  if (error.response?.status === 401) {
    return 'Sesión expirada. Por favor inicie sesión nuevamente.';
  }
  
  if (error.response?.status === 403) {
    return 'No tiene permisos para realizar esta acción.';
  }
  
  if (error.response?.status >= 500) {
    return 'Error del servidor. Intente nuevamente más tarde.';
  }
  
  return error.message || config.messages.error;
};

// Logger personalizado
export const logger = {
  info: (message, data) => {
    if (config.system.debug) {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message, data) => {
    if (config.system.debug) {
      console.warn(`[WARN] ${message}`, data);
    }
  }
};