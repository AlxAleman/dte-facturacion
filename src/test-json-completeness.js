// src/test-json-completeness.js
// Script para verificar que el JSON generado cumple con el esquema oficial

// JSON de ejemplo generado por el sistema
const jsonGenerado = {
  "identificacion": {
    "version": 1,
    "ambiente": "00",
    "tipoDte": "01",
    "codigoGeneracion": "2BAF4CF7-1C79-4827-A208-20B7C64C3997",
    "numeroControl": "DTE-01-00000001-000000000000001",
    "tipoModelo": 1,
    "tipoOperacion": 1,
    "fecEmi": "2025-07-09",
    "horEmi": "13:49:56",
    "tipoMoneda": "USD"
  },
  "emisor": {
    "nit": "0614-123456-789-0",
    "nrc": "123456",
    "nombre": "Mi Empresa S.A. de C.V.",
    "codActividad": "6201",
    "descActividad": "Desarrollo de software",
    "nombreComercial": "Mi Empresa",
    "direccion": {
      "departamento": "06",
      "municipio": "01",
      "complemento": "Calle Principal #123, Colonia Centro, San Salvador"
    }
  },
  "receptor": {
    "tipoDocumento": "36",
    "numDocumento": "0280788-3",
    "nrc": null,
    "nombre": "Alex Aleman",
    "codActividad": "6201",
    "descActividad": "Actividad económica del receptor",
    "direccion": {
      "departamento": "06",
      "municipio": "01",
      "complemento": "Santa Tecla"
    },
    "telefono": "70543824",
    "correo": "alxaleman@gmail.com"
  },
  "cuerpoDocumento": [
    {
      "numItem": 1,
      "codigo": "",
      "descripcion": "Prod",
      "cantidad": 1,
      "precioUni": 100,
      "montoDescu": 0
    }
  ],
  "resumen": {
    "totalNoSuj": 0,
    "totalExenta": 0,
    "totalGravada": 100,
    "subTotalVentas": 100,
    "descuNoSuj": 0,
    "descuExenta": 0,
    "descuGravada": 0,
    "porcentajeDescuento": 0,
    "totalDescu": 0,
    "tributos": [
      {
        "codigo": "20",
        "descripcion": "Impuesto al Valor Agregado 13%",
        "valor": 13
      }
    ],
    "subTotal": 100,
    "ivaRete1": 0,
    "reteRenta": 0,
    "montoTotalOperacion": 113,
    "totalNoGravado": 0,
    "totalPagar": 113,
    "totalLetras": "CIENTO TRECE DÓLARES",
    "totalIva": 13,
    "saldoFavor": 0,
    "condicionOperacion": 1,
    "pagos": [],
    "numPagoElectronico": ""
  }
};

// Campos requeridos según el esquema oficial
const camposRequeridos = {
  identificacion: [
    "version", "ambiente", "tipoDte", "numeroControl", "codigoGeneracion", 
    "tipoModelo", "tipoOperacion", "fecEmi", "horEmi", "tipoMoneda"
  ],
  emisor: [
    "nit", "nrc", "nombre", "codActividad", "descActividad", "direccion"
  ],
  receptor: [
    "tipoDocumento", "numDocumento", "nombre"
  ],
  cuerpoDocumento: [
    "numItem", "descripcion", "cantidad", "precioUni"
  ],
  resumen: [
    "totalNoSuj", "totalExenta", "totalGravada", "subTotalVentas",
    "descuNoSuj", "descuExenta", "descuGravada", "porcentajeDescuento",
    "totalDescu", "tributos", "subTotal", "ivaRete1", "reteRenta",
    "montoTotalOperacion", "totalNoGravado", "totalPagar", "totalLetras",
    "totalIva", "saldoFavor", "condicionOperacion", "pagos", "numPagoElectronico"
  ]
};

// Función para verificar campos requeridos
function verificarCamposRequeridos(json, seccion) {
  const campos = camposRequeridos[seccion];
  const datos = json[seccion];
  const faltantes = [];
  const presentes = [];

  if (seccion === 'cuerpoDocumento') {
    // Verificar cada ítem del cuerpo del documento
    if (Array.isArray(datos) && datos.length > 0) {
      const primerItem = datos[0];
      campos.forEach(campo => {
        if (primerItem[campo] !== undefined && primerItem[campo] !== null && primerItem[campo] !== "") {
          presentes.push(campo);
        } else {
          faltantes.push(campo);
        }
      });
    } else {
      faltantes.push(...campos);
    }
  } else {
    campos.forEach(campo => {
      if (datos[campo] !== undefined && datos[campo] !== null && datos[campo] !== "") {
        presentes.push(campo);
      } else {
        faltantes.push(campo);
      }
    });
  }

  return { presentes, faltantes };
}

// Función para verificar estructura de direcciones
function verificarDirecciones(json) {
  const errores = [];
  
  // Verificar dirección del emisor
  if (!json.emisor.direccion.departamento) {
    errores.push("emisor.direccion.departamento faltante");
  }
  if (!json.emisor.direccion.municipio) {
    errores.push("emisor.direccion.municipio faltante");
  }
  if (!json.emisor.direccion.complemento) {
    errores.push("emisor.direccion.complemento faltante");
  }

  // Verificar dirección del receptor
  if (!json.receptor.direccion.departamento) {
    errores.push("receptor.direccion.departamento faltante");
  }
  if (!json.receptor.direccion.municipio) {
    errores.push("receptor.direccion.municipio faltante");
  }
  if (!json.receptor.direccion.complemento) {
    errores.push("receptor.direccion.complemento faltante");
  }

  return errores;
}

// Función para verificar estructura de tributos
function verificarTributos(json) {
  const tributos = json.resumen.tributos;
  if (!Array.isArray(tributos)) {
    return ["resumen.tributos debe ser un array"];
  }

  const errores = [];
  tributos.forEach((tributo, index) => {
    if (!tributo.codigo) {
      errores.push(`tributos[${index}].codigo faltante`);
    }
    if (!tributo.descripcion) {
      errores.push(`tributos[${index}].descripcion faltante`);
    }
    if (tributo.valor === undefined || tributo.valor === null) {
      errores.push(`tributos[${index}].valor faltante`);
    }
  });

  return errores;
}

// Ejecutar verificación
console.log("🔍 VERIFICANDO COMPLETITUD DEL JSON GENERADO");
console.log("=" .repeat(50));

// Verificar cada sección
Object.keys(camposRequeridos).forEach(seccion => {
  console.log(`\n📋 Sección: ${seccion.toUpperCase()}`);
  const resultado = verificarCamposRequeridos(jsonGenerado, seccion);
  
  console.log(`✅ Campos presentes (${resultado.presentes.length}):`, resultado.presentes);
  
  if (resultado.faltantes.length > 0) {
    console.log(`❌ Campos faltantes (${resultado.faltantes.length}):`, resultado.faltantes);
  } else {
    console.log("✅ Todos los campos requeridos están presentes");
  }
});

// Verificar estructura de direcciones
console.log("\n📍 Verificando estructura de direcciones:");
const erroresDirecciones = verificarDirecciones(jsonGenerado);
if (erroresDirecciones.length > 0) {
  console.log("❌ Errores en direcciones:", erroresDirecciones);
} else {
  console.log("✅ Estructura de direcciones correcta");
}

// Verificar estructura de tributos
console.log("\n💰 Verificando estructura de tributos:");
const erroresTributos = verificarTributos(jsonGenerado);
if (erroresTributos.length > 0) {
  console.log("❌ Errores en tributos:", erroresTributos);
} else {
  console.log("✅ Estructura de tributos correcta");
}

// Resumen final
const totalCamposRequeridos = Object.values(camposRequeridos).flat().length;
const totalCamposPresentes = Object.keys(camposRequeridos).reduce((total, seccion) => {
  const resultado = verificarCamposRequeridos(jsonGenerado, seccion);
  return total + resultado.presentes.length;
}, 0);

console.log("\n" + "=" .repeat(50));
console.log("📊 RESUMEN FINAL:");
console.log(`Total campos requeridos: ${totalCamposRequeridos}`);
console.log(`Total campos presentes: ${totalCamposPresentes}`);
console.log(`Porcentaje de completitud: ${((totalCamposPresentes / totalCamposRequeridos) * 100).toFixed(1)}%`);

if (totalCamposPresentes === totalCamposRequeridos && erroresDirecciones.length === 0 && erroresTributos.length === 0) {
  console.log("🎉 ¡JSON COMPLETAMENTE VÁLIDO!");
} else {
  console.log("⚠️ JSON necesita ajustes para cumplir con el esquema oficial");
}

export { jsonGenerado, camposRequeridos }; 