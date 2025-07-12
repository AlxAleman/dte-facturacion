// src/test-schema-validator.cjs
// Archivo de prueba para verificar el sistema de validación

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Cargar esquema directamente
const schemaPath = path.join(__dirname, 'components', 'schemas', 'fe-fc-v1.json');
const fcSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Datos de prueba para una factura de consumidor
const testDTEData = {
  identificacion: {
    version: 1,
    ambiente: "01",
    tipoDte: "01",
    numeroControl: "DTE-01-12345678-000000000000001",
    codigoGeneracion: "ABCD1234-5678-9ABC-DEF0-123456789ABC",
    tipoModelo: 1,
    tipoOperacion: 1,
    tipoContingencia: null,
    motivoContin: null,
    fecEmi: "2024-01-15",
    horEmi: "14:30:00",
    tipoMoneda: "USD"
  },
  emisor: {
    nit: "12345678901234",
    nrc: "123456",
    nombre: "EMPRESA DE PRUEBA S.A. DE C.V.",
    codActividad: "62010",
    descActividad: "Programación informática",
    direccion: {
      departamento: "06",
      municipio: "01",
      complemento: "Colonia Test, Calle Test #123"
    }
  },
  receptor: {
    tipoDocumento: "13",
    numDocumento: "12345678-9",
    nombre: "CLIENTE DE PRUEBA",
    nrc: null,
    direccion: {
      departamento: "06",
      municipio: "01",
      complemento: "Dirección del cliente"
    }
  },
  cuerpoDocumento: [
    {
      numItem: 1,
      tipoItem: 2,
      codigo: "SERV001",
      uniMedida: "SERV",
      cantidad: 1,
      precioUni: 100.00,
      montoDescu: 0,
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada: 100.00,
      tributos: [
        {
          codigo: "20",
          descripcion: "IVA 13%",
          valor: 13.00
        }
      ],
      psv: 100.00,
      noGravado: 0,
      ivaItem: 13.00,
      totalItem: 113.00
    }
  ],
  resumen: {
    totalNoSuj: 0,
    totalExenta: 0,
    totalGravada: 100.00,
    subTotalVentas: 100.00,
    descuNoSuj: 0,
    descuExenta: 0,
    descuGravada: 0,
    porcentajeDescuento: 0,
    totalDescu: 0,
    tributos: [
      {
        codigo: "20",
        descripcion: "IVA 13%",
        valor: 13.00
      }
    ],
    subTotal: 100.00,
    ivaRete1: 0,
    reteRenta: 0,
    montoTotalOperacion: 113.00,
    totalNoGravado: 0,
    totalPagar: 113.00,
    totalLetras: "CIENTO TRECE DOLARES CON 00/100",
    totalIva: 13.00,
    saldoFavor: 0,
    condicionOperacion: 1,
    pagos: [
      {
        codigo: "01",
        montoPago: 113.00
      }
    ],
    numPagoElectronico: ""
  }
};

// Función de prueba simplificada
function testSchemaValidator() {
  console.log('🧪 Iniciando prueba del sistema de validación...');
  
  try {
    // Inicializar Ajv
    console.log('1. Inicializando Ajv...');
    const ajv = new Ajv({ 
      allErrors: true, 
      strict: false,
      verbose: true,
      validateFormats: true
    });
    addFormats(ajv);
    
    // Compilar esquema
    console.log('2. Compilando esquema FC...');
    const validate = ajv.compile(fcSchema);
    
    // Validar documento
    console.log('3. Validando documento de prueba...');
    const isValid = validate(testDTEData);
    
    console.log('✅ Validación completada');
    console.log('Resultado:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
    
    if (!isValid) {
      console.log('❌ Errores encontrados:');
      console.log(JSON.stringify(validate.errors, null, 2));
    
      // Análisis de errores
      const errorCount = validate.errors.length;
      const missingFields = validate.errors.filter(e => e.keyword === 'required').length;
      const invalidFields = validate.errors.filter(e => e.keyword === 'pattern' || e.keyword === 'format').length;
      
      console.log(`\n📊 Resumen de errores:`);
      console.log(`- Total errores: ${errorCount}`);
      console.log(`- Campos faltantes: ${missingFields}`);
      console.log(`- Campos con formato inválido: ${invalidFields}`);
    } else {
      console.log('🎉 Documento válido según el esquema FC');
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar prueba
  testSchemaValidator();