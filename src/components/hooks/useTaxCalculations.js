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

  // Constantes de impuestos para El Salvador
  const IVA_RATE = 0.13; // 13%
  const RENTA_RATE = 0.10; // 10% retención de renta (cuando aplica)
  const MIN_RENTA_THRESHOLD = 100.00; // Umbral mínimo para retención

  // Función para redondear según reglas de El Salvador
  const roundMoney = useCallback((amount) => {
    return Math.round(amount * 100) / 100;
  }, []);

  // Calcular impuestos para un ítem individual
  const calculateItemTax = useCallback((item) => {
    const { cantidad, precioUni, montoDescu = 0, noGravado = false } = item;
    
    const subtotalItem = cantidad * precioUni;
    const descuentoItem = montoDescu;
    const ventasItem = subtotalItem - descuentoItem;
    
    let ivaItem = 0;
    if (!noGravado && ventasItem > 0) {
      ivaItem = roundMoney(ventasItem * IVA_RATE);
    }
    
    return {
      ...item,
      ventasGravadas: noGravado ? 0 : roundMoney(ventasItem),
      ventasExentas: noGravado ? roundMoney(ventasItem) : 0,
      ivaItem: ivaItem,
      totalItem: roundMoney(ventasItem + ivaItem)
    };
  }, [roundMoney]);

  // Calcular totales del documento
  const calculateDocumentTotals = useCallback((items, descuentoGlobal = 0, aplicarRetencion = false) => {
    if (!items || items.length === 0) {
      return {
        subtotal: 0,
        descuentos: 0,
        subTotalVentas: 0,
        ventasGravadas: 0,
        ventasExentas: 0,
        iva: 0,
        reteRenta: 0,
        montoTotalOperacion: 0,
        totalPagar: 0,
        itemsCalculated: []
      };
    }

    // Calcular cada ítem
    const itemsCalculated = items.map(calculateItemTax);
    
    // Sumar totales
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
    
    const iva = roundMoney(
      itemsCalculated.reduce((sum, item) => sum + item.ivaItem, 0)
    );
    
    const montoTotalOperacion = roundMoney(subTotalVentas + iva);
    
    // Calcular retención de renta si aplica
    let reteRenta = 0;
    if (aplicarRetencion && montoTotalOperacion >= MIN_RENTA_THRESHOLD) {
      reteRenta = roundMoney(subTotalVentas * RENTA_RATE);
    }
    
    const totalPagar = roundMoney(montoTotalOperacion - reteRenta);
    
    return {
      subtotal,
      descuentos: totalDescuentos,
      subTotalVentas,
      ventasGravadas,
      ventasExentas,
      iva,
      reteRenta,
      montoTotalOperacion,
      totalPagar,
      itemsCalculated
    };
  }, [calculateItemTax, roundMoney]);

  // Generar resumen de tributos para DTE
  const generateTributos = useCallback((calculations) => {
    const tributos = [];
    
    if (calculations.iva > 0) {
      tributos.push({
        codigo: "20",
        descripcion: "Impuesto al Valor Agregado 13%",
        valor: calculations.iva
      });
    }
    
    if (calculations.reteRenta > 0) {
      tributos.push({
        codigo: "D1",
        descripcion: "Retención Renta 10%",
        valor: calculations.reteRenta
      });
    }
    
    return tributos;
  }, []);

  // Validar cálculos
  const validateCalculations = useCallback((calcs) => {
    const errors = [];
    
    if (calcs.subtotal < 0) {
      errors.push("El subtotal no puede ser negativo");
    }
    
    if (calcs.iva < 0) {
      errors.push("El IVA no puede ser negativo");
    }
    
    if (calcs.totalPagar < 0) {
      errors.push("El total a pagar no puede ser negativo");
    }
    
    // Validar que el IVA sea aproximadamente el 13% de ventas gravadas
    const expectedIva = roundMoney(calcs.ventasGravadas * IVA_RATE);
    if (Math.abs(calcs.iva - expectedIva) > 0.01) {
      errors.push("El cálculo del IVA no coincide con el esperado");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [roundMoney]);

  // Función principal para calcular todo
  const calculate = useCallback((items, options = {}) => {
    const {
      descuentoGlobal = 0,
      aplicarRetencion = false
    } = options;
    
    const results = calculateDocumentTotals(items, descuentoGlobal, aplicarRetencion);
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

  // Función para formatear moneda
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Función para obtener el desglose de impuestos en texto
  const getTaxBreakdown = useCallback((calcs) => {
    const breakdown = [];
    
    if (calcs.ventasGravadas > 0) {
      breakdown.push(`Ventas Gravadas: ${formatCurrency(calcs.ventasGravadas)}`);
    }
    
    if (calcs.ventasExentas > 0) {
      breakdown.push(`Ventas Exentas: ${formatCurrency(calcs.ventasExentas)}`);
    }
    
    if (calcs.iva > 0) {
      breakdown.push(`IVA (13%): ${formatCurrency(calcs.iva)}`);
    }
    
    if (calcs.reteRenta > 0) {
      breakdown.push(`Retención Renta (10%): ${formatCurrency(calcs.reteRenta)}`);
    }
    
    return breakdown;
  }, [formatCurrency]);

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
    constants: {
      IVA_RATE,
      RENTA_RATE,
      MIN_RENTA_THRESHOLD
    }
  };
};