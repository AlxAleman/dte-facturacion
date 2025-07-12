// src/hooks/useTaxCalculations.js
import { useState, useEffect, useCallback } from 'react';
import { numberToWords } from '../../utils/numberToWords';

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
      minAmount: 10.95,
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
      minAmount: 0.01,
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj", "ivaPerci1", "ivaRete1"],
      calculations: {
        totalGravada: true,
        totalExenta: true,
        totalNoSuj: true,
        ivaPerci1: true,
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
        ivaPerci1: true,
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
        ivaPerci1: true,
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
      requiredFields: ["totalCompra", "ivaRete1"],
      calculations: {
        totalCompra: true,
        ivaRete1: true,
        totalPagar: true
      }
    },

    // FEX - Factura de Exportación
    "11": {
      name: "Factura de Exportación",
      structure: "resumen",
      iva: { applies: false, rate: 0, field: null },
      retencion: { applies: false, rate: 0, field: null },
      minAmount: 100.00,
      requiredFields: ["totalGravada"],
      calculations: {
        totalGravada: true,
        totalPagar: true
      }
    },

    // CR - Comprobante de Retención
    "07": {
      name: "Comprobante de Retención",
      structure: "hibrida",
      iva: { applies: false, rate: 0, field: null },
      retencion: { applies: true, rate: 0.10, field: "totalIVAretenido", minThreshold: 0.01 },
      minAmount: 0.01, // min retención
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
        totalGravada: true,
        totalExenta: true,
        totalNoSuj: true
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
        valorTotal: true
      }
    },

    // DCL - Documento Contable de Liquidación
    "09": {
      name: "Documento Contable de Liquidación",
      structure: "cuerpoDocumento",
      iva: { applies: true, rate: 0.02, field: "ivaPercibido" },
      retencion: { applies: false, rate: 0, field: null },
      minAmount: 0,
      requiredFields: ["subTotal", "iva", "ivaPercibido", "ivaComision"],
      calculations: {
        subTotal: true,
        iva: true,
        ivaPercibido: true,
        ivaComision: true
      }
    },

    // CL - Comprobante de Liquidación
    "08": {
      name: "Comprobante de Liquidación",
      structure: "resumen",
      iva: { applies: true, rate: 0.13, field: "ivaPerci" },
      retencion: { applies: true, rate: 0.10, field: "ivaRete1", minThreshold: 100.00 },
      minAmount: 0,
      allowNegative: true,
      requiredFields: ["totalGravada", "totalExenta", "totalNoSuj", "totalExportacion"],
      calculations: {
        totalGravada: true,
        totalExenta: true,
        totalNoSuj: true,
        totalExportacion: true,
        ivaPerci: true,
        total: true
      }
    }
  };

  // Constantes generales
  const IVA_RATE = 0.13;
  const RENTA_RATE = 0.10;
  const MIN_RENTA_THRESHOLD = 100.00;

  // Función para redondear según reglas de El Salvador
  const roundMoney = useCallback((amount) => {
    return Math.round(amount * 100) / 100;
  }, []);

  const getDteRules = useCallback((tipoDte) => {
    return DTE_RULES[tipoDte] || DTE_RULES["01"];
  }, []);

  // --- CORRECCIÓN PARA CR (07): validar retención mínima, no monto total
  const validateMinAmount = useCallback((tipoDte, amount, extra) => {
    const rules = getDteRules(tipoDte);
    // Para CR validamos el monto de retención, no el monto total
    if (tipoDte === "07") {
      const rete = extra?.reteRenta ?? 0;
      if (rete < (rules.retencion.minThreshold || 0.01)) {
        return {
          isValid: false,
          error: `El monto mínimo de retención para ${rules.name} es $${(rules.retencion.minThreshold || 0.01).toFixed(2)}`
        };
      }
      return { isValid: true };
    }
    if (rules.minAmount && amount < rules.minAmount) {
      return {
        isValid: false,
        error: `El monto mínimo para ${rules.name} es $${rules.minAmount.toFixed(2)}`
      };
    }
    return { isValid: true };
  }, [getDteRules]);

  // Calcular impuestos para un ítem individual
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

  // Calcular totales específicos por tipo DTE
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

    // Cálculos específicos por tipo DTE
    let iva = 0;
    let reteRenta = 0;
    let montoTotalOperacion = 0;
    let totalPagar = 0;
    let dteSpecificFields = {};

    if (rules.iva.applies) {
      iva = roundMoney(ventasGravadas * rules.iva.rate);
    }

    if (rules.retencion.applies && aplicarRetencion) {
      const baseRetencion = rules.retencion.field === "totalIVAretenido" ? iva : subTotalVentas;
      if (baseRetencion > (rules.retencion.minThreshold || 0)) {
        reteRenta = roundMoney(baseRetencion * rules.retencion.rate);
      }
    }

    switch (tipoDte) {
      case "01":
        montoTotalOperacion = roundMoney(subTotalVentas + iva);
        totalPagar = roundMoney(montoTotalOperacion - reteRenta);
        
        // 🆕 NUEVO: Generar todos los campos requeridos del resumen según esquema
        dteSpecificFields = {
          // Campos básicos
          totalNoSuj: 0,
          totalExenta: ventasExentas,
          totalGravada: ventasGravadas,
          subTotalVentas: subTotalVentas,
          
          // Descuentos
          descuNoSuj: 0,
          descuExenta: 0,
          descuGravada: totalDescuentos,
          porcentajeDescuento: subtotal > 0 ? (totalDescuentos / subtotal) * 100 : 0,
          totalDescu: totalDescuentos,
          
          // Tributos
          tributos: iva > 0 ? [{
            codigo: "20",
            descripcion: "Impuesto al Valor Agregado 13%",
            valor: iva
          }] : [],
          
          // Totales
          subTotal: subtotal,
          ivaRete1: reteRenta,
          reteRenta: reteRenta,
          montoTotalOperacion: montoTotalOperacion,
          totalNoGravado: 0,
          totalPagar: totalPagar,
          totalLetras: numberToWords(totalPagar), // ✅ Campo requerido con conversión a palabras
          totalIva: iva,
          saldoFavor: 0,
          condicionOperacion: 1,
          pagos: [],
          numPagoElectronico: ""
        };
        break;

      case "03":
      case "05":
      case "06":
        montoTotalOperacion = roundMoney(subTotalVentas + iva);
        totalPagar = roundMoney(montoTotalOperacion - reteRenta);
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        dteSpecificFields.ivaPerci1 = iva;
        dteSpecificFields.ivaRete1 = reteRenta;
        break;

      case "14":
        montoTotalOperacion = subTotalVentas;
        totalPagar = subTotalVentas;
        dteSpecificFields.totalCompra = subTotalVentas;
        dteSpecificFields.ivaRete1 = 0;
        break;

      case "11":
        // 🆕 NUEVO: Cálculos específicos para Factura de Exportación
        montoTotalOperacion = roundMoney(subTotalVentas);
        totalPagar = roundMoney(montoTotalOperacion);
        
        dteSpecificFields = {
          totalGravada: ventasGravadas,
          descuento: totalDescuentos,
          porcentajeDescuento: subtotal > 0 ? (totalDescuentos / subtotal) * 100 : 0,
          totalDescu: totalDescuentos,
          seguro: 0,
          flete: 0,
          montoTotalOperacion: montoTotalOperacion,
          totalNoGravado: 0, // Exportaciones no tienen IVA
          totalPagar: totalPagar,
          totalLetras: numberToWords(totalPagar),
          condicionOperacion: 1, // 1 = Contado
          pagos: [{
            codigo: "01",
            montoPago: totalPagar,
            referencia: null,
            plazo: null,
            periodo: null
          }],
          codIncoterms: "FOB",
          descIncoterms: "Free On Board",
          numPagoElectronico: null,
                  observaciones: "Factura de exportación"
      };
      break;

    case "14":
      // 🆕 NUEVO: Cálculos específicos para Factura de Sujeto Excluido
      montoTotalOperacion = roundMoney(subTotalVentas);
      totalPagar = roundMoney(montoTotalOperacion);
      
      dteSpecificFields = {
        totalCompra: ventasGravadas,
        descu: totalDescuentos,
        totalDescu: totalDescuentos,
        subTotal: subtotal,
        ivaRete1: 0, // Sujetos excluidos no tienen IVA
        reteRenta: 0,
        totalPagar: totalPagar,
        totalLetras: numberToWords(totalPagar),
        condicionOperacion: 1, // 1 = Contado, 2 = Crédito, 3 = Mixto
        pagos: [{
          codigo: "01", // 01 = Efectivo, 02 = Cheque, 03 = Tarjeta, etc.
          montoPago: totalPagar,
          referencia: null,
          plazo: null,
          periodo: null
        }],
        observaciones: "Factura de sujeto excluido"
      };
      break;

    case "15":
      // 🆕 NUEVO: Cálculos específicos para Comprobante de Donación
      montoTotalOperacion = roundMoney(subTotalVentas);
      totalPagar = roundMoney(montoTotalOperacion);
      
      dteSpecificFields = {
        valorTotal: ventasGravadas,
        totalLetras: numberToWords(totalPagar),
        pagos: [{
          codigo: "99", // 99 = Otros
          montoPago: totalPagar,
          referencia: "Donación"
        }]
      };
      break;

      case "07":
        // Retención directa para CR
        if (aplicarRetencion) {
          reteRenta = roundMoney(subTotalVentas * 0.10);
        }
        dteSpecificFields.totalSujetoRetencion = subTotalVentas;
        dteSpecificFields.totalIVAretenido = reteRenta;
        break;

      case "04":
        montoTotalOperacion = subTotalVentas;
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        break;

      case "15":
        dteSpecificFields.valorTotal = subTotalVentas;
        break;

      case "09":
        dteSpecificFields.valorOperaciones = subTotalVentas;
        dteSpecificFields.subTotal = subTotalVentas;
        dteSpecificFields.iva = iva;
        dteSpecificFields.montoSujetoPercepcion = subTotalVentas;
        dteSpecificFields.ivaPercibido = roundMoney(subTotalVentas * 0.02);
        dteSpecificFields.comision = 0;
        dteSpecificFields.ivaComision = 0;
        dteSpecificFields.liquidoApagar = roundMoney(subTotalVentas - dteSpecificFields.ivaPercibido);
        break;

      case "08":
        montoTotalOperacion = roundMoney(subTotalVentas + iva);
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        dteSpecificFields.totalExportacion = 0;
        dteSpecificFields.ivaPerci = iva;
        dteSpecificFields.total = montoTotalOperacion;
        break;

      default:
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

  // --- Corrige para que la validación CR use el monto de retención
  const validateCalculations = useCallback((calculations) => {
    const errors = [];
    const { tipoDte, subtotal, iva, totalPagar, montoTotalOperacion, reteRenta } = calculations;
    const rules = getDteRules(tipoDte);

    if (subtotal < 0) {
      errors.push("El subtotal no puede ser negativo");
    }

    if (iva < 0) {
      errors.push("El IVA no puede ser negativo");
    }

    // --- Para CR (07) valida sobre el campo reteRenta
    let minValidation;
    if (tipoDte === "07") {
      minValidation = validateMinAmount(tipoDte, 0, { reteRenta });
    } else {
      minValidation = validateMinAmount(tipoDte, montoTotalOperacion);
    }
    if (!minValidation.isValid) {
      errors.push(minValidation.error);
    }

    if (rules.iva.applies) {
      const expectedIva = roundMoney(calculations.ventasGravadas * rules.iva.rate);
      if (Math.abs(iva - expectedIva) > 0.01) {
        errors.push(`El cálculo del IVA no coincide con el esperado para ${rules.name}`);
      }
    }

    if (!rules.iva.applies && iva > 0) {
      errors.push(`${rules.name} no debe tener IVA`);
    }

    if (tipoDte === "11" && montoTotalOperacion < 100) {
      errors.push("Las facturas de exportación requieren un monto mínimo de $100.00");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [getDteRules, validateMinAmount, roundMoney]);

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

    if (tipoDte === "09" && calculations.dteSpecificFields?.ivaPercibido > 0) {
      tributos.push({
        codigo: "C3",
        descripcion: "IVA Percibido 2%",
        valor: calculations.dteSpecificFields.ivaPercibido
      });
    }

    return tributos;
  }, [getDteRules]);

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

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

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

    if (calcs.dteSpecificFields) {
      Object.entries(calcs.dteSpecificFields).forEach(([field, value]) => {
        if (typeof value === 'number' && value > 0) {
          breakdown.push(`${field}: ${formatCurrency(value)}`);
        }
      });
    }

    return breakdown;
  }, [formatCurrency, getDteRules]);

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
    getDteInfo,
    getDteRules,
    validateMinAmount,
    constants: {
      IVA_RATE,
      RENTA_RATE,
      MIN_RENTA_THRESHOLD,
      DTE_RULES
    }
  };
};
