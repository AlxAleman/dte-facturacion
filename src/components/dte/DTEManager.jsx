// src/components/dte/DTEManager.jsx
// IMPORTS CORREGIDOS según tu estructura final

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Send, 
  Eye, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw
} from 'lucide-react';

// Imports según tu estructura actual ✅
import DteForm from './DteForm';                                    // ✅ Mismo directorio
import TaxCalculator from '../../calculadora/TaxCalculator';        // ✅ Tu carpeta calculadora  
import SignatureQRManager from '../../calculadora/SignatureQRManager';
import { useTaxCalculations } from '../hooks/useTaxCalculations';   // ✅ Tu hooks
import { useQRGenerator } from '../hooks/useQRGenerator';           // ✅ Tu hooks  
import { schemaValidator } from '../services/schemaValidator';      // ✅ Tu services
import { apiService } from '../services/apiService';               // ✅ Tu services
import { CATALOGS, getCatalogValue } from '../data/catalogs';       // ✅ Tu data

const DTEManager = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [dteData, setDteData] = useState(null);
  const [signedDocument, setSignedDocument] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [environment, setEnvironment] = useState('test');

  const steps = [
    { number: 1, title: 'Datos del DTE', icon: FileText },
    { number: 2, title: 'Cálculos', icon: Settings },
    { number: 3, title: 'Firma y QR', icon: CheckCircle },
    { number: 4, title: 'Envío', icon: Send }
  ];

  // Cargar esquemas al inicializar
  useEffect(() => {
    const initializeSchemas = async () => {
      try {
        await schemaValidator.loadAllSchemas();
        console.log('Esquemas cargados correctamente');
      } catch (error) {
        console.error('Error al cargar esquemas:', error);
      }
    };

    initializeSchemas();
  }, []);

  // Configurar ambiente de API
  useEffect(() => {
    apiService.setEnvironment(environment === 'production');
  }, [environment]);

  // Manejar datos del formulario DTE
  const handleDTEDataChange = useCallback((data) => {
    setDteData(data);
    
    // Validar documento cuando cambie
    if (data && data.identificacion?.tipoDocumento) {
      const validation = schemaValidator.validateDocumentByType(data);
      setValidationResult(validation);
    }
  }, []);

  // Manejar cambios en los cálculos
  const handleCalculationChange = useCallback((calcs) => {
    setCalculations(calcs);
    
    // Actualizar datos del DTE con los cálculos
    if (dteData && calcs) {
      setDteData(prevData => ({
        ...prevData,
        resumen: {
          ...prevData.resumen,
          subTotal: calcs.subtotal,
          descuItem: calcs.descuentos,
          subTotalVentas: calcs.subTotalVentas,
          ivaPerci: calcs.iva,
          reteRenta: calcs.reteRenta,
          montoTotalOperacion: calcs.montoTotalOperacion,
          totalPagar: calcs.totalPagar,
          tributos: calcs.tributos
        }
      }));
    }
  }, [dteData]);

  // Manejar documento firmado
  const handleDocumentSigned = useCallback((signed) => {
    setSignedDocument(signed);
    setActiveStep(4); // Pasar al paso de envío
  }, []);

  // Manejar QR generado
  const handleQRGenerated = useCallback((qr) => {
    setQrData(qr);
  }, []);

  // Enviar DTE
  const handleSubmitDTE = async () => {
    if (!signedDocument) {
      alert('Debe firmar el documento antes de enviarlo');
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await apiService.sendDTE(signedDocument);
      setSubmissionResult(result);
      
      if (result.success) {
        // Actualizar documento con sello recibido
        setSignedDocument(prev => ({
          ...prev,
          selloRecibido: result.data.selloRecibido,
          fhProcesamiento: result.data.fhProcesamiento,
          estado: result.data.estado
        }));
      }
    } catch (error) {
      setSubmissionResult({
        success: false,
        error: `Error al enviar DTE: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descargar JSON del DTE
  const downloadDTEJson = () => {
    const dataToDownload = signedDocument || dteData;
    if (!dataToDownload) return;

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DTE-${dataToDownload.identificacion?.codigoGeneracion || 'draft'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Previsualizar DTE
  const previewDTE = () => {
    if (!dteData) return;

    const previewWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Vista Previa DTE</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; color: #333; }
            .value { margin-left: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Documento Tributario Electrónico</h2>
            <p><span class="label">Tipo:</span> ${getCatalogValue('TIPOS_DTE', dteData.identificacion?.tipoDocumento)}</p>
            <p><span class="label">Código:</span> ${dteData.identificacion?.codigoGeneracion}</p>
            <p><span class="label">Fecha:</span> ${dteData.identificacion?.fecEmi}</p>
          </div>
          
          <div class="section">
            <h3>Emisor</h3>
            <p><span class="label">Nombre:</span> ${dteData.emisor?.nombre}</p>
            <p><span class="label">NIT:</span> ${dteData.emisor?.nit}</p>
          </div>
          
          <div class="section">
            <h3>Receptor</h3>
            <p><span class="label">Nombre:</span> ${dteData.receptor?.nombre || 'CONSUMIDOR FINAL'}</p>
            <p><span class="label">Documento:</span> ${dteData.receptor?.numDocumento || 'N/A'}</p>
          </div>
          
          <div class="section">
            <h3>Detalle</h3>
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${dteData.cuerpoDocumento?.map(item => `
                  <tr>
                    <td>${item.descripcion}</td>
                    <td>${item.cantidad}</td>
                    <td>$${item.precioUni?.toFixed(2)}</td>
                    <td>$${(item.cantidad * item.precioUni)?.toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h3>Resumen</h3>
            <p><span class="label">Subtotal:</span> $${dteData.resumen?.subTotal?.toFixed(2) || '0.00'}</p>
            <p><span class="label">IVA:</span> $${dteData.resumen?.ivaPerci?.toFixed(2) || '0.00'}</p>
            <p><span class="label">Total a Pagar:</span> $${dteData.resumen?.totalPagar?.toFixed(2) || '0.00'}</p>
          </div>
          
          <script>
            window.print();
          </script>
        </body>
      </html>
    `;
    
    previewWindow.document.write(content);
    previewWindow.document.close();
  };

  // Renderizar indicador de paso
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              activeStep >= step.number
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-400'
            }`}
          >
            <step.icon className="w-5 h-5" />
          </div>
          <div className="ml-2 mr-4">
            <p className={`text-sm font-medium ${
              activeStep >= step.number ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${
              activeStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Documentos Tributarios Electrónicos
          </h1>
          
          <div className="flex items-center gap-4">
            {/* Selector de ambiente */}
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="test">Ambiente de Pruebas</option>
              <option value="production">Ambiente de Producción</option>
            </select>
            
            {/* Indicador de ambiente */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              environment === 'production' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {environment === 'production' ? 'PRODUCCIÓN' : 'PRUEBAS'}
            </div>
          </div>
        </div>
        
        {renderStepIndicator()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Paso 1: Formulario DTE */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <DteForm
                onDataChange={handleDTEDataChange}
                initialData={dteData}
              />
              
              {validationResult && (
                <div className={`p-4 rounded-lg ${
                  validationResult.isValid 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      validationResult.isValid ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {validationResult.message}
                    </span>
                  </div>
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setActiveStep(2)}
                  disabled={!dteData || (validationResult && !validationResult.isValid)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar a Cálculos
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Cálculos */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <TaxCalculator
                items={dteData?.cuerpoDocumento || []}
                onCalculationChange={handleCalculationChange}
              />
              
              <div className="flex justify-between">
                <button
                  onClick={() => setActiveStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  disabled={!calculations || (calculations.validation && !calculations.validation.isValid)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar a Firma
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Firma y QR */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <SignatureQRManager
                dteData={dteData}
                onDocumentSigned={handleDocumentSigned}
                onQRGenerated={handleQRGenerated}
              />
              
              <div className="flex justify-between">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  disabled={!signedDocument}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar a Envío
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Envío */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Enviar DTE al Ministerio de Hacienda
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Resumen del Documento</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Tipo de Documento:</dt>
                        <dd className="text-gray-900">{getCatalogValue('TIPOS_DTE', dteData?.identificacion?.tipoDocumento)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Código de Generación:</dt>
                        <dd className="text-gray-900 font-mono text-xs">{dteData?.identificacion?.codigoGeneracion}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Total a Pagar:</dt>
                        <dd className="text-gray-900 font-semibold">${dteData?.resumen?.totalPagar?.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Estado:</dt>
                        <dd className="text-gray-900">
                          {signedDocument?.estado || 'Listo para enviar'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleSubmitDTE}
                      disabled={isSubmitting || !signedDocument}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 inline mr-2" />
                          Enviar DTE
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {submissionResult && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    submissionResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {submissionResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        submissionResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {submissionResult.success ? 'DTE enviado correctamente' : 'Error al enviar DTE'}
                      </span>
                    </div>
                    {submissionResult.success && submissionResult.data && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>Sello de Recepción: {submissionResult.data.selloRecibido}</p>
                        <p>Fecha de Procesamiento: {new Date(submissionResult.data.fhProcesamiento).toLocaleString()}</p>
                      </div>
                    )}
                    {!submissionResult.success && (
                      <p className="mt-1 text-sm text-red-700">{submissionResult.error}</p>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => {
                      // Reiniciar proceso
                      setActiveStep(1);
                      setDteData(null);
                      setSignedDocument(null);
                      setQrData(null);
                      setCalculations(null);
                      setSubmissionResult(null);
                      setValidationResult(null);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Nuevo DTE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Acciones rápidas */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
            <div className="space-y-2">
              <button
                onClick={previewDTE}
                disabled={!dteData}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                Vista Previa
              </button>
              <button
                onClick={downloadDTEJson}
                disabled={!dteData}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Descargar JSON
              </button>
            </div>
          </div>

          {/* Estado del proceso */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Proceso</h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    activeStep > step.number
                      ? 'bg-green-100 text-green-800'
                      : activeStep === step.number
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {activeStep > step.number ? '✓' : step.number}
                  </div>
                  <span className={`text-sm ${
                    activeStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Información</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Todos los documentos son validados contra esquemas oficiales</li>
              <li>• La firma digital es requerida antes del envío</li>
              <li>• El código QR permite consulta pública</li>
              <li>• Ambiente actual: {environment === 'production' ? 'Producción' : 'Pruebas'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DTEManager;