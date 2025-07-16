// src/config/empresa.js
// Configuración de datos de la empresa emisora

export const EMPRESA_CONFIG = {
  // 🏢 DATOS PRINCIPALES DE LA EMPRESA
  nombre: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  nit: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  nombreComercial: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  descActividad: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  
  // 📍 INFORMACIÓN DE CONTACTO
  direccion: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  telefono: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  correo: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  
  // 🏛️ INFORMACIÓN TRIBUTARIA
  nrc: "", // 🔥 CORREGIDO: Debe ser configurado por el usuario
  
  // 🎨 CONFIGURACIÓN VISUAL (opcional)
  logo: "/logo.png", // Ruta al logo de la empresa
  colorPrimario: "#2563eb", // Color principal para la UI
  colorSecundario: "#1e40af", // Color secundario
  
  // ⚙️ CONFIGURACIÓN DE FACTURACIÓN
  serieFactura: "A", // Serie de facturación
  numeroInicial: "00000001", // Número inicial de facturas
  moneda: "USD", // Moneda por defecto
  idioma: "es", // Idioma por defecto
  
  // 📋 CONFIGURACIÓN DE IMPRESIÓN
  piePagina: "Gracias por su preferencia",
  terminosCondiciones: "Los precios están sujetos a cambios sin previo aviso",
  
  // 🔧 CONFIGURACIÓN TÉCNICA
  ambiente: "test", // test | production
  certificadoDigital: {
    ruta: "/certificates/certificado.p12",
    password: "password123"
  }
};

// Función para obtener los datos del emisor en formato DTE
export const getEmisorData = () => {
  // Intentar cargar configuración guardada en localStorage
  const savedConfig = localStorage.getItem('empresaConfig');
  let configToUse = EMPRESA_CONFIG;
  
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      configToUse = { ...EMPRESA_CONFIG, ...parsedConfig }; // Merge con configuración por defecto
    } catch (error) {
      console.error('❌ Error al cargar configuración desde localStorage:', error);
      configToUse = EMPRESA_CONFIG;
    }
  }
  
  return {
    nit: configToUse.nit,
    nombre: configToUse.nombre,
    nombreComercial: configToUse.nombreComercial,
    descActividad: configToUse.descActividad,
    direccion: configToUse.direccion,
    telefono: configToUse.telefono,
    correo: configToUse.correo,
    nrc: configToUse.nrc
  };
};

// Función para validar que la configuración esté completa
export const validarConfiguracionEmpresa = () => {
  // Intentar cargar configuración guardada en localStorage
  const savedConfig = localStorage.getItem('empresaConfig');
  let configToUse = EMPRESA_CONFIG;
  
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig);
      configToUse = { ...EMPRESA_CONFIG, ...parsedConfig }; // Merge con configuración por defecto
    } catch (error) {
      console.error('❌ Error al cargar configuración desde localStorage:', error);
      configToUse = EMPRESA_CONFIG;
    }
  }
  
  const camposRequeridos = ['nombre', 'nit'];
  const camposFaltantes = camposRequeridos.filter(campo => !configToUse[campo]);
  
  if (camposFaltantes.length > 0) {
    console.warn('⚠️ Campos de empresa faltantes:', camposFaltantes);
    return false;
  }
  
  return true;
};

// Función para generar número de control
export const generarNumeroControl = (tipoDte, numeroFactura) => {
  const serie = EMPRESA_CONFIG.serieFactura || 'A';
  const numero = numeroFactura.toString().padStart(8, '0');
  const codigoGeneracion = Math.random().toString(36).substring(2, 15);
  
  return `DTE-${tipoDte}-${numero}-${codigoGeneracion}`;
};

export default EMPRESA_CONFIG; 