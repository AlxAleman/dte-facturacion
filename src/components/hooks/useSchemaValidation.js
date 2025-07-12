// src/components/hooks/useSchemaValidation.js
// Hook personalizado para validación de esquemas

import { useState, useEffect, useCallback } from 'react';
import { schemaValidator } from '../../services/schemaValidator.js';

export const useSchemaValidation = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [validationResults, setValidationResults] = useState(new Map());
  const [isValidating, setIsValidating] = useState(false);

  // Inicializar validador
  useEffect(() => {
    const initialize = async () => {
      if (!schemaValidator.isInitialized) {
        const result = await schemaValidator.initialize();
        setIsInitialized(result.success);
      } else {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  // Validar documento
  const validateDocument = useCallback(async (dteData, tipoDte) => {
    if (!isInitialized || !dteData || !tipoDte) {
      return null;
    }

    setIsValidating(true);
    try {
      const result = schemaValidator.validateDocument(dteData, tipoDte);
      
      // Guardar resultado en cache
      const cacheKey = `${tipoDte}-${dteData.identificacion?.codigoGeneracion || Date.now()}`;
      setValidationResults(prev => new Map(prev.set(cacheKey, result)));
      
      return result;
    } catch (error) {
      console.error('Error en validación:', error);
      return {
        isValid: false,
        errors: ['Error en validación: ' + error.message],
        warnings: []
      };
    } finally {
      setIsValidating(false);
    }
  }, [isInitialized]);

  // Validar campo específico
  const validateField = useCallback((dteData, fieldPath, tipoDte) => {
    if (!isInitialized || !dteData || !tipoDte) {
      return { isValid: false, error: 'Validador no inicializado' };
    }

    return schemaValidator.validateField(dteData, fieldPath, tipoDte);
  }, [isInitialized]);

  // Generar reporte completo
  const generateReport = useCallback((dteData, tipoDte) => {
    if (!isInitialized || !dteData || !tipoDte) {
      return null;
    }

    return schemaValidator.generateValidationReport(dteData, tipoDte);
  }, [isInitialized]);

  // Obtener información del esquema
  const getSchemaInfo = useCallback((tipoDte) => {
    if (!isInitialized) {
      return null;
    }

    return schemaValidator.getSchemaInfo(tipoDte);
  }, [isInitialized]);

  // Listar esquemas disponibles
  const getAvailableSchemas = useCallback(() => {
    if (!isInitialized) {
      return [];
    }

    return schemaValidator.listAvailableSchemas();
  }, [isInitialized]);

  // Limpiar cache de validaciones
  const clearValidationCache = useCallback(() => {
    setValidationResults(new Map());
  }, []);

  // Obtener resultado de cache
  const getCachedResult = useCallback((tipoDte, codigoGeneracion) => {
    const cacheKey = `${tipoDte}-${codigoGeneracion}`;
    return validationResults.get(cacheKey);
  }, [validationResults]);

  // Validar múltiples documentos
  const validateMultipleDocuments = useCallback(async (documents) => {
    if (!isInitialized) {
      return [];
    }

    setIsValidating(true);
    try {
      const results = await Promise.all(
        documents.map(async (doc) => {
          const result = await validateDocument(doc.data, doc.tipoDte);
          return {
            ...doc,
            validation: result
          };
        })
      );
      return results;
    } catch (error) {
      console.error('Error validando múltiples documentos:', error);
      return [];
    } finally {
      setIsValidating(false);
    }
  }, [isInitialized, validateDocument]);

  // Validar en tiempo real (debounced)
  const validateRealtime = useCallback((dteData, tipoDte, delay = 500) => {
    if (!isInitialized || !dteData || !tipoDte) {
      return;
    }

    const timeoutId = setTimeout(() => {
      validateDocument(dteData, tipoDte);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [isInitialized, validateDocument]);

  return {
    // Estado
    isInitialized,
    isValidating,
    validationResults: Array.from(validationResults.values()),

    // Métodos principales
    validateDocument,
    validateField,
    generateReport,
    getSchemaInfo,
    getAvailableSchemas,

    // Métodos de cache
    clearValidationCache,
    getCachedResult,

    // Métodos avanzados
    validateMultipleDocuments,
    validateRealtime,

    // Utilidades
    getValidationStats: () => {
      const results = Array.from(validationResults.values());
      return {
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length,
        totalErrors: results.reduce((sum, r) => sum + (r.errors?.length || 0), 0),
        totalWarnings: results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0)
      };
    }
  };
}; 