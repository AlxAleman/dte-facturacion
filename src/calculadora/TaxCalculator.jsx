// src/calculadora/TaxCalculator.jsx
import { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const TaxCalculator = ({ items = [], onCalculationChange }) => {
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    descuentos: 0,
    subTotalVentas: 0,
    iva: 0,
    reteRenta: 0,
    montoTotalOperacion: 0,
    totalPagar: 0,
    tributos: [],
    validation: { isValid: true, errors: [] }
  });

  const [taxSettings, setTaxSettings] = useState({
    ivaRate: 0.13, // 13% IVA en El Salvador
    reteRentaRate: 0.10, // 10% retención renta (opcional)
    applyReteRenta: false
  });

  // Calcular impuestos cuando cambien los items
  useEffect(() => {
    if (items && items.length > 0) {
      calculateTaxes();
    }
  }, [items, taxSettings.ivaRate, taxSettings.reteRentaRate, taxSettings.applyReteRenta]);

  // Notificar cambios al componente padre (solo cuando calculations cambie realmente)
  useEffect(() => {
    if (onCalculationChange && calculations.subtotal > 0) {
      onCalculationChange(calculations);
    }
  }, [calculations.subtotal, calculations.totalPagar, calculations.iva]);

  const calculateTaxes = () => {
    try {
      // 1. Calcular subtotal y descuentos
      let subtotal = 0;
      let totalDescuentos = 0;

      items.forEach(item => {
        const itemSubtotal = (item.cantidad || 0) * (item.precioUni || 0);
        subtotal += itemSubtotal;
        totalDescuentos += (item.montoDescu || 0);
      });

      // 2. Subtotal después de descuentos
      const subTotalVentas = subtotal - totalDescuentos;

      // 3. Calcular IVA (13%)
      const iva = subTotalVentas * taxSettings.ivaRate;

      // 4. Calcular retención de renta (opcional)
      const reteRenta = taxSettings.applyReteRenta ? subTotalVentas * taxSettings.reteRentaRate : 0;

      // 5. Monto total de operación (antes de retenciones)
      const montoTotalOperacion = subTotalVentas + iva;

      // 6. Total a pagar (después de retenciones)
      const totalPagar = montoTotalOperacion - reteRenta;

      // 7. Crear array de tributos
      const tributos = [
        {
          codigo: '20',
          descripcion: 'Impuesto al Valor Agregado 13%',
          valor: iva
        }
      ];

      if (reteRenta > 0) {
        tributos.push({
          codigo: 'D1',
          descripcion: 'Retención Renta 10%',
          valor: reteRenta
        });
      }

      // 8. Validaciones
      const validation = validateCalculations({
        subtotal,
        subTotalVentas,
        iva,
        totalPagar
      });

      // 9. Actualizar estado
      const newCalculations = {
        subtotal,
        descuentos: totalDescuentos,
        subTotalVentas,
        iva,
        reteRenta,
        montoTotalOperacion,
        totalPagar,
        tributos,
        validation
      };

      setCalculations(newCalculations);

    } catch (error) {
      console.error('Error calculando impuestos:', error);
      setCalculations(prev => ({
        ...prev,
        validation: {
          isValid: false,
          errors: [`Error en cálculo: ${error.message}`]
        }
      }));
    }
  };

  const validateCalculations = (calc) => {
    const errors = [];

    if (calc.subtotal < 0) errors.push('El subtotal no puede ser negativo');
    if (calc.iva < 0) errors.push('El IVA no puede ser negativo');
    if (calc.totalPagar < 0) errors.push('El total a pagar no puede ser negativo');
    if (calc.subTotalVentas < 0) errors.push('El subtotal de ventas no puede ser negativo');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleTaxSettingsChange = (setting, value) => {
    setTaxSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        Calculadora de Impuestos
      </h2>

      {/* Configuración de impuestos */}
      <div className="mb-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Impuestos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa IVA (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={(taxSettings.ivaRate * 100).toFixed(2)}
                onChange={(e) => handleTaxSettingsChange('ivaRate', parseFloat(e.target.value) / 100)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retención Renta (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={(taxSettings.reteRentaRate * 100).toFixed(2)}
                onChange={(e) => handleTaxSettingsChange('reteRentaRate', parseFloat(e.target.value) / 100)}
                disabled={!taxSettings.applyReteRenta}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aplicar Retención
            </label>
            <div className="flex items-center h-10">
              <input
                type="checkbox"
                checked={taxSettings.applyReteRenta}
                onChange={(e) => handleTaxSettingsChange('applyReteRenta', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Aplicar retención de renta
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de items */}
      {items && items.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resumen de Productos/Servicios
          </h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Descuento</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => {
                  const itemSubtotal = ((item.cantidad || 0) * (item.precioUni || 0)) - (item.montoDescu || 0);
                  return (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.descripcion || 'Sin descripción'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.cantidad || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${(item.precioUni || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${(item.montoDescu || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${itemSubtotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cálculos detallados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Cálculos paso a paso */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Cálculos Detallados
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Subtotal (antes de descuentos)</span>
              <span className="text-sm font-medium text-gray-900">${calculations.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">(-) Descuentos</span>
              <span className="text-sm font-medium text-red-600">-${calculations.descuentos.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Subtotal de Ventas</span>
              <span className="text-sm font-bold text-gray-900">${calculations.subTotalVentas.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">(+) IVA ({(taxSettings.ivaRate * 100).toFixed(1)}%)</span>
              <span className="text-sm font-medium text-blue-600">+${calculations.iva.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Monto Total Operación</span>
              <span className="text-sm font-bold text-gray-900">${calculations.montoTotalOperacion.toFixed(2)}</span>
            </div>
            
            {calculations.reteRenta > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">(-) Retención Renta ({(taxSettings.reteRentaRate * 100).toFixed(1)}%)</span>
                <span className="text-sm font-medium text-red-600">-${calculations.reteRenta.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: Resumen final */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Resumen Final
          </h3>
          
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                ${calculations.totalPagar.toFixed(2)}
              </div>
              <div className="text-sm text-blue-700">Total a Pagar</div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-blue-900">${calculations.iva.toFixed(2)}</div>
                  <div className="text-blue-700">IVA Total</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-900">{items.length}</div>
                  <div className="text-blue-700">Productos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tributos */}
          {calculations.tributos.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Tributos Aplicados</h4>
              <div className="space-y-2">
                {calculations.tributos.map((tributo, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{tributo.descripcion}</span>
                    <span className="font-medium text-gray-900">${tributo.valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validación */}
      <div className="mt-6">
        {calculations.validation.isValid ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Cálculos validados correctamente</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Todos los cálculos de impuestos han sido verificados y están listos para la firma.
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Errores en los cálculos</span>
            </div>
            <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
              {calculations.validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Información</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Los cálculos se basan en la normativa tributaria de El Salvador</li>
          <li>• El IVA estándar es del 13% sobre el valor de la venta</li>
          <li>• La retención de renta es opcional y configurable</li>
          <li>• Todos los cálculos se realizan automáticamente</li>
        </ul>
      </div>
    </div>
  );
};

export default TaxCalculator;