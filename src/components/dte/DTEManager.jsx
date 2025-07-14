// src/components/dte/DTEManager.jsx
// VERSIÓN SIMPLIFICADA SIN VALIDACIÓN DE ESQUEMAS

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
  Edit,
  Building,
  X
} from 'lucide-react';

// Imports según tu estructura actual ✅
import DteFormContainer, { CamposRequeridosPendientes, DebugInfo } from './forms/DteFormContainer';                                    
import TaxCalculator from '../../calculadora/TaxCalculator';        
import SignatureQRManager from '../../calculadora/SignatureQRManager';
import FacturaPreview from './FacturaPreview';                      
import { useTaxCalculations } from '../hooks/useTaxCalculations';   
import { useQRGenerator } from '../hooks/useQRGenerator';           

// 🆕 TEMPORALMENTE COMENTADO: Importar el validador de esquemas
// import { schemaValidator } from '../../services/schemaValidator.js';    // ✅ VALIDADOR DE ESQUEMAS
// import SchemaValidationIndicator from '../services/SchemaValidationIndicator'; // ✅ INDICADOR DE ESQUEMAS
// import DteFinalReview from './DteFinalReview'; // ✅ REVISIÓN FINAL

import EmpresaConfig from '../config/EmpresaConfig';
import { apiService } from '../services/apiService';               
import { CATALOGS, getCatalogValue } from '../data/catalogs';
import { getEmisorData } from '../../config/empresa';       


const DTEManager = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [dteData, setDteData] = useState(null);
  const [signedDocument, setSignedDocument] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // 🆕 TEMPORALMENTE COMENTADO: Estado para validación real
  // const [validationResult, setValidationResult] = useState(null);
  // const [isValidationReady, setIsValidationReady] = useState(false);
  
  // 🆕 NUEVO: Estado para validación de campos requeridos del formulario
  const [formValidation, setFormValidation] = useState({
    isValid: false,
    missingFields: [],
    errors: {}
  });
  
  const [environment, setEnvironment] = useState('test');
  const [showEmpresaConfig, setShowEmpresaConfig] = useState(false);
  const [generatedJSON, setGeneratedJSON] = useState('');

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

  // 🆕 TEMPORALMENTE COMENTADO: Inicializar validador de esquemas al cargar
  // useEffect(() => {
  //   const initializeSchemaValidator = async () => {
  //     console.log('🔧 Inicializando validador de esquemas...');
  //     try {
  //       const result = await schemaValidator.initialize();
  //       if (result.success) {
  //         console.log('✅ Validador de esquemas inicializado:', result.message);
  //         setIsValidationReady(true);
  //       } else {
  //         console.error('❌ Error inicializando validador:', result.error);
  //       }
  //     } catch (error) {
  //       console.error('❌ Error crítico inicializando validador:', error);
  //     }
  //   };

  //   initializeSchemaValidator();
  // }, []);

  // Configurar ambiente de API
  useEffect(() => {
    apiService.setEnvironment(environment === 'production');
  }, [environment]);

  // 🆕 Actualizar el ambiente en los datos del DTE (separado para evitar bucle)
  useEffect(() => {
    if (dteData) {
      const currentAmbiente = dteData.identificacion?.ambiente;
      const newAmbiente = environment === 'production' ? "01" : "00";
      
      // Solo actualizar si el ambiente ha cambiado
      if (currentAmbiente !== newAmbiente) {
        setDteData(prev => ({
          ...prev,
          identificacion: {
            ...prev.identificacion,
            ambiente: newAmbiente
          }
        }));
      }
    }
  }, [environment]); // Removido dteData de las dependencias

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

  // 🆕 TEMPORALMENTE COMENTADO: Manejar resultado de validación de esquemas
  // const handleSchemaValidationChange = useCallback((result) => {
  //   setValidationResult(result);
  //   console.log('📊 Resultado validación esquema:', result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
  //   if (!result.isValid && result.errors?.length > 0) {
  //     console.log('🔍 Errores de esquema encontrados:', result.errors.slice(0, 3));
  //   }
  // }, []);

  // 🆕 TEMPORALMENTE COMENTADO: Manejar validación final completa
  // const handleFinalValidationComplete = useCallback((report) => {
  //   console.log('📋 Reporte de validación final:', report);
  //   if (report.overall.isValid) {
  //     console.log('✅ Documento válido para envío');
  //   } else {
  //     console.log('❌ Documento con errores:', report.overall.totalErrors);
  //   }
  // }, []);

  // Manejar datos del formulario DTE - 🆕 ACTUALIZADO
  const handleDTEDataChange = useCallback((data, validation = null) => {
    setDteData(data);
    
    // 🆕 NUEVO: Actualizar validación del formulario si se proporciona
    if (validation) {
      setFormValidation(validation);
      console.log('📋 Validación del formulario:', {
        isValid: validation.isValid,
        missingFields: validation.missingFields?.length || 0,
        errors: Object.keys(validation.errors || {}).length
      });
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

      // 🆕 NUEVO: Usar el resumen completo generado por el hook
      const resumenCompleto = calcs.dteSpecificFields || {
        ...dteData.resumen,
        subTotal: calcs.subtotal,
        descuItem: calcs.descuentos,
        subTotalVentas: calcs.subTotalVentas,
        montoTotalOperacion: calcs.montoTotalOperacion,
        tributos: calcs.tributos || []
      };

      // Actualizar estructura específica según tipo
      let updatedData = { ...dteData };

      switch (tipoDte) {
        case "09": // DCL - usa cuerpoDocumento
          updatedData.cuerpoDocumento = {
            ...updatedData.cuerpoDocumento,
            ...calcs.dteSpecificFields
          };
          break;
        default:
          // Para otros tipos, actualizar resumen
          updatedData.resumen = resumenCompleto;
      }

      setDteData(updatedData);
      console.log('✅ DTE actualizado con cálculos específicos');
    }
  }, [dteData, getCurrentDteType, getCurrentDteInfo]);

  // Manejar documento firmado
  const handleDocumentSigned = useCallback((signedDoc) => {
    setSignedDocument(signedDoc);
    console.log('✅ Documento firmado:', signedDoc.estado);
  }, []);

  // Manejar QR generado
  const handleQRGenerated = useCallback((qr) => {
    setQrData(qr);
    console.log('✅ QR generado');
  }, []);

  // 🆕 NUEVA FUNCIÓN: Validar si se puede avanzar al siguiente paso
  const canProceedToNextStep = useCallback((currentStep) => {
    switch (currentStep) {
      case 1:
        return dteData && formValidation.isValid;
      case 2:
        return dteData && calculations;
      case 3:
        return dteData && signedDocument;
      case 4:
        return dteData && signedDocument;
      default:
    return true;
    }
  }, [dteData, formValidation.isValid, calculations, signedDocument]);

  // 🆕 NUEVA FUNCIÓN: Obtener texto del botón continuar
  const getContinueButtonText = useCallback((step) => {
    switch (step) {
      case 1:
        if (!dteData) return 'Complete el formulario';
        if (!formValidation.isValid) return 'Complete campos requeridos';
        return 'Continuar a Cálculos';
      case 2:
        if (!calculations) return 'Complete los cálculos';
        return 'Continuar a Firma';
      case 3:
        if (!signedDocument) return 'Documento no firmado';
        return 'Continuar a Revisión';
      case 4:
        if (!signedDocument) return 'Documento no firmado';
        return 'Continuar a Envío';
      default:
        return 'Continuar';
    }
  }, [dteData, formValidation.isValid, calculations, signedDocument]);

  // 🆕 NUEVA FUNCIÓN: Obtener nombre de visualización para campos
  const getFieldDisplayName = (fieldPath) => {
    const fieldNames = {
      'identificacion.tipoDte': 'Tipo de DTE',
      'identificacion.fecEmi': 'Fecha de Emisión',
      'receptor.nombre': 'Nombre del Receptor',
      'receptor.numDocumento': 'Número de Documento',
      'receptor.nrc': 'NRC',
      'receptor.nombreComercial': 'Nombre Comercial',
      'receptor.actividad': 'Actividad Económica',
      'receptor.telefono': 'Teléfono',
      'receptor.correo': 'Correo Electrónico',
      'receptor.direccion.complemento': 'Dirección',
      'cuerpoDocumento': 'Productos/Servicios'
    };

    // Para campos de ítems específicos
    if (fieldPath.includes('cuerpoDocumento.')) {
      const parts = fieldPath.split('.');
      const index = parts[1];
      const field = parts[2];
      const fieldName = {
        'descripcion': 'Descripción',
        'cantidad': 'Cantidad',
        'precioUni': 'Precio Unitario'
      }[field] || field;
      return `Ítem ${parseInt(index) + 1} - ${fieldName}`;
    }

    return fieldNames[fieldPath] || fieldPath;
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

  // Funciones existentes
  const validateBeforeSubmit = () => {
    return dteData && signedDocument;
  };

  const handleSubmitDTE = async () => {
    if (!validateBeforeSubmit()) {
      alert('Por favor complete todos los pasos antes de enviar');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiService.submitDTE(signedDocument);
      setSubmissionResult(result);
      console.log('✅ DTE enviado:', result);
    } catch (error) {
      setSubmissionResult({ success: false, error: error.message });
      console.error('❌ Error enviando DTE:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler de impresión profesional
  const handlePrintPreview = () => {
    handlePrintDirect();
  };

  // Función de impresión profesional
  const handlePrintDirect = () => {
    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    const printContent = previewRef.current?.innerHTML;
    
    if (!printContent) {
      alert('No hay contenido para imprimir');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DTE - ${getCurrentDteInfo().name}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: Arial, sans-serif;
            }
            @media print {
              @page {
                margin: 0.5in;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };

  const getPreviewData = () => {
    if (!dteData) return null;

    const tipoDte = getCurrentDteType();
    const dteInfo = getCurrentDteInfo();

    // Merge de emisor: config + formulario, priorizando config si el valor en el formulario es vacío
    const emisorBase = getEmisorData();
    const emisorUser = dteData.emisor || {};
    const emisorMerged = { ...emisorBase };
    Object.keys(emisorBase).forEach(key => {
      // Si el usuario ingresó un valor no vacío, úsalo; si no, usa el de la config
      emisorMerged[key] = (emisorUser[key] !== undefined && emisorUser[key] !== null && emisorUser[key] !== "") ? emisorUser[key] : emisorBase[key];
    });

    // Merge de receptor: asegurar siempre campo 'nombre'
    const receptorUser = dteData.receptor || {};
    let nombreReceptor = receptorUser.nombre || receptorUser.razonSocial || receptorUser.nombreComercial || receptorUser.nombreReceptor || "RECEPTOR SIN NOMBRE";
    const receptorMerged = { ...receptorUser, nombre: nombreReceptor };

    // Asegurar que el array de productos no sea undefined
    let items = dteData.cuerpoDocumento || dteData.items || [];
    if (!Array.isArray(items)) items = [];
    // Para pruebas: si está vacío, poner un producto de ejemplo
    // if (items.length === 0) items = [{ descripcion: "Producto de prueba", cantidad: 1, precioUni: 1 }];

    const previewData = {
      emisor: emisorMerged,
      receptor: receptorMerged,
      items,
      resumen: {
        codigoGeneracion: dteData.identificacion?.codigoGeneracion || '',
        numeroControl: dteData.identificacion?.numeroControl || '',
        selloRecepcion: dteData.identificacion?.selloRecepcion || '',
        modeloFacturacion: dteData.identificacion?.tipoModelo || 1,
        tipoTransmision: dteData.identificacion?.tipoOperacion || 1,
        fechaEmision: dteData.identificacion?.fecEmi || '',
        ...dteData.resumen
      },
      infoAdicional: dteData.infoAdicional || '',
      firmas: dteData.firmas || {},
      valorLetras: dteData.valorLetras || '',
      condicionOperacion: dteData.condicionOperacion || 'Contado',
      pagina: 1,
      paginasTotales: 1,
      tipoDte,
      dteInfo,
      calculations,
      qrData,
      environment
    };

    console.log('🟢 Datos enviados a FacturaPreview:', previewData);

    console.log('📋 Datos para preview:', {
      emisor: previewData.emisor,
      receptor: previewData.receptor,
      itemsCount: previewData.items?.length || 0,
      items: previewData.items,
      resumen: previewData.resumen,
      datosIncompletos: {
        emisorNombre: !previewData.emisor?.nombre,
        receptorNombre: !previewData.receptor?.nombre,
        itemsArray: !Array.isArray(previewData.items),
        itemsVacio: Array.isArray(previewData.items) && previewData.items.length === 0
      }
    });

    return previewData;
  };

  const convertNumberToWords = (num) => {
    // Implementación básica - puedes mejorarla
    return `$${num.toFixed(2)}`;
  };

  const downloadDTEJson = () => {
    if (!dteData) {
      alert('No hay datos para descargar');
      return;
    }

    // 🆕 NUEVO: Usar la misma función que "Generar JSON"
    const processedData = processCompleteDTEData(dteData, calculations);
    
    const dataStr = JSON.stringify(processedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dte-${getCurrentDteType()}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateJSON = () => {
    const completeData = processCompleteDTEData(dteData, calculations);
    setGeneratedJSON(JSON.stringify(completeData, null, 2));
  };

  const handleValidateSchema = () => {
    if (!generatedJSON) {
      alert("Primero genera el JSON para validarlo");
      return;
    }
    
    try {
      const jsonData = JSON.parse(generatedJSON);
      const validation = validateAgainstSchema(jsonData);
      
      if (validation.isValid) {
        alert("✅ El JSON cumple con el esquema fe-fc-v1.json");
      } else {
        const errorMessage = "❌ Errores de validación:\n\n" + validation.errors.join("\n");
        alert(errorMessage);
      }
    } catch (error) {
      alert("❌ Error al parsear el JSON: " + error.message);
    }
  };

  // 🆕 NUEVA FUNCIÓN: Procesar datos completos del DTE
  const processCompleteDTEData = (formData, calcs) => {
    const tipoDte = getCurrentDteType();
    
    // 🆕 Configuración específica según tipo de DTE
    const dteConfig = {
      "01": { // Factura de Consumidor
        version: 1,
        numeroControlPattern: `DTE-01-00000001-000000000000001`,
        receptorStructure: "tipoDocumento"
      },
      "03": { // Comprobante de Crédito Fiscal
        version: 3,
        numeroControlPattern: `DTE-03-00000001-000000000000001`,
        receptorStructure: "nit"
      },
      "04": { // 🆕 NUEVO: Nota de Remisión
        version: 3,
        numeroControlPattern: `DTE-04-00000001-000000000000001`,
        receptorStructure: "tipoDocumento"
      },
      "05": { // 🆕 NUEVO: Nota de Crédito
        version: 3,
        numeroControlPattern: `DTE-05-00000001-000000000000001`,
        receptorStructure: "nit"
      },
      "06": { // 🆕 NUEVO: Nota de Débito
        version: 3,
        numeroControlPattern: `DTE-06-00000001-000000000000001`,
        receptorStructure: "nit"
      },
      "07": { // 🆕 NUEVO: Comprobante de Retención
        version: 1,
        numeroControlPattern: `DTE-07-00000001-000000000000001`,
        receptorStructure: "tipoDocumento"
      },
      "08": { // 🆕 NUEVO: Comprobante de Liquidación
        version: 1,
        numeroControlPattern: `DTE-08-00000001-000000000000001`,
        receptorStructure: "nit"
      },
      "09": { // 🆕 NUEVO: Documento Contable de Liquidación
        version: 1,
        numeroControlPattern: `DTE-09-00000001-000000000000001`,
        receptorStructure: "nit"
      },
      "11": { // 🆕 NUEVO: Factura de Exportación
        version: 1,
        numeroControlPattern: `DTE-11-00000001-000000000000001`,
        receptorStructure: "documento"
      },
      "14": { // 🆕 NUEVO: Factura de Sujeto Excluido
        version: 1,
        numeroControlPattern: `DTE-14-00000001-000000000000001`,
        receptorStructure: "documento"
      },
      "15": { // 🆕 NUEVO: Comprobante de Donación
        version: 1,
        numeroControlPattern: `DTE-15-00000001-000000000000001`,
        receptorStructure: "documento"
      }
    };
    
    const config = dteConfig[tipoDte] || dteConfig["01"];
    
    // Estructura base del documento
    const completeDTE = {
      identificacion: {
        version: config.version,
        ambiente: environment === 'production' ? "01" : "00",
        tipoDte: tipoDte,
        codigoGeneracion: formData.identificacion?.codigoGeneracion || generateUUID(),
        numeroControl: formData.identificacion?.numeroControl || config.numeroControlPattern,
        tipoModelo: formData.identificacion?.tipoModelo || 1,
        tipoOperacion: formData.identificacion?.tipoOperacion || 1,
        // 🆕 Campos específicos para CCF
        ...(tipoDte === "03" && {
          tipoContingencia: null,
          motivoContin: null
        }),
        fecEmi: formData.identificacion?.fecEmi || new Date().toISOString().split('T')[0],
        horEmi: formData.identificacion?.horEmi || new Date().toTimeString().split(' ')[0],
        tipoMoneda: formData.identificacion?.tipoMoneda || "USD"
      },
      emisor: (() => {
        const emisorBase = getEmisorData();
        const emisorUser = formData.emisor || {};
        const emisorMerged = { ...emisorBase };
        Object.keys(emisorBase).forEach(key => {
          emisorMerged[key] = (emisorUser[key] !== undefined && emisorUser[key] !== null && emisorUser[key] !== "") ? emisorUser[key] : emisorBase[key];
        });
        // Asegurar que siempre haya un campo 'nombre' válido
        if (!emisorMerged.nombre || emisorMerged.nombre === "") {
          emisorMerged.nombre = emisorBase.nombre || emisorUser.nombre || emisorBase.nombreComercial || emisorUser.nombreComercial || "EMISOR SIN NOMBRE";
        }
        return emisorMerged;
      })(),
      receptor: (() => {
        const receptorUser = formData.receptor || {};
        // Asegurar que siempre haya un campo 'nombre' válido
        let nombre = receptorUser.nombre || receptorUser.razonSocial || receptorUser.nombreComercial || receptorUser.nombreReceptor || "RECEPTOR SIN NOMBRE";
        return { ...receptorUser, nombre };
      })(),
      items: Array.isArray(formData.cuerpoDocumento) && formData.cuerpoDocumento.length > 0
        ? formData.cuerpoDocumento
        : (Array.isArray(formData.items) ? formData.items : []),
      cuerpoDocumento: tipoDte === "07" ? formData.cuerpoDocumento?.map(item => ({
        // 🆕 NUEVO: Estructura específica para Comprobante de Retención
        numItem: item.numItem || 1,
        tipoDte: item.tipoDte || "03", // Tipo de documento relacionado
        tipoDoc: item.tipoDoc || 1, // Tipo de generación
        numDocumento: item.numDocumento || "",
        fechaEmision: item.fechaEmision || new Date().toISOString().split('T')[0],
        montoSujetoGrav: item.montoSujetoGrav || (item.cantidad * item.precioUni),
        codigoRetencionMH: item.codigoRetencionMH || "22",
        ivaRetenido: item.ivaRetenido || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100,
        descripcion: item.descripcion || item.descripcion || "Retención de IVA"
      })) : tipoDte === "08" ? formData.cuerpoDocumento?.map(item => ({
        // 🆕 NUEVO: Estructura específica para Comprobante de Liquidación
        numItem: item.numItem || 1,
        tipoDte: item.tipoDte || "01", // Tipo de documento relacionado
        tipoGeneracion: item.tipoGeneracion || 1, // Tipo de generación
        numeroDocumento: item.numeroDocumento || "",
        fechaGeneracion: item.fechaGeneracion || new Date().toISOString().split('T')[0],
        ventaNoSuj: item.ventaNoSuj || 0,
        ventaExenta: item.ventaExenta || 0,
        ventaGravada: item.ventaGravada || (item.cantidad * item.precioUni),
        exportaciones: item.exportaciones || 0,
        tributos: item.tributos || ["20"], // Código de IVA
        ivaItem: item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100,
        obsItem: item.obsItem || "Liquidación de documento"
      })) : tipoDte === "09" ? {
        // 🆕 NUEVO: Estructura específica para Documento Contable de Liquidación (objeto único)
        periodoLiquidacionFechaInicio: formData.cuerpoDocumento?.periodoLiquidacionFechaInicio || new Date().toISOString().split('T')[0],
        periodoLiquidacionFechaFin: formData.cuerpoDocumento?.periodoLiquidacionFechaFin || new Date().toISOString().split('T')[0],
        codLiquidacion: formData.cuerpoDocumento?.codLiquidacion || "LIQ001",
        cantidadDoc: formData.cuerpoDocumento?.cantidadDoc || formData.cuerpoDocumento?.length || 1,
        valorOperaciones: formData.cuerpoDocumento?.valorOperaciones || formData.cuerpoDocumento?.reduce((total, item) => total + (item.cantidad * item.precioUni), 0) || 0,
        montoSinPercepcion: formData.cuerpoDocumento?.montoSinPercepcion || 0,
        descripSinPercepcion: formData.cuerpoDocumento?.descripSinPercepcion || "Operaciones no sujetas a percepción",
        subTotal: formData.cuerpoDocumento?.subTotal || formData.cuerpoDocumento?.reduce((total, item) => total + (item.cantidad * item.precioUni), 0) || 0,
        iva: formData.cuerpoDocumento?.iva || Math.round((formData.cuerpoDocumento?.reduce((total, item) => total + (item.cantidad * item.precioUni), 0) || 0) * 0.13 * 100) / 100,
        montoSujetoPercepcion: formData.cuerpoDocumento?.montoSujetoPercepcion || formData.cuerpoDocumento?.reduce((total, item) => total + (item.cantidad * item.precioUni), 0) || 0,
        ivaPercibido: formData.cuerpoDocumento?.ivaPercibido || Math.round((formData.cuerpoDocumento?.reduce((total, item) => total + (item.cantidad * item.precioUni), 0) || 0) * 0.02 * 100) / 100,
        comision: formData.cuerpoDocumento?.comision || 0,
        porcentComision: formData.cuerpoDocumento?.porcentComision || "0%",
        ivaComision: formData.cuerpoDocumento?.ivaComision || 0,
        liquidoApagar: formData.cuerpoDocumento?.liquidoApagar || (formData.cuerpoDocumento?.reduce((total, item) => total + (item.cantidad * item.precioUni), 0) || 0),
        totalLetras: formData.cuerpoDocumento?.totalLetras || convertNumberToWords(formData.cuerpoDocumento?.reduce((total, item) => total + (item.cantidad * item.precioUni), 0) || 0),
        observaciones: formData.cuerpoDocumento?.observaciones || "Documento contable de liquidación"
      } : tipoDte === "14" ? formData.cuerpoDocumento?.map(item => ({
        // 🆕 NUEVO: Estructura específica para Factura de Sujeto Excluido
        numItem: item.numItem || 1,
        tipoItem: 2, // 🆕 Campo requerido por esquema
        cantidad: item.cantidad || 1,
        codigo: item.codigo || "",
        uniMedida: "59", // 🆕 Campo requerido por esquema
        descripcion: item.descripcion || "",
        precioUni: item.precioUni || 0,
        montoDescu: item.montoDescu || 0,
        compra: (item.cantidad * item.precioUni) - item.montoDescu // 🆕 Campo específico para FSE
      })) : formData.cuerpoDocumento?.map(item => ({
        numItem: item.numItem || 1,
        tipoItem: 2, // 🆕 Campo requerido por esquema
        codigo: item.codigo || "",
        descripcion: item.descripcion || "", // 🆕 Campo requerido por esquema
        uniMedida: "59", // 🆕 Campo requerido por esquema
        cantidad: item.cantidad || 1,
        precioUni: item.precioUni || 0,
        montoDescu: item.montoDescu || 0,
        ventaNoSuj: 0, // 🆕 Campo requerido por esquema
        ventaExenta: 0, // 🆕 Campo requerido por esquema
        ventaGravada: (item.cantidad * item.precioUni) - item.montoDescu, // 🆕 Campo requerido por esquema
        tributos: [{
          codigo: "20",
          descripcion: "Impuesto al Valor Agregado 13%",
          valor: ((item.cantidad * item.precioUni) - item.montoDescu) * 0.13
        }], // 🆕 Campo requerido por esquema
        psv: 0, // 🆕 Campo requerido por esquema
        noGravado: 0, // 🆕 Campo requerido por esquema
        ivaItem: Math.round(((item.cantidad * item.precioUni) - item.montoDescu) * 0.13 * 100) / 100, // 🆕 Campo requerido por esquema
        totalItem: Math.round(((item.cantidad * item.precioUni) - item.montoDescu) * 1.13 * 100) / 100 // 🆕 Campo requerido por esquema
      })) || [],
      resumen: tipoDte === "07" ? {
        // 🆕 NUEVO: Estructura específica para Comprobante de Retención
        totalSujetoRetencion: calcs?.dteSpecificFields?.totalSujetoRetencion || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.montoSujetoGrav || (item.cantidad * item.precioUni)), 0) || 0,
        totalIVAretenido: calcs?.dteSpecificFields?.totalIVAretenido || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ivaRetenido || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0) || 0,
        totalIVAretenidoLetras: calcs?.dteSpecificFields?.totalIVAretenidoLetras || 
          convertNumberToWords(calcs?.dteSpecificFields?.totalIVAretenido || 
            formData.cuerpoDocumento?.reduce((total, item) => total + (item.ivaRetenido || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0) || 0)
      } : tipoDte === "08" ? {
        // 🆕 NUEVO: Estructura específica para Comprobante de Liquidación
        totalNoSuj: calcs?.dteSpecificFields?.totalNoSuj || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ventaNoSuj || 0), 0) || 0,
        totalExenta: calcs?.dteSpecificFields?.totalExenta || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ventaExenta || 0), 0) || 0,
        totalGravada: calcs?.dteSpecificFields?.totalGravada || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ventaGravada || (item.cantidad * item.precioUni)), 0) || 0,
        totalExportacion: calcs?.dteSpecificFields?.totalExportacion || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.exportaciones || 0), 0) || 0,
        subTotalVentas: calcs?.dteSpecificFields?.subTotalVentas || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ventaNoSuj || 0) + (item.ventaExenta || 0) + (item.ventaGravada || (item.cantidad * item.precioUni)) + (item.exportaciones || 0), 0) || 0,
        tributos: calcs?.tributos || [{
          codigo: "20",
          descripcion: "Impuesto al Valor Agregado 13%",
          valor: formData.cuerpoDocumento?.reduce((total, item) => total + (item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0) || 0
        }],
        montoTotalOperacion: calcs?.montoTotalOperacion || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ventaNoSuj || 0) + (item.ventaExenta || 0) + (item.ventaGravada || (item.cantidad * item.precioUni)) + (item.exportaciones || 0) + (item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0) || 0,
        ivaPerci: calcs?.dteSpecificFields?.ivaPerci || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0) || 0,
        total: calcs?.totalPagar || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.ventaNoSuj || 0) + (item.ventaExenta || 0) + (item.ventaGravada || (item.cantidad * item.precioUni)) + (item.exportaciones || 0) + (item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0) || 0,
        totalLetras: calcs?.dteSpecificFields?.totalLetras || 
          convertNumberToWords(calcs?.totalPagar || 
            formData.cuerpoDocumento?.reduce((total, item) => total + (item.ventaNoSuj || 0) + (item.ventaExenta || 0) + (item.ventaGravada || (item.cantidad * item.precioUni)) + (item.exportaciones || 0) + (item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0) || 0),
        condicionOperacion: calcs?.dteSpecificFields?.condicionOperacion || 1
      } : tipoDte === "14" ? {
        // 🆕 NUEVO: Estructura específica para Factura de Sujeto Excluido
        totalCompra: calcs?.dteSpecificFields?.totalCompra || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.compra || (item.cantidad * item.precioUni)), 0) || 0,
        descu: calcs?.dteSpecificFields?.descu || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.montoDescu || 0), 0) || 0,
        totalDescu: calcs?.dteSpecificFields?.totalDescu || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.montoDescu || 0), 0) || 0,
        subTotal: calcs?.subtotal || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.compra || (item.cantidad * item.precioUni)), 0) || 0,
        ivaRete1: calcs?.dteSpecificFields?.ivaRete1 || 0,
        reteRenta: calcs?.reteRenta || 0,
        totalPagar: calcs?.totalPagar || 
          formData.cuerpoDocumento?.reduce((total, item) => total + (item.compra || (item.cantidad * item.precioUni)), 0) || 0,
        totalLetras: calcs?.dteSpecificFields?.totalLetras || 
          convertNumberToWords(calcs?.totalPagar || 
            formData.cuerpoDocumento?.reduce((total, item) => total + (item.compra || (item.cantidad * item.precioUni)), 0) || 0),
        condicionOperacion: calcs?.dteSpecificFields?.condicionOperacion || 1,
        pagos: calcs?.dteSpecificFields?.pagos || [{
          codigo: "01",
          montoPago: calcs?.totalPagar || 
            formData.cuerpoDocumento?.reduce((total, item) => total + (item.compra || (item.cantidad * item.precioUni)), 0) || 0,
          referencia: null,
          plazo: null,
          periodo: null
        }],
        observaciones: calcs?.dteSpecificFields?.observaciones || "Factura de sujeto excluido"
      } : {
        // Campos básicos
        totalNoSuj: calcs?.dteSpecificFields?.totalNoSuj || 0,
        totalExenta: calcs?.dteSpecificFields?.totalExenta || 0,
        totalGravada: calcs?.dteSpecificFields?.totalGravada || 0,
        subTotalVentas: calcs?.dteSpecificFields?.subTotalVentas || 0,
        
        // Descuentos
        descuNoSuj: calcs?.dteSpecificFields?.descuNoSuj || 0,
        descuExenta: calcs?.dteSpecificFields?.descuExenta || 0,
        descuGravada: calcs?.dteSpecificFields?.descuGravada || 0,
        porcentajeDescuento: calcs?.dteSpecificFields?.porcentajeDescuento || 0,
        totalDescu: calcs?.dteSpecificFields?.totalDescu || 0,
        
        // Tributos
        tributos: calcs?.tributos || [],
        
        // Totales
        subTotal: calcs?.subtotal || 0,
        ivaRete1: calcs?.dteSpecificFields?.ivaRete1 || 0,
        // 🆕 Campo específico para CCF
        ...(tipoDte === "03" && {
          ivaPerci1: calcs?.dteSpecificFields?.ivaPerci1 || 0
        }),
        // 🆕 Campo específico para Nota de Débito
        ...(tipoDte === "06" && {
          ivaPerci1: calcs?.dteSpecificFields?.ivaPerci1 || 0
        }),
        reteRenta: calcs?.reteRenta || 0,
        montoTotalOperacion: calcs?.montoTotalOperacion || 0,
        totalNoGravado: calcs?.dteSpecificFields?.totalNoGravado || 0,
        totalPagar: calcs?.totalPagar || 0,
        totalLetras: calcs?.dteSpecificFields?.totalLetras || "",
        totalIva: calcs?.iva || 0,
        saldoFavor: calcs?.dteSpecificFields?.saldoFavor || 0,
        condicionOperacion: calcs?.dteSpecificFields?.condicionOperacion || 1,
        pagos: calcs?.dteSpecificFields?.pagos || [],
        numPagoElectronico: calcs?.dteSpecificFields?.numPagoElectronico || ""
      },
      // 🆕 Campos opcionales según esquema
      documentoRelacionado: null, // Opcional
      otrosDocumentos: null, // Opcional
      ventaTercero: null, // Opcional
      // 🆕 Campos obligatorios para CCF
      ...(tipoDte === "03" && {
        extension: {
          nombEntrega: "Responsable de entrega",
          docuEntrega: "DUI-12345678",
          nombRecibe: "Responsable de recepción",
          docuRecibe: "DUI-87654321",
          observaciones: "Documento generado automáticamente",
          placaVehiculo: "ABC123"
        },
        apendice: []
      }),
      // 🆕 NUEVO: Campos obligatorios para Nota de Remisión
      ...(tipoDte === "04" && {
        documentoRelacionado: formData.documentoRelacionado || [{
          tipoDocumento: "01",
          tipoGeneracion: 1,
          numeroDocumento: "FAC-001-00000001",
          fechaEmision: new Date().toISOString().split('T')[0]
        }],
        ventaTercero: formData.ventaTercero || {
          nit: "0614-123456-789-0",
          nombre: "Empresa Tercera S.A. de C.V."
        },
        extension: formData.extension || {
          nombEntrega: "Responsable de entrega",
          docuEntrega: "DUI-12345678",
          nombRecibe: "Responsable de recepción",
          docuRecibe: "DUI-87654321",
          observaciones: "Remisión de mercancías"
        },
        apendice: formData.apendice || []
      }),
      // 🆕 NUEVO: Campos obligatorios para Nota de Crédito
      ...(tipoDte === "05" && {
        documentoRelacionado: formData.documentoRelacionado || [{
          tipoDocumento: "03",
          tipoGeneracion: 1,
          numeroDocumento: "CCF-003-00000001",
          fechaEmision: new Date().toISOString().split('T')[0]
        }],
        ventaTercero: formData.ventaTercero || {
          nit: "0614-123456-789-0",
          nombre: "Empresa Tercera S.A. de C.V."
        },
        extension: formData.extension || {
          nombEntrega: "Responsable de emisión",
          docuEntrega: "DUI-12345678",
          nombRecibe: "Responsable de recepción",
          docuRecibe: "DUI-87654321",
          observaciones: "Nota de crédito por corrección"
        },
        apendice: formData.apendice || []
      }),
      // 🆕 NUEVO: Campos obligatorios para Nota de Débito
      ...(tipoDte === "06" && {
        documentoRelacionado: formData.documentoRelacionado || [{
          tipoDocumento: "03",
          tipoGeneracion: 1,
          numeroDocumento: "CCF-003-00000001",
          fechaEmision: new Date().toISOString().split('T')[0]
        }],
        ventaTercero: formData.ventaTercero || {
          nit: "0614-123456-789-0",
          nombre: "Empresa Tercera S.A. de C.V."
        },
        extension: formData.extension || {
          nombEntrega: "Responsable de emisión",
          docuEntrega: "DUI-12345678",
          nombRecibe: "Responsable de recepción",
          docuRecibe: "DUI-87654321",
          observaciones: "Nota de débito por ajuste"
        },
        apendice: formData.apendice || []
      }),
      // 🆕 NUEVO: Campos obligatorios para Comprobante de Retención
      ...(tipoDte === "07" && {
        extension: formData.extension || {
          nombEntrega: "Responsable de emisión",
          docuEntrega: "DUI-12345678",
          nombRecibe: "Responsable de recepción",
          docuRecibe: "DUI-87654321",
          observaciones: "Comprobante de retención de IVA"
        },
        apendice: formData.apendice || []
      }),
      // 🆕 NUEVO: Campos obligatorios para Comprobante de Liquidación
      ...(tipoDte === "08" && {
        extension: formData.extension || {
          nombEntrega: "Responsable de emisión",
          docuEntrega: "DUI-12345678",
          nombRecibe: "Responsable de recepción",
          docuRecibe: "DUI-87654321",
          observaciones: "Comprobante de liquidación"
        },
        apendice: formData.apendice || []
      }),
      // 🆕 NUEVO: Campos obligatorios para Documento Contable de Liquidación
      ...(tipoDte === "09" && {
        extension: formData.extension || {
          nombEntrega: "Responsable de emisión",
          docuEntrega: "DUI-12345678",
          codEmpleado: "EMP001"
        },
        apendice: formData.apendice || []
      }),
      // 🆕 NUEVO: Campos obligatorios para Factura de Exportación
      ...(tipoDte === "11" && {
        otrosDocumentos: formData.otrosDocumentos || [{
          codDocAsociado: 1,
          descDocumento: "Documento de exportación",
          detalleDocumento: "Detalle del documento de exportación",
          placaTrans: null,
          modoTransp: null,
          numConductor: null,
          nombreConductor: null
        }],
        ventaTercero: formData.ventaTercero || {
          nit: "0614-123456-789-0",
          nombre: "Empresa Exportadora S.A. de C.V."
        },
        apendice: formData.apendice || []
      }),
      // 🆕 NUEVO: Campos obligatorios para Factura de Sujeto Excluido
      ...(tipoDte === "14" && {
        apendice: formData.apendice || []
      }),
      ...(tipoDte !== "03" && tipoDte !== "04" && tipoDte !== "05" && tipoDte !== "06" && tipoDte !== "07" && tipoDte !== "08" && tipoDte !== "09" && tipoDte !== "11" && tipoDte !== "14" && {
        extension: null,
        apendice: null
      })
    };

    // 🆕 Agregar campos específicos según el tipo de DTE
    if (calcs?.dteSpecificFields) {
      Object.entries(calcs.dteSpecificFields).forEach(([field, value]) => {
        if (!completeDTE.resumen.hasOwnProperty(field)) {
          completeDTE.resumen[field] = value;
        }
      });
    }

    return completeDTE;
  };

  // 🆕 Función helper para generar UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        {/* Header y ambiente */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Documentos Tributarios Electrónicos
            </h1>
            {/* 🆕 Mostrar tipo DTE actual */}
            {dteData && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo actual:</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm font-medium">
                  {getCurrentDteType()} - {getCurrentDteInfo().name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Botón de configuración de empresa */}
            <button
              onClick={() => setShowEmpresaConfig(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Building className="w-4 h-4" />
              Configurar Empresa
            </button>
            
            {/* Selector de ambiente */}
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="test">Ambiente de Pruebas</option>
              <option value="production">Ambiente de Producción</option>
            </select>
            {/* Indicador de ambiente */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${environment === 'production'
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
              }`}>
              {environment === 'production' ? 'PRODUCCIÓN' : 'PRUEBAS'}
            </div>
          </div>
        </div>

        {renderStepIndicator()}
      </div>

      {/* Main layout responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
        {/* Panel principal */}
        <div className="xl:col-span-3">
          {/* Paso 1: Formulario DTE */}
          {activeStep === 1 && (
            <div className="space-y-4 lg:space-y-6">
              <DteFormContainer
                onDataChange={handleDTEDataChange}
                initialData={dteData}
              />
              
              {/* Botón continuar responsive */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setActiveStep(2)}
                  disabled={!canProceedToNextStep(1)}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {getContinueButtonText(1)}
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Cálculos */}
          {activeStep === 2 && (
            <div className="space-y-4 lg:space-y-6">
              {/* Información del tipo DTE */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Calculando para: {getCurrentDteInfo().name} ({getCurrentDteType()})
                </h3>
                <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <div>• <strong>IVA:</strong> {getCurrentDteInfo().iva.applies ? `${(getCurrentDteInfo().iva.rate * 100).toFixed(0)}%` : 'No aplica'}</div>
                  <div>• <strong>Retención:</strong> {getCurrentDteInfo().retencion.applies ? `${(getCurrentDteInfo().retencion.rate * 100).toFixed(0)}%` : 'No aplica'}</div>
                  {getCurrentDteInfo().minAmount > 0 && (
                    <div>• <strong>Monto mínimo:</strong> ${getCurrentDteInfo().minAmount.toFixed(2)}</div>
                  )}
                </div>
              </div>

              <TaxCalculator
                items={dteData?.cuerpoDocumento || []}
                tipoDte={getCurrentDteType()}
                onCalculationChange={handleCalculationChange}
              />
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setActiveStep(1)}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={() => setActiveStep(3)}
                  disabled={!canProceedToNextStep(2)}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {getContinueButtonText(2)}
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Firma y QR */}
          {activeStep === 3 && (
            <div className="space-y-4 lg:space-y-6">
              <SignatureQRManager
                dteData={dteData}
                onDocumentSigned={handleDocumentSigned}
                onQRGenerated={handleQRGenerated}
              />
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <button
                  onClick={() => setActiveStep(2)}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  disabled={!canProceedToNextStep(3)}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {getContinueButtonText(3)}
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Revisión Final */}
          {activeStep === 4 && (
            <div className="space-y-4 lg:space-y-6">
              {/* Vista previa del documento */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Vista Previa del DTE
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                  <FacturaPreview
                    ref={previewRef}
                    {...getPreviewData()}
                    qrValue={qrData?.qrValue || undefined}
                    className="w-full min-w-[600px]"
                  />
                </div>
              </div>

              {/* Navegación */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => setActiveStep(5)}
                    className="w-full sm:w-auto px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    🧪 Llenar datos de prueba
                  </button>
                </div>
                <button
                  onClick={() => setActiveStep(5)}
                  disabled={!canProceedToNextStep(4)}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {getContinueButtonText(4)}
                </button>
              </div>
            </div>
          )}

          {/* Paso 5: Envío */}
          {activeStep === 5 && (
            <div className="space-y-4 lg:space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Enviar DTE al Ministerio de Hacienda
                </h3>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resumen del Documento</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Tipo de Documento:</dt>
                        <dd className="text-gray-900 dark:text-white">{getCurrentDteInfo().name}</dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Código de Generación:</dt>
                        <dd className="text-gray-900 dark:text-white font-mono text-xs break-all">{dteData?.identificacion?.codigoGeneracion}</dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Total a Pagar:</dt>
                        <dd className="text-gray-900 dark:text-white font-semibold">
                          ${(dteData?.resumen?.totalPagar || dteData?.resumen?.valorTotal || 0).toFixed(2)}
                        </dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <dt className="text-gray-600 dark:text-gray-400">Estado:</dt>
                        <dd className="text-gray-900 dark:text-white">
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
        <div className="xl:col-span-1 space-y-4 lg:space-y-6">
          {/* Información del DTE actual */}
          {dteData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Documento Actual</h3>
              <div className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{getCurrentDteInfo().name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Código:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{getCurrentDteType()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                  <span className={getCurrentDteInfo().iva.applies ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                    {getCurrentDteInfo().iva.applies ? `${(getCurrentDteInfo().iva.rate * 100).toFixed(0)}%` : 'No aplica'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Retención:</span>
                  <span className={getCurrentDteInfo().retencion.applies ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"}>
                    {getCurrentDteInfo().retencion.applies ? `${(getCurrentDteInfo().retencion.rate * 100).toFixed(0)}%` : 'No aplica'}
                  </span>
                </div>
                {calculations && (
                  <>
                    <hr className="my-3 border-gray-200 dark:border-gray-600" />
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-medium text-gray-900 dark:text-white">${calculations.subTotalVentas?.toFixed(2) || '0.00'}</span>
                    </div>
                    {calculations.iva > 0 && (
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">+${calculations.iva.toFixed(2)}</span>
                      </div>
                    )}
                    {calculations.reteRenta > 0 && (
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Retención:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">-${calculations.reteRenta.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    <div className="flex flex-col sm:flex-row sm:justify-between font-semibold">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-lg text-gray-900 dark:text-white">
                        ${(calculations.totalPagar || calculations.dteSpecificFields?.valorTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              <button
                onClick={() => setActiveStep(4)}
                disabled={!signedDocument}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Eye className="w-4 h-4" />
                Vista Previa
              </button>
              <button
                onClick={handleGenerateJSON}
                disabled={!dteData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileText className="w-4 h-4" />
                Generar JSON
              </button>
              <button
                onClick={handleValidateSchema}
                disabled={!generatedJSON}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Validar Esquema
              </button>
              <button
                onClick={downloadDTEJson}
                disabled={!dteData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar JSON
              </button>
            </div>
          </div>
          
          {/* Estado del proceso */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado del Proceso</h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.number} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${activeStep > step.number
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : activeStep === step.number
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    {activeStep > step.number ? '✓' : step.number}
                  </div>
                  <span className={`text-sm ${activeStep >= step.number ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* JSON Generado y Validación */}
          {generatedJSON && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">JSON Generado</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {generatedJSON.length > 1000 ? generatedJSON.substring(0, 1000) + '...' : generatedJSON}
                  </pre>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedJSON)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={downloadDTEJson}
                    className="flex-1 px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Configuración de Empresa */}
      {showEmpresaConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Configuración de Empresa</h2>
              <button
                onClick={() => setShowEmpresaConfig(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <EmpresaConfig 
                onConfigChange={(newConfig) => {
                  console.log('✅ Configuración de empresa actualizada:', newConfig);
                  // Aquí podrías recargar los datos del formulario si es necesario
                  setShowEmpresaConfig(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DTEManager;