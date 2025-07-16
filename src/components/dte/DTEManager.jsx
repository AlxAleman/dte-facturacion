// src/components/dte/DTEManager.jsx
// VERSIÓN COMPLETA CORREGIDA - Solo coordinador, confía en formularios y hook de cálculos

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

import EmpresaConfig from '../config/EmpresaConfig';
import { apiService } from '../services/apiService';               
import { CATALOGS, getCatalogValue } from '../data/catalogs';
import { getEmisorData } from '../../config/empresa';
import { numberToWords } from '../../utils/numberToWords';       

const DTEManager = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [dteData, setDteData] = useState(null);
  const [signedDocument, setSignedDocument] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Estado para validación de campos requeridos del formulario
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

  // Hook de cálculos
  const { getDteInfo } = useTaxCalculations();

  const steps = [
    { number: 1, title: 'Datos del DTE', icon: FileText },
    { number: 2, title: 'Cálculos', icon: Settings },
    { number: 3, title: 'Firma y QR', icon: CheckCircle },
    { number: 4, title: 'Revisión', icon: Eye },
    { number: 5, title: 'Envío', icon: Send }
  ];

  // Configurar ambiente de API
  useEffect(() => {
    apiService.setEnvironment(environment === 'production');
  }, [environment]);

  // Actualizar el ambiente en los datos del DTE
  useEffect(() => {
    if (dteData && dteData.identificacion) {
      const currentAmbiente = dteData.identificacion.ambiente;
      const newAmbiente = environment === 'production' ? "01" : "00";
      
      // 🔥 CORREGIDO: Solo actualizar si realmente es diferente para evitar bucle infinito
      if (currentAmbiente !== newAmbiente) {
        console.log('🔄 Actualizando ambiente de', currentAmbiente, 'a', newAmbiente);
        setDteData(prev => ({
          ...prev,
          identificacion: {
            ...prev.identificacion,
            ambiente: newAmbiente
          }
        }));
      }
    }
  }, [environment, dteData?.identificacion?.ambiente]);

  // Scroll al top al cambiar de paso
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeStep]);

  // Obtener tipo de DTE actual
  const getCurrentDteType = useCallback(() => {
    return dteData?.identificacion?.tipoDte || "01";
  }, [dteData]);

  // Obtener información del tipo DTE actual
  const getCurrentDteInfo = useCallback(() => {
    const tipoDte = getCurrentDteType();
    return getDteInfo(tipoDte);
  }, [getCurrentDteType, getDteInfo]);

  // 🆕 FUNCIÓN PRINCIPAL: Completar campos técnicos y usar cálculos
  const prepareFinalDocument = (formData, calculations) => {
    if (!formData) return null;

    const tipoDte = formData?.identificacion?.tipoDte || "01";
    
    console.log('🔧 Preparando documento final para tipo DTE:', tipoDte);
    
    // 🔥 CRÍTICO: Usar estructura específica según el tipo de DTE
    switch (tipoDte) {
      case "03": // Comprobante de Crédito Fiscal
        return prepareCCFDocument(formData, calculations);
      case "01": // Factura de Consumidor Final
        return prepareFCDocument(formData, calculations);
      default:
        console.warn(`⚠️ Tipo de DTE ${tipoDte} no implementado específicamente, usando estructura genérica`);
        return prepareGenericDocument(formData, calculations);
    }
  };

  // 🔥 NUEVA: Función específica para CCF (Tipo 03)
  const prepareCCFDocument = (formData, calculations) => {
    console.log('🔧 Preparando documento CCF específico...');
    console.log('📊 Cálculos recibidos:', {
      tieneCalculations: !!calculations,
      tipoCalculations: typeof calculations,
      keys: calculations ? Object.keys(calculations) : [],
      reteRenta: calculations?.reteRenta,
      totalPagar: calculations?.totalPagar,
      dteSpecificFields: calculations?.dteSpecificFields
    });
    
    // Procesar items específicamente para CCF - SIN campos no permitidos
    let finalCuerpoDocumento = formData.cuerpoDocumento.map((item, index) => {
      const cantidad = item.cantidad || 1;
      const precioUni = item.precioUni || 0;
      const montoDescu = item.montoDescu || 0;
      const ventaTotal = (cantidad * precioUni) - montoDescu;
      const ventaGravada = ventaTotal > 0 ? ventaTotal : 0;

      return {
        numItem: index + 1,
        tipoItem: item.tipoItem || 2,
        uniMedida: parseInt(item.uniMedida) || 59,
        codigo: item.codigo || "",
        descripcion: item.descripcion || "Producto/Servicio",
        cantidad: cantidad,
        precioUni: precioUni,
        montoDescu: montoDescu,
        ventaNoSuj: item.ventaNoSuj !== undefined ? item.ventaNoSuj : 0,
        ventaExenta: item.ventaExenta !== undefined ? item.ventaExenta : 0,
        ventaGravada: Math.round(ventaGravada * 100) / 100,
        tributos: ventaGravada > 0 ? ["20"] : [],
        psv: item.psv !== undefined ? item.psv : 0,
        noGravado: item.noGravado !== undefined ? item.noGravado : 0,
        numeroDocumento: null,
        codTributo: null
        // 🔥 ELIMINADOS: ivaItem, totalItem (no están en el schema)
      };
    });

    // Calcular totales específicos para CCF
    const subTotalVentas = finalCuerpoDocumento.reduce((sum, item) => {
      return sum + (item.cantidad * item.precioUni) - item.montoDescu;
    }, 0);
    
    const totalGravada = finalCuerpoDocumento.reduce((sum, item) => {
      return sum + item.ventaGravada;
    }, 0);

    const ivaTotal = totalGravada * 0.13;
    
    // 🔥 NUEVO: Usar cálculos del hook si están disponibles, sino calcular directamente
    let reteRenta = 0;
    let totalPagar = 0;
    let baseRetencion = totalGravada; // Base para retención en CCF
    let minThreshold = 100.00; // Umbral mínimo para aplicar retención
    let rentaRate = 0.10; // 10% de retención de renta
    
    if (calculations && calculations.reteRenta !== undefined) {
      // Usar cálculos del hook
      reteRenta = calculations.reteRenta;
      totalPagar = calculations.totalPagar || (subTotalVentas + ivaTotal - reteRenta);
      console.log('✅ Usando retención de renta del hook:', { reteRenta, totalPagar });
    } else {
      // Calcular directamente según reglas del CCF
      if (baseRetencion > minThreshold) {
        reteRenta = Math.round(baseRetencion * rentaRate * 100) / 100;
      }
      
      totalPagar = subTotalVentas + ivaTotal - reteRenta;
      console.log('🔧 Calculando retención de renta directamente:', { 
        baseRetencion, 
        minThreshold, 
        rentaRate, 
        reteRenta, 
        totalPagar 
      });
    }

    // 🔥 ESTRUCTURA ESPECÍFICA PARA CCF - CON TODOS LOS CAMPOS REQUERIDOS
    const ccfDocument = {
      identificacion: {
        version: 3,
        ambiente: environment === 'production' ? "01" : "00",
        tipoDte: "03",
        codigoGeneracion: generateUUID(),
        numeroControl: generateNumeroControl("03"),
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi: new Date().toISOString().split('T')[0],
        horEmi: new Date().toTimeString().split(' ')[0],
        tipoMoneda: "USD"
      },
      documentoRelacionado: null, // 🔥 REQUERIDO según schema
      emisor: {
        nit: cleanNIT(formData.emisor?.nit),
        nrc: cleanNRC(formData.emisor?.nrc),
        nombre: formData.emisor?.nombre,
        codActividad: formData.emisor?.codActividad || "",
        descActividad: formData.emisor?.descActividad || "",
        nombreComercial: formData.emisor?.nombreComercial || null,
        tipoEstablecimiento: formData.emisor?.tipoEstablecimiento || "",
        codEstableMH: formData.emisor?.codEstableMH || "",
        codEstable: formData.emisor?.codEstable || "",
        codPuntoVentaMH: formData.emisor?.codPuntoVentaMH || "",
        codPuntoVenta: formData.emisor?.codPuntoVenta || "",
        telefono: formData.emisor?.telefono || getEmisorData().telefono || "",
        correo: formData.emisor?.correo || getEmisorData().correo || "",
        direccion: formData.emisor?.direccion || {
          departamento: "",
          municipio: "",
          complemento: ""
        }
      },
      receptor: {
        nit: formData.receptor?.nit,
        nrc: formData.receptor?.nrc,
        nombre: formData.receptor?.nombre,
        codActividad: formData.receptor?.codActividad || "",
        descActividad: formData.receptor?.descActividad || "",
        nombreComercial: formData.receptor?.nombreComercial || "",
        direccion: formData.receptor?.direccion || {
          departamento: "",
          municipio: "",
          complemento: ""
        },
        telefono: formData.receptor?.telefono || "",
        correo: formData.receptor?.correo || ""
      },
      otrosDocumentos: null, // 🔥 REQUERIDO según schema
      ventaTercero: null, // 🔥 REQUERIDO según schema
      cuerpoDocumento: finalCuerpoDocumento,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: Math.round(totalGravada * 100) / 100,
        subTotalVentas: Math.round(subTotalVentas * 100) / 100,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: ivaTotal > 0 ? [{
          codigo: "20",
          descripcion: "Impuesto al Valor Agregado 13%",
          valor: Math.round(ivaTotal * 100) / 100
        }] : [],
        subTotal: Math.round(totalPagar * 100) / 100,
        ivaRete1: Math.round(reteRenta * 100) / 100,
        ivaPerci1: 0, // Campo específico para CCF
        reteRenta: Math.round(reteRenta * 100) / 100,
        montoTotalOperacion: Math.round((subTotalVentas + ivaTotal) * 100) / 100,
        totalNoGravado: 0,
        totalPagar: Math.round(totalPagar * 100) / 100,
        totalLetras: numberToWords(totalPagar), // 🔥 CORREGIDO: Usar función correcta
        saldoFavor: 0, // 🔥 REQUERIDO según schema
        condicionOperacion: 1,
        pagos: [{
          codigo: "01",
          montoPago: Math.round(totalPagar * 100) / 100,
          referencia: null,
          plazo: null,
          periodo: null
        }],
        numPagoElectronico: null // 🔥 CORREGIDO: null en lugar de string vacío
      },
      extension: { // 🔥 REQUERIDO según schema
        nombEntrega: null,
        docuEntrega: null,
        nombRecibe: null,
        docuRecibe: null,
        observaciones: null,
        placaVehiculo: null
      },
      apendice: null // 🔥 REQUERIDO según schema
    };

        console.log('✅ Documento CCF específico preparado:', {
      tipoDte: ccfDocument.identificacion.tipoDte,
      secciones: Object.keys(ccfDocument),
      camposEspecificos: ['ivaPerci1', 'documentoRelacionado', 'otrosDocumentos', 'ventaTercero', 'extension', 'apendice'],
      camposEliminados: ['ivaItem', 'totalItem'],
      totalLetras: ccfDocument.resumen.totalLetras,
      numPagoElectronico: ccfDocument.resumen.numPagoElectronico,
      retencionRenta: {
        baseRetencion: baseRetencion,
        reteRenta: reteRenta,
        ivaRete1: ccfDocument.resumen.ivaRete1,
        aplica: baseRetencion > minThreshold
      }
    });

    // 🔥 CRÍTICO: Verificar que no haya campos innecesarios en cuerpoDocumento
    const camposNoPermitidosEnItems = ['ivaItem', 'totalItem'];
    finalCuerpoDocumento.forEach((item, index) => {
      camposNoPermitidosEnItems.forEach(campo => {
        if (item[campo] !== undefined) {
          console.error(`🚨 ERROR: Campo no permitido en item ${index + 1}: ${campo}`);
          delete item[campo];
        }
      });
    });

    return ccfDocument;
  };

  // 🔥 NUEVA: Función específica para FC (Tipo 01) - Factura de Consumidor Final
  const prepareFCDocument = (formData, calculations) => {
    console.log('🔧 Preparando documento FC específico...');
    
    // Procesar items específicamente para FC
    let finalCuerpoDocumento = formData.cuerpoDocumento.map((item, index) => {
      const cantidad = item.cantidad || 1;
      const precioUni = item.precioUni || 0;
      const montoDescu = item.montoDescu || 0;
      const ventaTotal = (cantidad * precioUni) - montoDescu;
      const ventaGravada = ventaTotal > 0 ? ventaTotal : 0;
      const ivaItem = ventaGravada * 0.13;
      const totalItem = ventaGravada + ivaItem;

      return {
        numItem: index + 1,
        tipoItem: item.tipoItem || 2,
        uniMedida: parseInt(item.uniMedida) || 59,
        codigo: item.codigo || "",
        descripcion: item.descripcion || "Producto/Servicio",
        cantidad: cantidad,
        precioUni: precioUni,
        montoDescu: montoDescu,
        ventaNoSuj: item.ventaNoSuj !== undefined ? item.ventaNoSuj : 0,
        ventaExenta: item.ventaExenta !== undefined ? item.ventaExenta : 0,
        ventaGravada: Math.round(ventaGravada * 100) / 100,
        tributos: ventaGravada > 0 ? ["20"] : [],
        psv: item.psv !== undefined ? item.psv : 0,
        noGravado: item.noGravado !== undefined ? item.noGravado : 0,
        ivaItem: Math.round(ivaItem * 100) / 100,
        totalItem: Math.round(totalItem * 100) / 100,
        numeroDocumento: null,
        codTributo: null
      };
    });

    // Calcular totales específicos para FC
    const subTotalVentas = finalCuerpoDocumento.reduce((sum, item) => {
      return sum + (item.cantidad * item.precioUni) - item.montoDescu;
    }, 0);
    
    const totalGravada = finalCuerpoDocumento.reduce((sum, item) => {
      return sum + item.ventaGravada;
    }, 0);

    const ivaTotal = totalGravada * 0.13;
    
    // Calcular retención de renta para FC
    let reteRenta = 0;
    let totalPagar = 0;
    let baseRetencion = totalGravada;
    let minThreshold = 100.00;
    let rentaRate = 0.10;
    
    if (calculations && calculations.reteRenta !== undefined) {
      reteRenta = calculations.reteRenta;
      totalPagar = calculations.totalPagar || (subTotalVentas + ivaTotal - reteRenta);
      console.log('✅ FC: Usando retención de renta del hook:', { reteRenta, totalPagar });
    } else {
      if (baseRetencion > minThreshold) {
        reteRenta = Math.round(baseRetencion * rentaRate * 100) / 100;
      }
      totalPagar = subTotalVentas + ivaTotal - reteRenta;
      console.log('🔧 FC: Calculando retención de renta directamente:', { 
        baseRetencion, 
        minThreshold, 
        rentaRate, 
        reteRenta, 
        totalPagar 
      });
    }

    // 🔥 ESTRUCTURA ESPECÍFICA PARA FC - Factura de Consumidor Final
    const fcDocument = {
      identificacion: {
        version: 1,
        ambiente: environment === 'production' ? "01" : "00",
        tipoDte: "01",
        codigoGeneracion: generateUUID(), // ← Único para cada FC
        numeroControl: generateNumeroControl("01"), // ← Único para cada FC
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi: new Date().toISOString().split('T')[0],
        horEmi: new Date().toTimeString().split(' ')[0],
        tipoMoneda: "USD"
      },
      emisor: {
        nit: cleanNIT(formData.emisor?.nit),
        nrc: cleanNRC(formData.emisor?.nrc),
        nombre: formData.emisor?.nombre,
        codActividad: formData.emisor?.codActividad || "",
        descActividad: formData.emisor?.descActividad || "",
        nombreComercial: formData.emisor?.nombreComercial || null,
        tipoEstablecimiento: formData.emisor?.tipoEstablecimiento || "",
        codEstableMH: formData.emisor?.codEstableMH || "",
        codEstable: formData.emisor?.codEstable || "",
        codPuntoVentaMH: formData.emisor?.codPuntoVentaMH || "",
        codPuntoVenta: formData.emisor?.codPuntoVenta || "",
        telefono: formData.emisor?.telefono || getEmisorData().telefono || "",
        correo: formData.emisor?.correo || getEmisorData().correo || "",
        direccion: formData.emisor?.direccion || {
          departamento: "",
          municipio: "",
          complemento: ""
        }
      },
      receptor: {
        // 🔥 FC usa tipoDocumento y numDocumento, NO nit y nrc
        tipoDocumento: formData.receptor?.tipoDocumento || "36", // 36 = DUI
        numDocumento: formData.receptor?.numDocumento || "",
        nombre: formData.receptor?.nombre,
        nombreComercial: formData.receptor?.nombreComercial || "",
        direccion: formData.receptor?.direccion || {
          departamento: "",
          municipio: "",
          complemento: ""
        },
        telefono: formData.receptor?.telefono || "",
        correo: formData.receptor?.correo || ""
      },
      // 🔥 FC NO TIENE: documentoRelacionado, otrosDocumentos, ventaTercero
      cuerpoDocumento: finalCuerpoDocumento,
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: Math.round(totalGravada * 100) / 100,
        subTotalVentas: Math.round(subTotalVentas * 100) / 100,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: ivaTotal > 0 ? [{
          codigo: "20",
          descripcion: "IVA 13%",
          valor: Math.round(ivaTotal * 100) / 100
        }] : [],
        subTotal: Math.round(totalPagar * 100) / 100,
        ivaRete1: Math.round(reteRenta * 100) / 100,
        reteRenta: Math.round(reteRenta * 100) / 100, // ← Campo obligatorio para FC
        totalIva: Math.round(ivaTotal * 100) / 100, // Campo específico para FC
        montoTotalOperacion: Math.round((subTotalVentas + ivaTotal) * 100) / 100,
        totalNoGravado: 0,
        totalPagar: Math.round(totalPagar * 100) / 100,
        totalLetras: numberToWords(totalPagar),
        saldoFavor: 0, // ← Campo obligatorio para FC
        condicionOperacion: 1,
        pagos: [{
          codigo: "01",
          montoPago: Math.round(totalPagar * 100) / 100,
          referencia: null,
          plazo: null,
          periodo: null
        }],
        numPagoElectronico: null
      }
      // 🔥 FC NO TIENE: extension, apendice
    };

    console.log('✅ Documento FC específico preparado:', {
      tipoDte: fcDocument.identificacion.tipoDte,
      secciones: Object.keys(fcDocument),
      camposEspecificos: ['totalIva', 'tipoDocumento', 'numDocumento'],
      camposExcluidos: ['documentoRelacionado', 'otrosDocumentos', 'ventaTercero', 'extension', 'apendice'],
      receptor: {
        tipoDocumento: fcDocument.receptor.tipoDocumento,
        numDocumento: fcDocument.receptor.numDocumento
      }
    });

    return fcDocument;
  };

  // 🔥 NUEVA: Función genérica para otros tipos
  const prepareGenericDocument = (formData, calculations) => {
    const tipoDte = formData?.identificacion?.tipoDte || "01";
    console.log('🔧 Preparando documento genérico...');
    
    console.log('📋 Datos del formulario:', {
      secciones: Object.keys(formData),
      itemsOriginales: formData.cuerpoDocumento?.length || 0
    });
    console.log('🧮 Cálculos disponibles:', {
      itemsProcesados: calculations?.itemsCalculated?.length || 0,
      camposEspecificos: Object.keys(calculations?.dteSpecificFields || {})
    });

    // 🔥 PROCESAR ITEMS - FORZAR campos obligatorios SIEMPRE
    let finalCuerpoDocumento = formData.cuerpoDocumento || [];
    
    // 🆕 SIEMPRE completar los campos obligatorios (no depender del hook)
    console.log('🔧 Completando campos obligatorios del cuerpoDocumento...');
    finalCuerpoDocumento = formData.cuerpoDocumento.map((item, index) => {
      const cantidad = item.cantidad || 1;
      const precioUni = item.precioUni || 0;
      const montoDescu = item.montoDescu || 0;
      const ventaTotal = (cantidad * precioUni) - montoDescu;
      const ventaGravada = ventaTotal > 0 ? ventaTotal : 0;
      const ivaItem = ventaGravada * 0.13;
      const totalItem = ventaGravada + ivaItem;

      const processedItem = {
        ...item,
        // 🔥 CAMPOS OBLIGATORIOS QUE FALTABAN
        numItem: index + 1,
        tipoItem: item.tipoItem || 2,
        // 🔥 CORREGIDO: uniMedida debe ser integer, no string
        uniMedida: parseInt(item.uniMedida) || 59,
        // 🔥 CORREGIDO: Usar nombres correctos según schema
        ventaNoSuj: item.ventaNoSuj !== undefined ? item.ventaNoSuj : 0,
        ventaExenta: item.ventaExenta !== undefined ? item.ventaExenta : 0,
        ventaGravada: item.ventaGravada !== undefined ? item.ventaGravada : Math.round(ventaGravada * 100) / 100,
        // 🔥 CORREGIDO: Tributos debe ser array de strings, no objetos
        tributos: item.tributos || (ventaGravada > 0 ? ["20"] : []),
        psv: item.psv !== undefined ? item.psv : 0,
        noGravado: item.noGravado !== undefined ? item.noGravado : 0,
        // 🔥 CORREGIDO: Agregar campos faltantes críticos
        ivaItem: item.ivaItem !== undefined ? item.ivaItem : Math.round(ivaItem * 100) / 100,
        totalItem: item.totalItem !== undefined ? item.totalItem : Math.round(totalItem * 100) / 100,
        // 🔥 NUEVO: Campos adicionales requeridos
        codigo: item.codigo || "",
        descripcion: item.descripcion || "Producto/Servicio",
        cantidad: item.cantidad || 1,
        precioUni: item.precioUni || 0,
        montoDescu: item.montoDescu || 0,
        // 🔥 CORREGIDO: Agregar campos faltantes críticos
        numeroDocumento: null,
        codTributo: null
      };

      // 🔥 CORREGIDO: Eliminar campos con nombres incorrectos y campos no estándar
      delete processedItem.ventasGravadas;
      delete processedItem.ventasExentas;
      delete processedItem.tipoDocumento;
      delete processedItem.numDocumento;
      delete processedItem.ivaItem;
      delete processedItem.totalItem;
      delete processedItem.totalIva;

      console.log(`📋 Item ${index + 1} procesado:`, {
        descripcion: processedItem.descripcion,
        ventaGravada: processedItem.ventaGravada,
        ventaExenta: processedItem.ventaExenta,
        ventaNoSuj: processedItem.ventaNoSuj,
        psv: processedItem.psv,
        noGravado: processedItem.noGravado,
        tributos: processedItem.tributos?.length || 0,
        camposEliminados: ['ventasGravadas', 'ventasExentas']
      });

      return processedItem;
    });

    // 🆕 Si hay cálculos del hook, mergear algunos campos específicos
    if (calculations?.itemsCalculated && calculations.itemsCalculated.length > 0) {
      console.log('🔄 Mergeando con datos del hook de cálculos...');
      finalCuerpoDocumento = finalCuerpoDocumento.map((item, index) => {
        const calculatedItem = calculations.itemsCalculated[index];
        if (calculatedItem) {
          return {
            ...item,
                    // Sobrescribir con valores calculados si están disponibles
        ventaGravada: calculatedItem.ventaGravada || item.ventaGravada,
        // 🔥 CORREGIDO: No incluir ivaItem y totalItem en el merge (ya se eliminaron)
        tributos: calculatedItem.tributos || item.tributos
          };
        }
        return item;
      });
    }
    
    // ✅ USAR DATOS TAL COMO VIENEN DEL FORMULARIO + CÁLCULOS
    const finalDocument = {
      // ✅ IDENTIFICACIÓN - Completar campos faltantes obligatorios
      identificacion: {
        ...formData.identificacion,
        // 🔥 CORREGIDO: Versión debe ser 3, no 1
        version: 3,
        ambiente: environment === 'production' ? "01" : "00",
        codigoGeneracion: formData.identificacion?.codigoGeneracion || generateUUID(),
        numeroControl: formData.identificacion?.numeroControl || generateNumeroControl(tipoDte),
        horEmi: formData.identificacion?.horEmi || new Date().toTimeString().split(' ')[0],
        // 🔥 CAMPOS OBLIGATORIOS QUE FALTABAN
        tipoContingencia: null,
        motivoContin: null
      },

      // ✅ EMISOR - Completar campos obligatorios según schema
      emisor: {
        ...formData.emisor,
        // 🔥 CORREGIDO: NIT sin guiones (solo números)
        nit: cleanNIT(formData.emisor?.nit),
        // 🔥 CORREGIDO: NRC máximo 8 dígitos
        nrc: cleanNRC(formData.emisor?.nrc),
        // 🔥 CORREGIDO: Usar datos del formulario o valores mínimos válidos
        codActividad: formData.emisor?.codActividad || "",
        tipoEstablecimiento: formData.emisor?.tipoEstablecimiento || "",
        codEstableMH: formData.emisor?.codEstableMH || "",
        codEstable: formData.emisor?.codEstable || "", 
        codPuntoVentaMH: formData.emisor?.codPuntoVentaMH || "",
        codPuntoVenta: formData.emisor?.codPuntoVenta || "",
        // 🔥 CORREGIDO: Agregar campos faltantes críticos desde configuración si no están en formulario
        telefono: formData.emisor?.telefono || getEmisorData().telefono || "",
        correo: formData.emisor?.correo || getEmisorData().correo || ""
      },

      // ✅ RECEPTOR - Mapear campos correctamente según el tipo de DTE
      receptor: {
        ...formData.receptor,
        // 🔥 CORREGIDO: Para CCF (tipo 03), usar nit y nrc directamente
        nit: tipoDte === "03" ? formData.receptor?.nit : formData.receptor?.numDocumento,
        nrc: tipoDte === "03" ? formData.receptor?.nrc : formData.receptor?.nrc,
        // 🔥 CORREGIDO: Asegurar que el complemento tenga al menos 5 caracteres
        direccion: {
          ...formData.receptor?.direccion,
          complemento: formData.receptor?.direccion?.complemento?.trim()?.length >= 5 
            ? formData.receptor.direccion.complemento.trim()
            : "Dirección no especificada"
        }
      },

      // ✅ DOCUMENTOS OPCIONALES - Tal como vienen
      documentoRelacionado: (formData.documentoRelacionado && formData.documentoRelacionado.length > 0) ? formData.documentoRelacionado : null,
      otrosDocumentos: (formData.otrosDocumentos && formData.otrosDocumentos.length > 0) ? formData.otrosDocumentos : null,
      // 🔥 CORREGIDO: ventaTercero debe ser null, no objeto vacío
      ventaTercero: (formData.ventaTercero && Object.keys(formData.ventaTercero).length > 0 && formData.ventaTercero.nit) ? formData.ventaTercero : null,

      // ✅ CUERPO DOCUMENTO - Usar items procesados (con todos los campos obligatorios)
      cuerpoDocumento: finalCuerpoDocumento,

      // ✅ RESUMEN - Mergear datos del formulario + cálculos específicos
      resumen: {
        ...formData.resumen,
        ...calculations?.dteSpecificFields,
        // 🔥 CORREGIDO: Calcular totales correctamente desde cuerpoDocumento
        subTotalVentas: (() => {
          const total = finalCuerpoDocumento.reduce((sum, item) => {
            const cantidad = item.cantidad || 1;
            const precioUni = item.precioUni || 0;
            const montoDescu = item.montoDescu || 0;
            return sum + (cantidad * precioUni) - montoDescu;
          }, 0);
          console.log('🧮 subTotalVentas calculado:', total);
          return total;
        })(),
        subTotal: (() => {
          const total = finalCuerpoDocumento.reduce((sum, item) => {
            return sum + (item.totalItem || 0);
          }, 0);
          console.log('🧮 subTotal calculado:', total);
          return total;
        })(),
        totalPagar: (() => {
          const total = finalCuerpoDocumento.reduce((sum, item) => {
            return sum + (item.totalItem || 0);
          }, 0);
          console.log('🧮 totalPagar calculado:', total);
          return total;
        })(),
        // 🔥 CORREGIDO: Agregar montoTotalOperacion
        montoTotalOperacion: (() => {
          const total = finalCuerpoDocumento.reduce((sum, item) => {
            return sum + (item.totalItem || 0);
          }, 0);
          console.log('🧮 montoTotalOperacion calculado:', total);
          return total;
        })(),
        // 🔥 CORREGIDO: Agregar totalLetras
        totalLetras: (() => {
          const total = finalCuerpoDocumento.reduce((sum, item) => {
            return sum + (item.totalItem || 0);
          }, 0);
          const totalRedondeado = Math.round(total * 100) / 100;
          const letras = `${totalRedondeado.toFixed(2).replace('.', ' ').replace(' ', ' 00/100 DOLARES')}`;
          console.log('🧮 totalLetras calculado:', letras);
          return letras;
        })(),
        // 🔥 CORREGIDO: Calcular IVA automáticamente
        tributos: (() => {
          const ivaTotal = finalCuerpoDocumento.reduce((sum, item) => {
            const ventaGravada = item.ventaGravada || 0;
            return sum + (ventaGravada * 0.13);
          }, 0);
          console.log('🧮 IVA total calculado:', ivaTotal);
          return ivaTotal > 0 ? [{
            codigo: "20",
            descripcion: "Impuesto al Valor Agregado 13%",
            valor: Math.round(ivaTotal * 100) / 100
          }] : [];
        })(),
        // 🔥 CORREGIDO: Pagos con estructura completa
        pagos: calculations?.dteSpecificFields?.pagos?.length > 0 
          ? calculations.dteSpecificFields.pagos.map(pago => {
              // Solo incluir campos con valores válidos
              const pagoLimpio = {
                codigo: pago.codigo,
                montoPago: pago.montoPago
              };
              if (pago.referencia) pagoLimpio.referencia = pago.referencia;
              if (pago.plazo) pagoLimpio.plazo = pago.plazo;
              if (pago.periodo) pagoLimpio.periodo = pago.periodo;
              return pagoLimpio;
            })
          : [{
              codigo: "01", // 01 = Billetes y monedas
              montoPago: (() => {
                const total = finalCuerpoDocumento.reduce((sum, item) => {
                  return sum + (item.totalItem || 0);
                }, 0);
                console.log('🧮 montoPago calculado:', total);
                return total;
              })(),
              // 🔥 CORREGIDO: Agregar campos faltantes con null
              referencia: null,
              plazo: null,
              periodo: null
            }]
      },

      // ✅ CAMPOS OPCIONALES FINALES
      extension: (() => {
        if (!formData.extension) return null;
        
        // 🔥 CORREGIDO: Convertir strings vacíos a null en extension
        const extensionLimpio = {};
        Object.keys(formData.extension).forEach(key => {
          const valor = formData.extension[key];
          extensionLimpio[key] = (valor && valor.toString().trim() !== '') ? valor : null;
        });
        
        console.log('🧹 Extension limpiada:', extensionLimpio);
        return extensionLimpio;
      })(),
      apendice: (formData.apendice && formData.apendice.length > 0) ? formData.apendice : null
    };

    // 🔥 CRÍTICO: ELIMINAR CAMPOS NO PERMITIDOS
    if (finalDocument.items) {
      delete finalDocument.items;
      console.log('🗑️ Eliminado campo "items" duplicado');
    }
    
    // 🔥 CORREGIDO: Eliminar campos no estándar del resumen
    if (finalDocument.resumen) {
      delete finalDocument.resumen.totalIva;
      console.log('🗑️ Eliminado campo "totalIva" no estándar');
    }
    
    // 🔥 CORREGIDO: Eliminar campos no estándar del receptor
    if (finalDocument.receptor) {
      delete finalDocument.receptor.tipoDocumento;
      delete finalDocument.receptor.numDocumento;
      console.log('🗑️ Eliminados campos "tipoDocumento" y "numDocumento" del receptor');
    }

    console.log('✅ Documento final preparado:', {
      tipoDte: finalDocument.identificacion?.tipoDte,
      secciones: Object.keys(finalDocument),
      itemsFinales: finalDocument.cuerpoDocumento?.length,
      pagos: finalDocument.resumen?.pagos?.length || 0,
      camposEmisor: Object.keys(finalDocument.emisor || {}).length,
      primerItemCompleto: finalDocument.cuerpoDocumento?.[0] ? Object.keys(finalDocument.cuerpoDocumento[0]).length : 0,
      // 🔥 CORRECCIONES APLICADAS
      nitEmisor: finalDocument.emisor?.nit,
      nrcEmisor: finalDocument.emisor?.nrc,
      complementoReceptor: finalDocument.receptor?.direccion?.complemento?.length || 0,
      pagosLimpios: finalDocument.resumen?.pagos?.[0] ? Object.keys(finalDocument.resumen.pagos[0]).length : 0,
      // 🔥 VERIFICACIÓN DE CÁLCULOS CRÍTICOS
      resumenCalculos: {
        subTotalVentas: finalDocument.resumen?.subTotalVentas,
        subTotal: finalDocument.resumen?.subTotal,
        totalPagar: finalDocument.resumen?.totalPagar,
        montoTotalOperacion: finalDocument.resumen?.montoTotalOperacion,
        totalLetras: finalDocument.resumen?.totalLetras,
        tributos: finalDocument.resumen?.tributos?.length || 0,
        montoPago: finalDocument.resumen?.pagos?.[0]?.montoPago,
        pagosCompletos: finalDocument.resumen?.pagos?.[0] ? Object.keys(finalDocument.resumen.pagos[0]) : []
      },
      // 🔥 VERIFICACIÓN DE ARRAYS Y STRINGS VACÍOS
      arraysYStrings: {
        documentoRelacionado: finalDocument.documentoRelacionado,
        otrosDocumentos: finalDocument.otrosDocumentos,
        apendice: finalDocument.apendice,
        extension: finalDocument.extension
      },
      ventaTercero: finalDocument.ventaTercero,
      // 🔥 VERIFICACIÓN DE DATOS DEL FORMULARIO
      datosDelFormulario: {
        emisorNit: !!formData.emisor?.nit,
        emisorNrc: !!formData.emisor?.nrc,
        emisorNombre: !!formData.emisor?.nombre,
        receptorNombre: !!formData.receptor?.nombre,
        receptorTipoDoc: !!formData.receptor?.tipoDocumento,
        receptorNumDoc: !!formData.receptor?.numDocumento
      },
      // 🔥 NUEVO: Verificación específica del receptor para CCF
      receptorCCF: {
        nit: finalDocument.receptor?.nit,
        nrc: finalDocument.receptor?.nrc,
        nombre: finalDocument.receptor?.nombre,
        codActividad: finalDocument.receptor?.codActividad,
        descActividad: finalDocument.receptor?.descActividad,
        nombreComercial: finalDocument.receptor?.nombreComercial,
        telefono: finalDocument.receptor?.telefono,
        correo: finalDocument.receptor?.correo,
        direccion: finalDocument.receptor?.direccion
      }
    });

    return finalDocument;
  };

  // 🆕 VALIDACIÓN ESPECÍFICA POR SCHEMA
  const validateAgainstSchema = (document) => {
    const tipoDte = document?.identificacion?.tipoDte;
    const errors = [];
    
    console.log('🔍 Validando documento contra schema para tipo:', tipoDte);
    
    // Validaciones comunes obligatorias
    if (!document.identificacion) errors.push("identificacion es requerida");
    if (!document.emisor) errors.push("emisor es requerido");
    if (!document.receptor) errors.push("receptor es requerido");
    if (!document.cuerpoDocumento || !Array.isArray(document.cuerpoDocumento)) {
      errors.push("cuerpoDocumento debe ser un array");
    }
    if (!document.resumen) errors.push("resumen es requerido");

    // Validaciones específicas por tipo
    switch (tipoDte) {
      case "01": // Factura de Consumidor
        return validateFacturaConsumidor(document, errors);
      case "03": // CCF
        return validateCCF(document, errors);
      case "14": // FSE
        return validateFSE(document, errors);
      default:
        return { isValid: errors.length === 0, errors };
    }
  };

  const validateFacturaConsumidor = (doc, errors = []) => {
    console.log('🔍 Validando Factura de Consumidor...');
    
    // Validar campos obligatorios del resumen según fe-fc-v1.json
    const requiredResumenFields = [
      'totalNoSuj', 'totalExenta', 'totalGravada', 'subTotalVentas',
      'descuNoSuj', 'descuExenta', 'descuGravada', 'porcentajeDescuento',
      'totalDescu', 'tributos', 'subTotal', 'ivaRete1', 'reteRenta',
      'montoTotalOperacion', 'totalNoGravado', 'totalPagar', 'totalLetras',
      'totalIva', 'saldoFavor', 'condicionOperacion', 'pagos', 'numPagoElectronico'
    ];

    requiredResumenFields.forEach(field => {
      if (doc.resumen[field] === undefined) {
        errors.push(`resumen.${field} es obligatorio para FC`);
      }
    });

    // Validar items del cuerpo
    if (doc.cuerpoDocumento && Array.isArray(doc.cuerpoDocumento)) {
      doc.cuerpoDocumento.forEach((item, index) => {
        const requiredItemFields = [
          'numItem', 'tipoItem', 'cantidad', 'precioUni', 'ventaNoSuj',
          'ventaExenta', 'ventaGravada', 'tributos', 'psv', 'noGravado',
          'ivaItem', 'totalItem'
        ];
        
        requiredItemFields.forEach(field => {
          if (item[field] === undefined) {
            errors.push(`cuerpoDocumento[${index}].${field} es obligatorio para FC`);
          }
        });

        // Validar que tributos sea un array
        if (item.tributos && !Array.isArray(item.tributos)) {
          errors.push(`cuerpoDocumento[${index}].tributos debe ser un array`);
        }
      });
    }

    // Validar que pagos tenga al menos un elemento
    if (!doc.resumen.pagos || !Array.isArray(doc.resumen.pagos) || doc.resumen.pagos.length === 0) {
      errors.push("resumen.pagos debe tener al menos un pago para FC");
    }

    // Validar campos obligatorios del emisor
    const requiredEmisorFields = ['nit', 'nrc', 'nombre', 'codActividad', 'descActividad', 'direccion'];
    requiredEmisorFields.forEach(field => {
      if (!doc.emisor[field]) {
        errors.push(`emisor.${field} es obligatorio para FC`);
      }
    });

    console.log('📊 Resultado validación FC:', {
      erroresEncontrados: errors.length,
      primeros3Errores: errors.slice(0, 3)
    });

    return { isValid: errors.length === 0, errors };
  };

  const validateCCF = (doc, errors = []) => {
    console.log('🔍 Validando CCF:', {
      receptorNrc: !!doc.receptor?.nrc,
      receptorNit: !!doc.receptor?.nit,
      receptorNombre: !!doc.receptor?.nombre,
      ivaPerci1: doc.resumen?.ivaPerci1,
      tieneResumen: !!doc.resumen
    });
    
    // Validaciones específicas para CCF
    if (!doc.receptor?.nit) {
      errors.push("receptor.nit es obligatorio para CCF");
    }
    
    if (!doc.receptor?.nrc) {
      errors.push("receptor.nrc es obligatorio para CCF");
    }
    
    // 🔥 CORREGIDO: No validar ivaPerci1 en el paso 1, se calcula en el paso 2
    // if (doc.resumen && typeof doc.resumen.ivaPerci1 === 'undefined') {
    //   errors.push("resumen.ivaPerci1 es obligatorio para CCF");
    // }

    console.log('🔍 Errores de validación CCF:', errors);
    return { isValid: errors.length === 0, errors };
  };

  const validateFSE = (doc, errors = []) => {
    // Validaciones específicas para FSE
    if (doc.resumen && typeof doc.resumen.totalCompra === 'undefined') {
      errors.push("resumen.totalCompra es obligatorio para FSE");
    }

    return { isValid: errors.length === 0, errors };
  };

  // HANDLERS SIMPLIFICADOS
  const handleDTEDataChange = useCallback((data, validation = null) => {
    console.log('📥 Datos del formulario recibidos:', {
      tipoDte: data?.identificacion?.tipoDte,
      secciones: Object.keys(data || {}),
      itemsCount: data?.cuerpoDocumento?.length || 0,
      validacion: validation?.isValid,
      validation: validation
    });

    // ✅ USAR DATOS TAL COMO VIENEN - sin reprocesar
    setDteData(prevData => {
      // 🆕 MERGEAR inteligentemente para preservar datos existentes
      const mergedData = {
        ...prevData, // Datos anteriores
        ...data,     // Nuevos datos del formulario
        // Preservar campos calculados si existen
        ...(prevData?.resumen && calculations?.dteSpecificFields && {
          resumen: {
            ...prevData.resumen,
            ...data.resumen,
            ...calculations.dteSpecificFields
          }
        })
      };
      
      console.log('🔄 Datos mergeados:', {
        datosAnteriores: Object.keys(prevData || {}),
        datosNuevos: Object.keys(data || {}),
        resultadoFinal: Object.keys(mergedData || {})
      });
      
      return mergedData;
    });
    
    if (validation) {
      setFormValidation(validation);
    }
  }, [calculations]);

  const handleCalculationChange = useCallback((calcs) => {
    console.log('🧮 Cálculos del hook recibidos:', {
      tipoDte: calcs?.tipoDte,
      itemsConEstructuraCompleta: calcs?.itemsCalculated?.length || 0,
      camposEspecificos: Object.keys(calcs?.dteSpecificFields || {}),
      totalPagar: calcs?.totalPagar,
      pagosGenerados: calcs?.dteSpecificFields?.pagos?.length || 0
    });

    setCalculations(calcs);
    
    // 🆕 ACTUALIZAR dteData con los cálculos para preservarlos
    if (calcs && dteData) {
      setDteData(prevData => ({
        ...prevData,
        // Actualizar items con los calculados
        cuerpoDocumento: calcs.itemsCalculated || prevData.cuerpoDocumento,
        // Actualizar resumen con campos específicos
        resumen: {
          ...prevData.resumen,
          ...calcs.dteSpecificFields
        }
      }));
    }
  }, [dteData]);

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

  // Validar si se puede avanzar al siguiente paso
  const canProceedToNextStep = useCallback((currentStep) => {
    console.log('🔍 Verificando si se puede avanzar al paso', currentStep, {
      tieneDteData: !!dteData,
      formValidationIsValid: formValidation.isValid,
      tieneCalculations: !!calculations,
      tieneSignedDocument: !!signedDocument,
      formValidation: formValidation
    });
    
    switch (currentStep) {
      case 1:
        const canProceedStep1 = dteData && formValidation.isValid;
        console.log('🔍 ¿Puede avanzar al paso 1?', canProceedStep1);
        return canProceedStep1;
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

  // Obtener texto del botón continuar
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

  // GENERAR JSON FINAL
  const handleGenerateJSON = () => {
    if (!dteData) {
      alert('No hay datos para generar JSON');
      return;
    }

    // 🔥 NUEVO: Verificar y configurar datos de empresa si faltan
    let emisorData = getEmisorData();
    if (!emisorData.telefono || !emisorData.correo) {
      console.warn('⚠️ Datos de empresa incompletos. Configurando valores por defecto...');
      
      // Configurar valores por defecto si no están en localStorage
      const savedConfig = localStorage.getItem('empresaConfig');
      let currentConfig = savedConfig ? JSON.parse(savedConfig) : {};
      
      if (!currentConfig.telefono) {
        currentConfig.telefono = "+503 2222-3333";
        console.log('📞 Configurando teléfono por defecto:', currentConfig.telefono);
      }
      
      if (!currentConfig.correo) {
        currentConfig.correo = "facturacion@empresa.com";
        console.log('📧 Configurando correo por defecto:', currentConfig.correo);
      }
      
      // Guardar configuración actualizada
      localStorage.setItem('empresaConfig', JSON.stringify(currentConfig));
      console.log('✅ Configuración de empresa actualizada');
      
      // Recargar datos del emisor después de actualizar configuración
      emisorData = getEmisorData();
    }

    // 🔥 VALIDAR CAMPOS OBLIGATORIOS ANTES DE GENERAR
    const tipoDte = dteData?.identificacion?.tipoDte || "01";
    
    // 🔥 CORREGIDO: Cargar datos del emisor desde configuración si no están en el formulario
    const emisorFormData = dteData.emisor || {};
    
    console.log('🔍 Datos del emisor cargados:', {
      configuracion: emisorData,
      formulario: emisorFormData,
      telefonoConfig: emisorData.telefono,
      correoConfig: emisorData.correo,
      telefonoForm: emisorFormData.telefono,
      correoForm: emisorFormData.correo
    });
    
    const camposObligatorios = {
      'emisor.nit': emisorFormData.nit || emisorData.nit,
      'emisor.nrc': emisorFormData.nrc || emisorData.nrc,
      'emisor.nombre': emisorFormData.nombre || emisorData.nombre,
      'emisor.telefono': emisorFormData.telefono || emisorData.telefono,
      'emisor.correo': emisorFormData.correo || emisorData.correo,
      'receptor.nombre': dteData.receptor?.nombre,
    };
    
    // 🔥 CORREGIDO: Validar campos específicos según el tipo de DTE
    if (tipoDte === "03") {
      // Para CCF, validar nit y nrc del receptor
      camposObligatorios['receptor.nit'] = dteData.receptor?.nit;
      camposObligatorios['receptor.nrc'] = dteData.receptor?.nrc;
    } else {
      // Para otros tipos, validar tipoDocumento y numDocumento
      camposObligatorios['receptor.tipoDocumento'] = dteData.receptor?.tipoDocumento;
      camposObligatorios['receptor.numDocumento'] = dteData.receptor?.numDocumento;
    }

    console.log('🔍 Validando campos obligatorios para tipo DTE:', tipoDte);
    console.log('📋 Campos a validar:', camposObligatorios);
    
    const camposFaltantes = Object.entries(camposObligatorios)
      .filter(([_, valor]) => !valor || valor.trim() === '')
      .map(([campo, _]) => campo);

    if (camposFaltantes.length > 0) {
      console.error('❌ Campos faltantes detectados:', camposFaltantes);
      alert(`❌ Campos obligatorios faltantes:\n\n${camposFaltantes.join('\n')}\n\nPor favor, complete estos campos en el formulario.`);
      return;
    }
    
    console.log('✅ Todos los campos obligatorios están completos');

    console.log('🔧 Generando JSON final...');
    console.log('📋 Datos base del formulario:', {
      tipoDte: dteData?.identificacion?.tipoDte,
      itemsOriginales: dteData?.cuerpoDocumento?.length
    });
    console.log('🧮 Cálculos disponibles:', {
      itemsProcesados: calculations?.itemsCalculated?.length,
      camposEspecificos: Object.keys(calculations?.dteSpecificFields || {})
    });

    // ✅ USAR FUNCIÓN SIMPLIFICADA
    const finalDocument = prepareFinalDocument(dteData, calculations);
    
    if (!finalDocument) {
      alert('Error generando el documento final');
      return;
    }

    // 🔥 NUEVO: Generar identificadores únicos para cada factura
    const timestamp = new Date().getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueId = `${timestamp}-${randomSuffix}`;
    
    // 🔥 CORREGIDO: Asegurar que cada JSON sea completamente independiente
    finalDocument.identificacion.codigoGeneracion = generateUUID();
    finalDocument.identificacion.numeroControl = generateNumeroControl(tipoDte);
    finalDocument.identificacion.fecEmi = new Date().toISOString().split('T')[0];
    finalDocument.identificacion.horEmi = new Date().toTimeString().split(' ')[0];
    
    // 🔥 CRÍTICO: Verificar que no haya referencias compartidas
    console.log('🔢 Número de control generado:', finalDocument.identificacion.numeroControl);
    console.log('🆔 UUID generado:', finalDocument.identificacion.codigoGeneracion);
    console.log('📅 Fecha y hora:', finalDocument.identificacion.fecEmi, finalDocument.identificacion.horEmi);
    console.log('🔒 JSON completamente independiente generado');

    // 🔥 NUEVO: Log detallado del documento antes de validar
    console.log('🔍 Documento final antes de validación:', {
      tipoDte: finalDocument.identificacion?.tipoDte,
      receptor: {
        nit: finalDocument.receptor?.nit,
        nrc: finalDocument.receptor?.nrc,
        nombre: finalDocument.receptor?.nombre,
        codActividad: finalDocument.receptor?.codActividad,
        descActividad: finalDocument.receptor?.descActividad,
        nombreComercial: finalDocument.receptor?.nombreComercial,
        telefono: finalDocument.receptor?.telefono,
        correo: finalDocument.receptor?.correo,
        direccion: finalDocument.receptor?.direccion
      },
      emisor: {
        nit: finalDocument.emisor?.nit,
        nrc: finalDocument.emisor?.nrc,
        nombre: finalDocument.emisor?.nombre
      },
      items: finalDocument.cuerpoDocumento?.length || 0,
      resumen: Object.keys(finalDocument.resumen || {})
    });

    // Validar documento contra schema
    const validation = validateAgainstSchema(finalDocument);
    if (!validation.isValid) {
      console.error('❌ Errores de validación contra schema:', validation.errors);
      const errorMsg = `Errores de validación:\n\n${validation.errors.join('\n')}`;
      alert(errorMsg);
      
      // Mostrar en consola para debugging
      console.error('📄 Documento con errores:', finalDocument);
      return;
    }

    const jsonString = JSON.stringify(finalDocument, null, 2);
    setGeneratedJSON(jsonString);
    
    console.log('✅ JSON generado exitosamente:', {
      tipoDte: finalDocument.identificacion?.tipoDte,
      secciones: Object.keys(finalDocument),
      itemsFinales: finalDocument.cuerpoDocumento?.length,
      tamano: `${Math.round(jsonString.length / 1024)}KB`,
      camposResumen: Object.keys(finalDocument.resumen || {})
    });
    
    // Log específico para debugging de campos críticos
    if (finalDocument.cuerpoDocumento?.[0]) {
      console.log('🔍 Primer item procesado:', {
        psv: finalDocument.cuerpoDocumento[0].psv,
        noGravado: finalDocument.cuerpoDocumento[0].noGravado,
        tributos: finalDocument.cuerpoDocumento[0].tributos,
        tieneDescripcion: !!finalDocument.cuerpoDocumento[0].descripcion
      });
    }
    
    if (finalDocument.resumen) {
      console.log('🔍 Resumen procesado:', {
        numPagoElectronico: finalDocument.resumen.numPagoElectronico,
        pagos: finalDocument.resumen.pagos?.length || 0,
        totalLetras: !!finalDocument.resumen.totalLetras
      });
    }
  };

  // FUNCIONES EXISTENTES
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

  const handlePrintPreview = () => {
    handlePrintDirect();
  };

  const handlePrintDirect = () => {
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

    // Merge de emisor: config + formulario
    const emisorBase = getEmisorData();
    const emisorUser = dteData.emisor || {};
    const emisorMerged = { ...emisorBase };
    Object.keys(emisorBase).forEach(key => {
      emisorMerged[key] = (emisorUser[key] !== undefined && emisorUser[key] !== null && emisorUser[key] !== "") ? emisorUser[key] : emisorBase[key];
    });

    // Merge de receptor
    const receptorUser = dteData.receptor || {};
    let nombreReceptor = receptorUser.nombre || receptorUser.razonSocial || receptorUser.nombreComercial || receptorUser.nombreReceptor || "RECEPTOR SIN NOMBRE";
    const receptorMerged = { ...receptorUser, nombre: nombreReceptor };

    // Asegurar que el array de productos no sea undefined
    let items = dteData.cuerpoDocumento || dteData.items || [];
    if (!Array.isArray(items)) items = [];

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

    return previewData;
  };

  const downloadDTEJson = () => {
    if (!generatedJSON) {
      alert('Primero debe generar el JSON');
      return;
    }

    // 🔥 CORREGIDO: Generar nombre único para cada factura
    const tipoDte = getCurrentDteType();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const fileName = `DTE-${tipoDte.padStart(2, '0')}-${timestamp}-${randomSuffix}.json`;

    const dataBlob = new Blob([generatedJSON], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 JSON descargado:', fileName);
  };

  // Helper functions
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  };

  const generateNumeroControl = (tipoDte) => {
    // 🔥 CORREGIDO: Generar establecimiento alfanumérico (8 caracteres)
    const establecimiento = Math.random().toString(36).substring(2, 10).toUpperCase();
    const correlativo = "000000000000001";
    // 🔥 CORREGIDO: Usar el formato correcto según el tipo de DTE
    return `DTE-${tipoDte.padStart(2, '0')}-${establecimiento}-${correlativo}`;
  };

  // 🔥 FUNCIÓN HELPER: Limpiar NIT (solo números)
  const cleanNIT = (nit) => {
    if (!nit) return ""; // 🔥 CORREGIDO: No usar valores quemados
    return nit.replace(/[^0-9]/g, '');
  };

  // 🔥 FUNCIÓN HELPER: Limpiar NRC (máximo 8 dígitos)
  const cleanNRC = (nrc) => {
    if (!nrc) return ""; // 🔥 CORREGIDO: No usar valores quemados
    return nrc.replace(/[^0-9]/g, '').substring(0, 8);
  };

  // Renderizar indicador de paso
  const renderStepIndicator = () => (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex flex-col items-center flex-1 min-w-0">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mb-1 ${activeStep >= step.number
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-400'
              }`}
          >
            <step.icon className="w-5 h-5" />
          </div>
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
    <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        {/* Header y ambiente */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Gestión de Documentos Tributarios Electrónicos
            </h1>
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
            <button
              onClick={() => setShowEmpresaConfig(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Building className="w-4 h-4" />
              Configurar Empresa
            </button>
            
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="test">Ambiente de Pruebas</option>
              <option value="production">Ambiente de Producción</option>
            </select>
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
              {console.log('🔄 Renderizando paso 1 con datos:', {
                dteDataExists: !!dteData,
                tipoDte: dteData?.identificacion?.tipoDte,
                receptor: dteData?.receptor?.nombre ? '✅ Completado' : '❌ Faltante',
                emisor: dteData?.emisor?.nombre ? '✅ Completado' : '❌ Faltante',
                items: dteData?.cuerpoDocumento?.length || 0
              })}
              <DteFormContainer
                onDataChange={handleDTEDataChange}
                initialData={dteData} // 🔥 SIEMPRE pasar los datos actuales
                tipoDte={dteData?.identificacion?.tipoDte} // 🆕 Pasar tipo específico
              />
              
              {/* Mostrar información del tipo de DTE actual */}
              {dteData?.identificacion?.tipoDte && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    📋 Tipo de DTE: {dteData.identificacion.tipoDte}
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• <strong>Secciones cargadas:</strong> {Object.keys(dteData).join(', ')}</div>
                    <div>• <strong>Items:</strong> {dteData.cuerpoDocumento?.length || 0}</div>
                    <div>• <strong>Validación:</strong> {formValidation.isValid ? '✅ Válido' : '⚠️ Pendiente'}</div>
                    {/* 🆕 INFO ADICIONAL para debugging */}
                    <div>• <strong>Receptor:</strong> {dteData.receptor?.nombre ? '✅ Completado' : '❌ Faltante'}</div>
                    <div>• <strong>Cálculos:</strong> {calculations ? '✅ Realizados' : '❌ Pendientes'}</div>
                  </div>
                </div>
              )}
              
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

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Volver
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
                      // 🆕 MEJORADO: Reiniciar proceso completo
                      console.log('🔄 Iniciando nuevo DTE...');
                      setActiveStep(1);
                      setDteData(null);
                      setSignedDocument(null);
                      setQrData(null);
                      setCalculations(null);
                      setSubmissionResult(null);
                      setGeneratedJSON('');
                      setFormValidation({
                        isValid: false,
                        missingFields: [],
                        errors: {}
                      });
                      console.log('✅ Estado reiniciado para nuevo DTE');
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
                onClick={downloadDTEJson}
                disabled={!generatedJSON}
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
          
          {/* JSON Generado */}
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