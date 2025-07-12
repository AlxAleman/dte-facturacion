// src/config/empresa.js
// Configuración de datos de la empresa emisora

export const EMPRESA_CONFIG = {
  // 🏢 DATOS PRINCIPALES DE LA EMPRESA
  nombre: "Mi Empresa S.A. de C.V.",
  nit: "0614-123456-789-0",
  nombreComercial: "Mi Empresa",
  descActividad: "Comercio al por mayor y menor de productos diversos",
  
  // 📍 INFORMACIÓN DE CONTACTO
  direccion: "Calle Principal #123, Colonia Centro, San Salvador",
  telefono: "+503 2222-3333",
  correo: "facturacion@miempresa.com",
  
  // 🏛️ INFORMACIÓN TRIBUTARIA
  nrc: "123456",
  
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
  return {
    nit: EMPRESA_CONFIG.nit,
    nombre: EMPRESA_CONFIG.nombre,
    nombreComercial: EMPRESA_CONFIG.nombreComercial,
    descActividad: EMPRESA_CONFIG.descActividad,
    direccion: EMPRESA_CONFIG.direccion,
    telefono: EMPRESA_CONFIG.telefono,
    correo: EMPRESA_CONFIG.correo,
    nrc: EMPRESA_CONFIG.nrc
  };
};

// Función para validar que la configuración esté completa
export const validarConfiguracionEmpresa = () => {
  const camposRequeridos = ['nombre', 'nit'];
  const camposFaltantes = camposRequeridos.filter(campo => !EMPRESA_CONFIG[campo]);
  
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