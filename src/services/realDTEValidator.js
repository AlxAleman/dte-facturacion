// PASO 1: Primero agregar SOLO el validador básico
// src/services/realDTEValidator.js

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export class RealDTEValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.schemas = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Mapeo básico de esquemas
      const schemaFiles = {
        '01': 'fe-fc-v1.json',
        '03': 'fe-ccf-v3.json',
        '05': 'fe-nc-v3.json',
        '06': 'fe-nd-v3.json'
      };

      for (const [tipoDte, fileName] of Object.entries(schemaFiles)) {
        try {
          const response = await fetch(`/src/components/schemas/${fileName}`);
          if (response.ok) {
            const schema = await response.json();
            this.schemas.set(tipoDte, this.ajv.compile(schema));
          }
        } catch (error) {
          console.warn(`No se pudo cargar esquema ${fileName}:`, error);
        }
      }

      this.isInitialized = true;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  validateDocument(jsonData, tipoDte) {
    if (!this.isInitialized) {
      return { isValid: false, errors: ['Validador no inicializado'] };
    }

    const validator = this.schemas.get(tipoDte);
    if (!validator) {
      return { isValid: false, errors: [`Esquema no encontrado para tipo ${tipoDte}`] };
    }

    const isValid = validator(jsonData);
    return {
      isValid,
      errors: isValid ? [] : validator.errors?.map(e => e.message) || []
    };
  }
}

export const realDTEValidator = new RealDTEValidator();