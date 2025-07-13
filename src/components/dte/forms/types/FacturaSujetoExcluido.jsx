// src/components/dte/forms/types/FacturaSujetoExcluido.jsx
// Formulario específico para Factura de Sujeto Excluido (Tipo 14)

import React from 'react';
import { FileText, Ban } from 'lucide-react';
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
} from "../../../data/catalogoGeneral";
import ReceptorForm from '../shared/ReceptorForm';
import CuerpoDocumento from '../shared/CuerpoDocumento';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

function getInitialData() {
  if (!validarConfiguracionEmpresa()) {
    console.error('❌ Configuración de empresa incompleta. Revise src/config/empresa.js');
  }
  const emisorData = getEmisorData();
  const actividadEconomicaDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
  const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
  const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };
  return {
    identificacion: {
      version: 1,
      ambiente: "00",
      tipoDte: "14",
      codigoGeneracion: generateUUID(),
      numeroControl: "DTE-14-00000001-000000000000001",
      tipoModelo: 1,
      tipoOperacion: 1,
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
      direccion: {
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: emisorData.direccion || "Dirección de la empresa"
      },
      telefono: emisorData.telefono || "",
      correo: emisorData.correo || "",
      codEstableMH: "",
      codEstable: "",
      codPuntoVentaMH: "",
      codPuntoVenta: ""
    },
    sujetoExcluido: {
      tipoDocumento: "13",
      numDocumento: "",
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
    cuerpoDocumento: [
      {
        numItem: 1,
        codigo: "",
        descripcion: "",
        cantidad: 1,
        precioUni: 0,
        montoDescu: 0
      }
    ],
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
      pagos: [],
      numPagoElectronico: ""
    },
    extension: {
      motivoExclusion: "",
      observaciones: ""
    }
  };
}

const FacturaSujetoExcluido = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || getInitialData());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const prevDataRef = React.useRef();

  // Campos requeridos específicos para Factura de Sujeto Excluido
  const requiredFields = [
    'identificacion.tipoDte',
    'sujetoExcluido.nombre',
    'sujetoExcluido.nit',
    'cuerpoDocumento'
  ];

  // Restaurar datos solo una vez al montar
  React.useEffect(() => {
    if (initialData && !isInitialized) {
      setFormData(initialData);
      setIsInitialized(true);
    } else if (!initialData && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Notificar cambios al componente padre SOLO si los datos realmente cambian
  React.useEffect(() => {
    if (onDataChange && isInitialized) {
      const prev = prevDataRef.current;
      const curr = formData;
      // Comparación superficial, puedes mejorar con deepEqual si lo deseas
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        prevDataRef.current = curr;
        // Validación básica (puedes mejorar esto)
        const isValid = requiredFields.every(f => !isFieldEmpty(getNestedValue(curr, f)));
        const missingFields = requiredFields.filter(f => isFieldEmpty(getNestedValue(curr, f)));
        const validation = { isValid, missingFields, errors: {} };
        onDataChange(curr, validation);
      }
    }
  }, [formData, onDataChange, isInitialized]);
  
  const getNestedValue = (obj, path) => {
    if (!path || typeof path !== 'string') {
      return undefined;
    }
    return path.split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : undefined, obj);
  };
  
  const isFieldEmpty = (fieldPath) => {
    const value = getNestedValue(formData, fieldPath);
    return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0);
  };
  
  const getFieldClassName = (fieldPath, baseClass = "") => {
    const hasError = isFieldEmpty(fieldPath);
    const isRequired = requiredFields.includes(fieldPath);
    let className = baseClass || "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    if (hasError) {
      className += " border-red-300 focus:border-red-500 focus:ring-red-500";
    } else if (isRequired) {
      className += " border-blue-300";
    } else {
      className += " border-gray-300";
    }
    return className;
  };
  
  const handleExtensionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      extension: {
        ...prev.extension,
        [field]: value
      }
    }));
  };

  const handleSujetoExcluidoChange = (sujetoExcluidoData) => {
    setFormData(prev => ({ 
      ...prev, 
      sujetoExcluido: sujetoExcluidoData 
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Ban className="h-8 w-8 text-gray-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">🚫 Factura de Sujeto Excluido (Tipo 14)</h2>
            <p className="text-gray-700">Documento para sujetos excluidos del IVA</p>
          </div>
        </div>
      </div>
      
      {/* Formulario específico para Sujeto Excluido */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Ban className="h-5 w-5" />
          Información del Sujeto Excluido
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
            <select 
              value={formData.sujetoExcluido.tipoDocumento} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                tipoDocumento: e.target.value
              })}
              className={getFieldClassName('sujetoExcluido.tipoDocumento')}
            >
              <option value="36">NIT (36)</option>
              <option value="13">DUI (13)</option>
              <option value="02">Carnet de Residente (02)</option>
              <option value="03">Pasaporte (03)</option>
              <option value="37">Otro (37)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento *</label>
            <input 
              type="text" 
              value={formData.sujetoExcluido.numDocumento} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                numDocumento: e.target.value
              })}
              className={getFieldClassName('sujetoExcluido.numDocumento')} 
              placeholder="Número de documento" 
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre o Razón Social *</label>
            <input 
              type="text" 
              value={formData.sujetoExcluido.nombre} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                nombre: e.target.value
              })}
              className={getFieldClassName('sujetoExcluido.nombre')} 
              placeholder="Nombre completo o razón social" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
            <select 
              value={formData.sujetoExcluido.direccion.departamento} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                direccion: {
                  ...formData.sujetoExcluido.direccion,
                  departamento: e.target.value,
                  municipio: "" // Reset municipio when department changes
                }
              })}
              className={getFieldClassName('sujetoExcluido.direccion.departamento')}
            >
              <option value="">Seleccionar departamento</option>
              {catalogoDepartamentos.map(depto => (
                <option key={depto.codigo} value={depto.codigo}>
                  {depto.codigo} - {depto.valor}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio *</label>
            <select 
              value={formData.sujetoExcluido.direccion.municipio} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                direccion: {
                  ...formData.sujetoExcluido.direccion,
                  municipio: e.target.value
                }
              })}
              className={getFieldClassName('sujetoExcluido.direccion.municipio')}
              disabled={!formData.sujetoExcluido.direccion.departamento}
            >
              <option value="">Seleccionar municipio</option>
              {formData.sujetoExcluido.direccion.departamento && 
                catalogoMunicipios
                  .filter(muni => muni.departamento === formData.sujetoExcluido.direccion.departamento)
                  .map(muni => (
                    <option key={muni.codigo} value={muni.codigo}>
                      {muni.codigo} - {muni.valor}
                    </option>
                  ))
              }
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Complemento *</label>
            <input 
              type="text" 
              value={formData.sujetoExcluido.direccion.complemento} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                direccion: {
                  ...formData.sujetoExcluido.direccion,
                  complemento: e.target.value
                }
              })}
              className={getFieldClassName('sujetoExcluido.direccion.complemento')} 
              placeholder="Dirección específica, colonia, etc." 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input 
              type="text" 
              value={formData.sujetoExcluido.telefono} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                telefono: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              placeholder="Teléfono" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={formData.sujetoExcluido.correo} 
              onChange={e => handleSujetoExcluidoChange({
                ...formData.sujetoExcluido,
                correo: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              placeholder="correo@ejemplo.com" 
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Motivo de Exclusión y Observaciones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Exclusión *</label>
            <input 
              type="text" 
              value={formData.extension.motivoExclusion} 
              onChange={e => handleExtensionChange('motivoExclusion', e.target.value)} 
              className={getFieldClassName('extension.motivoExclusion')} 
              placeholder="Motivo de la exclusión" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea 
              value={formData.extension.observaciones} 
              onChange={e => handleExtensionChange('observaciones', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              rows={3} 
              placeholder="Observaciones adicionales..." 
            />
          </div>
        </div>
      </div>
      
      <CuerpoDocumento formData={formData} onDataChange={cuerpoData => setFormData(prev => ({ ...prev, cuerpoDocumento: cuerpoData }))} />
    </div>
  );
};

export default FacturaSujetoExcluido; 