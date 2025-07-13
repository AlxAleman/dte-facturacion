import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calculator, AlertCircle, CheckCircle, Info, DollarSign, Percent } from 'lucide-react';
import { useTaxCalculations } from '../components/hooks/useTaxCalculations';

const TaxCalculator = ({ items = [], tipoDte = "01", onCalculationChange }) => {
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [aplicarRetencion, setAplicarRetencion] = useState(false);
  const [calculations, setCalculations] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const userChangedRetencion = useRef(false);

  // Hook multi-DTE
  const {
    calculate,
    formatCurrency,
    getTaxBreakdown,
    getDteInfo,
    validateMinAmount,
    constants
  } = useTaxCalculations();

  const dteInfo = getDteInfo(tipoDte);

  // Reset "user changed" si cambia tipo de documento
  useEffect(() => {
    userChangedRetencion.current = false;
  }, [tipoDte]);

  // Auto-marcar retención si el monto es MAYOR al mínimo, pero no si el usuario lo ha tocado
  useEffect(() => {
    if (!dteInfo.retencion.applies) return;
    const min = dteInfo.retencion.minThreshold || 0;
    let montoBase = 0;
    if (items && items.length > 0) {
      montoBase = items.reduce(
        (sum, item) => sum + (item.cantidad * item.precioUni - (item.montoDescu || 0)),
        0
      ) - descuentoGlobal;
      if (montoBase < 0) montoBase = 0;
    }

    if (!userChangedRetencion.current) {
      if (montoBase > min && !aplicarRetencion) {
        setAplicarRetencion(true);
      }
      if (montoBase <= min && aplicarRetencion) {
        setAplicarRetencion(false);
      }
    }
    // eslint-disable-next-line
  }, [items, descuentoGlobal, tipoDte, dteInfo.retencion.minThreshold]);

  // Calcular automáticamente cuando cambien los datos relevantes
  useEffect(() => {
    if (items && items.length > 0) {
      performCalculation();
    }
    // eslint-disable-next-line
  }, [items, descuentoGlobal, aplicarRetencion, tipoDte]);

  // Función de cálculo principal
  const performCalculation = useCallback(() => {
    setIsCalculating(true);
    try {
      const results = calculate(items, {
        descuentoGlobal,
        aplicarRetencion,
        tipoDte
      });
      setCalculations(results);
      if (onCalculationChange) {
        onCalculationChange(results);
      }
    } catch (error) {
      console.error('Error en cálculo:', error);
      setCalculations(null);
    } finally {
      setIsCalculating(false);
    }
  }, [items, descuentoGlobal, aplicarRetencion, tipoDte, calculate, onCalculationChange]);

  const handleDescuentoChange = (value) => {
    const descuento = Math.max(0, parseFloat(value) || 0);
    setDescuentoGlobal(descuento);
  };

  // Marcar como "tocó usuario" al cambiar el checkbox
  const handleRetencionChange = (checked) => {
    userChangedRetencion.current = true;
    setAplicarRetencion(checked);
  };

  const getStatusColor = () => {
    if (!calculations) return 'gray';
    if (calculations.validation?.isValid) return 'green';
    return 'red';
  };

  const renderDteSpecificFields = () => {
    if (!calculations?.dteSpecificFields) return null;
    const specificFields = calculations.dteSpecificFields;
    const fieldsToShow = Object.entries(specificFields).filter(([_, value]) =>
      typeof value === 'number' && value !== 0
    );
    if (fieldsToShow.length === 0) return null;
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
          Campos Específicos - {dteInfo.name}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fieldsToShow.map(([field, value]) => (
            <div key={field} className="flex justify-between items-center">
              <span className="text-sm text-blue-700 dark:text-blue-300 capitalize">
                {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </span>
              <span className="font-medium text-blue-900 dark:text-blue-200">
                {formatCurrency(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDteWarnings = () => {
    if (!calculations?.warnings || calculations.warnings.length === 0) return null;
    const warnings = calculations.warnings;
    
    return (
      <div className="space-y-2">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border flex items-start gap-2 ${
              warning.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                : warning.type === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        Calculadora de Impuestos
      </h3>

      {/* Información del tipo DTE */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Calculando para: {dteInfo.name} ({tipoDte})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-blue-800 dark:text-blue-200">
          <div>• <strong>IVA:</strong> {dteInfo.iva.applies ? `${(dteInfo.iva.rate * 100).toFixed(0)}%` : 'No aplica'}</div>
          <div>• <strong>Retención:</strong> {dteInfo.retencion.applies ? `${(dteInfo.retencion.rate * 100).toFixed(0)}%` : 'No aplica'}</div>
          {dteInfo.minAmount > 0 && (
            <div>• <strong>Monto mínimo:</strong> ${dteInfo.minAmount.toFixed(2)}</div>
          )}
          <div>• <strong>Estructura:</strong> {dteInfo.structure}</div>
        </div>
      </div>

      {/* Controles de cálculo */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subtotal de Ventas
            </label>
            <input
              type="number"
              value={subtotal}
              onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descuentos
            </label>
            <input
              type="number"
              value={descuentos}
              onChange={(e) => setDescuentos(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        {/* Aplicar retención */}
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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aplicar Retención {(dteInfo.retencion.rate * 100).toFixed(0)}%
                </span>
              </label>
            </div>
          </div>
        )}
        {/* Info adicional de retención */}
        {dteInfo.retencion.applies && aplicarRetencion && dteInfo.retencion.minThreshold > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-2">
            <Info className="w-4 h-4 inline mr-1" />
            La retención se aplicará solo si el monto supera ${dteInfo.retencion.minThreshold.toFixed(2)}
          </div>
        )}
      </div>

      {/* Resultados de cálculo */}
      {calculations && (
        <div className="space-y-6">
          {renderDteWarnings()}
          {/* Resumen */}
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumen de Cálculos</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculations.subtotal)}</span>
                </div>
                {calculations.descuentos > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Descuentos:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(calculations.descuentos)}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal Ventas:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculations.subTotalVentas)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {calculations.ventasGravadas > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Ventas Gravadas:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(calculations.ventasGravadas)}</span>
                  </div>
                )}
                {calculations.ventasExentas > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Ventas Exentas:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(calculations.ventasExentas)}</span>
                  </div>
                )}
                {calculations.iva > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 dark:text-gray-300">IVA ({(dteInfo.iva.rate * 100).toFixed(0)}%):</span>
                    <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(calculations.iva)}</span>
                  </div>
                )}
                {calculations.reteRenta > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Retención ({(dteInfo.retencion.rate * 100).toFixed(0)}%):</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">-{formatCurrency(calculations.reteRenta)}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Total */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tipoDte === "15" ? "Total Donación:" : tipoDte === "07" ? "Total Retenido:" : "Total a Pagar:"}
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
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
          {/* Campos específicos */}
          {renderDteSpecificFields()}
          {/* Tributos */}
          {calculations.tributos && calculations.tributos.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
                Tributos Calculados ({calculations.tributos.length})
              </h4>
              <div className="space-y-2">
                {calculations.tributos.map((tributo, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 text-sm">
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                      {tributo.codigo} - {tributo.descripcion}:
                    </span>
                    <span className="text-yellow-900 dark:text-yellow-100 font-semibold">
                      {formatCurrency(tributo.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxCalculator;
