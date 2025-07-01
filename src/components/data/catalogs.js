// src/data/catalogs.js
// Catálogos oficiales del Ministerio de Hacienda de El Salvador
// Actualizados según resoluciones 2024-2025

export const CATALOGS = {
  // CAT-009: Tipo de Establecimiento
  CAT_009_TIPO_ESTABLECIMIENTO: [
    { codigo: "01", valor: "Casa Matriz" },
    { codigo: "02", valor: "Sucursal" },
    { codigo: "03", valor: "Agencia" },
    { codigo: "04", valor: "Oficina" },
    { codigo: "05", valor: "Planta Industrial" },
    { codigo: "06", valor: "Bodega" },
    { codigo: "07", valor: "Depósito" },
    { codigo: "08", valor: "Punto de Venta" },
    { codigo: "09", valor: "Kiosco" },
    { codigo: "10", valor: "Puesto" },
    { codigo: "99", valor: "Otros" }
  ],

  // CAT-012: Departamentos
  CAT_012_DEPARTAMENTOS: [
    { codigo: "01", valor: "Ahuachapán" },
    { codigo: "02", valor: "Santa Ana" },
    { codigo: "03", valor: "Sonsonate" },
    { codigo: "04", valor: "Chalatenango" },
    { codigo: "05", valor: "La Libertad" },
    { codigo: "06", valor: "San Salvador" },
    { codigo: "07", valor: "Cuscatlán" },
    { codigo: "08", valor: "La Paz" },
    { codigo: "09", valor: "Cabañas" },
    { codigo: "10", valor: "San Vicente" },
    { codigo: "11", valor: "Usulután" },
    { codigo: "12", valor: "San Miguel" },
    { codigo: "13", valor: "Morazán" },
    { codigo: "14", valor: "La Unión" }
  ],

  // CAT-014: Unidad de Medida
  CAT_014_UNIDAD_MEDIDA: [
    { codigo: "59", valor: "Unidad" },
    { codigo: "99", valor: "Otros" },
    { codigo: "1", valor: "Metro" },
    { codigo: "2", valor: "Metro cuadrado" },
    { codigo: "3", valor: "Metro cúbico" },
    { codigo: "4", valor: "Litro" },
    { codigo: "5", valor: "Galón" },
    { codigo: "6", valor: "Kilogramo" },
    { codigo: "7", valor: "Libra" },
    { codigo: "8", valor: "Quintal" },
    { codigo: "9", valor: "Tonelada" },
    { codigo: "10", valor: "Caja" },
    { codigo: "11", valor: "Docena" },
    { codigo: "12", valor: "Hora" },
    { codigo: "13", valor: "Día" },
    { codigo: "14", valor: "Mes" },
    { codigo: "15", valor: "Año" },
    { codigo: "16", valor: "Servicio" },
    { codigo: "17", valor: "Botella" },
    { codigo: "18", valor: "Bolsa" },
    { codigo: "19", valor: "Rollo" },
    { codigo: "20", valor: "Par" }
  ],

  // CAT-017: Forma de Pago
  CAT_017_FORMA_PAGO: [
    { codigo: "01", valor: "Billetes y monedas" },
    { codigo: "02", valor: "Tarjeta Débito/Crédito" },
    { codigo: "03", valor: "Cheque" },
    { codigo: "04", valor: "Transferencia - Depósito" },
    { codigo: "05", valor: "Billetera Digital" },
    { codigo: "99", valor: "Otros" }
  ],

  // CAT-019: Actividad Económica (principales)
  CAT_019_ACTIVIDAD_ECONOMICA: [
    { codigo: "10110", valor: "Cultivo de cereales" },
    { codigo: "46110", valor: "Venta al por mayor de materias primas agropecuarias" },
    { codigo: "47110", valor: "Venta al por menor en comercios no especializados" },
    { codigo: "55101", valor: "Hoteles con restaurante" },
    { codigo: "56101", valor: "Restaurantes con servicio de mesa" },
    { codigo: "62010", valor: "Programación informática" },
    { codigo: "68100", valor: "Compra y venta de bienes raíces propios" },
    { codigo: "85421", valor: "Educación universitaria" },
    { codigo: "86201", valor: "Actividades de la práctica médica" },
    { codigo: "96091", valor: "Otras actividades de servicios personales" }
  ],

  // CAT-020: País
  CAT_020_PAIS: [
    { codigo: "218", valor: "El Salvador" },
    { codigo: "320", valor: "Guatemala" },
    { codigo: "340", valor: "Honduras" },
    { codigo: "558", valor: "Nicaragua" },
    { codigo: "188", valor: "Costa Rica" },
    { codigo: "591", valor: "Panamá" },
    { codigo: "484", valor: "México" },
    { codigo: "840", valor: "Estados Unidos" },
    { codigo: "124", valor: "Canadá" },
    { codigo: "170", valor: "Colombia" },
    { codigo: "152", valor: "Chile" },
    { codigo: "032", valor: "Argentina" },
    { codigo: "076", valor: "Brasil" },
    { codigo: "724", valor: "España" },
    { codigo: "250", valor: "Francia" },
    { codigo: "380", valor: "Italia" },
    { codigo: "276", valor: "Alemania" },
    { codigo: "826", valor: "Reino Unido" },
    { codigo: "156", valor: "China" },
    { codigo: "392", valor: "Japón" },
    { codigo: "410", valor: "Corea del Sur" }
  ],

  // CAT-027: Recinto Fiscal
  CAT_027_RECINTO_FISCAL: [
    { codigo: "01", valor: "Aduana Central" },
    { codigo: "02", valor: "Aduana Puerto de Acajutla" },
    { codigo: "03", valor: "Aduana Aeroportuerto El Salvador" },
    { codigo: "04", valor: "Aduana Las Chinamas" },
    { codigo: "05", valor: "Aduana San Bartolo" },
    { codigo: "06", valor: "Aduana El Amatillo" },
    { codigo: "07", valor: "Aduana El Poy" },
    { codigo: "08", valor: "Aduana La Hachadura" },
    { codigo: "99", valor: "Otros" }
  ],

  // CAT-028: Régimen
  CAT_028_REGIMEN: [
    { codigo: "01", valor: "Contribuyente" },
    { codigo: "02", valor: "No Contribuyente" }
  ],

  // Tipos de documentos DTE
  TIPOS_DTE: [
    { codigo: "01", valor: "Factura", esquema: "fe-fc-v1.json" },
    { codigo: "03", valor: "Comprobante de Crédito Fiscal", esquema: "fe-ccf-v3.json" },
    { codigo: "04", valor: "Nota de Remisión", esquema: "fe-nr-v3.json" },
    { codigo: "05", valor: "Nota de Crédito", esquema: "fe-nc-v3.json" },
    { codigo: "06", valor: "Nota de Débito", esquema: "fe-nd-v3.json" },
    { codigo: "07", valor: "Comprobante de Retención", esquema: "fe-cr-v1.json" },
    { codigo: "08", valor: "Comprobante de Liquidación", esquema: "fe-cl-v1.json" },
    { codigo: "09", valor: "Documento Contable de Liquidación", esquema: "fe-dcl-v1.json" },
    { codigo: "11", valor: "Factura de Exportación", esquema: "fe-fex-v1.json" },
    { codigo: "14", valor: "Factura de Sujeto Excluido", esquema: "fe-fse-v1.json" },
    { codigo: "15", valor: "Comprobante de Donación", esquema: "fe-cd-v1.json" }
  ],

  // Estados de documentos DTE
  ESTADOS_DTE: [
    { codigo: "PROCESADO", valor: "Procesado" },
    { codigo: "RECHAZADO", valor: "Rechazado" },
    { codigo: "CONTINGENCIA", valor: "Contingencia" },
    { codigo: "ANULADO", valor: "Anulado" },
    { codigo: "INVALIDADO", valor: "Invalidado" }
  ],

  // Condiciones de operación
  CONDICIONES_OPERACION: [
    { codigo: "1", valor: "Contado" },
    { codigo: "2", valor: "Crédito" },
    { codigo: "3", valor: "Otro" }
  ],

  // Tipos de documento de identificación
  TIPOS_DOCUMENTO_IDENTIFICACION: [
    { codigo: "13", valor: "DUI" },
    { codigo: "02", valor: "NIT" },
    { codigo: "03", valor: "Pasaporte" },
    { codigo: "04", valor: "Carné de residente" },
    { codigo: "05", valor: "Otro" }
  ]
};

// Función para obtener catálogo por código
export const getCatalog = (catalogName) => {
  return CATALOGS[catalogName] || [];
};

// Función para obtener valor por código
export const getCatalogValue = (catalogName, codigo) => {
  const catalog = getCatalog(catalogName);
  const item = catalog.find(item => item.codigo === codigo);
  return item ? item.valor : null;
};

// Función para validar código en catálogo
export const isValidCatalogCode = (catalogName, codigo) => {
  const catalog = getCatalog(catalogName);
  return catalog.some(item => item.codigo === codigo);
};

// Función para buscar en catálogo por texto
export const searchInCatalog = (catalogName, searchText) => {
  const catalog = getCatalog(catalogName);
  return catalog.filter(item => 
    item.valor.toLowerCase().includes(searchText.toLowerCase()) ||
    item.codigo.includes(searchText)
  );
};