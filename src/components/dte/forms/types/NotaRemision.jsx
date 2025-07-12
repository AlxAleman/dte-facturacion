// src/components/dte/forms/types/NotaRemision.jsx
// Formulario específico para Nota de Remisión (Tipo 04)

import React from 'react';
import { FileText, Truck, User, Package } from 'lucide-react';
import { getEmisorData, validarConfiguracionEmpresa } from '../../../../config/empresa';
import { buscarActividadPorCodigo } from '../../data/catalogoActividadEconomica';
import { 
  catalogoDepartamentos,
  catalogoMunicipios,
  buscarPorCodigo
} from '../../data/catalogoGeneral';
import EmisorInfo from '../shared/EmisorInfo';
import ReceptorForm from '../shared/ReceptorForm';
import CuerpoDocumento from '../shared/CuerpoDocumento';

// Función helper para generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

// Función para obtener datos iniciales específicos para Nota de Remisión
function getInitialData() {
  // Validar configuración de empresa
  if (!validarConfiguracionEmpresa()) {
    console.error('❌ Configuración de empresa incompleta. Revise src/config/empresa.js');
  }

  // Obtener datos del emisor desde la configuración
  const emisorData = getEmisorData();

  // Obtener códigos de catálogos oficiales
  const actividadEconomicaDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
  const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
  const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };

  return {
    identificacion: {
      version: 1,
      ambiente: "00", // 00=Prueba, 01=Producción
      tipoDte: "04", // 04=Nota de Remisión
      codigoGeneracion: generateUUID(),
      numeroControl: "DTE-04-00000001-000000000000001",
      tipoModelo: 1, // 1=Modelo previo, 2=Modelo diferido
      tipoOperacion: 1, // 1=Normal, 2=Contingencia
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
      tipoDocumento: "36", // 36=NIT, 13=DUI, 37=Otro, 03=Pasaporte, 02=Carnet de Residente
      numDocumento: "",
      nrc: null,
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
      bienTitulo: "01" // 01=Propio, 02=Tercero
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
      condicionOperacion: 1, // 1=Contado, 2=Crédito, 3=Otro
      pagos: [],
      numPagoElectronico: ""
    },
    // Campos específicos para Nota de Remisión
    documentoRelacionado: [
      {
        tipoDocumento: "01", // 01=Factura de Consumidor, 03=CCF, etc.
        tipoGeneracion: 1, // 1=Pre-impreso, 2=Electrónico
        numeroDocumento: "",
        fechaEmision: new Date().toISOString().split('T')[0],
        monto: 0,
        iva: 0
      }
    ],
    ventaTercero: {
      nit: "",
      nombre: "",
      codActividad: actividadEconomicaDefault.codigo,
      descActividad: actividadEconomicaDefault.valor,
      direccion: {
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: ""
      }
    },
    extension: {
      nombEntrega: "",
      docuEntrega: "",
      nombRecibe: "",
      docuRecibe: "",
      observaciones: ""
    },
    apendice: []
  };
}

const NotaRemision = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || getInitialData());
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Campos requeridos específicos para Nota de Remisión
  const requiredFields = [
    'identificacion.tipoDte',
    'receptor.nombre',
    'receptor.tipoDocumento',
    'receptor.numDocumento',
    'receptor.bienTitulo',
    'documentoRelacionado',
    'ventaTercero.nit',
    'ventaTercero.nombre',
    'extension.nombEntrega',
    'extension.docuEntrega',
    'extension.nombRecibe',
    'extension.docuRecibe',
    'extension.observaciones',
    'cuerpoDocumento'
  ];

  // Restaurar datos solo una vez al montar
  React.useEffect(() => {
    if (initialData && !isInitialized) {
      console.log('📝 Restaurando datos del formulario (una sola vez):', initialData);
      setFormData(initialData);
      setIsInitialized(true);
    } else if (!initialData && !isInitialized) {
      console.log('✅ Sin datos iniciales, habilitando formulario');
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Notificar cambios al componente padre (solo después de inicializar)
  React.useEffect(() => {
    if (onDataChange && isInitialized) {
      onDataChange(formData);
    }
  }, [formData, onDataChange, isInitialized]);

  // Obtener valor anidado del objeto
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Verificar si un campo específico está vacío
  const isFieldEmpty = (fieldPath) => {
    const value = getNestedValue(formData, fieldPath);
    return value === undefined || value === null || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  };

  // Obtener clase CSS para campos con error
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

  // Manejar cambios en campos de identificación
  const handleIdentificacionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      identificacion: {
        ...prev.identificacion,
        [field]: value
      }
    }));
  };

  // Manejar cambios en campos del receptor
  const handleReceptorChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      receptor: {
        ...prev.receptor,
        [field]: value
      }
    }));
  };

  // Manejar cambios en campos anidados del receptor
  const handleReceptorNestedChange = (nestedField, field, value) => {
    setFormData(prev => ({
      ...prev,
      receptor: {
        ...prev.receptor,
        [nestedField]: {
          ...prev.receptor[nestedField],
          [field]: value
        }
      }
    }));
  };

  // Manejar cambios en documento relacionado
  const handleDocumentoRelacionadoChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      documentoRelacionado: prev.documentoRelacionado.map((doc, i) => 
        i === index ? { ...doc, [field]: value } : doc
      )
    }));
  };

  // Agregar nuevo documento relacionado
  const addDocumentoRelacionado = () => {
    setFormData(prev => ({
      ...prev,
      documentoRelacionado: [
        ...prev.documentoRelacionado,
        {
          tipoDocumento: "01",
          tipoGeneracion: 1,
          numeroDocumento: "",
          fechaEmision: new Date().toISOString().split('T')[0],
          monto: 0,
          iva: 0
        }
      ]
    }));
  };

  // Eliminar documento relacionado
  const removeDocumentoRelacionado = (index) => {
    setFormData(prev => ({
      ...prev,
      documentoRelacionado: prev.documentoRelacionado.filter((_, i) => i !== index)
    }));
  };

  // Manejar cambios en venta a tercero
  const handleVentaTerceroChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      ventaTercero: {
        ...prev.ventaTercero,
        [field]: value
      }
    }));
  };

  // Manejar cambios en campos anidados de venta a tercero
  const handleVentaTerceroNestedChange = (nestedField, field, value) => {
    setFormData(prev => ({
      ...prev,
      ventaTercero: {
        ...prev.ventaTercero,
        [nestedField]: {
          ...prev.ventaTercero[nestedField],
          [field]: value
        }
      }
    }));
  };

  // Manejar cambios en extensión
  const handleExtensionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      extension: {
        ...prev.extension,
        [field]: value
      }
    }));
  };

  // Manejar cambios en campos del resumen
  const handleResumenChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      resumen: {
        ...prev.resumen,
        [field]: value
      }
    }));
  };

  // Manejar cambios en items del cuerpo del documento
  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: prev.cuerpoDocumento.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Agregar nuevo item
  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: [
        ...prev.cuerpoDocumento,
        {
          numItem: prev.cuerpoDocumento.length + 1,
          codigo: "",
          descripcion: "",
          cantidad: 1,
          precioUni: 0,
          montoDescu: 0
        }
      ]
    }));
  };

  // Eliminar item
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: prev.cuerpoDocumento.filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, numItem: i + 1 }))
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header específico para Nota de Remisión */}
      <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold text-purple-900">
              📋 Nota de Remisión (Tipo 04)
            </h2>
            <p className="text-purple-700">
              Documento para el traslado de mercancías
            </p>
          </div>
        </div>
      </div>

      {/* Información del Emisor */}
      <EmisorInfo 
        formData={formData} 
        onDataChange={(emisorData) => setFormData(prev => ({ ...prev, emisor: emisorData }))} 
      />

      {/* Información del Receptor */}
      <ReceptorForm 
        formData={formData} 
        onDataChange={(receptorData) => setFormData(prev => ({ ...prev, receptor: receptorData }))} 
      />

      {/* Documentos Relacionados */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos Relacionados
        </h3>
        
        {formData.documentoRelacionado.map((doc, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={doc.tipoDocumento}
                  onChange={(e) => handleDocumentoRelacionadoChange(index, 'tipoDocumento', e.target.value)}
                  className={getFieldClassName(`documentoRelacionado.${index}.tipoDocumento`)}
                >
                  <option value="01">01 - Factura de Consumidor</option>
                  <option value="03">03 - Comprobante de Crédito Fiscal</option>
                  <option value="04">04 - Nota de Remisión</option>
                  <option value="05">05 - Nota de Crédito</option>
                  <option value="06">06 - Nota de Débito</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Generación *
                </label>
                <select
                  value={doc.tipoGeneracion}
                  onChange={(e) => handleDocumentoRelacionadoChange(index, 'tipoGeneracion', parseInt(e.target.value))}
                  className={getFieldClassName(`documentoRelacionado.${index}.tipoGeneracion`)}
                >
                  <option value={1}>1 - Pre-impreso</option>
                  <option value={2}>2 - Electrónico</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  value={doc.numeroDocumento}
                  onChange={(e) => handleDocumentoRelacionadoChange(index, 'numeroDocumento', e.target.value)}
                  className={getFieldClassName(`documentoRelacionado.${index}.numeroDocumento`)}
                  placeholder="Número del documento"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Emisión *
                </label>
                <input
                  type="date"
                  value={doc.fechaEmision}
                  onChange={(e) => handleDocumentoRelacionadoChange(index, 'fechaEmision', e.target.value)}
                  className={getFieldClassName(`documentoRelacionado.${index}.fechaEmision`)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={doc.monto}
                  onChange={(e) => handleDocumentoRelacionadoChange(index, 'monto', parseFloat(e.target.value) || 0)}
                  className={getFieldClassName(`documentoRelacionado.${index}.monto`)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IVA *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={doc.iva}
                  onChange={(e) => handleDocumentoRelacionadoChange(index, 'iva', parseFloat(e.target.value) || 0)}
                  className={getFieldClassName(`documentoRelacionado.${index}.iva`)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => removeDocumentoRelacionado(index)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 rounded"
              >
                Eliminar Documento
              </button>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addDocumentoRelacionado}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 rounded-lg"
        >
          + Agregar Documento Relacionado
        </button>
      </div>

      {/* Venta a Tercero */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Venta a Tercero
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIT del Tercero *
            </label>
            <input
              type="text"
              value={formData.ventaTercero.nit}
              onChange={(e) => handleVentaTerceroChange('nit', e.target.value)}
              className={getFieldClassName('ventaTercero.nit')}
              placeholder="NIT del tercero"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Tercero *
            </label>
            <input
              type="text"
              value={formData.ventaTercero.nombre}
              onChange={(e) => handleVentaTerceroChange('nombre', e.target.value)}
              className={getFieldClassName('ventaTercero.nombre')}
              placeholder="Nombre del tercero"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Actividad
            </label>
            <input
              type="text"
              value={formData.ventaTercero.codActividad}
              onChange={(e) => handleVentaTerceroChange('codActividad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Código de actividad económica"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción de Actividad
            </label>
            <input
              type="text"
              value={formData.ventaTercero.descActividad}
              onChange={(e) => handleVentaTerceroChange('descActividad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Descripción de la actividad"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <input
              type="text"
              value={formData.ventaTercero.direccion?.departamento}
              onChange={(e) => handleVentaTerceroNestedChange('direccion', 'departamento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Código de departamento"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Municipio
            </label>
            <input
              type="text"
              value={formData.ventaTercero.direccion?.municipio}
              onChange={(e) => handleVentaTerceroNestedChange('direccion', 'municipio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Código de municipio"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección Complementaria
            </label>
            <input
              type="text"
              value={formData.ventaTercero.direccion?.complemento}
              onChange={(e) => handleVentaTerceroNestedChange('direccion', 'complemento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Dirección complementaria"
            />
          </div>
        </div>
      </div>

      {/* Información de Entrega */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Información de Entrega
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Quien Entrega *
            </label>
            <input
              type="text"
              value={formData.extension.nombEntrega}
              onChange={(e) => handleExtensionChange('nombEntrega', e.target.value)}
              className={getFieldClassName('extension.nombEntrega')}
              placeholder="Nombre completo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documento de Quien Entrega *
            </label>
            <input
              type="text"
              value={formData.extension.docuEntrega}
              onChange={(e) => handleExtensionChange('docuEntrega', e.target.value)}
              className={getFieldClassName('extension.docuEntrega')}
              placeholder="DUI, NIT, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Quien Recibe *
            </label>
            <input
              type="text"
              value={formData.extension.nombRecibe}
              onChange={(e) => handleExtensionChange('nombRecibe', e.target.value)}
              className={getFieldClassName('extension.nombRecibe')}
              placeholder="Nombre completo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documento de Quien Recibe *
            </label>
            <input
              type="text"
              value={formData.extension.docuRecibe}
              onChange={(e) => handleExtensionChange('docuRecibe', e.target.value)}
              className={getFieldClassName('extension.docuRecibe')}
              placeholder="DUI, NIT, etc."
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones *
            </label>
            <textarea
              value={formData.extension.observaciones}
              onChange={(e) => handleExtensionChange('observaciones', e.target.value)}
              className={getFieldClassName('extension.observaciones')}
              rows={3}
              placeholder="Observaciones sobre la entrega..."
            />
          </div>
        </div>
      </div>

      {/* Cuerpo del Documento */}
      <CuerpoDocumento 
        formData={formData} 
        onDataChange={(cuerpoData) => setFormData(prev => ({ ...prev, cuerpoDocumento: cuerpoData }))} 
      />
    </div>
  );
};

export default NotaRemision; 