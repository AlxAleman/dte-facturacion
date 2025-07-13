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
  RefreshCw,
  ChevronUp,
  ChevronDown,
  AlertTriangle
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
      <div className={`p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
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
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {getStatusText()} • {validationResult?.schemaName || 'Esquema no encontrado'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {validationResult && (
              <button
                onClick={downloadValidationReport}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Descargar reporte"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowFullReport(!showFullReport)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={showFullReport ? "Ocultar detalles" : "Ver detalles"}
            >
              {showFullReport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Errores de validación */}
      {validationResult && validationResult.errors && validationResult.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Errores de Validación ({validationResult.errors.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {validationResult.errors.slice(0, 10).map((error, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 font-mono text-xs mt-0.5">•</span>
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 font-medium">
                      {error.path || 'Campo desconocido'}
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-xs">
                      {error.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {validationResult.errors.length > 10 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                ... y {validationResult.errors.length - 10} errores más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Advertencias */}
      {validationResult && validationResult.warnings && validationResult.warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Advertencias ({validationResult.warnings.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {validationResult.warnings.slice(0, 5).map((warning, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400 font-mono text-xs mt-0.5">•</span>
                  <div className="flex-1">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      {warning.path || 'Campo desconocido'}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                      {warning.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {validationResult.warnings.length > 5 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                ... y {validationResult.warnings.length - 5} advertencias más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Reporte completo */}
      {showFullReport && validationResult && (
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Reporte Completo de Validación
          </h4>
          <pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 overflow-auto max-h-96">
            {JSON.stringify(validationResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SchemaValidationIndicator; 