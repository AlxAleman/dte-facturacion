// src/components/dte/DteFinalReview.jsx
// Revisión final del documento antes del envío

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Send,
  Download,
  Eye,
  Printer,
  RefreshCw,
  Info
} from 'lucide-react';
import { schemaValidator } from '../../services/schemaValidator.js';
import SchemaValidationIndicator from '../services/SchemaValidationIndicator';
import { useTaxCalculations } from '../hooks/useTaxCalculations';

const DteFinalReview = ({ 
  dteData, 
  calculations, 
  onValidationComplete,
  onProceedToSend,
  className = "" 
}) => {
  const [validationReport, setValidationReport] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [finalJson, setFinalJson] = useState(null);
  const [triggerSchemaValidation, setTriggerSchemaValidation] = useState(false); // NUEVO
  const [schemaValidationResult, setSchemaValidationResult] = useState(null); // NUEVO
  
  const { getDteInfo, formatCurrency } = useTaxCalculations();

  const tipoDte = dteData?.identificacion?.tipoDte || "01";
  const dteInfo = getDteInfo(tipoDte);

  // Generar JSON final del documento
  useEffect(() => {
    if (dteData && calculations) {
      generateFinalJson();
    }
  }, [dteData, calculations]);

  const generateFinalJson = useCallback(() => {
    try {
      // Construir documento final con cálculos integrados
      const finalDocument = {
        ...dteData,
        resumen: {
          ...dteData.resumen,
          ...calculations.dteSpecificFields
        }
      };

      // Asegurar que los campos específicos del tipo DTE estén presentes
      if (calculations.dteSpecificFields) {
        Object.entries(calculations.dteSpecificFields).forEach(([field, value]) => {
          finalDocument.resumen[field] = value;
        });
      }

      setFinalJson(finalDocument);
    } catch (error) {
      console.error('Error generando JSON final:', error);
    }
  }, [dteData, calculations]);

  // Validación completa del documento
  const performCompleteValidation = useCallback(async () => {
    if (!finalJson || !tipoDte) return;

    setIsValidating(true);
    try {
      // Validación de esquema
      const schemaValidation = schemaValidator.validateDocument(finalJson, tipoDte);
      
      // Validación de cálculos
      const calculationValidation = validateCalculations();
      
      // Validación de reglas de negocio
      const businessValidation = validateBusinessRules();

      const completeReport = {
        timestamp: new Date().toISOString(),
        tipoDte,
        dteName: dteInfo.name,
        schemaValidation,
        calculationValidation,
        businessValidation,
        overall: {
          isValid: schemaValidation.isValid && 
                   calculationValidation.isValid && 
                   businessValidation.isValid,
          totalErrors: schemaValidation.errors.length + 
                      calculationValidation.errors.length + 
                      businessValidation.errors.length,
          totalWarnings: schemaValidation.warnings.length + 
                        calculationValidation.warnings.length + 
                        businessValidation.warnings.length
        }
      };

      setValidationReport(completeReport);
      
      if (onValidationComplete) {
        onValidationComplete(completeReport);
      }

    } catch (error) {
      console.error('Error en validación completa:', error);
      setValidationReport({
        overall: { isValid: false, totalErrors: 1, totalWarnings: 0 },
        errors: ['Error en validación: ' + error.message]
      });
    } finally {
      setIsValidating(false);
    }
  }, [finalJson, tipoDte, dteInfo, onValidationComplete]);

  // Validar cálculos
  const validateCalculations = () => {
    const errors = [];
    const warnings = [];

    if (!calculations) {
      errors.push('No se encontraron cálculos');
      return { isValid: false, errors, warnings };
    }

    // Validar que los cálculos coincidan con el tipo de DTE
    if (calculations.validation && !calculations.validation.isValid) {
      errors.push(...calculations.validation.errors);
    }

    // Validaciones específicas por tipo
    switch (tipoDte) {
      case "01": // FC
        if (!calculations.dteSpecificFields?.totalIva) {
          warnings.push('FC debe especificar totalIva');
        }
        break;
      case "03": // CCF
        if (!calculations.dteSpecificFields?.ivaPerci1) {
          warnings.push('CCF debe especificar ivaPerci1');
        }
        break;
      case "07": // CR
        if (!calculations.dteSpecificFields?.totalIVAretenido) {
          warnings.push('CR debe especificar totalIVAretenido');
        }
        break;
      case "11": // FEX
        if (calculations.montoTotalOperacion < 100) {
          warnings.push('FEX requiere monto mínimo de $100.00');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  // Validar reglas de negocio
  const validateBusinessRules = () => {
    const errors = [];
    const warnings = [];

    // Validar datos básicos
    if (!dteData.emisor?.nit) {
      errors.push('NIT del emisor es requerido');
    }

    if (!dteData.receptor?.nombre) {
      errors.push('Nombre del receptor es requerido');
    }

    if (!dteData.cuerpoDocumento || dteData.cuerpoDocumento.length === 0) {
      errors.push('El documento debe tener al menos un ítem');
    }

    // Validar fechas
    const fechaEmision = new Date(dteData.identificacion?.fecEmi);
    const hoy = new Date();
    if (fechaEmision > hoy) {
      warnings.push('La fecha de emisión no puede ser futura');
    }

    // Validar montos
    if (calculations && calculations.montoTotalOperacion <= 0) {
      warnings.push('El monto total debe ser mayor a cero');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const downloadFinalJson = () => {
    if (!finalJson) return;

    const blob = new Blob([JSON.stringify(finalJson, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dte-${tipoDte}-${dteData.identificacion?.codigoGeneracion || Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getOverallStatus = () => {
    if (!validationReport) return 'pending';
    if (validationReport.overall.isValid) return 'valid';
    if (validationReport.overall.totalErrors > 0) return 'invalid';
    return 'warning';
  };

  const getStatusIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'valid': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'invalid': return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default: return <Info className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'valid': return 'Documento Válido';
      case 'invalid': return 'Documento Inválido';
      case 'warning': return 'Documento con Advertencias';
      default: return 'Sin Validar';
    }
  };

  const getStatusColor = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'valid': return 'text-green-600';
      case 'invalid': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  // Handler para validar solo cuando el usuario lo solicite
  const handleValidateClick = () => {
    setTriggerSchemaValidation(false); // Reinicia
    setTimeout(() => setTriggerSchemaValidation(true), 50); // Dispara validación
  };

  // Callback para recibir el resultado de la validación de esquema
  const handleSchemaValidationChange = (result) => {
    setSchemaValidationResult(result);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header de revisión */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
                Revisión Final del Documento
              </h2>
              <p className="text-gray-600">
                {dteInfo.name} • {getStatusText()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidateClick}
              disabled={isValidating || !finalJson}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
              {isValidating ? 'Validando...' : 'Validar'}
            </button>
            
            {finalJson && (
              <button
                onClick={downloadFinalJson}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            )}
            
            {finalJson && (
              <button
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
          </div>
        </div>

        {/* Resumen de validación */}
        {validationReport && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">
                {validationReport.overall.totalErrors}
              </div>
              <div className="text-gray-500">Errores</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">
                {validationReport.overall.totalWarnings}
              </div>
              <div className="text-gray-500">Advertencias</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">
                {validationReport.schemaValidation?.missingFields?.length || 0}
              </div>
              <div className="text-gray-500">Campos faltantes</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">
                {validationReport.schemaValidation?.invalidFields?.length || 0}
              </div>
              <div className="text-gray-500">Campos inválidos</div>
            </div>
          </div>
        )}
      </div>

      {/* Validación de esquema */}
      {/* Mostrar el indicador SOLO después de validar */}
      {triggerSchemaValidation && (
        <SchemaValidationIndicator
          dteData={finalJson}
          tipoDte={tipoDte}
          triggerValidation={triggerSchemaValidation}
          onValidationChange={handleSchemaValidationChange}
          showDetails={true}
        />
      )}

      {/* Detalles de validación */}
      {validationReport && (
        <div className="space-y-4">
          {/* Errores críticos */}
          {validationReport.overall.totalErrors > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Errores Críticos ({validationReport.overall.totalErrors})
              </h3>
              
              {/* Errores de esquema */}
              {validationReport.schemaValidation?.errors?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Errores de Esquema:</h4>
                  <div className="space-y-2">
                    {validationReport.schemaValidation.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                        <div className="font-medium">{error.path || 'Documento'}</div>
                        <div>{error.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errores de cálculos */}
              {validationReport.calculationValidation?.errors?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Errores de Cálculos:</h4>
                  <div className="space-y-2">
                    {validationReport.calculationValidation.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errores de reglas de negocio */}
              {validationReport.businessValidation?.errors?.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Errores de Reglas de Negocio:</h4>
                  <div className="space-y-2">
                    {validationReport.businessValidation.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advertencias */}
          {validationReport.overall.totalWarnings > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Advertencias ({validationReport.overall.totalWarnings})
              </h3>
              
              <div className="space-y-2">
                {[
                  ...(validationReport.schemaValidation?.warnings || []),
                  ...(validationReport.calculationValidation?.warnings || []),
                  ...(validationReport.businessValidation?.warnings || [])
                ].map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview del JSON */}
      {showJsonPreview && finalJson && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Preview del JSON Final
          </h3>
          <pre className="text-xs text-gray-700 bg-white p-4 rounded border overflow-auto max-h-96">
            {JSON.stringify(finalJson, null, 2)}
          </pre>
        </div>
      )}

      {/* Botón de envío */}
      {validationReport && validationReport.overall.isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Documento Listo para Envío
                </h3>
                <p className="text-green-700">
                  El documento cumple con todas las validaciones requeridas
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onProceedToSend && onProceedToSend(finalJson)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Enviar al Ministerio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DteFinalReview; 