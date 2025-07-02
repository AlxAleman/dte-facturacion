import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, AlertCircle, CheckCircle, Info, DollarSign, Percent } from 'lucide-react';
import { useTaxCalculations } from '../components/hooks/useTaxCalculations';

const TaxCalculator = ({ items = [], tipoDte = "01", onCalculationChange }) => {
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [aplicarRetencion, setAplicarRetencion] = useState(false);
  const [calculations, setCalculations] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // 🆕 Hook actualizado con soporte multi-DTE
  const {
    calculate,
    formatCurrency,
    getTaxBreakdown,
    getDteInfo,
    validateMinAmount,
    constants
  } = useTaxCalculations();

  // 🆕 Obtener información del tipo DTE actual
  const dteInfo = getDteInfo(tipoDte);

  // Calcular automáticamente cuando cambien los datos
  useEffect(() => {
    if (items && items.length > 0) {
      performCalculation();
    }
  }, [items, descuentoGlobal, aplicarRetencion, tipoDte]);

  // 🆕 Función de cálculo actualizada
  const performCalculation = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      // Usar el nuevo hook con soporte para tipoDte
      const results = calculate(items, {
        descuentoGlobal,
        aplicarRetencion,
        tipoDte // 🆕 Pasar tipo DTE
      });

      console.log(`🧮 Cálculo realizado para ${dteInfo.name}:`, results);
      
      setCalculations(results);
      
      // Notificar al componente padre
      if (onCalculationChange) {
        onCalculationChange(results);
      }
    } catch (error) {
      console.error('Error en cálculo:', error);
      setCalculations(null);
    } finally {
      setIsCalculating(false);
    }
  }, [items, descuentoGlobal, aplicarRetencion, tipoDte, calculate, onCalculationChange, dteInfo.name]);

  // Manejar cambio de descuento global
  const handleDescuentoChange = (value) => {
    const descuento = Math.max(0, parseFloat(value) || 0);
    setDescuentoGlobal(descuento);
  };

  // Manejar cambio de retención
  const handleRetencionChange = (checked) => {
    setAplicarRetencion(checked);
  };

  // 🆕 Obtener el color del estado según las validaciones
  const getStatusColor = () => {
    if (!calculations) return 'gray';
    if (calculations.validation?.isValid) return 'green';
    return 'red';
  };

  // 🆕 Renderizar campos específicos del tipo DTE
  const renderDteSpecificFields = () => {
    if (!calculations?.dteSpecificFields) return null;

    const specificFields = calculations.dteSpecificFields;
    const fieldsToShow = Object.entries(specificFields).filter(([_, value]) => 
      typeof value === 'number' && value !== 0
    );

    if (fieldsToShow.length === 0) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-3">
          Campos Específicos - {dteInfo.name}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fieldsToShow.map(([field, value]) => (
            <div key={field} className="flex justify-between items-center">
              <span className="text-sm text-blue-700 capitalize">
                {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </span>
              <span className="font-medium text-blue-900">
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 🆕 Renderizar advertencias específicas del tipo
  const renderDteWarnings = () => {
    if (!calculations) return null;

    const warnings = [];

    // Validación de monto mínimo
    const totalAmount = calculations.montoTotalOperacion || calculations.dteSpecificFields?.valorTotal || 0;
    const minValidation = validateMinAmount(tipoDte, totalAmount);
    
    if (!minValidation.isValid) {
      warnings.push({
        type: 'error',
        message: minValidation.error
      });
    }

    // Advertencias específicas por tipo
    switch (tipoDte) {
      case "11": // FEX
        if (totalAmount > 0 && totalAmount < 100) {
          warnings.push({
            type: 'warning',
            message: 'Las facturas de exportación requieren un monto mínimo de $100.00'
          });
        }
        break;
      
      case "07": // CR
        if (calculations.reteRenta < 0.01) {
          warnings.push({
            type: 'warning',
            message: 'Los comprobantes de retención deben tener al menos $0.01 de retención'
          });
        }
        break;

      case "14": // FSE
        if (calculations.iva > 0) {
          warnings.push({
            type: 'error',
            message: 'Las facturas de sujeto excluido no deben tener IVA'
          });
        }
        break;

      case "04": // NR
        warnings.push({
          type: 'info',
          message: 'Nota de remisión: documento no fiscal para traslado de bienes'
        });
        break;

      case "15": // CD
        warnings.push({
          type: 'info',
          message: 'Comprobante de donación: no genera obligaciones tributarias'
        });
        break;
    }

    if (warnings.length === 0) return null;

    return (
      <div className="space-y-2">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border flex items-start gap-2 ${
              warning.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : warning.type === 'warning'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {warning.type === 'error' ? (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : warning.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <span className="text-sm">{warning.message}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Calculadora de Impuestos
            </h2>
            <p className="text-sm text-gray-600">
              {dteInfo.name} ({tipoDte}) - {items.length} ítem(s)
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          getStatusColor() === 'green'
            ? 'bg-green-100 text-green-800'
            : getStatusColor() === 'red'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isCalculating ? 'Calculando...' : 
           calculations?.validation?.isValid ? 'Válido' : 
           calculations ? 'Con errores' : 'Sin calcular'}
        </div>
      </div>

      {/* 🆕 Información del tipo DTE */}
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Configuración para {dteInfo.name}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">IVA:</span>
            <span className={`font-medium ${dteInfo.iva.applies ? 'text-green-600' : 'text-gray-500'}`}>
              {dteInfo.iva.applies ? `${(dteInfo.iva.rate * 100).toFixed(0)}%` : 'No aplica'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600">Retención:</span>
            <span className={`font-medium ${dteInfo.retencion.applies ? 'text-orange-600' : 'text-gray-500'}`}>
              {dteInfo.retencion.applies ? `${(dteInfo.retencion.rate * 100).toFixed(0)}%` : 'No aplica'}
            </span>
          </div>
          {dteInfo.minAmount > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600">Mínimo:</span>
              <span className="font-medium text-yellow-600">
                ${dteInfo.minAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controles de configuración */}
      <div className="mb-6 space-y-4">
        {/* Descuento global */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descuento Global
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={descuentoGlobal}
              onChange={(e) => handleDescuentoChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Aplicar retención - solo si aplica para el tipo */}
          {dteInfo.retencion.applies && (
            <div className="flex items-center">
              <div className="flex items-center h-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicarRetencion}
                    onChange={(e) => handleRetencionChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Aplicar Retención {(dteInfo.retencion.rate * 100).toFixed(0)}%
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Información de retención */}
        {dteInfo.retencion.applies && aplicarRetencion && dteInfo.retencion.minThreshold > 0 && (
          <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
            <Info className="w-4 h-4 inline mr-1" />
            La retención se aplicará solo si el monto supera ${dteInfo.retencion.minThreshold.toFixed(2)}
          </div>
        )}
      </div>

      {/* Resultados de cálculo */}
      {calculations && (
        <div className="space-y-6">
          {/* Advertencias específicas del tipo */}
          {renderDteWarnings()}

          {/* Resumen principal */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Cálculos</h3>
            
            {/* Cálculos base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                </div>
                {calculations.descuentos > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descuentos:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(calculations.descuentos)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal Ventas:</span>
                  <span className="font-medium">{formatCurrency(calculations.subTotalVentas)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {calculations.ventasGravadas > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ventas Gravadas:</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculations.ventasGravadas)}</span>
                  </div>
                )}
                {calculations.ventasExentas > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ventas Exentas:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(calculations.ventasExentas)}</span>
                  </div>
                )}
                {calculations.iva > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA ({(dteInfo.iva.rate * 100).toFixed(0)}%):</span>
                    <span className="font-medium text-green-600">+{formatCurrency(calculations.iva)}</span>
                  </div>
                )}
                {calculations.reteRenta > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retención ({(dteInfo.retencion.rate * 100).toFixed(0)}%):</span>
                    <span className="font-medium text-orange-600">-{formatCurrency(calculations.reteRenta)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  {tipoDte === "15" ? "Total Donación:" : tipoDte === "07" ? "Total Retenido:" : "Total a Pagar:"}
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    calculations.totalPagar || 
                    calculations.dteSpecificFields?.valorTotal || 
                    calculations.dteSpecificFields?.totalIVAretenido || 
                    0
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Campos específicos del tipo DTE */}
          {renderDteSpecificFields()}

          {/* Desglose de tributos */}
          {calculations.tributos && calculations.tributos.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Tributos Aplicados</h4>
              <div className="space-y-2">
                {calculations.tributos.map((tributo, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-blue-700">
                      {tributo.codigo} - {tributo.descripcion}
                    </span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(tributo.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errores de validación */}
          {calculations.validation && !calculations.validation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Errores de Validación
              </h4>
              <ul className="space-y-1">
                {calculations.validation.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Estado válido */}
          {calculations.validation && calculations.validation.isValid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Cálculos válidos para {dteInfo.name}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado sin datos */}
      {(!calculations || !items || items.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">
            {items && items.length === 0 
              ? 'Agregue productos para calcular impuestos'
              : 'Calculando impuestos...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;