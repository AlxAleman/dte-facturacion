// src/components/dte/DTEManager.jsx
// IMPORTS CORREGIDOS según tu estructura final

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Send,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Printer,
  Edit
} from 'lucide-react';

// Imports según tu estructura actual ✅
import DteForm from './DteForm';                                    // ✅ Mismo directorio
import TaxCalculator from '../../calculadora/TaxCalculator';        // ✅ Tu carpeta calculadora  
import SignatureQRManager from '../../calculadora/SignatureQRManager';
import FacturaPreview from './FacturaPreview';                      // ✅ Nuevo import para preview
import { useTaxCalculations } from '../hooks/useTaxCalculations';   // ✅ Tu hooks ACTUALIZADO
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

  // Referencias para preview
  const previewRef = useRef(null);

  // 🆕 Hook de cálculos actualizado
  const { getDteInfo } = useTaxCalculations();

  const steps = [
    { number: 1, title: 'Datos del DTE', icon: FileText },
    { number: 2, title: 'Cálculos', icon: Settings },
    { number: 3, title: 'Firma y QR', icon: CheckCircle },
    { number: 4, title: 'Revisión', icon: Eye },
    { number: 5, title: 'Envío', icon: Send }
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

  // Scroll al top al cambiar de paso
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

  // 🆕 Obtener tipo de DTE actual
  const getCurrentDteType = useCallback(() => {
    return dteData?.identificacion?.tipoDte || "01";
  }, [dteData]);

  // 🆕 Obtener información del tipo DTE actual
  const getCurrentDteInfo = useCallback(() => {
    const tipoDte = getCurrentDteType();
    return getDteInfo(tipoDte);
  }, [getCurrentDteType, getDteInfo]);

  // Manejar datos del formulario DTE
  const handleDTEDataChange = useCallback((data) => {
    setDteData(data);

    // Validar documento cuando cambie
    if (data && data.identificacion?.tipoDocumento) {
      const validation = schemaValidator.validateDocumentByType(data);
      setValidationResult(validation);
    }
  }, []);

  // 🆕 Manejar cambios en los cálculos - ACTUALIZADO
  const handleCalculationChange = useCallback((calcs) => {
    setCalculations(calcs);

    // Actualizar datos del DTE con los cálculos específicos por tipo
    if (dteData && calcs) {
      const tipoDte = getCurrentDteType();
      const dteInfo = getCurrentDteInfo();
      
      console.log(`🔧 Actualizando resumen para ${dteInfo.name} (${tipoDte})`);
      console.log('📊 Cálculos recibidos:', calcs);
      console.log('🎯 Campos específicos DTE:', calcs.dteSpecificFields);

      // Construir resumen base
      const baseResumen = {
        ...dteData.resumen,
        subTotal: calcs.subtotal,
        descuItem: calcs.descuentos,
        subTotalVentas: calcs.subTotalVentas,
        montoTotalOperacion: calcs.montoTotalOperacion,
        tributos: calcs.tributos
      };

      // 🆕 Agregar campos específicos según el tipo DTE
      const resumenEspecifico = { ...baseResumen };

      // Aplicar campos específicos del tipo DTE
      if (calcs.dteSpecificFields) {
        Object.entries(calcs.dteSpecificFields).forEach(([field, value]) => {
          resumenEspecifico[field] = value;
        });
      }

      // Campos comunes según aplique
      if (dteInfo.retencion?.applies) {
        resumenEspecifico.reteRenta = calcs.reteRenta;
      }

      // totalPagar solo para tipos que lo requieren
      if (dteInfo.calculations?.totalPagar) {
        resumenEspecifico.totalPagar = calcs.totalPagar;
      }

      // Actualizar estructura específica según tipo
      let updatedData = { ...dteData };

      switch (tipoDte) {
        case "09": // DCL - usa cuerpoDocumento
          updatedData.cuerpoDocumento = {
            ...updatedData.cuerpoDocumento,
            ...calcs.dteSpecificFields
          };
          break;

        case "07": // CR - estructura híbrida
          updatedData.resumen = {
            ...baseResumen,
            ...calcs.dteSpecificFields
          };
          // CR no tiene algunos campos comunes
          delete updatedData.resumen.totalPagar;
          delete updatedData.resumen.montoTotalOperacion;
          break;

        case "15": // CD - estructura ultra simple
          updatedData.resumen = {
            valorTotal: calcs.dteSpecificFields.valorTotal,
            totalLetras: convertNumberToWords(calcs.dteSpecificFields.valorTotal)
          };
          break;

        case "04": // NR - sin totalPagar
          updatedData.resumen = { ...resumenEspecifico };
          delete updatedData.resumen.totalPagar;
          break;

        default: // Estructura resumen normal
          updatedData.resumen = resumenEspecifico;
          break;
      }

      console.log('✅ Resumen actualizado:', updatedData.resumen);
      setDteData(updatedData);
    }
  }, [dteData, getCurrentDteType, getCurrentDteInfo]);

  // Manejar documento firmado
  const handleDocumentSigned = useCallback((signed) => {
    setSignedDocument(signed);
    setActiveStep(4); // Pasar al paso de revisión
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

  // Imprimir preview
  const handlePrintPreview = () => {
    if (previewRef.current) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Vista Previa DTE</title>
            <style>
              body { margin: 0; font-family: Arial, sans-serif; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${previewRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // 🆕 Preparar datos para el preview - ACTUALIZADO
  const getPreviewData = () => {
    if (!dteData || !calculations) return null;

    const tipoDte = getCurrentDteType();
    const dteInfo = getCurrentDteInfo();

    // Datos base del preview
    const basePreviewData = {
      tipoDte: tipoDte,
      dteName: dteInfo.name,
      emisor: {
        nombre: dteData.emisor?.nombre || '',
        nombreComercial: dteData.emisor?.nombre || '',
        nit: dteData.emisor?.nit || '',
        nrc: dteData.emisor?.nrc || '',
        actividad: dteData.emisor?.descActividad || 'Actividad no especificada',
        direccion: dteData.emisor?.direccion || '',
        telefono: dteData.emisor?.telefono || '',
        correo: dteData.emisor?.correo || ''
      },
      receptor: {
        nombre: dteData.receptor?.nombre || '',
        nit: dteData.receptor?.numDocumento || '',
        nrc: dteData.receptor?.nrc || '',
        actividad: dteData.receptor?.actividad || '',
        direccion: dteData.receptor?.direccion || '',
        nombreComercial: dteData.receptor?.nombreComercial || '',
        telefono: dteData.receptor?.telefono || '',
        correo: dteData.receptor?.correo || ''
      },
      items: dteData.cuerpoDocumento?.map(item => ({
        cantidad: item.cantidad || 0,
        unidad: 'Unidad',
        codigo: item.codigo || `ITEM-${item.numItem}`,
        descripcion: item.descripcion || '',
        precio: item.precioUni || 0,
        descuento: item.montoDescu || 0,
        noSujetas: 0,
        exentas: 0,
        gravadas: ((item.cantidad || 0) * (item.precioUni || 0)) - (item.montoDescu || 0)
      })) || [],
      resumen: {
        codigoGeneracion: dteData.identificacion?.codigoGeneracion || '',
        numeroControl: dteData.identificacion?.numeroControl || '',
        selloRecepcion: signedDocument?.selloRecibido || '',
        modeloFacturacion: 'Modelo Facturación Previo',
        tipoTransmision: 'Transmisión Normal',
        fechaEmision: dteData.identificacion?.fecEmi || '',
        subTotal: calculations.subTotalVentas || 0,
        totalPagar: calculations.totalPagar || 0,
        // 🆕 Campos específicos por tipo
        dteSpecificFields: calculations.dteSpecificFields || {}
      },
      valorLetras: convertNumberToWords(calculations.totalPagar || calculations.dteSpecificFields?.valorTotal || 0),
      condicionOperacion: 'Contado',
      firmas: signedDocument?.firma ? {
        entrega: {
          nombre: dteData.emisor?.nombre || '',
          documento: dteData.emisor?.nit || ''
        },
        recibe: {
          nombre: dteData.receptor?.nombre || '',
          documento: dteData.receptor?.numDocumento || ''
        }
      } : undefined
    };

    return basePreviewData;
  };

  // Convertir número a palabras (función simplificada)
  const convertNumberToWords = (num) => {
    const formatter = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    });
    return formatter.format(num).replace('US$', '') + ' dólares';
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
    const tipoDte = getCurrentDteType();
    const dteInfo = getCurrentDteInfo();
    link.download = `${dteInfo.name.replace(/\s+/g, '_')}-${dataToDownload.identificacion?.codigoGeneracion || 'draft'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Renderizar indicador de paso
  const renderStepIndicator = () => (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex flex-col items-center flex-1 min-w-0">
          {/* Círculo con ícono */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mb-1 ${activeStep >= step.number
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-400'
              }`}
          >
            <step.icon className="w-5 h-5" />
          </div>
          {/* Texto abajo, ajustado para el primer paso */}
          <span className={`text-[11px] text-center font-medium ${activeStep >= step.number ? 'text-blue-600' : 'text-gray-400'
            }`}>
            {index === 0 ? (
              <>
                <span className="inline sm:hidden">Datos</span>
                <span className="hidden sm:inline">Datos del DTE</span>
              </>
            ) : (
              step.title
            )}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
      <div className="mb-8">
        {/* Header y ambiente */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Gestión de Documentos Tributarios Electrónicos
            </h1>
            {/* 🆕 Mostrar tipo DTE actual */}
            {dteData && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">Tipo actual:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                  {getCurrentDteType()} - {getCurrentDteInfo().name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
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
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${environment === 'production'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
              }`}>
              {environment === 'production' ? 'PRODUCCIÓN' : 'PRUEBAS'}
            </div>
          </div>
        </div>
        {renderStepIndicator()}
      </div>

      {/* Main layout responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel principal */}
        <div className="lg:col-span-2">
          {/* Paso 1: Formulario DTE */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <DteForm
                onDataChange={handleDTEDataChange}
                initialData={dteData}
              />
              {validationResult && (
                <div className={`p-4 rounded-lg ${validationResult.isValid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                  }`}>
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${validationResult.isValid ? 'text-green-800' : 'text-red-800'
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
              {/* Botón continuar responsive */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
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

          {/* Paso 2: Cálculos - 🆕 ACTUALIZADO */}
          {activeStep === 2 && (
            <div className="space-y-6">
              {/* 🆕 Información del tipo DTE */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Calculando para: {getCurrentDteInfo().name} ({getCurrentDteType()})
                </h3>
                <div className="text-xs text-blue-800 space-y-1">
                  <div>• <strong>IVA:</strong> {getCurrentDteInfo().iva.applies ? `${(getCurrentDteInfo().iva.rate * 100).toFixed(0)}%` : 'No aplica'}</div>
                  <div>• <strong>Retención:</strong> {getCurrentDteInfo().retencion.applies ? `${(getCurrentDteInfo().retencion.rate * 100).toFixed(0)}%` : 'No aplica'}</div>
                  {getCurrentDteInfo().minAmount > 0 && (
                    <div>• <strong>Monto mínimo:</strong> ${getCurrentDteInfo().minAmount.toFixed(2)}</div>
                  )}
                </div>
              </div>

              <TaxCalculator
                items={dteData?.cuerpoDocumento || []}
                tipoDte={getCurrentDteType()} // 🆕 Pasar tipo DTE
                onCalculationChange={handleCalculationChange}
              />
              <div className="flex flex-col sm:flex-row justify-between gap-3">
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
              <div className="flex flex-col sm:flex-row justify-between gap-3">
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
                  Continuar a Revisión
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Preview/Revisión */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Revisión del Documento - {getCurrentDteInfo().name}
                </h3>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Revise cuidadosamente todos los datos antes de enviar el documento al Ministerio de Hacienda.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <button
                      onClick={handlePrintPreview}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Preview
                    </button>
                    <button
                      onClick={() => setActiveStep(1)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                      Editar Documento
                    </button>
                  </div>
                </div>
                {/* Vista previa del documento */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                    <h4 className="font-medium text-gray-900">Vista Previa - {getCurrentDteInfo().name}</h4>
                  </div>
                  <div className="p-4 bg-gray-100 max-h-96 overflow-x-auto overflow-y-auto">
                    {getPreviewData() && (
                      <div className="min-w-[320px] sm:min-w-0 transform scale-75 sm:scale-100 origin-top">
                        <FacturaPreview
                          ref={previewRef}
                          {...getPreviewData()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Navegación */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={() => setActiveStep(5)}
                  disabled={!signedDocument}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar a Envío
                </button>
              </div>
            </div>
          )}

          {/* Paso 5: Envío */}
          {activeStep === 5 && (
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
                        <dd className="text-gray-900">{getCurrentDteInfo().name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Código de Generación:</dt>
                        <dd className="text-gray-900 font-mono text-xs">{dteData?.identificacion?.codigoGeneracion}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Total a Pagar:</dt>
                        <dd className="text-gray-900 font-semibold">
                          ${(dteData?.resumen?.totalPagar || dteData?.resumen?.valorTotal || 0).toFixed(2)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Estado:</dt>
                        <dd className="text-gray-900">
                          {signedDocument?.estado || 'Listo para enviar'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
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
                  <div className={`mt-4 p-4 rounded-lg ${submissionResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                      {submissionResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${submissionResult.success ? 'text-green-800' : 'text-red-800'
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
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                  <button
                    onClick={() => setActiveStep(4)}
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
        <div className="space-y-6 mt-8 lg:mt-0">
          {/* 🆕 Información del DTE actual */}
          {dteData && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documento Actual</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium text-blue-600">{getCurrentDteInfo().name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Código:</span>
                  <span className="font-mono">{getCurrentDteType()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA:</span>
                  <span className={getCurrentDteInfo().iva.applies ? "text-green-600" : "text-gray-500"}>
                    {getCurrentDteInfo().iva.applies ? `${(getCurrentDteInfo().iva.rate * 100).toFixed(0)}%` : 'No aplica'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Retención:</span>
                  <span className={getCurrentDteInfo().retencion.applies ? "text-orange-600" : "text-gray-500"}>
                    {getCurrentDteInfo().retencion.applies ? `${(getCurrentDteInfo().retencion.rate * 100).toFixed(0)}%` : 'No aplica'}
                  </span>
                </div>
                {calculations && (
                  <>
                    <hr className="my-3" />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">${calculations.subTotalVentas?.toFixed(2) || '0.00'}</span>
                    </div>
                    {calculations.iva > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">IVA:</span>
                        <span className="font-medium text-green-600">+${calculations.iva.toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.reteRenta > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Retención:</span>
                        <span className="font-medium text-orange-600">-${calculations.reteRenta.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-lg">
                        ${(calculations.totalPagar || calculations.dteSpecificFields?.valorTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveStep(4)}
                disabled={!signedDocument}
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
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${activeStep > step.number
                      ? 'bg-green-100 text-green-800'
                      : activeStep === step.number
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                    {activeStep > step.number ? '✓' : step.number}
                  </div>
                  <span className={`text-sm ${activeStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 🆕 Información específica del tipo DTE */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              {dteData ? `Información - ${getCurrentDteInfo().name}` : 'Información General'}
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              {dteData ? (
                <>
                  <li>• Estructura: {getCurrentDteInfo().structure}</li>
                  <li>• Schema: {CATALOGS.TIPOS_DTE.find(t => t.codigo === getCurrentDteType())?.esquema || 'N/A'}</li>
                  {getCurrentDteInfo().minAmount > 0 && (
                    <li>• Monto mínimo: ${getCurrentDteInfo().minAmount.toFixed(2)}</li>
                  )}
                  {getCurrentDteInfo().allowNegative && (
                    <li>• ⚠️ Permite valores negativos</li>
                  )}
                  <li>• Validación: Esquema oficial MH</li>
                </>
              ) : (
                <>
                  <li>• Seleccione el tipo de DTE en el formulario</li>
                  <li>• Cada tipo tiene reglas específicas</li>
                  <li>• Los cálculos se ajustan automáticamente</li>
                  <li>• Validación contra esquemas oficiales</li>
                </>
              )}
              <li>• Ambiente: {environment === 'production' ? 'Producción' : 'Pruebas'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DTEManager;