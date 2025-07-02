import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Download, RotateCw } from 'lucide-react';

const DTETestSuite = () => {
  const [testResults, setTestResults] = useState({});
  const [running, setRunning] = useState(false);

  // 🧪 CASOS DE PRUEBA ESPECÍFICOS POR TIPO DTE
  const testCases = {
    "01": { // FC - Factura de Consumidor
      name: "Factura de Consumidor",
      cases: [
        {
          name: "FC Básica - Monto Mínimo",
          items: [
            { numItem: 1, descripcion: "Producto básico", cantidad: 1, precioUni: 10.95, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: false },
          expected: {
            subTotalVentas: 10.95,
            iva: 1.42, // 10.95 * 0.13 = 1.4235 ≈ 1.42
            totalPagar: 12.37,
            fields: ["totalGravada", "totalExenta", "totalNoSuj", "totalIva", "ivaRete1"]
          }
        },
        {
          name: "FC con Retención",
          items: [
            { numItem: 1, descripcion: "Servicio profesional", cantidad: 1, precioUni: 1000, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: true },
          expected: {
            subTotalVentas: 1000,
            iva: 130, // 1000 * 0.13
            reteRenta: 100, // 1000 * 0.10
            totalPagar: 1030, // 1000 + 130 - 100
            fields: ["totalGravada", "totalIva", "ivaRete1"]
          }
        },
        {
          name: "FC por debajo del mínimo",
          items: [
            { numItem: 1, descripcion: "Producto pequeño", cantidad: 1, precioUni: 5.00, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: false },
          expected: {
            shouldFail: true,
            errorContains: "monto mínimo"
          }
        }
      ]
    },

    "03": { // CCF - Comprobante de Crédito Fiscal
      name: "Comprobante de Crédito Fiscal", 
      cases: [
        {
          name: "CCF Empresarial",
          items: [
            { numItem: 1, descripcion: "Suministros oficina", cantidad: 10, precioUni: 25.00, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: true },
          expected: {
            subTotalVentas: 250,
            iva: 32.50, // 250 * 0.13
            reteRenta: 25, // 250 * 0.10
            totalPagar: 257.50, // 250 + 32.50 - 25
            fields: ["totalGravada", "ivaPerci1", "ivaRete1"], // ivaPerci1 en lugar de totalIva
            noFields: ["totalIva"] // No debe tener totalIva
          }
        }
      ]
    },

    "14": { // FSE - Factura de Sujeto Excluido
      name: "Factura de Sujeto Excluido",
      cases: [
        {
          name: "FSE Sin Impuestos",
          items: [
            { numItem: 1, descripcion: "Venta exenta", cantidad: 1, precioUni: 100, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: false },
          expected: {
            subTotalVentas: 100,
            iva: 0, // Sin IVA
            reteRenta: 0, // Sin retención
            totalPagar: 100,
            fields: ["totalCompra", "ivaRete1"], // Estructura específica FSE
            noFields: ["totalGravada", "totalIva", "ivaPerci1"]
          }
        }
      ]
    },

    "11": { // FEX - Factura de Exportación
      name: "Factura de Exportación",
      cases: [
        {
          name: "FEX Mínimo Válido",
          items: [
            { numItem: 1, descripcion: "Producto exportación", cantidad: 1, precioUni: 100, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: false },
          expected: {
            subTotalVentas: 100,
            iva: 0, // Sin IVA para exportación
            totalPagar: 100,
            fields: ["totalGravada"], // Tiene totalGravada pero sin IVA
            noFields: ["totalIva", "ivaPerci1", "ivaRete1"]
          }
        },
        {
          name: "FEX por debajo del mínimo",
          items: [
            { numItem: 1, descripcion: "Producto exportación pequeño", cantidad: 1, precioUni: 50, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: false },
          expected: {
            shouldFail: true,
            errorContains: "100.00"
          }
        }
      ]
    },

    "07": { // CR - Comprobante de Retención
      name: "Comprobante de Retención",
      cases: [
        {
          name: "CR Básico",
          items: [
            { numItem: 1, descripcion: "Base retención", cantidad: 1, precioUni: 100, montoDescu: 0 }
          ],
          options: { descuentoGlobal: 0, aplicarRetencion: true },
          expected: {
            subTotalVentas: 100,
            iva: 0, // CR no tiene IVA
            reteRenta: 10, // 100 * 0.10
            fields: ["totalSujetoRetencion", "totalIVAretenido"], // Estructura híbrida
            noFields: ["totalPagar", "totalIva", "montoTotalOperacion"]
          }
        }
      ]
    }
  };

  // 🧮 Simulador de cálculos simplificado
  const simulateCalculation = (items, options, tipoDte) => {
    const roundMoney = (amount) => Math.round(amount * 100) / 100;
    
    // Reglas específicas por tipo
    const rules = {
      "01": { iva: { applies: true, rate: 0.13 }, retencion: { applies: true, rate: 0.10 }, minAmount: 10.95 },
      "03": { iva: { applies: true, rate: 0.13 }, retencion: { applies: true, rate: 0.10 }, minAmount: 0.01 },
      "14": { iva: { applies: false, rate: 0 }, retencion: { applies: false, rate: 0 }, minAmount: 0 },
      "11": { iva: { applies: false, rate: 0 }, retencion: { applies: false, rate: 0 }, minAmount: 100 },
      "07": { iva: { applies: false, rate: 0 }, retencion: { applies: true, rate: 0.10 }, minAmount: 0.01 }
    };

    const rule = rules[tipoDte] || rules["01"];
    
    // Cálculos base
    const subtotal = roundMoney(items.reduce((sum, item) => sum + (item.cantidad * item.precioUni), 0));
    const descuentos = roundMoney(options.descuentoGlobal || 0);
    const subTotalVentas = roundMoney(subtotal - descuentos);
    
    const ventasGravadas = rule.iva.applies ? subTotalVentas : 0;
    const ventasExentas = !rule.iva.applies ? subTotalVentas : 0;
    
    const iva = rule.iva.applies ? roundMoney(ventasGravadas * rule.iva.rate) : 0;
    
    let reteRenta = 0;
    if (rule.retencion.applies && options.aplicarRetencion) {
      const baseRetencion = tipoDte === "07" ? iva : subTotalVentas;
      if (baseRetencion >= 100) { // Umbral mínimo
        reteRenta = roundMoney(baseRetencion * rule.retencion.rate);
      }
    }
    
    const montoTotalOperacion = roundMoney(subTotalVentas + iva);
    const totalPagar = roundMoney(montoTotalOperacion - reteRenta);
    
    // Campos específicos por tipo
    const dteSpecificFields = {};
    
    switch (tipoDte) {
      case "01": // FC
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        dteSpecificFields.totalIva = iva;
        dteSpecificFields.ivaRete1 = reteRenta;
        break;
        
      case "03": // CCF
        dteSpecificFields.totalGravada = ventasGravadas;
        dteSpecificFields.totalExenta = ventasExentas;
        dteSpecificFields.totalNoSuj = 0;
        dteSpecificFields.ivaPerci1 = iva;
        dteSpecificFields.ivaRete1 = reteRenta;
        break;
        
      case "14": // FSE
        dteSpecificFields.totalCompra = subTotalVentas;
        dteSpecificFields.ivaRete1 = 0;
        break;
        
      case "11": // FEX
        dteSpecificFields.totalGravada = ventasGravadas;
        break;
        
      case "07": // CR
        dteSpecificFields.totalSujetoRetencion = subTotalVentas;
        dteSpecificFields.totalIVAretenido = reteRenta;
        break;
    }
    
    // Validaciones
    const errors = [];
    if (rule.minAmount && montoTotalOperacion < rule.minAmount) {
      errors.push(`Monto mínimo requerido: $${rule.minAmount.toFixed(2)}`);
    }
    
    return {
      tipoDte,
      subtotal,
      descuentos,
      subTotalVentas,
      ventasGravadas,
      ventasExentas,
      iva,
      reteRenta,
      montoTotalOperacion,
      totalPagar,
      dteSpecificFields,
      validation: {
        isValid: errors.length === 0,
        errors
      }
    };
  };

  // 🧪 Ejecutar una prueba
  const runTest = (tipoDte, testCase) => {
    try {
      const result = simulateCalculation(testCase.items, testCase.options, tipoDte);
      const expected = testCase.expected;
      
      const checks = [];
      
      // Verificar si debería fallar
      if (expected.shouldFail) {
        if (result.validation.isValid) {
          checks.push({
            type: 'error',
            message: 'Se esperaba que fallara pero pasó la validación'
          });
        } else if (expected.errorContains && !result.validation.errors.some(err => err.includes(expected.errorContains))) {
          checks.push({
            type: 'error',
            message: `Error esperado que contenga "${expected.errorContains}" no encontrado`
          });
        } else {
          checks.push({
            type: 'success',
            message: 'Falló como se esperaba'
          });
        }
      } else {
        // Verificar valores esperados
        Object.entries(expected).forEach(([key, expectedValue]) => {
          if (key === 'fields' || key === 'noFields' || key === 'shouldFail' || key === 'errorContains') return;
          
          const actualValue = result[key];
          const tolerance = 0.01; // Tolerancia para decimales
          
          if (Math.abs(actualValue - expectedValue) > tolerance) {
            checks.push({
              type: 'error',
              message: `${key}: esperado ${expectedValue}, obtenido ${actualValue}`
            });
          } else {
            checks.push({
              type: 'success',
              message: `${key}: ✓ ${actualValue}`
            });
          }
        });
        
        // Verificar campos requeridos
        if (expected.fields) {
          expected.fields.forEach(field => {
            if (result.dteSpecificFields[field] === undefined) {
              checks.push({
                type: 'error',
                message: `Campo requerido faltante: ${field}`
              });
            } else {
              checks.push({
                type: 'success',
                message: `Campo presente: ${field}`
              });
            }
          });
        }
        
        // Verificar campos que NO deben estar
        if (expected.noFields) {
          expected.noFields.forEach(field => {
            if (result.dteSpecificFields[field] !== undefined && result.dteSpecificFields[field] !== 0) {
              checks.push({
                type: 'error',
                message: `Campo no esperado presente: ${field} = ${result.dteSpecificFields[field]}`
              });
            } else {
              checks.push({
                type: 'success',
                message: `Campo correctamente ausente: ${field}`
              });
            }
          });
        }
      }
      
      return {
        passed: checks.filter(c => c.type === 'error').length === 0,
        result,
        checks
      };
    } catch (error) {
      return {
        passed: false,
        result: null,
        checks: [{
          type: 'error',
          message: `Error en ejecución: ${error.message}`
        }]
      };
    }
  };

  // 🚀 Ejecutar todas las pruebas
  const runAllTests = async () => {
    setRunning(true);
    const results = {};
    
    for (const [tipoDte, dteTests] of Object.entries(testCases)) {
      results[tipoDte] = {
        name: dteTests.name,
        cases: []
      };
      
      for (const testCase of dteTests.cases) {
        const testResult = runTest(tipoDte, testCase);
        results[tipoDte].cases.push({
          name: testCase.name,
          ...testResult
        });
        
        // Simular delay para mostrar progreso
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    setTestResults(results);
    setRunning(false);
  };

  // 📊 Estadísticas de pruebas
  const getTestStats = () => {
    let total = 0;
    let passed = 0;
    
    Object.values(testResults).forEach(dteResult => {
      dteResult.cases.forEach(testCase => {
        total++;
        if (testCase.passed) passed++;
      });
    });
    
    return { total, passed, failed: total - passed };
  };

  // 📥 Exportar resultados
  const exportResults = () => {
    const stats = getTestStats();
    const report = {
      timestamp: new Date().toISOString(),
      summary: stats,
      results: testResults
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dte-test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = getTestStats();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Play className="text-green-600" />
          Suite de Pruebas DTE - Verificación de Cálculos
        </h1>
        <p className="text-gray-600 mb-6">
          Pruebas automatizadas para verificar que los cálculos de impuestos sean correctos según los schemas oficiales del MH.
        </p>

        {/* Controles */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={running}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {running ? 'Ejecutando...' : 'Ejecutar Todas las Pruebas'}
          </button>
          
          {Object.keys(testResults).length > 0 && (
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Exportar Resultados
            </button>
          )}
        </div>

        {/* Estadísticas */}
        {stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Pruebas</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-sm text-green-800">Exitosas</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-red-800">Fallidas</div>
            </div>
          </div>
        )}
      </div>

      {/* Resultados por tipo DTE */}
      {Object.entries(testResults).map(([tipoDte, dteResult]) => (
        <div key={tipoDte} className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {tipoDte} - {dteResult.name}
          </h2>
          
          <div className="space-y-4">
            {dteResult.cases.map((testCase, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  testCase.passed
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    {testCase.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {testCase.name}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    testCase.passed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {testCase.passed ? 'PASÓ' : 'FALLÓ'}
                  </span>
                </div>
                
                {/* Checks */}
                <div className="space-y-1">
                  {testCase.checks.map((check, checkIndex) => (
                    <div
                      key={checkIndex}
                      className={`text-sm flex items-center gap-2 ${
                        check.type === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {check.type === 'success' ? '✓' : '✗'}
                      {check.message}
                    </div>
                  ))}
                </div>
                
                {/* Resultado detallado */}
                {testCase.result && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Ver resultado detallado
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(testCase.result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Instrucciones */}
      {Object.keys(testResults).length === 0 && !running && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Cómo usar esta herramienta
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <div>
                <strong>Ejecutar pruebas:</strong> Haz clic en "Ejecutar Todas las Pruebas" para verificar los cálculos
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <div>
                <strong>Revisar resultados:</strong> Cada prueba muestra si pasó o falló con detalles específicos
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <div>
                <strong>Casos incluidos:</strong> Pruebas para montos mínimos, cálculos de IVA, retenciones, y campos específicos por tipo
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
              <div>
                <strong>Exportar:</strong> Descarga un reporte JSON completo con todos los resultados
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DTETestSuite;