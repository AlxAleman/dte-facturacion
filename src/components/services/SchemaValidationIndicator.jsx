// src/components/services/SchemaValidationIndicator.jsx
// Indicador visual de validación de esquemas

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  FileText, 
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { schemaValidator } from '../../services/schemaValidator.js';

const SchemaValidationIndicator = ({ 
  dteData, 
  tipoDte, 
  onValidationChange,
  showDetails = false,
  className = "",
  triggerValidation = false // NUEVA PROP para controlar cuándo validar
}) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

  // Validar SOLO cuando triggerValidation cambie a true
  useEffect(() => {
    if (triggerValidation && dteData && tipoDte && schemaValidator.isInitialized) {
      validateDocument();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerValidation]);

  const validateDocument = useCallback(async () => {
    if (!dteData || !tipoDte) return;

    setIsValidating(true);
    try {
      const result = schemaValidator.validateDocument(dteData, tipoDte);
      setValidationResult(result);
      
      if (onValidationChange) {
        onValidationChange(result);
      }
    } catch (error) {
      console.error('Error en validación:', error);
      setValidationResult({
        isValid: false,
        errors: ['Error en validación: ' + error.message],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  }, [dteData, tipoDte, onValidationChange]);

  const getStatusIcon = () => {
    if (isValidating) {
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
    }
    
    if (!validationResult) {
      return <Info className="w-5 h-5 text-gray-400" />;
    }

    if (validationResult.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }

    if (validationResult.errors.length > 0) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }

    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (isValidating) return 'Validando...';
    if (!validationResult) return 'Sin validar';
    if (validationResult.isValid) return 'Válido';
    if (validationResult.errors.length > 0) return 'Inválido';
    return 'Con advertencias';
  };

  const getStatusColor = () => {
    if (isValidating) return 'text-blue-600';
    if (!validationResult) return 'text-gray-500';
    if (validationResult.isValid) return 'text-green-600';
    if (validationResult.errors.length > 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusBg = () => {
    if (isValidating) return 'bg-blue-50 border-blue-200';
    if (!validationResult) return 'bg-gray-50 border-gray-200';
    if (validationResult.isValid) return 'bg-green-50 border-green-200';
    if (validationResult.errors.length > 0) return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const downloadValidationReport = () => {
    if (!validationResult) return;

    const report = schemaValidator.generateValidationReport(dteData, tipoDte);
    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validacion-dte-${tipoDte}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!dteData || !tipoDte) {
    return (
      <div className={`p-4 border rounded-lg bg-gray-50 border-gray-200 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Info className="w-5 h-5" />
          <span className="text-sm">Esperando datos para validar</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Indicador principal */}
      <div className={`p-4 border rounded-lg ${getStatusBg()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className={`font-medium ${getStatusColor()}`}>
                Validación de Esquema
              </h3>
              <p className="text-sm text-gray-600">
                {getStatusText()} • {validationResult?.schemaName || 'Esquema no encontrado'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={validateDocument}
              disabled={isValidating}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Revalidar"
            >
              <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
            </button>
            
            {validationResult && (
              <button
                onClick={downloadValidationReport}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Descargar reporte"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            
            {validationResult && (
              <button
                onClick={() => setShowFullReport(!showFullReport)}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Ver detalles"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Resumen de validación */}
        {validationResult && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {validationResult.errors.length}
              </div>
              <div className="text-gray-500">Errores</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {validationResult.warnings.length}
              </div>
              <div className="text-gray-500">Advertencias</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {validationResult.missingFields.length}
              </div>
              <div className="text-gray-500">Campos faltantes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {validationResult.invalidFields.length}
              </div>
              <div className="text-gray-500">Campos inválidos</div>
            </div>
          </div>
        )}
      </div>

      {/* Detalles de validación */}
      {showDetails && validationResult && (
        <div className="space-y-4">
          {/* Errores */}
          {validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Errores de Validación ({validationResult.errors.length})
              </h4>
              <div className="space-y-2">
                {validationResult.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800 bg-red-100 p-2 rounded">
                    <div className="font-medium">{error.path || 'Documento'}</div>
                    <div>{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advertencias */}
          {validationResult.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Advertencias ({validationResult.warnings.length})
              </h4>
              <div className="space-y-2">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-800 bg-yellow-100 p-2 rounded">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos faltantes */}
          {validationResult.missingFields.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Campos Requeridos Faltantes ({validationResult.missingFields.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {validationResult.missingFields.map((field, index) => (
                  <div key={index} className="text-sm text-orange-800 bg-orange-100 p-2 rounded">
                    {field}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos inválidos */}
          {validationResult.invalidFields.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Campos con Formato Inválido ({validationResult.invalidFields.length})
              </h4>
              <div className="space-y-2">
                {validationResult.invalidFields.map((field, index) => (
                  <div key={index} className="text-sm text-purple-800 bg-purple-100 p-2 rounded">
                    <div className="font-medium">{field.path}</div>
                    <div>{field.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte completo */}
      {showFullReport && validationResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Reporte Completo de Validación
          </h4>
          <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-auto max-h-96">
            {JSON.stringify(validationResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SchemaValidationIndicator; 