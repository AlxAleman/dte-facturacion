// src/services/schemaValidator.js
// Servicio para validación de DTEs contra esquemas JSON oficiales

export class SchemaValidatorService {
  constructor() {
    this.schemas = new Map();
    this.loadedSchemas = new Set();
  }

  // Cargar esquema desde archivo JSON
  async loadSchema(schemaName, schemaPath) {
    try {
      const response = await fetch(schemaPath);
      if (!response.ok) {
        throw new Error(`Error al cargar esquema: ${response.statusText}`);
      }
      
      const schema = await response.json();
      this.schemas.set(schemaName, schema);
      this.loadedSchemas.add(schemaName);
      
      return {
        success: true,
        message: `Esquema ${schemaName} cargado correctamente`,
        schema: schemaName
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al cargar esquema ${schemaName}: ${error.message}`,
        error
      };
    }
  }

  // Cargar todos los esquemas disponibles
  async loadAllSchemas() {
    const schemaFiles = [
    { name: 'factura', path: '/src/components/schemas/fe-fc-v1.json' },
    { name: 'ccf', path: '/src/components/schemas/fe-ccf-v3.json' },
    { name: 'notaCredito', path: '/src/components/schemas/fe-nc-v3.json' },
    { name: 'notaDebito', path: '/src/components/schemas/fe-nd-v3.json' },
    { name: 'notaRemision', path: '/src/components/schemas/fe-nr-v3.json' },
    { name: 'facturaExportacion', path: '/src/components/schemas/fe-fex-v1.json' },
    { name: 'facturaSujetoExcluido', path: '/src/components/schemas/fe-fse-v1.json' },
    { name: 'comprobanteRetencion', path: '/src/components/schemas/fe-cr-v1.json' },
    { name: 'comprobanteLiquidacion', path: '/src/components/schemas/fe-cl-v1.json' },
    { name: 'documentoContableLiquidacion', path: '/src/components/schemas/fe-dcl-v1.json' },
    { name: 'comprobanteDonacion', path: '/src/components/schemas/fe-cd-v1.json' },
    { name: 'anulacion', path: '/src/components/schemas/anulacion-schema-v2.json' },
    { name: 'contingencia', path: '/src/components/schemas/contingencia-schema-v3.json' }
  ];

    const results = [];
    for (const schema of schemaFiles) {
      const result = await this.loadSchema(schema.name, schema.path);
      results.push({ ...result, name: schema.name });
    }

    const successCount = results.filter(r => r.success).length;
    return {
      success: successCount === schemaFiles.length,
      message: `${successCount}/${schemaFiles.length} esquemas cargados`,
      results
    };
  }

  // Validar documento contra esquema específico
  validateDocument(document, schemaName) {
    if (!this.schemas.has(schemaName)) {
      return {
        isValid: false,
        message: `Esquema '${schemaName}' no encontrado`,
        errors: [`Esquema ${schemaName} no está cargado`]
      };
    }

    const schema = this.schemas.get(schemaName);
    return this.validateAgainstSchema(document, schema, schemaName);
  }

  // Validar documento contra esquema JSON
  validateAgainstSchema(document, schema, schemaName = 'unknown') {
    const errors = [];
    const warnings = [];

    try {
      // Validar estructura principal
      this.validateObject(document, schema, '', errors, warnings);

      // Validaciones específicas por tipo de documento
      this.applyBusinessRules(document, schemaName, errors, warnings);

      return {
        isValid: errors.length === 0,
        message: errors.length === 0 ? 'Documento válido' : 'Documento contiene errores',
        errors,
        warnings,
        schema: schemaName
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Error durante validación: ${error.message}`,
        errors: [error.message],
        warnings: []
      };
    }
  }

  // Validar objeto contra esquema
  validateObject(obj, schema, path, errors, warnings) {
    if (!schema || typeof schema !== 'object') {
      return;
    }

    // Validar tipo
    if (schema.type && !this.validateType(obj, schema.type)) {
      errors.push(`${path}: Tipo incorrecto. Esperado: ${schema.type}, Recibido: ${typeof obj}`);
      return;
    }

    // Validar propiedades requeridas
    if (schema.required && Array.isArray(schema.required)) {
      for (const required of schema.required) {
        if (obj === null || obj === undefined || !(required in obj)) {
          errors.push(`${path}: Propiedad requerida '${required}' no encontrada`);
        }
      }
    }

    // Validar propiedades
    if (schema.properties && typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const propSchema = schema.properties[key];
        if (propSchema) {
          const newPath = path ? `${path}.${key}` : key;
          this.validateProperty(value, propSchema, newPath, errors, warnings);
        } else if (schema.additionalProperties === false) {
          warnings.push(`${path}: Propiedad adicional no permitida: '${key}'`);
        }
      }
    }

    // Validar arrays
    if (schema.type === 'array' && Array.isArray(obj)) {
      if (schema.items) {
        obj.forEach((item, index) => {
          const newPath = `${path}[${index}]`;
          this.validateObject(item, schema.items, newPath, errors, warnings);
        });
      }

      // Validar longitud de array
      if (schema.minItems !== undefined && obj.length < schema.minItems) {
        errors.push(`${path}: Array debe tener al menos ${schema.minItems} elementos`);
      }
      if (schema.maxItems !== undefined && obj.length > schema.maxItems) {
        errors.push(`${path}: Array no puede tener más de ${schema.maxItems} elementos`);
      }
    }
  }

  // Validar propiedad individual
  validateProperty(value, schema, path, errors, warnings) {
    // Validar tipo
    if (schema.type && !this.validateType(value, schema.type)) {
      errors.push(`${path}: Tipo incorrecto. Esperado: ${schema.type}, Recibido: ${typeof value}`);
      return;
    }

    // Validar enum
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path}: Valor '${value}' no está en los valores permitidos: [${schema.enum.join(', ')}]`);
    }

    // Validar pattern (regex)
    if (schema.pattern && typeof value === 'string') {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push(`${path}: Valor '${value}' no cumple con el patrón requerido: ${schema.pattern}`);
      }
    }

    // Validar longitud de string
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${path}: Longitud mínima requerida: ${schema.minLength}`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${path}: Longitud máxima permitida: ${schema.maxLength}`);
      }
    }

    // Validar rangos numéricos
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push(`${path}: Valor mínimo permitido: ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push(`${path}: Valor máximo permitido: ${schema.maximum}`);
      }
    }

    // Validar objetos anidados
    if (schema.type === 'object' || schema.properties) {
      this.validateObject(value, schema, path, errors, warnings);
    }
  }

  // Validar tipo de dato
  validateType(value, expectedType) {
    if (value === null || value === undefined) {
      return expectedType === 'null' || expectedType.includes('null');
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (Array.isArray(expectedType)) {
      return expectedType.includes(actualType);
    }

    return actualType === expectedType;
  }

  // Aplicar reglas de negocio específicas
  applyBusinessRules(document, schemaName, errors, warnings) {
    // Validaciones comunes para todos los DTEs
    this.validateCommonBusinessRules(document, errors, warnings);

    // Validaciones específicas por tipo
    switch (schemaName) {
      case 'factura':
      case 'ccf':
        this.validateInvoiceRules(document, errors, warnings);
        break;
      case 'notaCredito':
        this.validateCreditNoteRules(document, errors, warnings);
        break;
      case 'notaDebito':
        this.validateDebitNoteRules(document, errors, warnings);
        break;
      case 'anulacion':
        this.validateCancellationRules(document, errors, warnings);
        break;
    }
  }

  // Validaciones comunes
  validateCommonBusinessRules(document, errors, warnings) {
    // Validar código de generación (UUID v4)
    if (document.identificacion?.codigoGeneracion) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(document.identificacion.codigoGeneracion)) {
        errors.push('identificacion.codigoGeneracion: Debe ser un UUID v4 válido');
      }
    }

    // Validar fecha de emisión
    if (document.identificacion?.fecEmi) {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(document.identificacion.fecEmi)) {
        errors.push('identificacion.fecEmi: Formato de fecha debe ser YYYY-MM-DD');
      } else {
        const fecha = new Date(document.identificacion.fecEmi);
        const hoy = new Date();
        if (fecha > hoy) {
          warnings.push('identificacion.fecEmi: Fecha de emisión es futura');
        }
      }
    }

    // Validar NIT del emisor
    if (document.emisor?.nit) {
      if (!/^\d{14}$/.test(document.emisor.nit)) {
        errors.push('emisor.nit: Debe contener exactamente 14 dígitos');
      }
    }

    // Validar totales
    if (document.resumen) {
      this.validateTotals(document, errors, warnings);
    }
  }

  // Validar cálculos de totales
  validateTotals(document, errors, warnings) {
    const resumen = document.resumen;
    const cuerpo = document.cuerpoDocumento;

    if (!cuerpo || !Array.isArray(cuerpo)) return;

    // Calcular subtotal
    const calculatedSubtotal = cuerpo.reduce((sum, item) => {
      return sum + (item.cantidad * item.precioUni);
    }, 0);

    if (Math.abs(calculatedSubtotal - (resumen.subTotal || 0)) > 0.01) {
      errors.push('resumen.subTotal: No coincide con la suma de los ítems');
    }

    // Validar IVA (13%)
    const ventasGravadas = resumen.subTotalVentas || 0;
    const expectedIva = Math.round(ventasGravadas * 0.13 * 100) / 100;
    
    if (resumen.ivaPerci && Math.abs(resumen.ivaPerci - expectedIva) > 0.01) {
      warnings.push('resumen.ivaPerci: El IVA calculado no coincide con el esperado (13%)');
    }
  }

  // Validaciones específicas para facturas
  validateInvoiceRules(document, errors, warnings) {
    // Validar que tenga al menos un ítem
    if (!document.cuerpoDocumento || document.cuerpoDocumento.length === 0) {
      errors.push('cuerpoDocumento: Debe contener al menos un ítem');
    }

    // Validar condición de operación
    if (document.resumen?.condicionOperacion) {
      const validConditions = ['1', '2', '3']; // Contado, Crédito, Otro
      if (!validConditions.includes(document.resumen.condicionOperacion)) {
        errors.push('resumen.condicionOperacion: Valor inválido');
      }
    }
  }

  // Validaciones para notas de crédito
  validateCreditNoteRules(document, errors, warnings) {
    // Debe referenciar documento original
    if (!document.documentoRelacionado || !document.documentoRelacionado.length) {
      errors.push('documentoRelacionado: Nota de crédito debe referenciar documento original');
    }
  }

  // Validaciones para notas de débito
  validateDebitNoteRules(document, errors, warnings) {
    // Similar a nota de crédito
    if (!document.documentoRelacionado || !document.documentoRelacionado.length) {
      errors.push('documentoRelacionado: Nota de débito debe referenciar documento original');
    }
  }

  // Validaciones para anulaciones
  validateCancellationRules(document, errors, warnings) {
    // Debe tener motivo de anulación
    if (!document.motivo) {
      errors.push('motivo: Motivo de anulación es requerido');
    }

    // Debe referenciar documento a anular
    if (!document.codigoGeneracion) {
      errors.push('codigoGeneracion: Código del documento a anular es requerido');
    }
  }

  // Obtener esquema por tipo de documento
  getSchemaByDocumentType(tipoDocumento) {
    const schemaMap = {
      '01': 'factura',
      '03': 'ccf',
      '04': 'notaRemision',  
      '05': 'notaCredito',
      '06': 'notaDebito',
      '07': 'comprobanteRetencion',
      '08': 'comprobanteLiquidacion',
      '09': 'documentoContableLiquidacion',
      '11': 'facturaExportacion',
      '14': 'facturaSujetoExcluido',
      '15': 'comprobanteDonacion'
    };

    return schemaMap[tipoDocumento] || null;
  }

  // Validar documento por tipo
  validateDocumentByType(document) {
    const tipoDocumento = document.identificacion?.tipoDocumento;
    if (!tipoDocumento) {
      return {
        isValid: false,
        message: 'Tipo de documento no especificado',
        errors: ['identificacion.tipoDocumento es requerido']
      };
    }

    const schemaName = this.getSchemaByDocumentType(tipoDocumento);
    if (!schemaName) {
      return {
        isValid: false,
        message: `Tipo de documento '${tipoDocumento}' no soportado`,
        errors: [`Tipo de documento ${tipoDocumento} no válido`]
      };
    }

    return this.validateDocument(document, schemaName);
  }

  // Obtener lista de esquemas cargados
  getLoadedSchemas() {
    return Array.from(this.loadedSchemas);
  }

  // Limpiar esquemas cargados
  clearSchemas() {
    this.schemas.clear();
    this.loadedSchemas.clear();
  }
}

// Instancia singleton
export const schemaValidator = new SchemaValidatorService();