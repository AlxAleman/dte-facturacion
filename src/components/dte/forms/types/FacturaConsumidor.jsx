// src/components/dte/forms/types/FacturaConsumidor.jsx
// Formulario específico para Factura de Consumidor (Tipo 01)

import React from 'react';
import { Receipt, User, ShoppingCart } from 'lucide-react';
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

// ===== FUNCIÓN DE INICIALIZACIÓN =====
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
      tipoDocumento: "13", // Cambio a DUI por defecto para ser consistente
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
      condicionOperacion: 1,
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

// ===== COMPONENTE PRINCIPAL =====
const FacturaConsumidor = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || getInitialData());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [municipiosFiltrados, setMunicipiosFiltrados] = React.useState([]);
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

  React.useEffect(() => {
    if (onDataChange && isInitialized) {
      const prev = prevDataRef.current;
      const curr = formData;
      
      if (JSON.stringify(prev) !== JSON.stringify(curr)) {
        prevDataRef.current = curr;
        const isValid = REQUIRED_FIELDS.every(f => !isFieldEmpty(getNestedValue(curr, f)));
        const missingFields = REQUIRED_FIELDS.filter(f => isFieldEmpty(getNestedValue(curr, f)));
        const validation = { isValid, missingFields, errors: {} };
        // Log temporal para depuración
        console.log('[VALIDACIÓN] isValid:', isValid, 'missingFields:', missingFields, 'valores:', {
          tipoDte: getNestedValue(curr, 'identificacion.tipoDte'),
          nombre: getNestedValue(curr, 'receptor.nombre'),
          tipoDocumento: getNestedValue(curr, 'receptor.tipoDocumento'),
          numDocumento: getNestedValue(curr, 'receptor.numDocumento'),
          cuerpoDocumento: getNestedValue(curr, 'cuerpoDocumento')
        });
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

  // Handler para cambios en el receptor (incluyendo municipios)
  const handleReceptorChange = (updatedReceptor) => {
    setFormData(prev => ({
      ...prev,
      receptor: { ...prev.receptor, ...updatedReceptor }
    }));
  };

  // Handler específico para cambio de departamento
  const handleDepartamentoChange = (departamentoCode) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        receptor: {
          ...prev.receptor,
          direccion: {
            ...prev.receptor.direccion,
            departamento: departamentoCode,
            municipio: "" // Limpiar municipio al cambiar departamento
          }
        }
      };
      return newData;
    });
  };

  // Handler específico para cambio de municipio
  const handleMunicipioChange = (municipioCode) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        receptor: {
          ...prev.receptor,
          direccion: {
            ...prev.receptor.direccion,
            municipio: municipioCode
          }
        }
      };
      return newData;
    });
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

      {/* Información del Receptor */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
        </div>
        <ReceptorForm
          formData={formData.receptor}
          onDataChange={handleReceptorChange}
          // Puedes agregar aquí otros props como requiredFields, isFieldEmpty, getFieldClassName, etc. si son necesarios
        />

        {/* Sección de Dirección Manual - ELIMINADA POR DUPLICIDAD */}
      </div>

      {/* Cuerpo del Documento */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Productos y Servicios</h3>
        </div>
        <CuerpoDocumento
          formData={formData || {}}
          onDataChange={setFormData}
          requiredFields={REQUIRED_FIELDS}
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
      </div>

      {/* Información Adicional Simplificada */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración del Documento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Emisión
            </label>
            <input
              type="date"
              value={formData?.identificacion?.fecEmi ?? ''}
              onChange={(e) => handleIdentificacionChange('fecEmi', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default FacturaConsumidor;