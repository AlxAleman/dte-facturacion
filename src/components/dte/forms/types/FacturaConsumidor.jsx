// src/components/dte/forms/types/FacturaConsumidor.jsx
// Formulario específico para Factura de Consumidor (Tipo 01) - VERSIÓN CORREGIDA COMPLETA

import React from 'react';
import { Receipt, User, ShoppingCart, AlertTriangle } from 'lucide-react';
import { CATALOGS } from '../../../data/catalogs';
import { getEmisorData, validarConfiguracionEmpresa } from '../../../../config/empresa';
import {
  actividadesCat019 as actividadesEconomicas,
  buscarPorCodigo as buscarActividadPorCodigo,
  buscarPorValor as buscarActividadPorNombre
} from '../../../data/catalogoActividadEconomica';
import {
  catalogoDepartamentos,
  catalogoMunicipios,
  buscarPorCodigo
} from '../../../data/catalogoGeneral';
import ReceptorForm from '../shared/ReceptorForm';
import CuerpoDocumento from '../shared/CuerpoDocumento';
import { generateUUID, getNestedValue, isFieldEmpty, getFieldClassName, getFieldDisplayName } from '../shared/utils';

// ===== CONFIGURACIÓN Y CONSTANTES =====
const REQUIRED_FIELDS = [
  'identificacion.tipoDte',
  'receptor.nombre',
  'receptor.tipoDocumento',
  'receptor.numDocumento',
  'cuerpoDocumento'
];

// ===== FUNCIÓN DE INICIALIZACIÓN SIMPLIFICADA =====
function getInitialData() {
  if (!validarConfiguracionEmpresa()) {
    console.error('❌ Configuración de empresa incompleta. Revise src/config/empresa.js');
  }

  const emisorData = getEmisorData();
  console.log('🏢 Datos del emisor obtenidos:', emisorData);

  const actividadEconomicaDefault = buscarActividadPorCodigo("62010") || { 
    codigo: "62010", 
    valor: "Programación informática" 
  };
  const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { 
    codigo: "06", 
    valor: "San Salvador" 
  };
  const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { 
    codigo: "23", 
    valor: "SAN SALVADOR CENTRO" 
  };

  const initialData = {
    identificacion: {
      version: 1,
      ambiente: "00",
      tipoDte: "01",
      codigoGeneracion: generateUUID(),
      numeroControl: "DTE-01-00000001-000000000000001",
      tipoModelo: 1,
      tipoOperacion: 1,
      tipoContingencia: null,
      motivoContin: null,
      fecEmi: new Date().toISOString().split('T')[0],
      horEmi: new Date().toTimeString().split(' ')[0],
      tipoMoneda: "USD"
    },
    emisor: {
      nit: emisorData.nit,
      nrc: emisorData.nrc || "123456",
      nombre: emisorData.nombre,
      codActividad: actividadEconomicaDefault.codigo,
      descActividad: actividadEconomicaDefault.valor,
      nombreComercial: emisorData.nombreComercial || null,
      tipoEstablecimiento: emisorData.tipoEstablecimiento || "01",
      codEstableMH: emisorData.codEstableMH || "0001",
      codEstable: emisorData.codEstable || "0001",
      codPuntoVentaMH: emisorData.codPuntoVentaMH || "0001",
      codPuntoVenta: emisorData.codPuntoVenta || "0001",
      direccion: {
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: emisorData.direccion || "Dirección de la empresa"
      }
    },
    receptor: {
      tipoDocumento: "36", // DUI por defecto
      numDocumento: "",
      nrc: null, // null para DUI según schema
      nombre: "",
      codActividad: actividadEconomicaDefault.codigo,
      descActividad: actividadEconomicaDefault.valor,
      direccion: {
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: ""
      },
      telefono: "",
      correo: ""
    },
    
    // 🔥 CUERPO SIMPLIFICADO - Solo campos de entrada para Paso 1
    cuerpoDocumento: [
      {
        numItem: 1,
        tipoItem: 2, // Campo técnico oculto
        codigo: "",
        descripcion: "",
        uniMedida: "59", // Campo técnico oculto
        cantidad: 1,
        precioUni: 0,
        montoDescu: 0
        // Los demás campos se agregan en el Paso 2 (cálculos)
      }
    ],
    
    // 🔥 RESUMEN SIMPLIFICADO - Estructura básica
    resumen: {
      totalNoSuj: 0,
      totalExenta: 0,
      totalGravada: 0,
      subTotalVentas: 0,
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: 0,
      porcentajeDescuento: 0,
      totalDescu: 0,
      tributos: [],
      subTotal: 0,
      ivaRete1: 0,
      reteRenta: 0,
      montoTotalOperacion: 0,
      totalNoGravado: 0,
      totalPagar: 0,
      totalLetras: "",
      totalIva: 0,
      saldoFavor: 0,
      condicionOperacion: 1,
      pagos: [{
        codigo: "01",
        montoPago: 0
      }],
      numPagoElectronico: ""
    },

    // Campos opcionales
    documentoRelacionado: null,
    otrosDocumentos: null,
    ventaTercero: null,
    extension: null,
    apendice: null
  };

  console.log('📋 Datos iniciales generados para FacturaConsumidor:', {
    emisor: initialData.emisor,
    receptor: initialData.receptor,
    cuerpoDocumento: initialData.cuerpoDocumento
  });

  return initialData;
}

// 🔥 VALIDACIÓN SIMPLIFICADA - Solo para Paso 1
const validateForStep1 = (formData) => {
  const errors = [];
  
  // Validar campos básicos requeridos
  if (!formData.receptor?.nombre) {
    errors.push('Nombre del receptor es requerido');
  }
  if (!formData.receptor?.numDocumento) {
    errors.push('Número de documento es requerido');
  }
  if (!formData.cuerpoDocumento || formData.cuerpoDocumento.length === 0) {
    errors.push('Debe agregar al menos un producto');
  } else {
    // Validar que cada producto tenga los campos básicos
    formData.cuerpoDocumento.forEach((item, index) => {
      if (!item.descripcion) {
        errors.push(`Producto ${index + 1}: Descripción es requerida`);
      }
      if (!item.cantidad || item.cantidad <= 0) {
        errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      if (!item.precioUni || item.precioUni <= 0) {
        errors.push(`Producto ${index + 1}: Precio debe ser mayor a 0`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    missingFields: errors,
    errors: {}
  };
};

// ===== COMPONENTE PRINCIPAL =====
const FacturaConsumidor = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || getInitialData());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [municipiosFiltrados, setMunicipiosFiltrados] = React.useState([]);
  const [validationErrors, setValidationErrors] = React.useState([]);
  const prevDataRef = React.useRef();

  // ===== EFECTOS =====
  React.useEffect(() => {
    if (initialData && !isInitialized) {
      setFormData(initialData);
      setIsInitialized(true);
    } else if (!initialData && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Filtrar municipios cuando cambie el departamento
  React.useEffect(() => {
    const departamentoSeleccionado = formData?.receptor?.direccion?.departamento;
    if (departamentoSeleccionado) {
      const municipios = catalogoMunicipios.filter(
        municipio => municipio.departamento === departamentoSeleccionado
      );
      setMunicipiosFiltrados(municipios);
      console.log('🏘️ Municipios filtrados para departamento', departamentoSeleccionado, ':', municipios);
    } else {
      setMunicipiosFiltrados([]);
    }
  }, [formData?.receptor?.direccion?.departamento]);

  // 🔥 VALIDACIÓN CORREGIDA para Paso 1
  React.useEffect(() => {
    if (onDataChange && isInitialized) {
      const prev = prevDataRef.current;
      const curr = formData;
      
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        prevDataRef.current = curr;
        
        // 🆕 USAR VALIDACIÓN SIMPLIFICADA PARA PASO 1
        const validation = validateForStep1(curr);
        
        setValidationErrors(validation.missingFields);
        
        console.log('[VALIDACIÓN FC PASO 1] isValid:', validation.isValid, 'errors:', validation.missingFields);
        
        onDataChange(curr, validation);
      }
    }
  }, [formData, onDataChange, isInitialized]);

  // ===== HANDLERS =====
  const handleIdentificacionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      identificacion: {
        ...prev.identificacion,
        [field]: value
      }
    }));
  };

  const handleResumenChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      resumen: {
        ...prev.resumen,
        [field]: value
      }
    }));
  };

  const handleReceptorChange = (updatedReceptor) => {
    setFormData(prev => ({
      ...prev,
      receptor: { ...prev.receptor, ...updatedReceptor }
    }));
  };

  const handleCuerpoDocumentoChange = (updatedFormData) => {
    setFormData(updatedFormData);
  };

  // ===== RENDER =====
  return (
    <div className="space-y-8">
      
      {/* Header Simple */}
      <div className="bg-green-100 border border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-xl font-bold text-green-900">Factura de Consumidor (Tipo 01)</h2>
            <p className="text-green-700">Documento para ventas a consumidores finales</p>
          </div>
        </div>
      </div>

      {/* Panel de validación */}
      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-800">Campos Requeridos Pendientes</h4>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Información del Receptor */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
        </div>
        <ReceptorForm
          formData={formData.receptor}
          onDataChange={handleReceptorChange}
          requiredFields={REQUIRED_FIELDS}
          isFieldEmpty={isFieldEmpty}
          getFieldClassName={getFieldClassName}
        />
      </div>

      {/* Cuerpo del Documento */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Productos y Servicios</h3>
        </div>
        <CuerpoDocumento
          formData={formData}
          onDataChange={handleCuerpoDocumentoChange}
          requiredFields={REQUIRED_FIELDS}
          isFieldEmpty={isFieldEmpty}
          getFieldClassName={getFieldClassName}
          showCodigo={true}
          showDescripcion={true}
          showCantidad={true}
          showPrecio={true}
          showDescuento={true}
          showSubtotal={true}
          tipoDte="01"
          title="Productos/Servicios"
        />
      </div>

      {/* Configuración del Documento */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración del Documento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condición de Operación <span className="text-red-500">*</span>
            </label>
            <select
              value={formData?.resumen?.condicionOperacion ?? 1}
              onChange={(e) => handleResumenChange('condicionOperacion', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 - Contado</option>
              <option value={2}>2 - Crédito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Moneda <span className="text-red-500">*</span>
            </label>
            <select
              value={formData?.identificacion?.tipoMoneda ?? 'USD'}
              onChange={(e) => handleIdentificacionChange('tipoMoneda', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">USD - Dólar Estadounidense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Emisión <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData?.identificacion?.fecEmi ?? ''}
              onChange={(e) => handleIdentificacionChange('fecEmi', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Debug Info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Debug Info - Factura de Consumidor (Paso 1)</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Items: {formData?.cuerpoDocumento?.length || 0}</div>
            <div>• Receptor válido: {formData?.receptor?.nombre ? '✅' : '❌'}</div>
            <div>• Productos válidos: {formData?.cuerpoDocumento?.every(item => item.descripcion && item.cantidad > 0 && item.precioUni > 0) ? '✅' : '❌'}</div>
            <div>• Total sin IVA: ${((formData?.cuerpoDocumento || []).reduce((total, item) => total + ((item.cantidad * item.precioUni) - item.montoDescu), 0) || 0).toFixed(2)}</div>
          </div>
        </div>
      )}

    </div>
  );
};

// ===== EXPORTACIÓN EXPLÍCITA =====
export default FacturaConsumidor;