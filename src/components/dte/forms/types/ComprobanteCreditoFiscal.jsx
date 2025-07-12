import React from 'react';
import { FileText } from 'lucide-react';
import { CATALOGS } from '../../data/catalogs';
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

  // Campos requeridos específicos para CCF
  const requiredFields = [
    'identificacion.tipoDte',
    'receptor.nombre',
    'receptor.nit',
    'receptor.nrc',
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
      {/* Información del Emisor */}
      <EmisorInfo formData={formData} />

      {/* Información del Receptor - Específica para CCF */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Información del Receptor</h3>
          <button
            type="button"
            onClick={() => {
              // Completar automáticamente campos opcionales
              const actividadDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
              const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
              const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };
              
              setFormData(prev => ({
                ...prev,
                receptor: {
                  ...prev.receptor,
                  codActividad: prev.receptor.codActividad || actividadDefault.codigo,
                  descActividad: prev.receptor.descActividad || actividadDefault.valor,
                  telefono: prev.receptor.telefono || "0000-0000",
                  correo: prev.receptor.correo || "cliente@ejemplo.com",
                  direccion: {
                    ...prev.receptor.direccion,
                    departamento: prev.receptor.direccion?.departamento || departamentoDefault.codigo,
                    municipio: prev.receptor.direccion?.municipio || municipioDefault.codigo,
                    complemento: prev.receptor.direccion?.complemento || "Dirección por defecto"
                  }
                }
              }));
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors"
          >
            🤖 Completar automáticamente
          </button>
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
            {isFieldEmpty('receptor.nombre') && (
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
            {isFieldEmpty('receptor.nit') && (
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
            {isFieldEmpty('receptor.nrc') && (
              <p className="text-sm text-red-600 mt-1">NRC es requerido para CCF</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.receptor.telefono}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, telefono: e.target.value }
              }))}
              placeholder="Número de teléfono"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.receptor.correo}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                receptor: { ...prev.receptor, correo: e.target.value }
              }))}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Departamento
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar departamento</option>
                  {catalogoDepartamentos.map(depto => (
                    <option key={depto.codigo} value={depto.codigo}>
                      {depto.valor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Municipio
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!formData.receptor.direccion?.departamento}
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
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Complemento
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
        isFieldEmpty={isFieldEmpty}
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

      {/* Información específica de CCF */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Información de Comprobante de Crédito Fiscal
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Comprobante de Crédito Fiscal:</strong> Para ventas a empresas</p>
          <p>• <strong>IVA:</strong> 13% con derecho a crédito fiscal</p>
          <p>• <strong>Incluye:</strong> IVA Percibido además del retenido</p>
          <p>• <strong>Receptor:</strong> Solo empresas con NIT y NRC</p>
          <p>• <strong>Campos específicos:</strong> ivaPerci1 para IVA percibido</p>
          <p>• <strong>Versión:</strong> 3 (esquema más reciente)</p>
        </div>
      </div>
    </div>
  );
};

export default ComprobanteCreditoFiscal; 