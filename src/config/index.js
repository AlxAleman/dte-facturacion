// src/config/index.js
// Configuración global del sistema

export const config = {
  // URLs de API
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'https://api.factura.gob.sv',
    testURL: import.meta.env.VITE_TEST_API_URL || 'https://apitest.dtes.mh.gob.sv',
    consultaURL: import.meta.env.VITE_MH_CONSULTA_URL || 'https://admin.factura.gob.sv/consultaPublica'
  },

  // Información de la empresa
  company: {
    nit: import.meta.env.VITE_COMPANY_NIT || '',
    name: import.meta.env.VITE_COMPANY_NAME || '',
    nrc: import.meta.env.VITE_COMPANY_NRC || '',
    email: import.meta.env.VITE_COMPANY_EMAIL || '',
    phone: import.meta.env.VITE_COMPANY_PHONE || ''
  },

  // Configuración de impuestos (El Salvador)
  taxes: {
    iva: 0.13,          // 13%
    renta: 0.10,        // 10%
    minRentaThreshold: 100.00
  },

  // Configuración del sistema
  system: {
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    debug: import.meta.env.VITE_DEBUG === 'true',
    version: import.meta.env.VITE_VERSION || '1.0.0',
    useNewSystem: import.meta.env.VITE_USE_NEW_SYSTEM === 'true'
  },

  // Configuración de validación
  validation: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedCertificateTypes: ['.cer', '.crt'],
    allowedKeyTypes: ['.key', '.pem'],
    maxRetries: 3,
    timeoutMs: 30000
  },

  // Configuración de QR
  qr: {
    defaultSize: 200,
    maxSize: 400,
    minSize: 100,
    errorCorrectionLevel: 'M'
  },

  // Mensajes del sistema
  messages: {
    loading: 'Procesando...',
    success: 'Operación completada exitosamente',
    error: 'Ha ocurrido un error',
    networkError: 'Error de conexión. Verifique su internet.',
    validationError: 'Por favor corrija los errores antes de continuar'
  },

  // Configuración de formato
  format: {
    currency: 'USD',
    locale: 'es-SV',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss'
  }
};

// Función para obtener configuración por ambiente
export const getConfig = (environment = config.system.environment) => {
  const configs = {
    development: {
      ...config,
      api: {
        ...config.api,
        baseURL: config.api.testURL
      },
      system: {
        ...config.system,
        debug: true
      }
    },
    production: {
      ...config,
      system: {
        ...config.system,
        debug: false
      }
    },
    test: {
      ...config,
      api: {
        ...config.api,
        baseURL: 'http://localhost:3001'
      }
    }
  };

  return configs[environment] || configs.development;
};

export default config;