// src/services/schemaValidator.js
// Sistema completo de validación de esquemas para DTE

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { SCHEMAS } from '../components/schemas/schemas.js';

class SchemaValidator {
  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true, 
      strict: false,
      verbose: true,
      validateFormats: true
    });
    addFormats(this.ajv);
    
    this.validators = new Map();
    this.schemaMappings = {
      "01": "fe-fc-v1",      // Factura de Consumidor
      "03": "fe-ccf-v3",     // Comprobante de Crédito Fiscal
      "04": "fe-nr-v3",      // Nota de Remisión
      "05": "fe-nc-v3",      // Nota de Crédito
      "06": "fe-nd-v3",      // Nota de Débito
      "07": "fe-cr-v1",      // Comprobante de Retención
      "08": "fe-cl-v1",      // Comprobante de Liquidación
      "09": "fe-dcl-v1",     // Documento Contable de Liquidación
      "11": "fe-fex-v1",     // Factura de Exportación
      "14": "fe-fse-v1",     // Factura de Sujeto Excluido
      "15": "fe-cd-v1"       // Comprobante de Donación
    };
    
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔧 Inicializando validador de esquemas...');
      
      // Verificar que SCHEMAS esté disponible
      if (!SCHEMAS) {
        throw new Error('SCHEMAS no está disponible');
      }
      
      console.log('📋 Esquemas disponibles:', Object.keys(SCHEMAS));
      
      // Compilar todos los esquemas
      for (const [tipoDte, schemaName] of Object.entries(this.schemaMappings)) {
        try {
          const schema = SCHEMAS[schemaName];
          if (schema) {
            const validator = this.ajv.compile(schema);
            this.validators.set(tipoDte, {
              validator,
              schema,
              schemaName
            });
            console.log(`✅ Esquema compilado: ${schemaName} (DTE ${tipoDte})`);
          } else {
            console.warn(`⚠️ Esquema no encontrado: ${schemaName}`);
          }
        } catch (schemaError) {
          console.error(`❌ Error compilando esquema ${schemaName}:`, schemaError);
        }
      }

      this.isInitialized = true;
      console.log('✅ Validador de esquemas inicializado correctamente');
      return { success: true, message: 'Validador inicializado' };
    } catch (error) {
      console.error('❌ Error inicializando validador:', error);
      return { success: false, error: error.message };
    }
  }

  // Validar documento completo
  validateDocument(dteData, tipoDte) {
    if (!this.isInitialized) {
      return {
        isValid: false,
        errors: ['Validador no inicializado'],
        warnings: []
      };
    }

    const validatorInfo = this.validators.get(tipoDte);
    if (!validatorInfo) {
      return {
        isValid: false,
        errors: [`Esquema no encontrado para tipo DTE ${tipoDte}`],
        warnings: []
      };
    }

    const { validator, schema, schemaName } = validatorInfo;
    const isValid = validator(dteData);

    const result = {
      isValid,
      schemaName,
      tipoDte,
      errors: [],
      warnings: [],
      missingFields: [],
      invalidFields: [],
      validationDetails: {}
    };

    if (!isValid && validator.errors) {
      result.errors = validator.errors.map(error => ({
        path: error.instancePath || 'root',
        message: error.message,
        keyword: error.keyword,
        schemaPath: error.schemaPath
      }));
    }

    // Análisis detallado de campos faltantes e inválidos
    this.analyzeValidationResult(dteData, result);

    return result;
  }

  // Análisis detallado de la validación
  analyzeValidationResult(dteData, result) {
    const { schema } = this.validators.get(result.tipoDte);
    
    // Verificar campos requeridos
    const requiredFields = this.getRequiredFields(schema);
    const missingFields = this.findMissingFields(dteData, requiredFields);
    
    if (missingFields.length > 0) {
      result.missingFields = missingFields;
      result.warnings.push(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    // Verificar campos con formato incorrecto
    const invalidFields = this.findInvalidFields(dteData, result.errors);
    if (invalidFields.length > 0) {
      result.invalidFields = invalidFields;
    }

    // Análisis específico por tipo de DTE
    this.analyzeDTESpecificFields(dteData, result);
  }

  // Obtener campos requeridos del esquema
  getRequiredFields(schema, prefix = '') {
    const required = [];
    
    if (schema.required) {
      schema.required.forEach(field => {
        required.push(prefix ? `${prefix}.${field}` : field);
      });
    }

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, prop]) => {
        if (prop.type === 'object' && prop.properties) {
          const nestedRequired = this.getRequiredFields(prop, prefix ? `${prefix}.${key}` : key);
          required.push(...nestedRequired);
        }
      });
    }

    return required;
  }

  // Encontrar campos faltantes
  findMissingFields(data, requiredFields) {
    const missing = [];
    
    requiredFields.forEach(fieldPath => {
      const value = this.getNestedValue(data, fieldPath);
      if (value === undefined || value === null || value === '') {
        missing.push(fieldPath);
      }
    });

    return missing;
  }

  // Encontrar campos con formato incorrecto
  findInvalidFields(data, errors) {
    const invalid = [];
    
    errors.forEach(error => {
      if (error.keyword === 'pattern' || error.keyword === 'format') {
        invalid.push({
          path: error.path,
          message: error.message,
          type: error.keyword
        });
      }
    });

    return invalid;
  }

  // Análisis específico por tipo de DTE
  analyzeDTESpecificFields(dteData, result) {
    const tipoDte = result.tipoDte;
    
    switch (tipoDte) {
      case "01": // FC - Factura de Consumidor
        this.validateFCFields(dteData, result);
        break;
      case "03": // CCF - Comprobante de Crédito Fiscal
        this.validateCCFFields(dteData, result);
        break;
      case "07": // CR - Comprobante de Retención
        this.validateCRFields(dteData, result);
        break;
      case "09": // DCL - Documento Contable de Liquidación
        this.validateDCLFields(dteData, result);
        break;
      case "11": // FEX - Factura de Exportación
        this.validateFEXFields(dteData, result);
        break;
      case "14": // FSE - Factura de Sujeto Excluido
        this.validateFSEFields(dteData, result);
        break;
      case "15": // CD - Comprobante de Donación
        this.validateCDFields(dteData, result);
        break;
    }
  }

  // Validaciones específicas por tipo de DTE
  validateFCFields(dteData, result) {
    const resumen = dteData.resumen;
    if (resumen) {
      if (!resumen.totalGravada && !resumen.totalExenta) {
        result.warnings.push('FC debe tener ventas gravadas o exentas');
      }
      if (resumen.totalIva === undefined || resumen.totalIva === null) {
        result.warnings.push('FC debe especificar totalIva');
      }
    }
  }

  validateCCFFields(dteData, result) {
    const resumen = dteData.resumen;
    if (resumen) {
      if (!resumen.totalGravada && !resumen.totalExenta) {
        result.warnings.push('CCF debe tener ventas gravadas o exentas');
      }
      if (resumen.ivaPerci1 === undefined || resumen.ivaPerci1 === null) {
        result.warnings.push('CCF debe especificar ivaPerci1');
      }
    }
  }

  validateCRFields(dteData, result) {
    const resumen = dteData.resumen;
    if (resumen) {
      if (!resumen.totalSujetoRetencion) {
        result.warnings.push('CR debe especificar totalSujetoRetencion');
      }
      if (!resumen.totalIVAretenido) {
        result.warnings.push('CR debe especificar totalIVAretenido');
      }
    }
  }

  validateDCLFields(dteData, result) {
    const cuerpoDoc = dteData.cuerpoDocumento;
    if (!cuerpoDoc || !Array.isArray(cuerpoDoc) || cuerpoDoc.length === 0) {
      result.warnings.push('DCL debe tener cuerpoDocumento con al menos un ítem');
    }
  }

  validateFEXFields(dteData, result) {
    const resumen = dteData.resumen;
    if (resumen && resumen.totalGravada < 100) {
      result.warnings.push('FEX requiere monto mínimo de $100.00');
    }
  }

  validateFSEFields(dteData, result) {
    const resumen = dteData.resumen;
    if (resumen && resumen.totalIva > 0) {
      result.errors.push('FSE no debe tener IVA');
    }
  }

  validateCDFields(dteData, result) {
    const resumen = dteData.resumen;
    if (!resumen || !resumen.valorTotal) {
      result.warnings.push('CD debe especificar valorTotal');
    }
  }

  // Obtener valor anidado de un objeto
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Validar campo específico
  validateField(dteData, fieldPath, tipoDte) {
    const validatorInfo = this.validators.get(tipoDte);
    if (!validatorInfo) {
      return { isValid: false, error: 'Esquema no encontrado' };
    }

    const { schema } = validatorInfo;
    const fieldSchema = this.getFieldSchema(schema, fieldPath);
    
    if (!fieldSchema) {
      return { isValid: true }; // Campo no definido en esquema
    }

    const value = this.getNestedValue(dteData, fieldPath);
    const validator = this.ajv.compile(fieldSchema);
    const isValid = validator(value);

    return {
      isValid,
      error: isValid ? null : validator.errors?.[0]?.message
    };
  }

  // Obtener esquema de un campo específico
  getFieldSchema(schema, fieldPath) {
    const keys = fieldPath.split('.');
    let currentSchema = schema;

    for (const key of keys) {
      if (currentSchema.properties && currentSchema.properties[key]) {
        currentSchema = currentSchema.properties[key];
      } else {
        return null;
      }
    }

    return currentSchema;
  }

  // Generar reporte de validación
  generateValidationReport(dteData, tipoDte) {
    const validation = this.validateDocument(dteData, tipoDte);
    
    return {
      timestamp: new Date().toISOString(),
      tipoDte,
      schemaName: validation.schemaName,
      isValid: validation.isValid,
      summary: {
        totalErrors: validation.errors.length,
        totalWarnings: validation.warnings.length,
        missingFields: validation.missingFields.length,
        invalidFields: validation.invalidFields.length
      },
      details: {
        errors: validation.errors,
        warnings: validation.warnings,
        missingFields: validation.missingFields,
        invalidFields: validation.invalidFields
      },
      recommendations: this.generateRecommendations(validation)
    };
  }

  // Generar recomendaciones basadas en la validación
  generateRecommendations(validation) {
    const recommendations = [];

    if (validation.missingFields.length > 0) {
      recommendations.push({
        type: 'error',
        message: 'Completar campos requeridos faltantes',
        fields: validation.missingFields
      });
    }

    if (validation.invalidFields.length > 0) {
      recommendations.push({
        type: 'error',
        message: 'Corregir formato de campos inválidos',
        fields: validation.invalidFields.map(f => f.path)
      });
    }

    if (validation.warnings.length > 0) {
      recommendations.push({
        type: 'warning',
        message: 'Revisar advertencias específicas del tipo de documento',
        details: validation.warnings
      });
    }

    return recommendations;
  }

  // Obtener información del esquema
  getSchemaInfo(tipoDte) {
    const validatorInfo = this.validators.get(tipoDte);
    if (!validatorInfo) {
      return null;
    }

    const { schema, schemaName } = validatorInfo;
    return {
      tipoDte,
      schemaName,
      title: schema.title,
      description: schema.description,
      requiredFields: this.getRequiredFields(schema),
      properties: Object.keys(schema.properties || {})
    };
  }

  // Listar todos los esquemas disponibles
  listAvailableSchemas() {
    return Array.from(this.validators.entries()).map(([tipoDte, info]) => ({
      tipoDte,
      schemaName: info.schemaName,
      title: info.schema.title
    }));
  }
}

// Instancia singleton
const schemaValidator = new SchemaValidator(); 

export { schemaValidator }; 