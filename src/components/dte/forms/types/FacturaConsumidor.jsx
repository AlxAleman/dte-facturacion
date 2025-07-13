// src/components/dte/forms/types/FacturaConsumidor.jsx
// Formulario específico para Factura de Consumidor (Tipo 01)

import React from 'react';
import { FileText, Receipt } from 'lucide-react';
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
  const prevDataRef = React.useRef();

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

  // Verificar si un campo específico está vacío
  const isFieldEmptyLocal = (fieldPath) => {
    const value = getNestedValue(formData, fieldPath);
    return isFieldEmpty(value);
  };

  // Obtener clase CSS para campos con error
  const getFieldClassNameLocal = (fieldPath, baseClass = "") => {
    return getFieldClassName(fieldPath, formData, requiredFields, baseClass);
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

  // Render seguro con valores por defecto
  return (
    <div className="space-y-8">
      {/* Banner informativo para Factura de Consumidor */}
      <div className="bg-green-100 border border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-xl font-bold text-green-900">🧾 Factura de Consumidor (Tipo 01)</h2>
            <p className="text-green-700">Documento para ventas a consumidores finales</p>
          </div>
        </div>
      </div>

      {/* Información del Emisor */}
      {/* Eliminar: <EmisorInfo formData={formData || {}} /> */}

      {/* Información del Receptor */}
      <ReceptorForm
        formData={formData || {}}
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
        formData={formData || {}}
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
              value={formData?.resumen?.condicionOperacion ?? 1}
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
              value={formData?.identificacion?.tipoMoneda ?? 'USD'}
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
      {/* Eliminar el bloque de información específica de Factura de Consumidor */}
    </div>
  );
};

export default FacturaConsumidor; 