// src/components/dte/forms/TestDteFormContainer.jsx
// Componente de prueba para verificar el funcionamiento del DteFormContainer

import React, { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
import DteFormContainer from './DteFormContainer.export';

const TestDteFormContainer = () => {
  const [selectedTipoDte, setSelectedTipoDte] = useState("01");
  const [formData, setFormData] = useState(null);
  const [validationState, setValidationState] = useState({
    isValid: false,
    missingFields: [],
    errors: {}
  });

  // Manejar cambios en los datos del formulario
  const handleDataChange = (data, validation = null) => {
    setFormData(data);
    if (validation) {
      setValidationState(validation);
    }
    console.log('📝 Datos del formulario actualizados:', data);
    if (validation) {
      console.log('✅ Estado de validación:', validation);
    }
  };

  // Generar datos de prueba
  const generateTestData = () => {
    const testData = {
      identificacion: {
        version: 1,
        ambiente: "00",
        tipoDte: selectedTipoDte,
        codigoGeneracion: "TEST-" + Date.now(),
        numeroControl: `DTE-${selectedTipoDte}-00000001-000000000000001`,
        tipoModelo: 1,
        tipoOperacion: 1,
        fecEmi: new Date().toISOString().split('T')[0],
        horEmi: new Date().toTimeString().split(' ')[0],
        tipoMoneda: "USD"
      },
      emisor: {
        nit: "0614-123456-789-0",
        nrc: "123456",
        nombre: "Empresa de Prueba S.A. de C.V.",
        codActividad: "62010",
        descActividad: "Programación informática",
        nombreComercial: "Empresa Test",
        direccion: {
          departamento: "06",
          municipio: "23",
          complemento: "Colonia Centro, San Salvador"
        }
      },
      receptor: {
        nombre: "Cliente de Prueba",
        tipoDocumento: "36",
        numDocumento: "0614-987654-321-0",
        nrc: "654321",
        telefono: "2222-3333",
        correo: "cliente@prueba.com",
        direccion: {
          departamento: "06",
          municipio: "23",
          complemento: "Colonia Norte, San Salvador"
        }
      },
      cuerpoDocumento: [
        {
          numItem: 1,
          codigo: "PROD001",
          descripcion: "Servicio de desarrollo web",
          cantidad: 1,
          precioUni: 100.00,
          montoDescu: 0
        }
      ],
      resumen: {
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: 100.00,
        subTotalVentas: 100.00,
        descuNoSuj: 0,
        descuExenta: 0,
        descuGravada: 0,
        porcentajeDescuento: 0,
        totalDescu: 0,
        tributos: [],
        subTotal: 100.00,
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: 113.00,
        totalNoGravado: 0,
        totalPagar: 113.00,
        totalLetras: "CIENTO TRECE DOLARES CON 00/100",
        totalIva: 13.00,
        saldoFavor: 0,
        condicionOperacion: 1,
        pagos: [],
        numPagoElectronico: ""
      }
    };

    setFormData(testData);
    console.log('🧪 Datos de prueba generados:', testData);
  };

  // Limpiar datos
  const clearData = () => {
    setFormData(null);
    setValidationState({
      isValid: false,
      missingFields: [],
      errors: {}
    });
    console.log('🗑️ Datos limpiados');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Prueba del Sistema de Formularios DTE
            </h1>
          </div>
          <p className="text-gray-600">
            Sistema modular de formularios para diferentes tipos de Documentos Tributarios Electrónicos
          </p>
        </div>

        {/* Controles de prueba */}
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Controles de Prueba
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de DTE
              </label>
              <select
                value={selectedTipoDte}
                onChange={(e) => setSelectedTipoDte(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="01">01 - Factura de Consumidor</option>
                <option value="03">03 - Comprobante de Crédito Fiscal</option>
                <option value="04">04 - Nota de Remisión</option>
                <option value="05">05 - Nota de Crédito</option>
                <option value="06">06 - Nota de Débito</option>
                <option value="07">07 - Comprobante de Retención</option>
                <option value="08">08 - Comprobante de Liquidación</option>
                <option value="09">09 - Documento Contable de Liquidación</option>
                <option value="11">11 - Factura de Exportación</option>
                <option value="14">14 - Factura de Sujeto Excluido</option>
                <option value="15">15 - Comprobante de Donación</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateTestData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                🧪 Generar Datos de Prueba
              </button>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={clearData}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                🗑️ Limpiar Datos
              </button>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => console.log('📊 Datos actuales:', formData)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                📊 Ver en Consola
              </button>
            </div>
          </div>
        </div>

        {/* Estado de validación */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Estado de Validación</h2>
            {validationState.isValid ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Válido</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Inválido</span>
              </div>
            )}
          </div>
          
          {validationState.missingFields.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Campos requeridos faltantes ({validationState.missingFields.length}):
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validationState.missingFields.map((field, index) => (
                  <li key={index}>• {field}</li>
                ))}
              </ul>
            </div>
          )}
          
          {Object.keys(validationState.errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Errores de validación ({Object.keys(validationState.errors).length}):
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(validationState.errors).map(([field, error]) => (
                  <li key={field}>• {field}: {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Formulario DTE */}
        <DteFormContainer
          onDataChange={handleDataChange}
          initialData={formData}
          tipoDte={selectedTipoDte}
        />

        {/* Información del sistema */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Características</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• ✅ Sistema modular por tipo de DTE</li>
                <li>• ✅ Componentes compartidos reutilizables</li>
                <li>• ✅ Validación en tiempo real</li>
                <li>• ✅ Auto-completado inteligente</li>
                <li>• ✅ Interfaz responsiva</li>
                <li>• ✅ Información contextual por tipo</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tipos Soportados</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 01 - Factura de Consumidor</li>
                <li>• 03 - Comprobante de Crédito Fiscal</li>
                <li>• 04 - Nota de Remisión</li>
                <li>• 05 - Nota de Crédito</li>
                <li>• 06 - Nota de Débito</li>
                <li>• 07 - Comprobante de Retención</li>
                <li>• 08 - Comprobante de Liquidación</li>
                <li>• 09 - Documento Contable de Liquidación</li>
                <li>• 11 - Factura de Exportación</li>
                <li>• 14 - Factura de Sujeto Excluido</li>
                <li>• 15 - Comprobante de Donación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDteFormContainer; 