// Catálogos Generales DTE El Salvador
// Fuente: Ministerio de Hacienda

export const catalogoAmbiente = [
  { codigo: "00", valor: "Modo prueba" },
  { codigo: "01", valor: "Modo producción" }
];

export const catalogoTipoDocumento = [
  { codigo: "01", valor: "Factura" },
  { codigo: "03", valor: "Comprobante de crédito fiscal" },
  { codigo: "04", valor: "Nota de remisión" },
  { codigo: "05", valor: "Nota de crédito" },
  { codigo: "06", valor: "Nota de débito" },
  { codigo: "07", valor: "Comprobante de retención" },
  { codigo: "08", valor: "Comprobante de liquidación" },
  { codigo: "09", valor: "Documento contable de liquidación" },
  { codigo: "11", valor: "Facturas de exportación" },
  { codigo: "14", valor: "Factura de sujeto excluido" },
  { codigo: "15", valor: "Comprobante de donación" }
];

export const catalogoModeloFacturacion = [
  { codigo: "1", valor: "Modelo Facturación previo" },
  { codigo: "2", valor: "Modelo Facturación diferido" }
];

export const catalogoTipoTransmision = [
  { codigo: "1", valor: "Transmisión normal" },
  { codigo: "2", valor: "Transmisión por contingencia" }
];

export const catalogoDepartamentos = [
  { codigo: "00", valor: "Otro (Para extranjeros)" },
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
];

export const catalogoMunicipios = [
  { codigo: "00", valor: "Otro (Para extranjeros)", departamento: null },

  // AHUACHAPÁN (01)
  { codigo: "13", valor: "AHUACHAPAN NORTE", departamento: "01" },
  { codigo: "14", valor: "AHUACHAPAN CENTRO", departamento: "01" },
  { codigo: "15", valor: "AHUACHAPAN SUR", departamento: "01" },

  // SANTA ANA (02)
  { codigo: "14", valor: "SANTA ANA NORTE", departamento: "02" },
  { codigo: "15", valor: "SANTA ANA CENTRO", departamento: "02" },
  { codigo: "16", valor: "SANTA ANA ESTE", departamento: "02" },
  { codigo: "17", valor: "SANTA ANA OESTE", departamento: "02" },

  // SONSONATE (03)
  { codigo: "17", valor: "SONSONATE NORTE", departamento: "03" },
  { codigo: "18", valor: "SONSONATE CENTRO", departamento: "03" },
  { codigo: "19", valor: "SONSONATE ESTE", departamento: "03" },
  { codigo: "20", valor: "SONSONATE OESTE", departamento: "03" },

  // CHALATENANGO (04)
  { codigo: "34", valor: "CHALATENANGO NORTE", departamento: "04" },
  { codigo: "35", valor: "CHALATENANGO CENTRO", departamento: "04" },
  { codigo: "36", valor: "CHALATENANGO SUR", departamento: "04" },

  // LA LIBERTAD (05)
  { codigo: "23", valor: "LA LIBERTAD NORTE", departamento: "05" },
  { codigo: "24", valor: "LA LIBERTAD CENTRO", departamento: "05" },
  { codigo: "25", valor: "LA LIBERTAD OESTE", departamento: "05" },
  { codigo: "26", valor: "LA LIBERTAD ESTE", departamento: "05" },
  { codigo: "27", valor: "LA LIBERTAD COSTA", departamento: "05" },
  { codigo: "28", valor: "LA LIBERTAD SUR", departamento: "05" },

  // SAN SALVADOR (06)
  { codigo: "20", valor: "SAN SALVADOR NORTE", departamento: "06" },
  { codigo: "21", valor: "SAN SALVADOR OESTE", departamento: "06" },
  { codigo: "22", valor: "SAN SALVADOR ESTE", departamento: "06" },
  { codigo: "23", valor: "SAN SALVADOR CENTRO", departamento: "06" },
  { codigo: "24", valor: "SAN SALVADOR SUR", departamento: "06" },

  // CUSCATLÁN (07)
  { codigo: "17", valor: "CUSCATLAN NORTE", departamento: "07" },
  { codigo: "18", valor: "CUSCATLAN SUR", departamento: "07" },

  // LA PAZ (08)
  { codigo: "23", valor: "LA PAZ OESTE", departamento: "08" },
  { codigo: "24", valor: "LA PAZ CENTRO", departamento: "08" },
  { codigo: "25", valor: "LA PAZ ESTE", departamento: "08" },

  // CABAÑAS (09)
  { codigo: "10", valor: "CABANAS OESTE", departamento: "09" },
  { codigo: "11", valor: "CABANAS ESTE", departamento: "09" },

  // SAN VICENTE (10)
  { codigo: "14", valor: "SAN VICENTE NORTE", departamento: "10" },
  { codigo: "15", valor: "SAN VICENTE SUR", departamento: "10" },

  // USULUTÁN (11)
  { codigo: "24", valor: "USULUTAN NORTE", departamento: "11" },
  { codigo: "25", valor: "USULUTAN ESTE", departamento: "11" },
  { codigo: "26", valor: "USULUTAN OESTE", departamento: "11" },

  // SAN MIGUEL (12)
  { codigo: "21", valor: "SAN MIGUEL NORTE", departamento: "12" },
  { codigo: "22", valor: "SAN MIGUEL CENTRO", departamento: "12" },
  { codigo: "23", valor: "SAN MIGUEL OESTE", departamento: "12" },

  // MORAZÁN (13)
  { codigo: "27", valor: "MORAZAN NORTE", departamento: "13" },
  { codigo: "28", valor: "MORAZAN SUR", departamento: "13" },

  // LA UNIÓN (14)
  { codigo: "19", valor: "LA UNION NORTE", departamento: "14" },
  { codigo: "20", valor: "LA UNION SUR", departamento: "14" },
];

export const catalogoUnidadMedida = [
  { codigo: "1", valor: "metro" },
  { codigo: "2", valor: "Yarda" },
  { codigo: "6", valor: "milímetro" },
  { codigo: "9", valor: "kilómetro cuadrado" },
  { codigo: "10", valor: "Hectárea" }
];

export const catalogoTributos = [
  { codigo: "51", valor: "Bebidas Alcohólicas" },
  { codigo: "52", valor: "Cerveza" },
  { codigo: "53", valor: "Productos del Tabaco" },
  { codigo: "54", valor: "Bebidas Carbonatadas o Gaseosas Simples o Endulzadas" },
  { codigo: "55", valor: "Otros Específicos" },
  { codigo: "58", valor: "Alcohol" },
  { codigo: "77", valor: "Importador de Jugos, Néctares, Bebidas con Jugo y Refrescos" },
  { codigo: "79", valor: "Distribuidor de Jugos, Néctares, Bebidas con Jugo y Refrescos" },
  { codigo: "90", valor: "Sobre Llamadas Telefónicas Provenientes del Ext." },
  { codigo: "95", valor: "Detallista de Jugos, Néctares, Bebidas con Jugo y Refrescos" },
  { codigo: "86", valor: "Fabricante de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas" },
  { codigo: "91", valor: "Fabricante de Jugos, Néctares, Bebidas con Jugo y Refrescos" },
  { codigo: "92", valor: "Importador de Preparaciones Concentradas o en Polvo para la Elaboración de Bebidas" },
  { codigo: "A1", valor: "Específicos y Ad-Valorem" },
  { codigo: "A5", valor: "Bebidas Gaseosas, Isotónicas, Deportivas, Fortificantes, Energizantes o Estimulantes" },
  { codigo: "A7", valor: "Alcohol Etílico" },
  { codigo: "A9", valor: "Sacos Sintéticos" }
];

export const catalogoCondicionOperacion = [
  { codigo: "1", valor: "Contado" },
  { codigo: "2", valor: "A crédito" },
  { codigo: "3", valor: "Otro" }
];

export const catalogoFormaPago = [
  { codigo: "01", valor: "Billetes y monedas" },
  { codigo: "02", valor: "Tarjeta Débito" },
  { codigo: "03", valor: "Tarjeta Crédito" },
  { codigo: "04", valor: "Cheque" },
  { codigo: "05", valor: "Transferencia–Depósito Bancario" },
  { codigo: "08", valor: "Dinero electrónico" },
  { codigo: "09", valor: "Monedero electrónico" },
  { codigo: "11", valor: "Bitcoin" },
  { codigo: "12", valor: "Otras Criptomonedas" },
  { codigo: "13", valor: "Cuentas por pagar del receptor" },
  { codigo: "14", valor: "Giro bancario" },
  { codigo: "99", valor: "Otros (se debe indicar el medio de pago)" }
];

export const catalogoPlazo = [
  { codigo: "01", valor: "Días" },
  { codigo: "02", valor: "Meses" },
  { codigo: "03", valor: "Años" }
];

export const catalogoTipoPersona = [
  { codigo: "1", valor: "Persona Natural" },
  { codigo: "2", valor: "Persona Jurídica" }
];

// Funciones utilitarias genéricas
export function buscarPorCodigo(catalogo, codigo) {
  return catalogo.find(item => item.codigo === codigo) || null;
}

export function buscarPorValor(catalogo, valor) {
  return catalogo.filter(item => item.valor.toLowerCase().includes(valor.toLowerCase()));
}

export function esCodigoValido(catalogo, codigo) {
  return catalogo.some(item => item.codigo === codigo);
} 