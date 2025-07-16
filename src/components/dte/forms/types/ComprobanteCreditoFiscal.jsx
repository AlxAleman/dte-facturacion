import React from 'react';
import { FileText } from 'lucide-react';
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

// Función helper para generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

// Función para obtener datos iniciales específicos para CCF
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
      version: 3,
      ambiente: "00", // 00=Prueba, 01=Producción
      tipoDte: "03", // 03=Comprobante de Crédito Fiscal
      codigoGeneracion: generateUUID(),
      numeroControl: "DTE-03-00000001-000000000000001",
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
      // 🔥 CORREGIDO: Agregar campos faltantes críticos
      telefono: emisorData.telefono || "",
      correo: emisorData.correo || "",
      direccion: {
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: emisorData.direccion || "Dirección de la empresa"
      }
    },
    receptor: {
      nit: "", // Para CCF solo se usa NIT, no tipoDocumento/numDocumento
      nrc: "",
      nombre: "",
      codActividad: actividadEconomicaDefault.codigo,
      descActividad: actividadEconomicaDefault.valor,
      nombreComercial: "", // Campo requerido según esquema
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
      ivaPerci1: 0, // Campo específico para CCF
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
    }
  };
}

const ComprobanteCreditoFiscal = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || getInitialData());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const prevDataRef = React.useRef();

  // Campos requeridos específicos para CCF según esquema fe-ccf-v3.json
  const requiredFields = [
    'identificacion.tipoDte',
    'receptor.nombre',
    'receptor.nit',
    'receptor.nrc',
    'receptor.codActividad',
    'receptor.descActividad',
    'receptor.nombreComercial',
    'receptor.direccion.departamento',
    'receptor.direccion.municipio',
    'receptor.direccion.complemento',
    'receptor.telefono',
    'receptor.correo',
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

  // Notificar cambios al componente padre SOLO si los datos realmente cambian
  React.useEffect(() => {
    if (onDataChange && isInitialized) {
      const prev = prevDataRef.current;
      const curr = formData;
      // Comparación superficial, puedes mejorar con deepEqual si lo deseas
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        prevDataRef.current = curr;
        
                  // 🔥 CORREGIDO: Validación mejorada con delay para asegurar que los datos estén listos
        setTimeout(() => {
          const isValid = requiredFields.every(f => !isFieldEmpty(getNestedValue(curr, f)));
          const missingFields = requiredFields.filter(f => isFieldEmpty(getNestedValue(curr, f)));
          const validation = { isValid, missingFields, errors: {} };
          
          console.log('🔍 Validación CCF (con delay):', {
            isValid,
            missingFields,
            requiredFields,
            formDataKeys: Object.keys(curr || {}),
            receptorKeys: Object.keys(curr?.receptor || {}),
            // Debug detallado de cada campo requerido
            camposDetallados: requiredFields.map(f => ({
              campo: f,
              valor: getNestedValue(curr, f),
              estaVacio: isFieldEmpty(getNestedValue(curr, f)),
              tipo: typeof getNestedValue(curr, f)
            }))
          });
          
          onDataChange(curr, validation);
        }, 100); // Pequeño delay para asegurar que los datos estén completamente cargados
      }
    }
  }, [formData, onDataChange, isInitialized]);

  // Obtener valor anidado del objeto
  const getNestedValue = (obj, path) => {
    if (!path || typeof path !== 'string') {
      return undefined;
    }
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Verificar si un campo específico está vacío
  const isFieldEmpty = (value) => {
    // 🔥 CORREGIDO: Validación más robusta
    let isEmpty = false;
    
    if (value === undefined || value === null) {
      isEmpty = true;
    } else if (typeof value === 'string') {
      isEmpty = value.trim() === '';
    } else if (Array.isArray(value)) {
      isEmpty = value.length === 0;
    } else if (typeof value === 'object') {
      isEmpty = Object.keys(value).length === 0;
    } else {
      isEmpty = false; // Para números, booleanos, etc.
    }
    
    return isEmpty;
  };

  // Obtener clase CSS para campos con error
  const getFieldClassName = (fieldPath, baseClass = "") => {
    const hasError = isFieldEmpty(getNestedValue(formData, fieldPath));
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

  return (
    <div className="space-y-8">
      {/* Banner informativo para Comprobante de Crédito Fiscal */}
      <div className="bg-cyan-100 border border-cyan-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-cyan-600" />
            <div>
              <h2 className="text-xl font-bold text-cyan-900">📄 Comprobante de Crédito Fiscal (Tipo 03)</h2>
              <p className="text-cyan-700">Documento para ventas a contribuyentes con crédito fiscal</p>
            </div>
          </div>
          <button
            onClick={() => {
              console.log('🔍 DEBUG - Estado actual del formulario:', {
                formData,
                requiredFields,
                validation: requiredFields.map(f => ({
                  field: f,
                  value: getNestedValue(formData, f),
                  isEmpty: isFieldEmpty(getNestedValue(formData, f))
                })),
                // Mostrar solo los campos que están vacíos
                camposVacios: requiredFields.filter(f => isFieldEmpty(getNestedValue(formData, f))),
                // Mostrar valores específicos del receptor
                receptorValues: {
                  nombre: formData.receptor?.nombre,
                  nit: formData.receptor?.nit,
                  nrc: formData.receptor?.nrc,
                  codActividad: formData.receptor?.codActividad,
                  descActividad: formData.receptor?.descActividad,
                  nombreComercial: formData.receptor?.nombreComercial,
                  telefono: formData.receptor?.telefono,
                  correo: formData.receptor?.correo,
                  direccion: formData.receptor?.direccion
                }
              });
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Debug
          </button>
        </div>
      </div>

      {/* Información del Emisor */}
      {/* Eliminar: <EmisorInfo formData={formData} /> */}

      {/* Información del Receptor - Específica para CCF */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Información del Receptor</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Receptor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.nombre}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, nombre: e.target.value }
              }))}
              placeholder="Nombre completo o razón social"
              className={getFieldClassName('receptor.nombre')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.nombre')) && (
              <p className="text-sm text-red-600 mt-1">Nombre del receptor es requerido</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIT del Receptor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.nit}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, nit: e.target.value }
              }))}
              placeholder="NIT del receptor (ej: 0614-123456-789-0)"
              className={getFieldClassName('receptor.nit')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.nit')) && (
              <p className="text-sm text-red-600 mt-1">NIT del receptor es requerido</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NRC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.nrc}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, nrc: e.target.value }
              }))}
              placeholder="Número de registro de contribuyente"
              className={getFieldClassName('receptor.nrc')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.nrc')) && (
              <p className="text-sm text-red-600 mt-1">NRC es requerido para CCF</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Actividad Económica <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.codActividad}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, codActividad: e.target.value }
              }))}
              placeholder="Código de actividad (ej: 62010)"
              className={getFieldClassName('receptor.codActividad')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.codActividad')) && (
              <p className="text-sm text-red-600 mt-1">Código de actividad es requerido</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción de Actividad Económica <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.descActividad}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, descActividad: e.target.value }
              }))}
              placeholder="Descripción de la actividad económica"
              className={getFieldClassName('receptor.descActividad')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.descActividad')) && (
              <p className="text-sm text-red-600 mt-1">Descripción de actividad es requerida</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Comercial <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.nombreComercial}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, nombreComercial: e.target.value }
              }))}
              placeholder="Nombre comercial del receptor"
              className={getFieldClassName('receptor.nombreComercial')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.nombreComercial')) && (
              <p className="text-sm text-red-600 mt-1">Nombre comercial es requerido</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.telefono}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, telefono: e.target.value }
              }))}
              placeholder="Número de teléfono"
              className={getFieldClassName('receptor.telefono')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.telefono')) && (
              <p className="text-sm text-red-600 mt-1">Teléfono es requerido</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.receptor.correo}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, correo: e.target.value }
              }))}
              placeholder="correo@ejemplo.com"
              className={getFieldClassName('receptor.correo')}
              required
            />
            {isFieldEmpty(getNestedValue(formData, 'receptor.correo')) && (
              <p className="text-sm text-red-600 mt-1">Correo electrónico es requerido</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.receptor.direccion?.departamento || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receptor: {
                      ...prev.receptor,
                      direccion: {
                        ...prev.receptor.direccion,
                        departamento: e.target.value
                      }
                    }
                  }))}
                  className={getFieldClassName('receptor.direccion.departamento')}
                  required
                >
                  <option value="">Seleccionar departamento</option>
                  {catalogoDepartamentos.map(depto => (
                    <option key={depto.codigo} value={depto.codigo}>
                      {depto.valor}
                    </option>
                  ))}
                </select>
                {isFieldEmpty(getNestedValue(formData, 'receptor.direccion.departamento')) && (
                  <p className="text-xs text-red-600 mt-1">Departamento es requerido</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.receptor.direccion?.municipio || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receptor: {
                      ...prev.receptor,
                      direccion: {
                        ...prev.receptor.direccion,
                        municipio: e.target.value
                      }
                    }
                  }))}
                  className={getFieldClassName('receptor.direccion.municipio')}
                  disabled={!formData.receptor.direccion?.departamento}
                  required
                >
                  <option value="">Seleccionar municipio</option>
                  {formData.receptor.direccion?.departamento && 
                    catalogoMunicipios
                      .filter(muni => muni.departamento === formData.receptor.direccion.departamento)
                      .map(muni => (
                        <option key={muni.codigo} value={muni.codigo}>
                          {muni.valor}
                        </option>
                      ))
                  }
                </select>
                {isFieldEmpty(getNestedValue(formData, 'receptor.direccion.municipio')) && (
                  <p className="text-xs text-red-600 mt-1">Municipio es requerido</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Complemento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.receptor.direccion?.complemento || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    receptor: {
                      ...prev.receptor,
                      direccion: {
                        ...prev.receptor.direccion,
                        complemento: e.target.value
                      }
                    }
                  }))}
                  placeholder="Dirección específica"
                  className={getFieldClassName('receptor.direccion.complemento')}
                  required
                />
                {isFieldEmpty(getNestedValue(formData, 'receptor.direccion.complemento')) && (
                  <p className="text-xs text-red-600 mt-1">Complemento de dirección es requerido</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo del Documento */}
      <CuerpoDocumento
        formData={formData}
        onDataChange={setFormData}
        requiredFields={requiredFields}
        isFieldEmpty={(fieldPath) => isFieldEmpty(getNestedValue(formData, fieldPath))}
        getFieldClassName={getFieldClassName}
        showCodigo={true}
        showDescripcion={true}
        showCantidad={true}
        showPrecio={true}
        showDescuento={true}
        showSubtotal={true}
        title="Productos/Servicios"
      />

      {/* Información adicional */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condición de Operación
            </label>
            <select
              value={formData.resumen.condicionOperacion}
              onChange={(e) => handleResumenChange('condicionOperacion', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>1 - Contado</option>
              <option value={2}>2 - Crédito</option>
              <option value={3}>3 - Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Moneda
            </label>
            <select
              value={formData.identificacion.tipoMoneda}
              onChange={(e) => handleIdentificacionChange('tipoMoneda', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">USD - Dólar Estadounidense</option>
              <option value="EUR">EUR - Euro</option>
              <option value="CRC">CRC - Colón Costarricense</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprobanteCreditoFiscal; 