// src/components/dte/forms/types/FacturaExportacion.jsx
// Formulario específico para Factura de Exportación (Tipo 11)

import React from 'react';
import { FileText, Globe } from 'lucide-react';
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
      tipoDte: "11",
      codigoGeneracion: generateUUID(),
      numeroControl: "DTE-11-00000001-000000000000001",
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
      }
    },
    receptor: {
      nit: "",
      nrc: "",
      nombre: "",
      codActividad: actividadEconomicaDefault.codigo,
      descActividad: actividadEconomicaDefault.valor,
      direccion: {
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: ""
      },
      telefono: "",
      correo: "",
      pais: "SV"
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
      paisDestino: "",
      puertoEmbarque: "",
      incoterm: "",
      observaciones: ""
    }
  };
}

const FacturaExportacion = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || getInitialData());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const prevDataRef = React.useRef();

  // Campos requeridos específicos para Factura de Exportación
  const requiredFields = [
    'identificacion.tipoDte',
    'receptor.nombre',
    'receptor.paisDestino',
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
  const handleReceptorChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      receptor: {
        ...prev.receptor,
        [field]: value
      }
    }));
  };
  return (
    <div className="space-y-6">
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Globe className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-blue-900">🌎 Factura de Exportación (Tipo 11)</h2>
            <p className="text-blue-700">Documento para operaciones de exportación</p>
          </div>
        </div>
      </div>
      <ReceptorForm formData={formData} onDataChange={receptorData => setFormData(prev => ({ ...prev, receptor: receptorData }))} />
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Datos de Exportación
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País de Destino *</label>
            <input type="text" value={formData.extension.paisDestino} onChange={e => handleExtensionChange('paisDestino', e.target.value)} className={getFieldClassName('extension.paisDestino')} placeholder="Código de país de destino" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerto de Embarque *</label>
            <input type="text" value={formData.extension.puertoEmbarque} onChange={e => handleExtensionChange('puertoEmbarque', e.target.value)} className={getFieldClassName('extension.puertoEmbarque')} placeholder="Puerto de embarque" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incoterm *</label>
            <input type="text" value={formData.extension.incoterm} onChange={e => handleExtensionChange('incoterm', e.target.value)} className={getFieldClassName('extension.incoterm')} placeholder="Incoterm (ej: FOB, CIF)" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea value={formData.extension.observaciones} onChange={e => handleExtensionChange('observaciones', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} placeholder="Observaciones adicionales..." />
          </div>
        </div>
      </div>
      <CuerpoDocumento formData={formData} onDataChange={cuerpoData => setFormData(prev => ({ ...prev, cuerpoDocumento: cuerpoData }))} />
    </div>
  );
};

export default FacturaExportacion; 