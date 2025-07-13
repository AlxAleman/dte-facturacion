import React, { useState, useEffect } from 'react';
import { Save, Edit, Check, X, Building, Phone, Mail, MapPin, FileText } from 'lucide-react';
import EMPRESA_CONFIG, { validarConfiguracionEmpresa } from '../../config/empresa';

const EmpresaConfig = ({ onConfigChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(EMPRESA_CONFIG);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Cargar configuración guardada en localStorage o usar la configuración por defecto
    const savedConfig = localStorage.getItem('empresaConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        console.log('✅ Configuración cargada desde localStorage:', parsedConfig);
      } catch (error) {
        console.error('❌ Error al cargar configuración desde localStorage:', error);
        setConfig(EMPRESA_CONFIG);
      }
    } else {
      setConfig(EMPRESA_CONFIG);
      console.log('ℹ️ Usando configuración por defecto');
    }
  }, []);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error de validación
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateConfig = () => {
    const errors = {};
    const requiredFields = ['nombre', 'nit'];
    
    requiredFields.forEach(field => {
      if (!config[field] || config[field].trim() === '') {
        errors[field] = 'Este campo es requerido';
      }
    });

    // Validar formato de NIT
    if (config.nit && !/^\d{4}-\d{6}-\d{3}-\d$/.test(config.nit)) {
      errors.nit = 'Formato de NIT inválido (ej: 0614-123456-789-0)';
    }

    // Validar email
    if (config.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.correo)) {
      errors.correo = 'Formato de email inválido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (validateConfig()) {
      // Aquí podrías guardar la configuración en localStorage o enviarla al servidor
      localStorage.setItem('empresaConfig', JSON.stringify(config));
      
      // Notificar al componente padre
      if (onConfigChange) {
        onConfigChange(config);
      }
      
      setIsEditing(false);
      alert('✅ Configuración guardada exitosamente');
    } else {
      alert('❌ Por favor corrija los errores antes de guardar');
    }
  };

  const handleCancel = () => {
    // Recargar la configuración guardada en localStorage
    const savedConfig = localStorage.getItem('empresaConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        setConfig(EMPRESA_CONFIG);
      }
    } else {
      setConfig(EMPRESA_CONFIG);
    }
    setValidationErrors({});
    setIsEditing(false);
  };

  const getFieldClassName = (field) => {
    const baseClass = "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    return validationErrors[field] 
      ? `${baseClass} border-red-300 focus:border-red-500 focus:ring-red-500`
      : `${baseClass} border-gray-300`;
  };

  const isConfigValid = () => {
    const camposRequeridos = ['nombre', 'nit'];
    const camposFaltantes = camposRequeridos.filter(campo => !config[campo]);
    
    if (camposFaltantes.length > 0) {
      console.warn('⚠️ Campos de empresa faltantes:', camposFaltantes);
      return false;
    }
    
    return true;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Building className="w-6 h-6 mr-2 text-blue-600" />
          Configuración de Empresa
        </h2>
        
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
              >
                <Check className="w-4 h-4 mr-1" />
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estado de la configuración */}
      <div className={`mb-6 p-4 rounded-md ${isConfigValid() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          {isConfigValid() ? (
            <Check className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <X className="w-5 h-5 text-red-600 mr-2" />
          )}
          <span className={`text-sm font-medium ${isConfigValid() ? 'text-green-800' : 'text-red-800'}`}>
            {isConfigValid() ? 'Configuración válida' : 'Configuración incompleta'}
          </span>
        </div>
        <p className={`text-sm mt-1 ${isConfigValid() ? 'text-green-700' : 'text-red-700'}`}>
          {isConfigValid() 
            ? 'Todos los campos requeridos están configurados correctamente.'
            : 'Faltan campos requeridos. Complete la configuración para continuar.'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos Principales */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Datos Principales
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              value={config.nombre || ''}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              disabled={!isEditing}
              placeholder="Ej: Mi Empresa S.A. de C.V."
              className={getFieldClassName('nombre')}
            />
            {validationErrors.nombre && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIT *
            </label>
            <input
              type="text"
              value={config.nit || ''}
              onChange={(e) => handleInputChange('nit', e.target.value)}
              disabled={!isEditing}
              placeholder="Ej: 0614-123456-789-0"
              className={getFieldClassName('nit')}
            />
            {validationErrors.nit && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.nit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Comercial
            </label>
            <input
              type="text"
              value={config.nombreComercial || ''}
              onChange={(e) => handleInputChange('nombreComercial', e.target.value)}
              disabled={!isEditing}
              placeholder="Nombre comercial"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de Actividad
            </label>
            <textarea
              value={config.descActividad || ''}
              onChange={(e) => handleInputChange('descActividad', e.target.value)}
              disabled={!isEditing}
              placeholder="Descripción de la actividad económica"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-blue-600" />
            Información de Contacto
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={config.direccion || ''}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                disabled={!isEditing}
                placeholder="Dirección completa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="tel"
                value={config.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                disabled={!isEditing}
                placeholder="+503 2222-3333"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="email"
                value={config.correo || ''}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                disabled={!isEditing}
                placeholder="facturacion@empresa.com"
                className={getFieldClassName('correo')}
              />
            </div>
            {validationErrors.correo && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.correo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NRC
            </label>
            <input
              type="text"
              value={config.nrc || ''}
              onChange={(e) => handleInputChange('nrc', e.target.value)}
              disabled={!isEditing}
              placeholder="Número de registro de contribuyente"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Información Adicional</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Serie de Facturación:</span> {config.serieFactura || 'A'}
          </div>
          <div>
            <span className="font-medium">Moneda:</span> {config.moneda || 'USD'}
          </div>
          <div>
            <span className="font-medium">Ambiente:</span> {config.ambiente || 'test'}
          </div>
        </div>
      </div>

      {/* Nota importante */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Importante:</strong> Los cambios en la configuración se guardan localmente. 
          Para una implementación en producción, considere guardar estos datos en una base de datos 
          o sistema de configuración centralizado.
        </p>
      </div>
    </div>
  );
};

export default EmpresaConfig; 