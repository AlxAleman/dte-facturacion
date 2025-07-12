// src/components/dte/forms/types/FacturaConsumidor.jsx
// Formulario específico para Factura de Consumidor (Tipo 01)

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

// Función para obtener datos iniciales específicos para Factura de Consumidor
function getInitialData() {
  // Validar configuración de empresa
  if (!validarConfiguracionEmpresa()) {
    console.error('❌ Configuración de empresa incompleta. Revise src/config/empresa.js');
  }

  // Obtener datos del emisor desde la configuración
  const emisorData = getEmisorData();
  
  console.log('🏢 Datos del emisor obtenidos:', emisorData);

  // Obtener códigos de catálogos oficiales
  const actividadEconomicaDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
  const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
  const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };

  return {
    identificacion: {
      version: 1,
      ambiente: "00", // 00=Prueba, 01=Producción
      tipoDte: "01", // 01=Factura de Consumidor
      codigoGeneracion: generateUUID(),
      numeroControl: "DTE-01-00000001-000000000000001",
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
      condicionOperacion: 1, // 1=Contado, 2=Crédito, 3=Otro
      pagos: [],
      numPagoElectronico: ""
    }
  };
  
  console.log('📋 Datos iniciales generados para FacturaConsumidor:', {
    emisor: initialData.emisor,
    receptor: initialData.receptor,
    cuerpoDocumento: initialData.cuerpoDocumento
  });
  
  return initialData;
}

const FacturaConsumidor = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || getInitialData());
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Campos requeridos específicos para Factura de Consumidor
  const requiredFields = [
    'identificacion.tipoDte',
    'receptor.nombre',
    'receptor.tipoDocumento',
    'receptor.numDocumento',
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
      console.log('📤 Notificando cambios desde FacturaConsumidor:', {
        emisor: formData.emisor,
        receptor: formData.receptor,
        itemsCount: formData.cuerpoDocumento?.length || 0,
        isInitialized
      });
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

      {/* Información del Receptor */}
      <ReceptorForm
        formData={formData}
        onDataChange={setFormData}
        requiredFields={requiredFields}
        isFieldEmpty={isFieldEmpty}
        getFieldClassName={getFieldClassName}
        tipoDte="01"
        showNrc={true}
        showActividad={true}
        showDireccion={true}
        showContacto={true}
      />

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

      {/* Información específica de Factura de Consumidor */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Información de Factura de Consumidor
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Factura de Consumidor:</strong> Para ventas a consumidores finales</p>
          <p>• <strong>IVA:</strong> 13% sobre operaciones gravadas</p>
          <p>• <strong>Retención:</strong> 1% - 10% según aplique</p>
          <p>• <strong>Receptor:</strong> Puede ser persona natural o jurídica</p>
          <p>• <strong>NRC:</strong> Requerido solo para NIT, no aplica para DUI</p>
        </div>
      </div>
    </div>
  );
};

export default FacturaConsumidor; 