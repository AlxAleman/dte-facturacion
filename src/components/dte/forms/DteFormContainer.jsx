// src/components/dte/forms/DteFormContainer.jsx
// Coordinador principal que decide qué formulario mostrar según el tipo de DTE

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Info } from 'lucide-react';
import { CATALOGS } from '../../data/catalogs';

// Importar componentes específicos por tipo de DTE
import {
  FacturaConsumidor,
  ComprobanteCreditoFiscal,
  NotaRemision,
  NotaCredito,
  NotaDebito,
  ComprobanteRetencion,
  ComprobanteLiquidacion,
  DocumentoContableLiquidacion,
  FacturaExportacion,
  FacturaSujetoExcluido,
  ComprobanteDonacion
} from './types';

// Mapeo de tipos de DTE a componentes
const DTE_COMPONENTS = {
  "01": FacturaConsumidor,
  "03": ComprobanteCreditoFiscal,
  "04": NotaRemision,
  "05": NotaCredito,
  "06": NotaDebito,
  "07": ComprobanteRetencion,
  "08": ComprobanteLiquidacion,
  "09": DocumentoContableLiquidacion,
  "11": FacturaExportacion,
  "14": FacturaSujetoExcluido,
  "15": ComprobanteDonacion
};

// Información específica por tipo de DTE
const DTE_INFO = {
  "01": {
    title: "Factura de Consumidor",
    description: "Para ventas a consumidores finales",
    version: 1,
    iva: "13% sobre operaciones gravadas",
    retencion: "1% - 10% según aplique",
    receptor: "Puede ser persona natural o jurídica",
    nrc: "Requerido solo para NIT, no aplica para DUI"
  },
  "03": {
    title: "Comprobante de Crédito Fiscal",
    description: "Para ventas a empresas",
    version: 3,
    iva: "13% con derecho a crédito fiscal",
    retencion: "Incluye IVA Percibido además del retenido",
    receptor: "Solo empresas con NIT y NRC",
    nrc: "Campo específico: ivaPerci1 para IVA percibido"
  },
  "04": {
    title: "Nota de Remisión",
    description: "Para remisión de mercancías",
    version: 3,
    iva: "Documentos relacionados: Facturas o CCF asociados",
    retencion: "Venta por terceros: Información del propietario real",
    receptor: "Responsables: Entrega y recepción de mercancías",
    nrc: "Campos específicos: bienTitulo, documentoRelacionado, ventaTercero"
  },
  "05": {
    title: "Nota de Crédito",
    description: "Para correcciones o devoluciones",
    version: 3,
    iva: "Documentos relacionados: CCF o Facturas de Exportación",
    retencion: "Estructura: Similar a CCF (solo NIT del receptor)",
    receptor: "Incluye IVA Percibido y Retenido",
    nrc: "Campos específicos: documentoRelacionado, ventaTercero"
  },
  "06": {
    title: "Nota de Débito",
    description: "Para ajustes o cargos adicionales",
    version: 3,
    iva: "Documentos relacionados: CCF o Facturas de Exportación",
    retencion: "Estructura: Similar a CCF (solo NIT del receptor)",
    receptor: "Incluye IVA Percibido y Retenido",
    nrc: "Campos específicos: documentoRelacionado, ventaTercero"
  },
  "07": {
    title: "Comprobante de Retención",
    description: "Para retenciones de IVA",
    version: 1,
    iva: "Estructura única: Usa cuerpoDocumento para retenciones",
    retencion: "Campos específicos: Monto sujeto a retención e IVA retenido",
    receptor: "Documentos relacionados: Facturas, CCF o FSE",
    nrc: "Campos específicos: totalSujetoRetencion, totalIVAretenido"
  },
  "08": {
    title: "Comprobante de Liquidación",
    description: "Para liquidaciones de documentos",
    version: 1,
    iva: "Estructura única: Usa cuerpoDocumento para liquidaciones",
    retencion: "Campos específicos: Ventas por tipo e IVA percibido",
    receptor: "Documentos relacionados: Facturas, CCF, Notas de Crédito/Débito",
    nrc: "Campos específicos: ventasPorTipo, ivaPercibido"
  },
  "09": {
    title: "Documento Contable de Liquidación",
    description: "Para liquidaciones contables",
    version: 1,
    iva: "Estructura única: Usa cuerpoDocumento como objeto único",
    retencion: "Campos específicos: Período de liquidación, IVA percibido (2%)",
    receptor: "Campos obligatorios: Responsable de emisión y código de empleado",
    nrc: "Campos específicos: periodoLiquidacion, ivaPercibido2"
  },
  "11": {
    title: "Factura de Exportación",
    description: "Para exportaciones internacionales",
    version: 1,
    iva: "Receptor extranjero: Información completa del comprador",
    retencion: "Documentos asociados: Otros documentos y venta por terceros",
    receptor: "Campos específicos: País destino, INCOTERMS, flete, seguro",
    nrc: "Monto mínimo: $100.00"
  },
  "14": {
    title: "Factura de Sujeto Excluido",
    description: "Para sujetos excluidos del IVA",
    version: 1,
    iva: "Sujeto excluido: Información del comprador excluido",
    retencion: "Sin IVA: No se aplica impuesto al valor agregado",
    receptor: "Campos específicos: Actividad económica y dirección completa",
    nrc: "Campos específicos: sujetoExcluido, actividad económica"
  },
  "15": {
    title: "Comprobante de Donación",
    description: "Para documentar donaciones",
    version: 1,
    iva: "Donatario: Quien recibe la donación (emisor)",
    retencion: "Donante: Quien hace la donación (receptor)",
    receptor: "Campos específicos: Tipo de donación, depreciación, documentos asociados",
    nrc: "Campos específicos: donatario, donante, tipoDonacion"
  }
};

const DteFormContainer = ({ onDataChange, initialData, tipoDte = "01" }) => {
  const [selectedTipoDte, setSelectedTipoDte] = useState(tipoDte);
  const [formData, setFormData] = useState(null);
  const [validationState, setValidationState] = useState({
    isValid: false,
    missingFields: [],
    errors: {}
  });

  // Obtener el componente correspondiente al tipo de DTE
  const DteComponent = DTE_COMPONENTS[selectedTipoDte];
  const dteInfo = DTE_INFO[selectedTipoDte];

  // Debug: Log del componente que se va a renderizar
  console.log('🎯 Renderizando componente para tipo DTE:', selectedTipoDte, 'Componente:', DteComponent?.name);

  // Manejar cambio de tipo de DTE
  const handleTipoDteChange = (newTipoDte) => {
    console.log('🔄 Cambiando tipo de DTE de', selectedTipoDte, 'a', newTipoDte);
    setSelectedTipoDte(newTipoDte);
    
    // Crear datos iniciales para el nuevo tipo de DTE
    const initialDataWithTipoDte = {
      identificacion: {
        tipoDte: newTipoDte,
        // Puedes agregar aquí otros campos de identificacion si lo requieren los formularios
      },
      condicionOperacion: '',
      emisor: {},
      receptor: {},
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
      resumen: {},
      
      // Propiedades específicas para NotaRemision (Tipo 04)
      documentoRelacionado: [],
      ventaTercero: {
        nit: '',
        nombre: '',
        codActividad: '',
        descActividad: '',
        direccion: {
          departamento: '',
          municipio: '',
          complemento: ''
        }
      },
      
      // Propiedades específicas para NotaCredito (Tipo 05)
      tipoNota: '',
      
      // Propiedades específicas para NotaDebito (Tipo 06)
      tipoNotaDebito: '',
      
      // Propiedades específicas para ComprobanteRetencion (Tipo 07)
      totalSujetoRetencion: 0,
      totalIVAretenido: 0,
      
      // Propiedades específicas para ComprobanteLiquidacion (Tipo 08)
      ventasPorTipo: [],
      ivaPercibido: 0,
      
      // Propiedades específicas para DocumentoContableLiquidacion (Tipo 09)
      periodoLiquidacion: '',
      ivaPercibido2: 0,
      
      // Propiedades específicas para FacturaExportacion (Tipo 11)
      paisDestino: '',
      incoterms: '',
      flete: 0,
      seguro: 0,
      
      // Propiedades específicas para FacturaSujetoExcluido (Tipo 14)
      sujetoExcluido: {
        nit: '',
        nombre: '',
        actividad: '',
        direccion: {
          departamento: '',
          municipio: '',
          complemento: ''
        }
      },
      
      // Propiedades específicas para ComprobanteDonacion (Tipo 15)
      donatario: {
        nit: '',
        nombre: ''
      },
      donante: {
        nit: '',
        nombre: ''
      },
      tipoDonacion: '',
      
      // Propiedades comunes adicionales
      extension: {
        nombEntrega: '',
        docuEntrega: '',
        nombRecibe: '',
        docuRecibe: '',
        observaciones: ''
      },
      apendice: []
    };
    
    // Establecer los datos iniciales inmediatamente para que el componente hijo los reciba
    setFormData(initialDataWithTipoDte);
    setValidationState({
      isValid: false,
      missingFields: [],
      errors: {}
    });
    
    // Notificar inmediatamente el cambio de tipo al componente padre
    if (onDataChange) {
      onDataChange(initialDataWithTipoDte, {
        isValid: false,
        missingFields: [],
        errors: {}
      });
    }
  };

  // Manejar cambios en los datos del formulario
  const handleFormDataChange = (data, validation = null) => {
    // Solo modificar los datos si el tipo de DTE no está presente o es diferente
    let dataToUse = data;
    if (!data?.identificacion?.tipoDte || data.identificacion.tipoDte !== selectedTipoDte) {
      dataToUse = {
        ...data,
        identificacion: {
          ...data?.identificacion,
          tipoDte: selectedTipoDte
        }
      };
    }
    
    setFormData(dataToUse);
    
    if (validation) {
      setValidationState(validation);
    }

    // Notificar al componente padre
    if (onDataChange) {
      onDataChange(dataToUse, validation);
    }
  };

  // Efecto para manejar datos iniciales
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setSelectedTipoDte(initialData.identificacion?.tipoDte || "01");
    }
  }, [initialData]);

  // Efecto para manejar cambios en el tipo de DTE inicial - ELIMINADO porque causa problemas
  // useEffect(() => {
  //   if (tipoDte && tipoDte !== selectedTipoDte) {
  //     setSelectedTipoDte(tipoDte);
  //   }
  // }, [tipoDte, selectedTipoDte]);

  // Renderizar componente de error si no existe el tipo de DTE
  if (!DteComponent) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tipo de DTE no soportado
          </h2>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">
            El tipo de DTE <strong>{selectedTipoDte}</strong> no está implementado aún.
          </p>
          <p className="text-red-700 dark:text-red-300 mt-2">
            Tipos soportados: {Object.keys(DTE_COMPONENTS).join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Formulario de Documento Tributario Electrónico
      </h2>

      {/* Selector de tipo de DTE */}
      <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Tipo de Documento Tributario
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Tipo de DTE *
            </label>
            <select
              value={selectedTipoDte}
              onChange={(e) => handleTipoDteChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {CATALOGS.TIPOS_DTE.map(tipo => (
                <option key={tipo.codigo} value={tipo.codigo}>
                  {tipo.codigo} - {tipo.valor}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3 w-full">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Documento seleccionado:</strong>
                <div className="text-lg font-semibold text-blue-600 mt-1">
                  {dteInfo?.title || "Tipo no encontrado"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Versión: {dteInfo?.version || "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renderizar el componente específico del tipo de DTE */}
      <DteComponent
        key={`dte-${selectedTipoDte}`}
        onDataChange={handleFormDataChange}
        initialData={formData}
      />
    </div>
  );
};

// NUEVO: Exportar panel de campos requeridos pendientes
export function CamposRequeridosPendientes({ missingFields }) {
  if (!missingFields || missingFields.length === 0) return null;
  return (
    <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-yellow-600" />
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
          Campos Requeridos Pendientes ({missingFields.length})
        </h4>
      </div>
      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
        {missingFields.map((field, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="text-yellow-600">•</span>
            <span>{field}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// NUEVO: Exportar panel de debug info
export function DebugInfo({ selectedTipoDte, DteComponent, validationState }) {
  return (
    <div className="mb-6 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h4 className="font-semibold text-gray-800 dark:text-white">
          Información de Debug
        </h4>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
        <p><strong>Tipo DTE:</strong> {selectedTipoDte}</p>
        <p><strong>Componente:</strong> {DteComponent?.name || 'No encontrado'}</p>
        <p><strong>Válido:</strong> {validationState.isValid ? 'Sí' : 'No'}</p>
        <p><strong>Campos faltantes:</strong> {validationState.missingFields?.length || 0}</p>
      </div>
    </div>
  );
}

export default DteFormContainer; 