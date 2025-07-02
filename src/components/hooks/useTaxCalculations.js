// src/hooks/useTaxCalculations.js
import { useState, useEffect, useCallback } from 'react';

export const useTaxCalculations = () => {
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    descuentos: 0,
    subTotalVentas: 0,
    iva: 0,
    reteRenta: 0,
    montoTotalOperacion: 0,
    totalPagar: 0
  });

  // 🆕 REGLAS ESPECÍFICAS POR TIPO DTE según schemas oficiales
  const DTE_RULES = {
    // FC - Factura de Consumidor
    "01": {
      name: "Factura de Consumidor",
      structure: "resumen",
      iva: { applies: true, rate: 0.13, field: "totalIva" },
      retencion: { applies: true, rate: 0.10, field: "ivaRete1", minThreshold: 100.00 },
      minAmount: 10.95, // $10.95 mínimo
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj", "totalIva", "ivaRete1"],
      calculations: {
        totalGravada: true,
        totalExenta: true, 
        totalNoSuj: true,
        totalIva: true,
        ivaRete1: true,
        totalPagar: true
      }
    },
    
    // CCF - Comprobante de Crédito Fiscal  
    "03": {
      name: "Comprobante de Crédito Fiscal",
      structure: "resumen",
      iva: { applies: true, rate: 0.13, field: "totalIva" },
      retencion: { applies: true, rate: 0.10, field: "ivaRete1", minThreshold: 100.00 },
      minAmount: 0.01, // Mayor que 0
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj", "ivaPerci1", "ivaRete1"],
      calculations: {
        totalGravada: true,
        totalExenta: true,
        totalNoSuj: true,
        ivaPerci1: true, // Campo específico de CCF
        ivaRete1: true,
        totalPagar: true
      }
    },

    // NC - Nota de Crédito
    "05": {
      name: "Nota de Crédito", 
      structure: "resumen",
      iva: { applies: true, rate: 0.13, field: "totalIva" },
      retencion: { applies: true, rate: 0.10, field: "ivaRete1", minThreshold: 100.00 },
      minAmount: 0.01,
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj", "ivaPerci1", "ivaRete1"],
      calculations: {
        totalGravada: true,
        totalExenta: true,
        totalNoSuj: true,
        ivaPerci1: true, // Como CCF
        ivaRete1: true,
        totalPagar: true
      }
    },

    // ND - Nota de Débito
    "06": {
      name: "Nota de Débito",
      structure: "resumen", 
      iva: { applies: true, rate: 0.13, field: "totalIva" },
      retencion: { applies: true, rate: 0.10, field: "ivaRete1", minThreshold: 100.00 },
      minAmount: 0.01,
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj", "ivaPerci1", "ivaRete1"],
      calculations: {
        totalGravada: true,
        totalExenta: true,
        totalNoSuj: true,
        ivaPerci1: true, // Como CCF
        ivaRete1: true,
        totalPagar: true
      }
    },

    // FSE - Factura de Sujeto Excluido
    "14": {
      name: "Factura de Sujeto Excluido",
      structure: "resumen",
      iva: { applies: false, rate: 0, field: null },
      retencion: { applies: false, rate: 0, field: null },
      minAmount: 0,
      requiredFields: ["totalCompra", "ivaRete1"], // Estructura específica FSE
      calculations: {
        totalCompra: true, // En lugar de totalGravada
        ivaRete1: true, // Siempre 0 pero presente
        totalPagar: true
      }
    },

    // FEX - Factura de Exportación
    "11": {
      name: "Factura de Exportación", 
      structure: "resumen",
      iva: { applies: false, rate: 0, field: null },
      retencion: { applies: false, rate: 0, field: null },
      minAmount: 100.00, // $100 mínimo para exportación
      requiredFields: ["totalGravada"],
      calculations: {
        totalGravada: true, // Tiene totalGravada pero sin IVA
        totalPagar: true
      }
    },

    // CR - Comprobante de Retención
    "07": {
      name: "Comprobante de Retención",
      structure: "hibrida",
      iva: { applies: false, rate: 0, field: null },
      retencion: { applies: true, rate: 0.10, field: "totalIVAretenido", minThreshold: 0.01 },
      minAmount: 0.01,
      requiredFields: ["totalSujetoRetencion", "totalIVAretenido"],
      calculations: {
        totalSujetoRetencion: true,
        totalIVAretenido: true
      }
    },

    // NR - Nota de Remisión  
    "04": {
      name: "Nota de Remisión",
      structure: "resumen",
      iva: { applies: false, rate: 0, field: null },
      retencion: { applies: false, rate: 0, field: null },
      minAmount: 0,
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj"],
      calculations: {
        totalGravada: true, // Para control, sin IVA
        totalExenta: true,
        totalNoSuj: true
        // No tiene totalPagar
      }
    },

    // CD - Comprobante de Donación
    "15": {
      name: "Comprobante de Donación",
      structure: "resumen",
      iva: { applies: false, rate: 0, field: null },
      retencion: { applies: false, rate: 0, field: null },
      minAmount: 0,
      requiredFields: ["valorTotal"],
      calculations: {
        valorTotal: true // Estructura ultra simple
      }
    },

    // DCL - Documento Contable de Liquidación
    "09": {
      name: "Documento Contable de Liquidación",
      structure: "cuerpoDocumento", // Estructura diferente
      iva: { applies: true, rate: 0.02, field: "ivaPercibido" }, // 2% específico
      retencion: { applies: false, rate: 0, field: null },
      minAmount: 0,
      requiredFields: ["subTotal", "iva", "ivaPercibido", "ivaComision"],
      calculations: {
        subTotal: true,
        iva: true,
        ivaPercibido: true, // 2% fijo
        ivaComision: true // Campo único
      }
    },

    // CL - Comprobante de Liquidación
    "08": {
      name: "Comprobante de Liquidación", 
      structure: "resumen",
      iva: { applies: true, rate: 0.13, field: "ivaPerci" }, // ivaPerci (no ivaPerci1)
      retencion: { applies: true, rate: 0.10, field: "ivaRete1", minThreshold: 100.00 },
      minAmount: 0,
      allowNegative: true, // Permite valores negativos
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj", "totalExportacion"],
      calculations: {
        totalGravada: true,
        totalExenta: true, 
        totalNoSuj: true,
        totalExportacion: true, // Campo único
        ivaPerci: true, // Diferente a ivaPerci1
        total: true // En lugar de totalPagar
      }
    }
  };

  // Constantes generales (mantenidas por compatibilidad)
  const IVA_RATE = 0.13; // 13%
  const RENTA_RATE = 0.10; // 10% retención de renta
  const MIN_RENTA_THRESHOLD = 100.00; // Umbral mínimo para retención

  // Función para redondear según reglas de El Salvador
  const roundMoney = useCallback((amount) => {
    return Math.round(amount * 100) / 100;
  }, []);

  // 🆕 Obtener reglas específicas por tipo DTE
  const getDteRules = useCallback((tipoDte) => {
    return DTE_RULES[tipoDte] || DTE_RULES["01"]; // Default a FC si no se encuentra
  }, []);

  // 🆕 Validar monto mínimo según tipo DTE
  const validateMinAmount = useCallback((tipoDte, amount) => {
    const rules = getDteRules(tipoDte);
    if (rules.minAmount && amount < rules.minAmount) {
      return {
        isValid: false,
        error: `El monto mínimo para ${rules.name} es $${rules.minAmount.toFixed(2)}`
      };
    }
    return { isValid: true };
  }, [getDteRules]);

  // Calcular impuestos para un ítem individual (actualizado)
  const calculateItemTax = useCallback((item, tipoDte = "01") => {
    const { cantidad, precioUni, montoDescu = 0, noGravado = false } = item;
    const rules = getDteRules(tipoDte);
    
    const subtotalItem = cantidad * precioUni;
    const descuentoItem = montoDescu;
    const ventasItem = subtotalItem - descuentoItem;
    
    let ivaItem = 0;
    if (!noGravado && ventasItem > 0 && rules.iva.applies) {
      ivaItem = roundMoney(ventasItem * rules.iva.rate);
    }
    
    return {
      ...item,
      ventasGravadas: (!noGravado && rules.iva.applies) ? roundMoney(ventasItem) : 0,
      ventasExentas: (noGravado || !rules.iva.applies) ? roundMoney(ventasItem) : 0,
      ivaItem: ivaItem,
      totalItem: roundMoney(ventasItem + ivaItem)
    };
  }, [roundMoney, getDteRules]);

  // 🆕 Calcular totales específicos por tipo DTE
  const calculateDocumentTotals = useCallback((items, options = {}) => {
    const {
      descuentoGlobal = 0,
      aplicarRetencion = false,
      tipoDte = "01"
    } = options;

    const rules = getDteRules(tipoDte);

    if (!items || items.length === 0) {
      return {
        tipoDte,
        dteName: rules.name,
        subtotal: 0,
        descuentos: 0,
        subTotalVentas: 0,
        ventasGravadas: 0,
        ventasExentas: 0,
        iva: 0,
        reteRenta: 0,
        montoTotalOperacion: 0,
        totalPagar: 0,
        itemsCalculated: [],
        dteSpecificFields: {}
      };
    }

    // Calcular cada ítem
    const itemsCalculated = items.map(item => calculateItemTax(item, tipoDte));
    
    // Cálculos base
    const subtotal = roundMoney(
      itemsCalculated.reduce((sum, item) => sum + (item.cantidad * item.precioUni), 0)
    );
    
    const descuentosItems = roundMoney(
      itemsCalculated.reduce((sum, item) => sum + (item.montoDescu || 0), 0)
    );
    
    const totalDescuentos = roundMoney(descuentosItems + descuentoGlobal);
    const subTotalVentas = roundMoney(subtotal - totalDescuentos);
    
    const ventasGravadas = roundMoney(
      itemsCalculated.reduce((sum, item) => sum + item.ventasGravadas, 0)
    );
    
    const ventasExentas = roundMoney(
      itemsCalculated.reduce((sum, item) => sum + item.ventasExentas, 0)
    );

    // 🆕 Cálculos específicos por tipo DTE
    let iva = 0;
    let reteRenta = 0;
    let montoTotalOperacion = 0;
    let totalPagar = 0;
    const dteSpecificFields = {};

    // Calcular IVA según reglas del tipo
    if (rules.iva.applies) {
      iva = roundMoney(ventasGravadas * rules.iva.rate);
    }

    // Calcular retención según reglas del tipo  
    if (rules.retencion.applies && aplicarRetencion) {
      const baseRetencion = subTotalVentas;
      if (baseRetencion >= (rules.retencion.minThreshold || 0)) {
        reteRenta = roundMoney(baseRetencion * rules.retencion.rate);
      }
    }

    // Cálculos según estructura específica del DTE
    switch (tipoDte) {
      case "01": // FC - Factura de Consumidor
        montoTotalOperacion = roundMoney(subTotalVentas + iva);
        totalPagar = roundMoney(montoTotalOperacion - reteRenta);
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        dteSpecificFields.totalIva = iva;
        dteSpecificFields.ivaRete1 = reteRenta;
        break;

      case "03": // CCF - Comprobante de Crédito Fiscal
      case "05": // NC - Nota de Crédito  
      case "06": // ND - Nota de Débito
        montoTotalOperacion = roundMoney(subTotalVentas + iva);
        totalPagar = roundMoney(montoTotalOperacion - reteRenta);
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        dteSpecificFields.ivaPerci1 = iva; // Campo específico CCF/NC/ND
        dteSpecificFields.ivaRete1 = reteRenta;
        break;

      case "14": // FSE - Factura de Sujeto Excluido
        montoTotalOperacion = subTotalVentas;
        totalPagar = subTotalVentas;
        dteSpecificFields.totalCompra = subTotalVentas;
        dteSpecificFields.ivaRete1 = 0; // Siempre 0 pero presente
        break;

      case "11": // FEX - Factura de Exportación
        montoTotalOperacion = subTotalVentas;
        totalPagar = subTotalVentas;
        dteSpecificFields.totalGravada = ventasGravadas; // Tiene totalGravada sin IVA
        break;

      case "07": // CR - Comprobante de Retención
        dteSpecificFields.totalSujetoRetencion = subTotalVentas;
        dteSpecificFields.totalIVAretenido = reteRenta;
        // CR no tiene totalPagar
        break;

      case "04": // NR - Nota de Remisión
        montoTotalOperacion = subTotalVentas;
        // NR no tiene totalPagar
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        break;

      case "15": // CD - Comprobante de Donación
        dteSpecificFields.valorTotal = subTotalVentas;
        break;

      case "09": // DCL - Documento Contable de Liquidación
        dteSpecificFields.subTotal = subTotalVentas;
        dteSpecificFields.iva = iva;
        dteSpecificFields.ivaPercibido = roundMoney(subTotalVentas * 0.02); // 2% fijo
        dteSpecificFields.ivaComision = 0; // Calcular según reglas específicas
        break;

      case "08": // CL - Comprobante de Liquidación
        montoTotalOperacion = roundMoney(subTotalVentas + iva);
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        dteSpecificFields.totalExportacion = 0; // Campo específico CL
        dteSpecificFields.ivaPerci = iva; // ivaPerci (no ivaPerci1)
        dteSpecificFields.total = montoTotalOperacion; // total (no totalPagar)
        break;

      default:
        // Fallback a FC
        montoTotalOperacion = roundMoney(subTotalVentas + iva);
        totalPagar = roundMoney(montoTotalOperacion - reteRenta);
    }

    return {
      tipoDte,
      dteName: rules.name,
      subtotal,
      descuentos: totalDescuentos,
      subTotalVentas,
      ventasGravadas,
      ventasExentas,
      iva,
      reteRenta,
      montoTotalOperacion,
      totalPagar,
      itemsCalculated,
      dteSpecificFields,
      rules
    };
  }, [calculateItemTax, roundMoney, getDteRules]);

  // 🆕 Generar resumen de tributos actualizado
  const generateTributos = useCallback((calculations) => {
    const tributos = [];
    const { tipoDte, iva, reteRenta } = calculations;
    const rules = getDteRules(tipoDte);
    
    if (iva > 0 && rules.iva.applies) {
      const ivaPercent = (rules.iva.rate * 100).toFixed(0);
      tributos.push({
        codigo: "20",
        descripcion: `Impuesto al Valor Agregado ${ivaPercent}%`,
        valor: iva
      });
    }
    
    if (reteRenta > 0 && rules.retencion.applies) {
      const retPercent = (rules.retencion.rate * 100).toFixed(0);
      tributos.push({
        codigo: "D1", 
        descripcion: `Retención ${retPercent}%`,
        valor: reteRenta
      });
    }

    // Tributos específicos por tipo
    if (tipoDte === "09" && calculations.dteSpecificFields?.ivaPercibido > 0) {
      tributos.push({
        codigo: "C3",
        descripcion: "IVA Percibido 2%",
        valor: calculations.dteSpecificFields.ivaPercibido
      });
    }
    
    return tributos;
  }, [getDteRules]);

  // 🆕 Validar cálculos específicos por tipo DTE  
  const validateCalculations = useCallback((calcs) => {
    const errors = [];
    const { tipoDte, subtotal, iva, totalPagar, montoTotalOperacion } = calcs;
    const rules = getDteRules(tipoDte);
    
    // Validaciones básicas
    if (subtotal < 0) {
      errors.push("El subtotal no puede ser negativo");
    }
    
    if (iva < 0) {
      errors.push("El IVA no puede ser negativo");
    }
    
    // Validación de monto mínimo específico
    const minValidation = validateMinAmount(tipoDte, montoTotalOperacion);
    if (!minValidation.isValid) {
      errors.push(minValidation.error);
    }

    // Validaciones específicas por tipo
    if (rules.iva.applies) {
      const expectedIva = roundMoney(calcs.ventasGravadas * rules.iva.rate);
      if (Math.abs(iva - expectedIva) > 0.01) {
        errors.push(`El cálculo del IVA no coincide con el esperado para ${rules.name}`);
      }
    }

    // Validar que tipos sin IVA no tengan IVA
    if (!rules.iva.applies && iva > 0) {
      errors.push(`${rules.name} no debe tener IVA`);
    }

    // Validaciones específicas por estructura
    if (tipoDte === "11" && montoTotalOperacion < 100) { // FEX
      errors.push("Las facturas de exportación requieren un monto mínimo de $100.00");
    }

    if (tipoDte === "07" && calcs.reteRenta < 0.01) { // CR
      errors.push("Los comprobantes de retención deben tener al menos $0.01 de retención");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [getDteRules, validateMinAmount, roundMoney]);

  // 🆕 Función principal mejorada
  const calculate = useCallback((items, options = {}) => {
    const {
      descuentoGlobal = 0,
      aplicarRetencion = false,
      tipoDte = "01"
    } = options;
    
    const results = calculateDocumentTotals(items, { descuentoGlobal, aplicarRetencion, tipoDte });
    const tributos = generateTributos(results);
    const validation = validateCalculations(results);
    
    const finalResults = {
      ...results,
      tributos,
      validation
    };
    
    setCalculations(finalResults);
    return finalResults;
  }, [calculateDocumentTotals, generateTributos, validateCalculations]);

  // Función para formatear moneda (mantenida)
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // 🆕 Función para obtener el desglose específico por tipo DTE
  const getTaxBreakdown = useCallback((calcs) => {
    const breakdown = [];
    const { tipoDte, dteName } = calcs;
    
    breakdown.push(`Tipo: ${dteName} (${tipoDte})`);
    
    if (calcs.ventasGravadas > 0) {
      breakdown.push(`Ventas Gravadas: ${formatCurrency(calcs.ventasGravadas)}`);
    }
    
    if (calcs.ventasExentas > 0) {
      breakdown.push(`Ventas Exentas: ${formatCurrency(calcs.ventasExentas)}`);
    }
    
    if (calcs.iva > 0) {
      const rules = getDteRules(tipoDte);
      const percent = (rules.iva.rate * 100).toFixed(0);
      breakdown.push(`IVA (${percent}%): ${formatCurrency(calcs.iva)}`);
    }
    
    if (calcs.reteRenta > 0) {
      const rules = getDteRules(tipoDte);
      const percent = (rules.retencion.rate * 100).toFixed(0);
      breakdown.push(`Retención (${percent}%): ${formatCurrency(calcs.reteRenta)}`);
    }

    // Campos específicos por tipo
    if (calcs.dteSpecificFields) {
      Object.entries(calcs.dteSpecificFields).forEach(([field, value]) => {
        if (typeof value === 'number' && value > 0) {
          breakdown.push(`${field}: ${formatCurrency(value)}`);
        }
      });
    }
    
    return breakdown;
  }, [formatCurrency, getDteRules]);

  // 🆕 Función para obtener información del tipo DTE
  const getDteInfo = useCallback((tipoDte) => {
    return getDteRules(tipoDte);
  }, [getDteRules]);

  return {
    calculations,
    calculate,
    calculateItemTax,
    calculateDocumentTotals,
    generateTributos,
    validateCalculations,
    formatCurrency,
    getTaxBreakdown,
    roundMoney,
    getDteInfo, // 🆕
    getDteRules, // 🆕
    validateMinAmount, // 🆕
    constants: {
      IVA_RATE,
      RENTA_RATE,
      MIN_RENTA_THRESHOLD,
      DTE_RULES // 🆕 Exportar reglas para referencia
    }
  };
};