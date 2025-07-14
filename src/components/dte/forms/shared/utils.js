// src/components/dte/forms/shared/utils.js
// Utilidades compartidas para todos los formularios DTE

// Función helper para generar UUID
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

// Función para obtener valor anidado del objeto
export function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Función para verificar si un campo está vacío
export function isFieldEmpty(value) {
  return value === undefined || value === null || value === '' ||
         (Array.isArray(value) && value.length === 0);
}

// Función para obtener clase CSS para campos con error
export function getFieldClassName(fieldPath, formData, requiredFields = [], baseClass = "") {
  const value = getNestedValue(formData, fieldPath);
  const hasError = isFieldEmpty(value);
  const isRequired = requiredFields && requiredFields.includes(fieldPath);
  
  let className = baseClass || "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  
  if (hasError) {
    className += " border-red-300 focus:border-red-500 focus:ring-red-500";
  } else if (isRequired) {
    className += " border-blue-300";
  } else {
    className += " border-gray-300";
  }
  
  return className;
}

// Función para obtener nombre de campo para mostrar
export function getFieldDisplayName(fieldPath) {
  const fieldNames = {
    'identificacion.tipoDte': 'Tipo de DTE',
    'identificacion.fecEmi': 'Fecha de Emisión',
    'receptor.nombre': 'Nombre del Receptor',
    'receptor.tipoDocumento': 'Tipo de Documento',
    'receptor.numDocumento': 'Número de Documento',
    'receptor.nrc': 'NRC',
    'receptor.telefono': 'Teléfono',
    'receptor.correo': 'Correo Electrónico',
    'receptor.direccion.departamento': 'Departamento',
    'receptor.direccion.municipio': 'Municipio',
    'receptor.direccion.complemento': 'Dirección',
    'sujetoExcluido.nombre': 'Nombre del Sujeto Excluido',
    'sujetoExcluido.tipoDocumento': 'Tipo de Documento',
    'sujetoExcluido.numDocumento': 'Número de Documento',
    'sujetoExcluido.direccion.departamento': 'Departamento',
    'sujetoExcluido.direccion.municipio': 'Municipio',
    'sujetoExcluido.direccion.complemento': 'Dirección',
    'donatario.nombre': 'Nombre del Donatario',
    'donante.nombre': 'Nombre del Donante',
    'cuerpoDocumento': 'Productos/Servicios'
  };
  
  return fieldNames[fieldPath] || fieldPath;
} 