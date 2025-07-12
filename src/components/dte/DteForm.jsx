import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Minus, Trash2, FileText, AlertCircle } from 'lucide-react';
import { CATALOGS, getCatalogValue } from '../data/catalogs';
import { getEmisorData, validarConfiguracionEmpresa } from '../../config/empresa';
import { getNombreDepartamento, getNombreMunicipio } from '../../utils/geoCatalogs';
// 🆕 NUEVOS CATÁLOGOS OFICIALES
import { actividadesCat019 as actividadesEconomicas, buscarPorCodigo as buscarActividadPorCodigo, buscarPorValor as buscarActividadPorNombre } from '../data/catalogoActividadEconomica';
// import { paises, buscarPaisPorCodigo } from '../data/catalogoPaises.js';
import { 
  catalogoAmbiente, 
  catalogoTipoDocumento, 
  catalogoModeloFacturacion,
  catalogoDepartamentos,
  catalogoMunicipios,
  catalogoUnidadMedida,
  catalogoCondicionOperacion,
  catalogoFormaPago,
  catalogoTipoPersona,
  buscarPorCodigo
} from '../data/catalogoGeneral';

// 🆕 TEMPORALMENTE COMENTADO: Importar indicador de validación de esquemas
// import SchemaValidationIndicator from '../services/SchemaValidationIndicator';
// import { schemaValidator } from '../../services/schemaValidator';

// Función helper para generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

// Función para obtener datos iniciales del formulario
function getInitialData() {
  // Validar configuración de empresa
  if (!validarConfiguracionEmpresa()) {
    console.error('❌ Configuración de empresa incompleta. Revise src/config/empresa.js');
  }

  // Obtener datos del emisor desde la configuración
  const emisorData = getEmisorData();

  // 🆕 OBTENER CÓDIGOS DE CATÁLOGOS OFICIALES
  const actividadEconomicaDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
  const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
  const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };

  return {
    identificacion: {
      version: 1, // ✅ Campo requerido por esquema
      ambiente: "00", // ✅ CAT-001: 00=Prueba, 01=Producción
      tipoDte: "01", // ✅ CAT-002: 01=Factura
      codigoGeneracion: generateUUID(),
      numeroControl: "DTE-01-00000001-000000000000001",
      tipoModelo: 1, // ✅ CAT-003: 1=Modelo previo, 2=Modelo diferido
      tipoOperacion: 1, // ✅ CAT-004: 1=Normal, 2=Contingencia
      fecEmi: new Date().toISOString().split('T')[0],
      horEmi: new Date().toTimeString().split(' ')[0],
      tipoMoneda: "USD"
    },
    emisor: {
      nit: emisorData.nit,
      nrc: emisorData.nrc || "123456", // ✅ Campo requerido por esquema
      nombre: emisorData.nombre,
      codActividad: actividadEconomicaDefault.codigo, // ✅ CAT-019: Código oficial de actividad económica
      descActividad: actividadEconomicaDefault.valor,
      nombreComercial: emisorData.nombreComercial || null,
      direccion: {
        departamento: departamentoDefault.codigo, // ✅ CAT-012: Código oficial de departamento
        municipio: municipioDefault.codigo, // ✅ CAT-013: Código oficial de municipio
        complemento: emisorData.direccion || "Dirección de la empresa"
      },
      telefono: emisorData.telefono || "", // ✅ Agregar teléfono de la configuración
      correo: emisorData.correo || "" // ✅ Agregar correo de la configuración
    },
    receptor: {
      tipoDocumento: "36", // ✅ CAT-022: 36=NIT, 13=DUI, 37=Otro, 03=Pasaporte, 02=Carnet de Residente
      numDocumento: "",
      nrc: null, // ✅ Campo requerido por esquema (null para DUI)
      nombre: "",
      codActividad: actividadEconomicaDefault.codigo, // ✅ CAT-019: Código oficial de actividad económica
      descActividad: actividadEconomicaDefault.valor,
      direccion: {
        departamento: departamentoDefault.codigo, // ✅ CAT-012: Código oficial de departamento
        municipio: municipioDefault.codigo, // ✅ CAT-013: Código oficial de municipio
        complemento: ""
      },
      telefono: "",
      correo: "",
      bienTitulo: "01" // ✅ CAT-020: 01=Propio, 02=Tercero
    },
    // 🆕 NUEVO: Inicialización para Sujeto Excluido (Tipo 14)
    sujetoExcluido: {
      tipoDocumento: "13", // ✅ CAT-022: 36=NIT, 13=DUI, 37=Otro, 03=Pasaporte, 02=Carnet de Residente
      numDocumento: "",
      nombre: "",
      codActividad: actividadEconomicaDefault.codigo, // ✅ CAT-019: Código oficial de actividad económica
      descActividad: actividadEconomicaDefault.valor,
      direccion: {
        departamento: departamentoDefault.codigo, // ✅ CAT-012: Código oficial de departamento
        municipio: municipioDefault.codigo, // ✅ CAT-013: Código oficial de municipio
        complemento: ""
      },
      telefono: "",
      correo: ""
    },
    // 🆕 NUEVO: Inicialización para Comprobante de Donación (Tipo 15)
    donatario: {
      nombre: "",
      tipoDocumento: "13",
      numDocumento: "",
      codActividad: actividadEconomicaDefault.codigo,
      descActividad: actividadEconomicaDefault.valor,
      direccion: {
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: ""
      }
    },
    donante: {
      nombre: "",
      tipoDocumento: "13",
      numDocumento: "",
      codDomiciliado: "01", // ✅ CAT-021: 01=Domiciliado, 02=No Domiciliado
      codPais: "SV" // ✅ CAT-024: Código de país
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
      porcentajeDescuento: 0, // ✅ Campo requerido por esquema
      totalDescu: 0,
      tributos: [], // ✅ Campo requerido por esquema
      subTotal: 0,
      ivaRete1: 0, // ✅ Campo requerido por esquema
      reteRenta: 0,
      montoTotalOperacion: 0,
      totalNoGravado: 0,
      totalPagar: 0,
      totalLetras: "", // ✅ Campo requerido por esquema
      totalIva: 0,
      saldoFavor: 0, // ✅ Campo requerido por esquema
      condicionOperacion: 1, // ✅ CAT-016: 1=Contado, 2=Crédito, 3=Otro
      pagos: [], // ✅ Campo requerido por esquema
      numPagoElectronico: "" // ✅ Campo requerido por esquema
    },
    documentoRelacionado: [], // Para Nota de Remisión
    ventaTercero: {}, // Para Nota de Remisión
    extension: { // Para Nota de Remisión
      nombEntrega: "",
      docuEntrega: "",
      nombRecibe: "",
      docuRecibe: "",
      observaciones: ""
    },
    apendice: [] // Para Nota de Remisión
  };
}

const DteForm = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = useState(initialData || getInitialData());
  const [tipoDte, setTipoDte] = useState(initialData?.identificacion?.tipoDte || "01");
  const [schemaReady, setSchemaReady] = useState(false);
  const [requiredFields, setRequiredFields] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // 🆕 NUEVO: Estado para validación de campos requeridos
  const [missingRequiredFields, setMissingRequiredFields] = useState([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // Flag para saber si estamos inicializando con datos existentes
  const [isInitialized, setIsInitialized] = useState(false);

  // 🆕 NUEVO: Estado para el buscador de actividad económica
  const [showActividadSuggestions, setShowActividadSuggestions] = useState(false);

  // 🆕 NUEVO: Memoizar resultados de búsqueda para evitar re-renders innecesarios
  const resultadosBusqueda = useMemo(() => {
    if (!formData.receptor.descActividad || formData.receptor.descActividad.trim() === '') {
      return [];
    }
    return buscarActividadPorNombre(formData.receptor.descActividad).slice(0, 10);
  }, [formData.receptor.descActividad]);

  // 🆕 NUEVO: Manejar clic fuera del buscador de actividad económica
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actividad-search-container')) {
        setShowActividadSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🆕 TEMPORALMENTE COMENTADO: Inicializar validador y obtener campos requeridos
  // useEffect(() => {
  //   async function initSchema() {
  //     if (!schemaValidator.isInitialized) {
  //       await schemaValidator.initialize();
  //     }
  //     const schemaInfo = schemaValidator.getSchemaInfo(tipoDte);
  //     setRequiredFields(schemaInfo?.requiredFields || []);
  //     setSchemaReady(true);
  //   }
  //   initSchema();
  // }, [tipoDte]);

  // 🆕 TEMPORAL: Configurar campos requeridos básicos - OPTIMIZADO
  useEffect(() => {
    let basicRequiredFields = [
      'identificacion.tipoDte',
      'receptor.nombre',
      'receptor.tipoDocumento',
      'receptor.numDocumento',
      'cuerpoDocumento'
    ];

    // 🆕 NUEVO: Campos específicos según tipo de DTE
    if (formData.identificacion.tipoDte === "03") {
      basicRequiredFields.push('receptor.nrc');
    } else if (formData.identificacion.tipoDte === "04") {
      basicRequiredFields.push(
        'receptor.bienTitulo',
        'documentoRelacionado',
        'ventaTercero.nit',
        'ventaTercero.nombre',
        'extension.nombEntrega',
        'extension.docuEntrega',
        'extension.nombRecibe',
        'extension.docuRecibe',
        'extension.observaciones'
      );
    } else if (formData.identificacion.tipoDte === "05") {
      basicRequiredFields.push(
        'receptor.nrc',
        'documentoRelacionado',
        'ventaTercero.nit',
        'ventaTercero.nombre',
        'extension.nombEntrega',
        'extension.docuEntrega',
        'extension.nombRecibe',
        'extension.docuRecibe',
        'extension.observaciones'
      );
    } else if (formData.identificacion.tipoDte === "06") {
      basicRequiredFields.push(
        'receptor.nrc',
        'documentoRelacionado',
        'ventaTercero.nit',
        'ventaTercero.nombre',
        'extension.nombEntrega',
        'extension.docuEntrega',
        'extension.nombRecibe',
        'extension.docuRecibe',
        'extension.observaciones'
      );
    } else if (formData.identificacion.tipoDte === "07") {
      basicRequiredFields.push(
        'receptor.nrc',
        'extension.nombEntrega',
        'extension.docuEntrega',
        'extension.nombRecibe',
        'extension.docuRecibe',
        'extension.observaciones'
      );
    } else if (formData.identificacion.tipoDte === "08") {
      basicRequiredFields.push(
        'receptor.nrc',
        'extension.nombEntrega',
        'extension.docuEntrega',
        'extension.nombRecibe',
        'extension.docuRecibe',
        'extension.observaciones'
      );
    } else if (formData.identificacion.tipoDte === "09") {
      basicRequiredFields.push(
        'receptor.nrc',
        'extension.nombEntrega',
        'extension.docuEntrega',
        'extension.codEmpleado'
      );
    } else if (formData.identificacion.tipoDte === "11") {
      basicRequiredFields.push(
        'receptor.nombre',
        'receptor.tipoDocumento',
        'receptor.numDocumento',
        'receptor.codPais',
        'receptor.nombrePais',
        'receptor.complemento',
        'receptor.tipoPersona',
        'receptor.descActividad'
      );
    } else if (formData.identificacion.tipoDte === "14") {
      basicRequiredFields.push(
        'sujetoExcluido.nombre',
        'sujetoExcluido.tipoDocumento',
        'sujetoExcluido.numDocumento',
        'sujetoExcluido.codActividad',
        'sujetoExcluido.descActividad',
        'sujetoExcluido.direccion.departamento',
        'sujetoExcluido.direccion.municipio',
        'sujetoExcluido.direccion.complemento'
      );
    } else if (formData.identificacion.tipoDte === "15") {
      basicRequiredFields.push(
        'donatario.nombre',
        'donatario.tipoDocumento',
        'donatario.numDocumento',
        'donatario.codActividad',
        'donatario.descActividad',
        'donatario.direccion.departamento',
        'donatario.direccion.municipio',
        'donatario.direccion.complemento',
        'donante.nombre',
        'donante.tipoDocumento',
        'donante.numDocumento',
        'donante.codDomiciliado',
        'donante.codPais'
      );
    }

    setRequiredFields(basicRequiredFields);
    setSchemaReady(true);
  }, [tipoDte, formData.identificacion.tipoDte]);

  // 🔧 FIX: Restaurar datos solo una vez al montar
  useEffect(() => {
    if (initialData && !isInitialized) {
      console.log('📝 Restaurando datos del formulario (una sola vez):', initialData);
      setFormData(initialData);
      setIsInitialized(true);
    } else if (!initialData && !isInitialized) {
      // Si no hay datos iniciales, marcar como inicializado para permitir onDataChange
      console.log('✅ Sin datos iniciales, habilitando formulario');
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Notificar cambios al componente padre (solo después de inicializar)
  useEffect(() => {
    if (onDataChange && isInitialized) {
      onDataChange(formData);
    }
  }, [formData, onDataChange, isInitialized]);

  // 🆕 NUEVA FUNCIÓN: Validar campos requeridos en tiempo real
  const validateRequiredFields = useCallback(() => {
    if (!schemaReady || requiredFields.length === 0) {
      setIsFormValid(false);
      setMissingRequiredFields([]);
      return;
    }

    const missing = [];
    const errors = {};

    requiredFields.forEach(fieldPath => {
      const value = getNestedValue(formData, fieldPath);
      const isEmpty = value === undefined || value === null || value === '' || 
                     (Array.isArray(value) && value.length === 0) ||
                     (typeof value === 'object' && Object.keys(value).length === 0);

      if (isEmpty) {
        missing.push(fieldPath);
        errors[fieldPath] = 'Campo requerido';
      }
    });

    // Validaciones especiales para arrays
    if (requiredFields.includes('cuerpoDocumento') && 
        (!formData.cuerpoDocumento || formData.cuerpoDocumento.length === 0)) {
      missing.push('cuerpoDocumento');
      errors['cuerpoDocumento'] = 'Debe agregar al menos un producto/servicio';
    }

    // Validar cada ítem del cuerpo del documento
    if (formData.cuerpoDocumento && formData.cuerpoDocumento.length > 0) {
      formData.cuerpoDocumento.forEach((item, index) => {
        const itemRequiredFields = requiredFields.filter(field => 
          field.startsWith(`cuerpoDocumento.${index}.`)
        );
        
        itemRequiredFields.forEach(fieldPath => {
          const fieldName = fieldPath.split('.').pop();
          const value = item[fieldName];
          const isEmpty = value === undefined || value === null || value === '' || 
                         (typeof value === 'number' && value <= 0);

          if (isEmpty) {
            missing.push(fieldPath);
            errors[fieldPath] = 'Campo requerido';
          }
        });
      });
    }

    setMissingRequiredFields(missing);
    setValidationErrors(errors);
    setIsFormValid(missing.length === 0);

    // Notificar al componente padre sobre la validación
    if (onDataChange) {
      onDataChange(formData, {
        isValid: missing.length === 0,
        missingFields: missing,
        errors: errors
      });
    }
  }, [formData, requiredFields, schemaReady, onDataChange]);

  // 🆕 NUEVO: Validar campos requeridos cuando cambien los datos
  useEffect(() => {
    if (isInitialized && schemaReady) {
      validateRequiredFields();
    }
  }, [formData, schemaReady, isInitialized, validateRequiredFields]);

  // 🆕 NUEVA FUNCIÓN: Obtener valor anidado del objeto
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // 🆕 NUEVA FUNCIÓN: Verificar si un campo específico está vacío
  const isFieldEmpty = (fieldPath) => {
    return missingRequiredFields.includes(fieldPath);
  };

  // 🆕 NUEVA FUNCIÓN: Obtener mensaje de error para un campo
  const getFieldError = (fieldPath) => {
    return validationErrors[fieldPath];
  };

  // 🆕 NUEVA FUNCIÓN: Obtener nombre de visualización para campos
  const getFieldDisplayName = (fieldPath) => {
    const fieldNames = {
      // Campos básicos
      'identificacion.tipoDte': 'Tipo de DTE',
      'identificacion.fecEmi': 'Fecha de Emisión',
      'receptor.nombre': 'Nombre del Receptor',
      'receptor.numDocumento': 'Número de Documento',
      'receptor.nrc': 'NRC',
      'receptor.bienTitulo': 'Bienes Remitidos a Título de',
      'receptor.nombreComercial': 'Nombre Comercial',
      'receptor.actividad': 'Actividad Económica',
      'receptor.telefono': 'Teléfono',
      'receptor.correo': 'Correo Electrónico',
      'receptor.direccion.complemento': 'Dirección',
      'cuerpoDocumento': 'Productos/Servicios',
      
      // 🆕 NUEVO: Campos específicos de Nota de Remisión
      'documentoRelacionado': 'Documentos Relacionados',
      'ventaTercero.nit': 'NIT del Tercero',
      'ventaTercero.nombre': 'Nombre del Tercero',
      'extension.nombEntrega': 'Responsable de Entrega',
      'extension.docuEntrega': 'Documento de Entrega',
      'extension.nombRecibe': 'Responsable de Recepción',
      'extension.docuRecibe': 'Documento de Recepción',
      'extension.observaciones': 'Observaciones'
    };

    // Para campos de ítems específicos
    if (fieldPath.includes('cuerpoDocumento.')) {
      const parts = fieldPath.split('.');
      const index = parts[1];
      const field = parts[2];
      const fieldName = {
        'descripcion': 'Descripción',
        'cantidad': 'Cantidad',
        'precioUni': 'Precio Unitario'
      }[field] || field;
      return `Ítem ${parseInt(index) + 1} - ${fieldName}`;
    }

    return fieldNames[fieldPath] || fieldPath;
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };

      // 🆕 AUTOCOMPLETAR campos del receptor basado en tipo de documento
      if (section === 'receptor' && field === 'tipoDocumento') {
        // Si es DUI, limpiar NRC automáticamente
        if (value === '13') {
          updatedData.receptor.nrc = null;
        }
        // Si es NIT, establecer NRC vacío para que el usuario lo complete
        else if (value === '36') {
          updatedData.receptor.nrc = '';
        }
      }

      // 🆕 AUTOCOMPLETAR actividad económica si está vacía
      if (section === 'receptor' && field === 'nombre' && value && !updatedData.receptor.codActividad) {
        // Buscar actividad económica por defecto
        const actividadDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
        updatedData.receptor.codActividad = actividadDefault.codigo;
        updatedData.receptor.descActividad = actividadDefault.valor;
      }

      // 🆕 AUTOCOMPLETAR dirección si está vacía
      if (section === 'receptor' && field === 'nombre' && value && !updatedData.receptor.direccion?.departamento) {
        const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
        const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };
        
        updatedData.receptor.direccion = {
          ...updatedData.receptor.direccion,
          departamento: departamentoDefault.codigo,
          municipio: municipioDefault.codigo,
          complemento: updatedData.receptor.direccion?.complemento || "Dirección por defecto"
        };
      }

      return updatedData;
    });
  };

  // 🆕 NUEVA FUNCIÓN: Manejar cambios en campos anidados (como direcciones)
  const handleNestedInputChange = (section, nestedField, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedField]: {
          ...prev[section][nestedField],
        [field]: value
        }
      }
    }));
  };

  // 🆕 NUEVA FUNCIÓN: Manejar cambios en arrays y objetos anidados
  const handleArrayInputChange = (section, index, field, value) => {
    setFormData(prev => {
      if (index === '') {
        // Para objetos simples como ventaTercero
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      } else {
        // Para arrays como otrosDocumentos
        const sectionData = [...(prev[section] || [])];
        if (!sectionData[index]) {
          sectionData[index] = {};
        }
        sectionData[index] = {
          ...sectionData[index],
          [field]: value
        };
        return {
          ...prev,
          [section]: sectionData
        };
      }
    });
  };

  // 🆕 Manejar cambio de tipo DTE
  const handleTipoDteChange = (tipoDte) => {
    // Actualizar el número de control según el tipo
    const numeroControl = `DTE-${tipoDte}-00000001-000000000000001`;
    
    setFormData(prev => {
      const updatedData = {
      ...prev,
      identificacion: {
        ...prev.identificacion,
        tipoDte: tipoDte,
        numeroControl: numeroControl
      }
      };

      // 🆕 NUEVO: Ajustar estructura del receptor según tipo de DTE
      if (tipoDte === "03") {
        // Para CCF, el receptor usa NIT en lugar de tipoDocumento/numDocumento
        updatedData.receptor = {
          ...prev.receptor,
          // Mantener el número de documento como NIT
          nit: prev.receptor.numDocumento || "",
          // Limpiar campos que no aplican para CCF
          tipoDocumento: undefined,
          numDocumento: undefined
        };
      } else if (tipoDte === "04") {
        // 🆕 NUEVO: Para Nota de Remisión, agregar campo bienTitulo
        updatedData.receptor = {
          ...prev.receptor,
          tipoDocumento: prev.receptor.tipoDocumento || "36",
          numDocumento: prev.receptor.numDocumento || "",
          bienTitulo: prev.receptor.bienTitulo || "01" // 01=Propio, 02=Tercero
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Nota de Remisión
        updatedData.documentoRelacionado = prev.documentoRelacionado || [];
        updatedData.ventaTercero = prev.ventaTercero || {
          nit: "",
          nombre: ""
        };
        updatedData.extension = prev.extension || {
          nombEntrega: "",
          docuEntrega: "",
          nombRecibe: "",
          docuRecibe: "",
          observaciones: ""
        };
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "05") {
        // 🆕 NUEVO: Para Nota de Crédito, el receptor usa NIT en lugar de tipoDocumento/numDocumento
        updatedData.receptor = {
          ...prev.receptor,
          // Mantener el número de documento como NIT
          nit: prev.receptor.numDocumento || "",
          // Limpiar campos que no aplican para Nota de Crédito
          tipoDocumento: undefined,
          numDocumento: undefined
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Nota de Crédito
        updatedData.documentoRelacionado = prev.documentoRelacionado || [];
        updatedData.ventaTercero = prev.ventaTercero || {
          nit: "",
          nombre: ""
        };
        updatedData.extension = prev.extension || {
          nombEntrega: "",
          docuEntrega: "",
          nombRecibe: "",
          docuRecibe: "",
          observaciones: ""
        };
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "06") {
        // 🆕 NUEVO: Para Nota de Débito, el receptor usa NIT en lugar de tipoDocumento/numDocumento
        updatedData.receptor = {
          ...prev.receptor,
          // Mantener el número de documento como NIT
          nit: prev.receptor.numDocumento || "",
          // Limpiar campos que no aplican para Nota de Débito
          tipoDocumento: undefined,
          numDocumento: undefined
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Nota de Débito
        updatedData.documentoRelacionado = prev.documentoRelacionado || [];
        updatedData.ventaTercero = prev.ventaTercero || {
          nit: "",
          nombre: ""
        };
        updatedData.extension = prev.extension || {
          nombEntrega: "",
          docuEntrega: "",
          nombRecibe: "",
          docuRecibe: "",
          observaciones: ""
        };
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "07") {
        // 🆕 NUEVO: Para Comprobante de Retención, mantener estructura original del receptor
        updatedData.receptor = {
          ...prev.receptor,
          tipoDocumento: prev.receptor.tipoDocumento || "36",
          numDocumento: prev.receptor.numDocumento || ""
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Comprobante de Retención
        updatedData.extension = prev.extension || {
          nombEntrega: "",
          docuEntrega: "",
          nombRecibe: "",
          docuRecibe: "",
          observaciones: ""
        };
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "08") {
        // 🆕 NUEVO: Para Comprobante de Liquidación, mantener estructura original del receptor
        updatedData.receptor = {
          ...prev.receptor,
          // Mantener el número de documento como NIT
          numDocumento: prev.receptor.numDocumento || ""
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Comprobante de Liquidación
        updatedData.extension = prev.extension || {
          nombEntrega: "",
          docuEntrega: "",
          nombRecibe: "",
          docuRecibe: "",
          observaciones: ""
        };
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "09") {
        // 🆕 NUEVO: Para Documento Contable de Liquidación, mantener estructura original del receptor
        updatedData.receptor = {
          ...prev.receptor,
          // Mantener el número de documento como NIT
          numDocumento: prev.receptor.numDocumento || ""
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Documento Contable de Liquidación
        updatedData.extension = prev.extension || {
          nombEntrega: "",
          docuEntrega: "",
          codEmpleado: ""
        };
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "11") {
        // 🆕 NUEVO: Para Factura de Exportación, mantener estructura original del receptor
        updatedData.receptor = {
          ...prev.receptor,
          // Mantener el número de documento como está
          numDocumento: prev.receptor.numDocumento || ""
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Factura de Exportación
        updatedData.otrosDocumentos = prev.otrosDocumentos || [{
          codDocAsociado: 1,
          descDocumento: "",
          detalleDocumento: "",
          placaTrans: null,
          modoTransp: null,
          numConductor: null,
          nombreConductor: null
        }];
        updatedData.ventaTercero = prev.ventaTercero || {
          nit: "",
          nombre: ""
        };
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "14") {
        // 🆕 NUEVO: Para Factura de Sujeto Excluido, usar sujetoExcluido en lugar de receptor
        updatedData.sujetoExcluido = {
          ...prev.sujetoExcluido,
          tipoDocumento: prev.sujetoExcluido?.tipoDocumento || "36",
          numDocumento: prev.sujetoExcluido?.numDocumento || "",
          nombre: prev.sujetoExcluido?.nombre || "",
          codActividad: prev.sujetoExcluido?.codActividad || "",
          descActividad: prev.sujetoExcluido?.descActividad || "",
          direccion: {
            departamento: prev.sujetoExcluido?.direccion?.departamento || "",
            municipio: prev.sujetoExcluido?.direccion?.municipio || "",
            complemento: prev.sujetoExcluido?.direccion?.complemento || ""
          },
          telefono: prev.sujetoExcluido?.telefono || "",
          correo: prev.sujetoExcluido?.correo || ""
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Factura de Sujeto Excluido
        updatedData.apendice = prev.apendice || [];
      } else if (tipoDte === "15") {
        // 🆕 NUEVO: Para Comprobante de Donación, usar donatario y donante
        updatedData.donatario = {
          ...prev.donatario,
          tipoDocumento: prev.donatario?.tipoDocumento || "36",
          numDocumento: prev.donatario?.numDocumento || "",
          nombre: prev.donatario?.nombre || "",
          codActividad: prev.donatario?.codActividad || "",
          descActividad: prev.donatario?.descActividad || "",
          direccion: {
            departamento: prev.donatario?.direccion?.departamento || "",
            municipio: prev.donatario?.direccion?.municipio || "",
            complemento: prev.donatario?.direccion?.complemento || ""
          },
          telefono: prev.donatario?.telefono || "",
          correo: prev.donatario?.correo || ""
        };
        
        updatedData.donante = {
          ...prev.donante,
          tipoDocumento: prev.donante?.tipoDocumento || "36",
          numDocumento: prev.donante?.numDocumento || "",
          nombre: prev.donante?.nombre || "",
          codDomiciliado: prev.donante?.codDomiciliado || 1,
          codPais: prev.donante?.codPais || "9320", // El Salvador por defecto
          direccion: prev.donante?.codDomiciliado === 1 ? {
            departamento: prev.donante?.direccion?.departamento || "",
            municipio: prev.donante?.direccion?.municipio || "",
            complemento: prev.donante?.direccion?.complemento || ""
          } : null,
          telefono: prev.donante?.telefono || "",
          correo: prev.donante?.correo || ""
        };
        
        // 🆕 NUEVO: Agregar campos obligatorios para Comprobante de Donación
        updatedData.otrosDocumentos = prev.otrosDocumentos || [{
          codDocAsociado: 1,
          descDocumento: "",
          detalleDocumento: ""
        }];
        updatedData.apendice = prev.apendice || [];
      } else {
        // Para otros tipos, mantener estructura original
        updatedData.receptor = {
          ...prev.receptor,
          tipoDocumento: prev.receptor.tipoDocumento || "36",
          numDocumento: prev.receptor.numDocumento || ""
        };
      }

      return updatedData;
    });
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: prev.cuerpoDocumento.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // ✨ NUEVAS FUNCIONES PARA MÚLTIPLES PRODUCTOS
  const addNewItem = () => {
    const newItem = {
      numItem: formData.cuerpoDocumento.length + 1,
      codigo: "",
      descripcion: "",
      cantidad: 1,
      precioUni: 0,
      montoDescu: 0
    };

    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: [...prev.cuerpoDocumento, newItem]
    }));
  };

  const removeItem = (index) => {
    if (formData.cuerpoDocumento.length > 1) {
      setFormData(prev => ({
        ...prev,
        cuerpoDocumento: prev.cuerpoDocumento
          .filter((_, i) => i !== index)
          .map((item, i) => ({ ...item, numItem: i + 1 })) // Renumerar items
      }));
    }
  };

  const duplicateItem = (index) => {
    const itemToDuplicate = { ...formData.cuerpoDocumento[index] };
    itemToDuplicate.numItem = formData.cuerpoDocumento.length + 1;
    
    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: [...prev.cuerpoDocumento, itemToDuplicate]
    }));
  };

  // Calcular total general
  const getTotalGeneral = () => {
    return formData.cuerpoDocumento.reduce((total, item) => {
      return total + ((item.cantidad * item.precioUni) - item.montoDescu);
    }, 0);
  };

  // 🆕 Obtener información del tipo DTE seleccionado
  const getTipoDteInfo = () => {
    const tipoInfo = CATALOGS.TIPOS_DTE.find(tipo => tipo.codigo === formData.identificacion.tipoDte);
    return tipoInfo || { valor: "Tipo no encontrado", esquema: "unknown" };
  };

  // Función para saber si un campo es requerido según el schema
  const isFieldRequired = (fieldPath) => requiredFields.includes(fieldPath);

  // 🆕 NUEVA FUNCIÓN: Obtener clase CSS para campos con error
  const getFieldClassName = (fieldPath, baseClass = "") => {
    const hasError = isFieldEmpty(fieldPath);
    const isRequired = isFieldRequired(fieldPath);
    
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

  // Actualizar validación cuando cambien los datos o campos requeridos
  useEffect(() => {
    validateRequiredFields();
  }, [formData, requiredFields, validateRequiredFields]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Formulario de Documento Tributario Electrónico
      </h2>
      {/* 🆕 SELECTOR DE TIPO DTE - NUEVO */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Tipo de Documento Tributario
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Tipo de DTE *
            </label>
            <select
              value={formData.identificacion.tipoDte}
              onChange={(e) => handleTipoDteChange(e.target.value)}
              className={getFieldClassName('identificacion.tipoDte')}
              required
            >
              {CATALOGS.TIPOS_DTE.map(tipo => (
                <option key={tipo.codigo} value={tipo.codigo}>
                  {tipo.codigo} - {tipo.valor}
                </option>
              ))}
            </select>
            {isFieldEmpty('identificacion.tipoDte') && (
              <p className="text-sm text-red-600 mt-1">Seleccione un tipo de DTE</p>
            )}
          </div>
          
          <div className="flex items-end">
            <div className="bg-white border border-gray-200 rounded-md p-3 w-full">
              <div className="text-sm text-gray-600">
                <strong>Documento seleccionado:</strong>
                <div className="text-lg font-semibold text-blue-600 mt-1">
                  {getTipoDteInfo().valor}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Schema: {getTipoDteInfo().esquema}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del tipo seleccionado */}
        <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Tipo DTE:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            {formData.identificacion.tipoDte === "01" && (
              <>
                <p>• <strong>Factura de Consumidor:</strong> Para ventas a consumidores finales</p>
                <p>• <strong>IVA:</strong> 13% sobre operaciones gravadas</p>
                <p>• <strong>Retención:</strong> 1% - 10% según aplique</p>
              </>
            )}
            {formData.identificacion.tipoDte === "03" && (
              <>
                <p>• <strong>Comprobante de Crédito Fiscal:</strong> Para ventas a empresas</p>
                <p>• <strong>IVA:</strong> 13% con derecho a crédito fiscal</p>
                <p>• <strong>Incluye:</strong> IVA Percibido además del retenido</p>
              </>
            )}
            {formData.identificacion.tipoDte === "14" && (
              <>
                <p>• <strong>Factura de Sujeto Excluido:</strong> Para sujetos exentos de IVA</p>
                <p>• <strong>IVA:</strong> 0% (exento)</p>
                <p>• <strong>Retención:</strong> No aplica</p>
              </>
            )}
            {formData.identificacion.tipoDte === "11" && (
              <>
                <p>• <strong>Factura de Exportación:</strong> Para operaciones de exportación</p>
                <p>• <strong>IVA:</strong> 0% (exportación)</p>
                <p>• <strong>Monto mínimo:</strong> $100.00</p>
              </>
            )}
            {formData.identificacion.tipoDte === "04" && (
              <>
                <p>• <strong>Nota de Remisión:</strong> Para remisión de mercancías</p>
                <p>• <strong>Documentos relacionados:</strong> Facturas o CCF asociados</p>
                <p>• <strong>Venta por terceros:</strong> Información del propietario real</p>
                <p>• <strong>Responsables:</strong> Entrega y recepción de mercancías</p>
              </>
            )}
            {formData.identificacion.tipoDte === "05" && (
              <>
                <p>• <strong>Nota de Crédito:</strong> Para correcciones o devoluciones</p>
                <p>• <strong>Documentos relacionados:</strong> CCF o Facturas de Exportación</p>
                <p>• <strong>Estructura:</strong> Similar a CCF (solo NIT del receptor)</p>
                <p>• <strong>IVA:</strong> Incluye IVA Percibido y Retenido</p>
              </>
            )}
            {formData.identificacion.tipoDte === "06" && (
              <>
                <p>• <strong>Nota de Débito:</strong> Para ajustes o cargos adicionales</p>
                <p>• <strong>Documentos relacionados:</strong> CCF o Facturas de Exportación</p>
                <p>• <strong>Estructura:</strong> Similar a CCF (solo NIT del receptor)</p>
                <p>• <strong>IVA:</strong> Incluye IVA Percibido y Retenido</p>
              </>
            )}
            {formData.identificacion.tipoDte === "07" && (
              <>
                <p>• <strong>Comprobante de Retención:</strong> Para retenciones de IVA</p>
                <p>• <strong>Estructura única:</strong> Usa cuerpoDocumento para retenciones</p>
                <p>• <strong>Campos específicos:</strong> Monto sujeto a retención e IVA retenido</p>
                <p>• <strong>Documentos relacionados:</strong> Facturas, CCF o FSE</p>
              </>
            )}
            {formData.identificacion.tipoDte === "08" && (
              <>
                <p>• <strong>Comprobante de Liquidación:</strong> Para liquidaciones de documentos</p>
                <p>• <strong>Estructura única:</strong> Usa cuerpoDocumento para liquidaciones</p>
                <p>• <strong>Campos específicos:</strong> Ventas por tipo e IVA percibido</p>
                <p>• <strong>Documentos relacionados:</strong> Facturas, CCF, Notas de Crédito/Débito</p>
              </>
            )}
            {formData.identificacion.tipoDte === "09" && (
              <>
                <p>• <strong>Documento Contable de Liquidación:</strong> Para liquidaciones contables</p>
                <p>• <strong>Estructura única:</strong> Usa cuerpoDocumento como objeto único</p>
                <p>• <strong>Campos específicos:</strong> Período de liquidación, IVA percibido (2%)</p>
                <p>• <strong>Campos obligatorios:</strong> Responsable de emisión y código de empleado</p>
              </>
            )}
            {formData.identificacion.tipoDte === "11" && (
              <>
                <p>• <strong>Factura de Exportación:</strong> Para exportaciones internacionales</p>
                <p>• <strong>Receptor extranjero:</strong> Información completa del comprador</p>
                <p>• <strong>Documentos asociados:</strong> Otros documentos y venta por terceros</p>
                <p>• <strong>Campos específicos:</strong> País destino, INCOTERMS, flete, seguro</p>
              </>
            )}
            {formData.identificacion.tipoDte === "14" && (
              <>
                <p>• <strong>Factura de Sujeto Excluido:</strong> Para sujetos excluidos del IVA</p>
                <p>• <strong>Sujeto excluido:</strong> Información del comprador excluido</p>
                <p>• <strong>Sin IVA:</strong> No se aplica impuesto al valor agregado</p>
                <p>• <strong>Campos específicos:</strong> Actividad económica y dirección completa</p>
              </>
            )}
            {formData.identificacion.tipoDte === "15" && (
              <>
                <p>• <strong>Comprobante de Donación:</strong> Para documentar donaciones</p>
                <p>• <strong>Donatario:</strong> Quien recibe la donación (emisor)</p>
                <p>• <strong>Donante:</strong> Quien hace la donación (receptor)</p>
                <p>• <strong>Campos específicos:</strong> Tipo de donación, depreciación, documentos asociados</p>
              </>
            )}
            {!["01", "03", "14", "11", "04", "05", "06", "07", "08", "09", "11", "14", "15"].includes(formData.identificacion.tipoDte) && (
              <p>• Consulte la documentación oficial del MH para este tipo de documento</p>
            )}
          </div>
        </div>
      </div>

      {/* Información del Emisor - Solo Lectura */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          Información del Emisor
          <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Configurado automáticamente
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Emisor {isFieldRequired('emisor.nombre') && '*'}
            </label>
            <input
              type="text"
              value={formData.emisor.nombre}
              readOnly
              placeholder="Nombre de la empresa o razón social"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIT {isFieldRequired('emisor.nit') && '*'}
            </label>
            <input
              type="text"
              value={formData.emisor.nit}
              readOnly
              placeholder="Número de identificación tributaria"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Comercial
            </label>
            <input
              type="text"
              value={formData.emisor.nombreComercial || ''}
              readOnly
              placeholder="Nombre comercial (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actividad Económica
            </label>
            <input
              type="text"
              value={formData.emisor.descActividad || ''}
              readOnly
              placeholder="Descripción de la actividad económica"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={
                formData.emisor.direccion
                  ? `${getNombreDepartamento(formData.emisor.direccion.departamento)}, ${getNombreMunicipio(formData.emisor.direccion.departamento, formData.emisor.direccion.municipio)}, ${formData.emisor.direccion.complemento || ''}`
                  : ''
              }
              readOnly
              placeholder="Dirección completa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.emisor.telefono || ''}
              readOnly
              placeholder="Número de teléfono"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.emisor.correo || ''}
              readOnly
              placeholder="correo@empresa.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            💡 <strong>Nota:</strong> Los datos del emisor se configuran automáticamente desde 
            <code className="bg-blue-100 px-1 rounded">src/config/empresa.js</code>. 
            Para cambiar estos datos, edite el archivo de configuración.
          </p>
        </div>
      </div>

      {/* Información del Receptor */}
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
                  nombreComercial: prev.receptor.nombreComercial || prev.receptor.nombre,
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
              onChange={(e) => handleInputChange('receptor', 'nombre', e.target.value)}
              placeholder="Nombre completo o razón social"
              className={getFieldClassName('receptor.nombre')}
              required={isFieldRequired('receptor.nombre')}
            />
            {isFieldEmpty('receptor.nombre') && (
              <p className="text-sm text-red-600 mt-1">Nombre del receptor es requerido</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NRC {formData.identificacion.tipoDte === '03' ? <span className="text-red-500">*</span> : (formData.receptor.tipoDocumento === '36' && '*')}
            </label>
            <input
              type="text"
              value={formData.receptor.nrc || ''}
              onChange={(e) => handleInputChange('receptor', 'nrc', e.target.value)}
              placeholder={formData.identificacion.tipoDte === '03' ? 'Número de registro de contribuyente' : (formData.receptor.tipoDocumento === '13' ? 'No aplica para DUI' : 'Número de registro de contribuyente')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formData.identificacion.tipoDte === '03' ? '' : (formData.receptor.tipoDocumento === '13' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : '')}`}
              disabled={formData.identificacion.tipoDte === '03' ? false : formData.receptor.tipoDocumento === '13'}
              required={formData.identificacion.tipoDte === '03' ? true : formData.receptor.tipoDocumento === '36'}
            />
            {formData.identificacion.tipoDte === '03' ? (
              <p className="text-sm text-gray-600 mt-1">NRC requerido para CCF</p>
            ) : (
              <>
                {formData.receptor.tipoDocumento === '13' && (
                  <p className="text-sm text-gray-600 mt-1">NRC no aplica para DUI</p>
                )}
                {formData.receptor.tipoDocumento === '36' && !formData.receptor.nrc && (
                  <p className="text-sm text-red-600 mt-1">NRC es requerido para NIT</p>
                )}
              </>
            )}
          </div>
          {formData.identificacion.tipoDte === '03' ? (
            // 🆕 Campos específicos para CCF
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT del Receptor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.receptor.numDocumento || ''}
                onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
                placeholder="NIT del receptor (ej: 0614-123456-789-0)"
                className={getFieldClassName('receptor.numDocumento')}
                required={true}
              />
              {isFieldEmpty('receptor.numDocumento') && (
                <p className="text-sm text-red-600 mt-1">NIT del receptor es requerido</p>
              )}
            </div>
          ) : formData.identificacion.tipoDte === '05' ? (
            // 🆕 NUEVO: Campos específicos para Nota de Crédito
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT del Receptor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.receptor.numDocumento || ''}
                onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
                placeholder="NIT del receptor (ej: 0614-123456-789-0)"
                className={getFieldClassName('receptor.numDocumento')}
                required={true}
              />
              {isFieldEmpty('receptor.numDocumento') && (
                <p className="text-sm text-red-600 mt-1">NIT del receptor es requerido</p>
              )}
            </div>
          ) : formData.identificacion.tipoDte === '06' ? (
            // 🆕 NUEVO: Campos específicos para Nota de Débito
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT del Receptor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.receptor.numDocumento || ''}
                onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
                placeholder="NIT del receptor (ej: 0614-123456-789-0)"
                className={getFieldClassName('receptor.numDocumento')}
                required={true}
              />
              {isFieldEmpty('receptor.numDocumento') && (
                <p className="text-sm text-red-600 mt-1">NIT del receptor es requerido</p>
              )}
            </div>
          ) : formData.identificacion.tipoDte === '07' ? (
            // 🆕 NUEVO: Campos específicos para Comprobante de Retención (tipo/número de documento)
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.receptor.tipoDocumento}
                  onChange={(e) => handleInputChange('receptor', 'tipoDocumento', e.target.value)}
                  className={getFieldClassName('receptor.tipoDocumento')}
                  required={isFieldRequired('receptor.tipoDocumento')}
                >
                  <option value="">Seleccione tipo de documento</option>
                  <option value="36">NIT</option>
                  <option value="13">DUI</option>
                  <option value="37">Otro</option>
                  <option value="03">Pasaporte</option>
                  <option value="02">Carnet de Residente</option>
                </select>
                {isFieldEmpty('receptor.tipoDocumento') && (
                  <p className="text-sm text-red-600 mt-1">Tipo de documento es requerido</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.receptor.numDocumento}
              onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
              placeholder="DUI, NIT, Pasaporte, etc."
                  className={getFieldClassName('receptor.numDocumento')}
                  required={isFieldRequired('receptor.numDocumento')}
            />
                {isFieldEmpty('receptor.numDocumento') && (
                  <p className="text-sm text-red-600 mt-1">Número de documento es requerido</p>
                )}
          </div>
            </>
          ) : formData.identificacion.tipoDte === '08' ? (
            // 🆕 NUEVO: Campos específicos para Comprobante de Liquidación (solo NIT)
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT del Receptor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
                value={formData.receptor.numDocumento || ''}
                onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
                placeholder="NIT del receptor (ej: 0614-123456-789-0)"
                className={getFieldClassName('receptor.numDocumento')}
                required={true}
              />
              {isFieldEmpty('receptor.numDocumento') && (
                <p className="text-sm text-red-600 mt-1">NIT del receptor es requerido</p>
              )}
          </div>
          ) : formData.identificacion.tipoDte === '09' ? (
            // 🆕 NUEVO: Campos específicos para Documento Contable de Liquidación (solo NIT)
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT del Receptor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.receptor.numDocumento || ''}
                onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
                placeholder="NIT del receptor (ej: 0614-123456-789-0)"
                className={getFieldClassName('receptor.numDocumento')}
                required={true}
              />
              {isFieldEmpty('receptor.numDocumento') && (
                <p className="text-sm text-red-600 mt-1">NIT del receptor es requerido</p>
              )}
            </div>
          ) : formData.identificacion.tipoDte === '11' ? (
            // 🆕 NUEVO: Campos específicos para Factura de Exportación
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Receptor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.receptor.nombre || ''}
                onChange={(e) => handleInputChange('receptor', 'nombre', e.target.value)}
                placeholder="Nombre completo del receptor extranjero"
                className={getFieldClassName('receptor.nombre')}
                required={true}
              />
              {isFieldEmpty('receptor.nombre') && (
                <p className="text-sm text-red-600 mt-1">Nombre del receptor es requerido</p>
              )}
            </div>
          ) : formData.identificacion.tipoDte === '14' ? (
            // 🆕 NUEVO: Campos específicos para Factura de Sujeto Excluido
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sujetoExcluido?.tipoDocumento || "36"}
                  onChange={(e) => handleInputChange('sujetoExcluido', 'tipoDocumento', e.target.value)}
                  className={getFieldClassName('sujetoExcluido.tipoDocumento')}
                  required={true}
                >
                  <option value="36">NIT</option>
                  <option value="13">DUI</option>
                  <option value="37">Otro</option>
                  <option value="03">Pasaporte</option>
                  <option value="02">Carnet de Residente</option>
                </select>
                {isFieldEmpty('sujetoExcluido.tipoDocumento') && (
                  <p className="text-sm text-red-600 mt-1">Tipo de documento es requerido</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sujetoExcluido?.numDocumento || ""}
                  onChange={(e) => handleInputChange('sujetoExcluido', 'numDocumento', e.target.value)}
                  placeholder="DUI, NIT, Pasaporte, etc."
                  className={getFieldClassName('sujetoExcluido.numDocumento')}
                  required={true}
                />
                {isFieldEmpty('sujetoExcluido.numDocumento') && (
                  <p className="text-sm text-red-600 mt-1">Número de documento es requerido</p>
                )}
              </div>
            </>
          ) : (
            // Campos para otros tipos de DTE
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.receptor.tipoDocumento}
                  onChange={(e) => handleInputChange('receptor', 'tipoDocumento', e.target.value)}
                  className={getFieldClassName('receptor.tipoDocumento')}
                  required={isFieldRequired('receptor.tipoDocumento')}
                >
                  <option value="">Seleccione tipo de documento</option>
                  <option value="36">NIT</option>
                  <option value="13">DUI</option>
                  <option value="37">Otro</option>
                  <option value="03">Pasaporte</option>
                  <option value="02">Carnet de Residente</option>
                </select>
                {isFieldEmpty('receptor.tipoDocumento') && (
                  <p className="text-sm text-red-600 mt-1">Tipo de documento es requerido</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.receptor.numDocumento}
                  onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
                  placeholder="DUI, NIT, Pasaporte, etc."
                  className={getFieldClassName('receptor.numDocumento')}
                  required={isFieldRequired('receptor.numDocumento')}
                />
                {isFieldEmpty('receptor.numDocumento') && (
                  <p className="text-sm text-red-600 mt-1">Número de documento es requerido</p>
                )}
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Comercial
            </label>
            <input
              type="text"
              value={formData.receptor.nombreComercial || ''}
              onChange={(e) => handleInputChange('receptor', 'nombreComercial', e.target.value)}
              placeholder="Nombre comercial (opcional) - se completa automáticamente"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">Opcional - se puede completar automáticamente</p>
          </div>
          {formData.identificacion.tipoDte === '04' && (
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bienes Remitidos a Título de <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.receptor.bienTitulo || '01'}
                onChange={(e) => handleInputChange('receptor', 'bienTitulo', e.target.value)}
                className={getFieldClassName('receptor.bienTitulo')}
                required={true}
              >
                <option value="01">01 - Propio</option>
                <option value="02">02 - Tercero</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">
                {formData.receptor.bienTitulo === '01' ? 'Mercancías de propiedad del emisor' : 'Mercancías de propiedad de un tercero'}
              </p>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actividad Económica
            </label>
            <div className="relative actividad-search-container">
            <input
              type="text"
                value={formData.receptor.descActividad || ''}
                onChange={(e) => {
                  const searchTerm = e.target.value;
                  handleInputChange('receptor', 'descActividad', searchTerm);
                  // Si el usuario borra la descripción, también limpiar el código
                  if (!searchTerm) {
                    handleInputChange('receptor', 'codActividad', '');
                  }
                }}
                onFocus={() => setShowActividadSuggestions(true)}
                onBlur={() => {
                  // Pequeño delay para permitir hacer clic en las sugerencias
                  setTimeout(() => {
                    if (!document.querySelector('.actividad-search-container:hover')) {
                      setShowActividadSuggestions(false);
                    }
                  }, 150);
                }}
                placeholder="Buscar actividad económica (ej: software, comercio, servicios...)"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getFieldClassName('receptor.codActividad')}`}
                required={isFieldRequired('receptor.codActividad')}
              />
              {formData.receptor.descActividad && !formData.receptor.codActividad && (
                <p className="text-sm text-red-600 mt-1">Seleccione una actividad económica de la lista</p>
              )}
              
              {/* Dropdown de sugerencias */}
              {showActividadSuggestions && formData.receptor.descActividad && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {resultadosBusqueda.map((actividad) => (
                    <div
                      key={actividad.codigo}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        handleInputChange('receptor', 'codActividad', actividad.codigo);
                        handleInputChange('receptor', 'descActividad', actividad.valor);
                        setShowActividadSuggestions(false);
                      }}
                    >
                      <div className="font-medium text-sm">{actividad.codigo}</div>
                      <div className="text-xs text-gray-600">{actividad.valor}</div>
                    </div>
                  ))}
                  {resultadosBusqueda.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No se encontraron actividades económicas
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.receptor.telefono || ''}
              onChange={(e) => handleInputChange('receptor', 'telefono', e.target.value)}
              placeholder="Número de teléfono (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">Opcional</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.receptor.correo || ''}
              onChange={(e) => handleInputChange('receptor', 'correo', e.target.value)}
              placeholder="correo@ejemplo.com (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">Opcional</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento
            </label>
            <select
              value={formData.receptor.direccion?.departamento || ''}
              onChange={(e) => {
                handleNestedInputChange('receptor', 'direccion', 'departamento', e.target.value);
                // Limpiar municipio cuando cambia departamento
                handleNestedInputChange('receptor', 'direccion', 'municipio', '');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione departamento</option>
              {catalogoDepartamentos.map((depto) => (
                <option key={depto.codigo} value={depto.codigo}>
                  {depto.valor}
                </option>
              ))}
            </select>
            {isFieldEmpty('receptor.direccion.departamento') && (
              <p className="text-sm text-red-600 mt-1">Departamento es requerido</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Municipio {isFieldRequired('receptor.direccion.municipio') && '*'}
            </label>
            <select
              value={formData.receptor.direccion?.municipio || ''}
              onChange={(e) => handleNestedInputChange('receptor', 'direccion', 'municipio', e.target.value)}
              className={getFieldClassName('receptor.direccion.municipio')}
              required={isFieldRequired('receptor.direccion.municipio')}
              disabled={!formData.receptor.direccion?.departamento}
            >
              <option value="">Seleccione municipio</option>
              {formData.receptor.direccion?.departamento && 
                catalogoMunicipios
                  .filter(muni => muni.departamento === formData.receptor.direccion.departamento)
                  .map((muni) => (
                    <option key={muni.codigo} value={muni.codigo}>
                      {muni.valor}
                    </option>
                  ))
              }
            </select>
            {isFieldEmpty('receptor.direccion.municipio') && (
              <p className="text-sm text-red-600 mt-1">Municipio es requerido</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección (Complemento)
            </label>
            <input
              type="text"
              value={formData.receptor.direccion?.complemento || ''}
              onChange={(e) => handleNestedInputChange('receptor', 'direccion', 'complemento', e.target.value)}
              placeholder="Dirección específica (calle, número, etc.) - opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-600 mt-1">Opcional</p>
          </div>
        </div>
        
        {/* Leyenda de campos */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span><span className="text-red-500">*</span> Campo requerido</span>
            <span>Campo opcional (se puede completar automáticamente)</span>
          </div>
        </div>
      </div>

      {/* 🆕 NUEVO: Secciones específicas para Nota de Remisión */}
      {formData.identificacion.tipoDte === '04' && (
        <>
          {/* Documentos Relacionados */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Documentos Relacionados <span className="text-red-500">*</span>
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> La Nota de Remisión debe estar relacionada con Facturas (01) o Comprobantes de Crédito Fiscal (03)
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.documentoRelacionado?.[0]?.tipoDocumento || ''}
                    onChange={(e) => {
                      const newDocRel = [{
                        tipoDocumento: e.target.value,
                        tipoGeneracion: 1,
                        numeroDocumento: formData.documentoRelacionado?.[0]?.numeroDocumento || '',
                        fechaEmision: formData.documentoRelacionado?.[0]?.fechaEmision || new Date().toISOString().split('T')[0]
                      }];
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccione tipo</option>
                    <option value="01">01 - Factura de Consumidor</option>
                    <option value="03">03 - Comprobante de Crédito Fiscal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.documentoRelacionado?.[0]?.numeroDocumento || ''}
                    onChange={(e) => {
                      const newDocRel = [...(formData.documentoRelacionado || [])];
                      if (newDocRel[0]) {
                        newDocRel[0].numeroDocumento = e.target.value;
                      }
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    placeholder="Número de factura o CCF relacionado"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.documentoRelacionado?.[0]?.fechaEmision || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDocRel = [...(formData.documentoRelacionado || [])];
                      if (newDocRel[0]) {
                        newDocRel[0].fechaEmision = e.target.value;
                      }
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
          </div>
        </div>
      </div>

          {/* Venta por Terceros */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Venta por Cuenta de Terceros <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Si los bienes son de propiedad de un tercero, complete esta información
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIT del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nit || ''}
                    onChange={(e) => handleInputChange('ventaTercero', 'nit', e.target.value)}
                    placeholder="NIT del propietario real de los bienes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nombre || ''}
                    onChange={(e) => handleInputChange('ventaTercero', 'nombre', e.target.value)}
                    placeholder="Nombre o razón social del tercero"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información de Entrega y Recepción */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Responsables de Entrega y Recepción <span className="text-red-500">*</span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> Información de las personas responsables de la entrega y recepción de mercancías
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Entrega <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombEntrega', '', e.target.value)}
                    placeholder="Nombre completo del responsable de entrega"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Entrega <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuEntrega', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de entrega"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombRecibe', '', e.target.value)}
                    placeholder="Nombre completo del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuRecibe', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.extension?.observaciones || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'observaciones', '', e.target.value)}
                    placeholder="Observaciones adicionales sobre la remisión"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Nota de Crédito */}
      {formData.identificacion.tipoDte === '05' && (
        <>
          {/* Documentos Relacionados */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Documentos Relacionados <span className="text-red-500">*</span>
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> La Nota de Crédito debe estar relacionada con Comprobantes de Crédito Fiscal (03) o Facturas de Exportación (07)
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.documentoRelacionado?.[0]?.tipoDocumento || ''}
                    onChange={(e) => {
                      const newDocRel = [{
                        tipoDocumento: e.target.value,
                        tipoGeneracion: 1,
                        numeroDocumento: formData.documentoRelacionado?.[0]?.numeroDocumento || '',
                        fechaEmision: formData.documentoRelacionado?.[0]?.fechaEmision || new Date().toISOString().split('T')[0]
                      }];
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccione tipo</option>
                    <option value="03">03 - Comprobante de Crédito Fiscal</option>
                    <option value="07">07 - Factura de Exportación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.documentoRelacionado?.[0]?.numeroDocumento || ''}
                    onChange={(e) => {
                      const newDocRel = [...(formData.documentoRelacionado || [])];
                      if (newDocRel[0]) {
                        newDocRel[0].numeroDocumento = e.target.value;
                      }
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    placeholder="Número de CCF o factura de exportación relacionado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.documentoRelacionado?.[0]?.fechaEmision || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDocRel = [...(formData.documentoRelacionado || [])];
                      if (newDocRel[0]) {
                        newDocRel[0].fechaEmision = e.target.value;
                      }
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Venta por Terceros */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Venta por Cuenta de Terceros <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Si la operación es por cuenta de un tercero, complete esta información
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIT del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nit || ''}
                    onChange={(e) => handleInputChange('ventaTercero', 'nit', e.target.value)}
                    placeholder="NIT del tercero (si aplica)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nombre || ''}
                    onChange={(e) => handleInputChange('ventaTercero', 'nombre', e.target.value)}
                    placeholder="Nombre o razón social del tercero"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información de Entrega y Recepción */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Responsables de Operación <span className="text-red-500">*</span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> Información de las personas responsables de la operación
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombEntrega', '', e.target.value)}
                    placeholder="Nombre completo del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuEntrega', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombRecibe', '', e.target.value)}
                    placeholder="Nombre completo del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuRecibe', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.extension?.observaciones || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'observaciones', '', e.target.value)}
                    placeholder="Observaciones sobre la nota de crédito"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Nota de Débito */}
      {formData.identificacion.tipoDte === '06' && (
        <>
          {/* Documentos Relacionados */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Documentos Relacionados <span className="text-red-500">*</span>
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> La Nota de Débito debe estar relacionada con Comprobantes de Crédito Fiscal (03) o Facturas de Exportación (07)
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.documentoRelacionado?.[0]?.tipoDocumento || ''}
                    onChange={(e) => {
                      const newDocRel = [{
                        tipoDocumento: e.target.value,
                        tipoGeneracion: 1,
                        numeroDocumento: formData.documentoRelacionado?.[0]?.numeroDocumento || '',
                        fechaEmision: formData.documentoRelacionado?.[0]?.fechaEmision || new Date().toISOString().split('T')[0]
                      }];
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccione tipo</option>
                    <option value="03">03 - Comprobante de Crédito Fiscal</option>
                    <option value="07">07 - Factura de Exportación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.documentoRelacionado?.[0]?.numeroDocumento || ''}
                    onChange={(e) => {
                      const newDocRel = [...(formData.documentoRelacionado || [])];
                      if (newDocRel[0]) {
                        newDocRel[0].numeroDocumento = e.target.value;
                      }
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    placeholder="Número de CCF o factura de exportación relacionado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.documentoRelacionado?.[0]?.fechaEmision || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDocRel = [...(formData.documentoRelacionado || [])];
                      if (newDocRel[0]) {
                        newDocRel[0].fechaEmision = e.target.value;
                      }
                      setFormData(prev => ({ ...prev, documentoRelacionado: newDocRel }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Venta por Terceros */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Venta por Cuenta de Terceros <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Si la operación es por cuenta de un tercero, complete esta información
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIT del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nit || ''}
                    onChange={(e) => handleInputChange('ventaTercero', 'nit', e.target.value)}
                    placeholder="NIT del tercero (si aplica)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nombre || ''}
                    onChange={(e) => handleInputChange('ventaTercero', 'nombre', e.target.value)}
                    placeholder="Nombre o razón social del tercero"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información de Entrega y Recepción */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Responsables de Operación <span className="text-red-500">*</span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> Información de las personas responsables de la operación
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombEntrega', '', e.target.value)}
                    placeholder="Nombre completo del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuEntrega', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombRecibe', '', e.target.value)}
                    placeholder="Nombre completo del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuRecibe', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.extension?.observaciones || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'observaciones', '', e.target.value)}
                    placeholder="Observaciones sobre la nota de débito"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Comprobante de Retención */}
      {formData.identificacion.tipoDte === '07' && (
        <>
          {/* Información de Entrega y Recepción */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Responsables de Operación <span className="text-red-500">*</span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> Información de las personas responsables de la operación de retención
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombEntrega', '', e.target.value)}
                    placeholder="Nombre completo del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuEntrega', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombRecibe', '', e.target.value)}
                    placeholder="Nombre completo del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuRecibe', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.extension?.observaciones || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'observaciones', '', e.target.value)}
                    placeholder="Observaciones sobre el comprobante de retención"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Comprobante de Liquidación */}
      {formData.identificacion.tipoDte === '08' && (
        <>
          {/* Información de Entrega y Recepción */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Responsables de Operación <span className="text-red-500">*</span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> Información de las personas responsables de la operación de liquidación
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombEntrega', '', e.target.value)}
                    placeholder="Nombre completo del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Emisión <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuEntrega', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de emisión"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombRecibe', '', e.target.value)}
                    placeholder="Nombre completo del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuRecibe || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuRecibe', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable de recepción"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.extension?.observaciones || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'observaciones', '', e.target.value)}
                    placeholder="Observaciones sobre el comprobante de liquidación"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Documento Contable de Liquidación */}
      {formData.identificacion.tipoDte === '09' && (
        <>
          {/* Información de Período de Liquidación */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Período de Liquidación <span className="text-red-500">*</span>
            </h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-800">
                <strong>Nota:</strong> Defina el período de liquidación para el documento contable
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.cuerpoDocumento?.periodoLiquidacionFechaInicio || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleNestedInputChange('cuerpoDocumento', 'periodoLiquidacionFechaInicio', '', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.cuerpoDocumento?.periodoLiquidacionFechaFin || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleNestedInputChange('cuerpoDocumento', 'periodoLiquidacionFechaFin', '', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Liquidación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cuerpoDocumento?.codLiquidacion || ''}
                    onChange={(e) => handleNestedInputChange('cuerpoDocumento', 'codLiquidacion', '', e.target.value)}
                    placeholder="Código de liquidación (ej: LIQ001)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de Documentos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cuerpoDocumento?.cantidadDoc || 1}
                    onChange={(e) => handleNestedInputChange('cuerpoDocumento', 'cantidadDoc', '', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información de Responsable */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Responsable de Emisión <span className="text-red-500">*</span>
            </h3>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-800">
                <strong>Nota:</strong> Información del responsable que genera el documento contable
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.nombEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'nombEntrega', '', e.target.value)}
                    placeholder="Nombre completo del responsable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Documento de Identificación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.docuEntrega || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'docuEntrega', '', e.target.value)}
                    placeholder="DUI, NIT, etc. del responsable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Empleado <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.extension?.codEmpleado || ''}
                    onChange={(e) => handleNestedInputChange('extension', 'codEmpleado', '', e.target.value)}
                    placeholder="Código de empleado (ej: EMP001)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Factura de Exportación */}
      {formData.identificacion.tipoDte === '11' && (
        <>
          {/* Información del Receptor Extranjero */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información del Receptor Extranjero <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Complete la información del comprador extranjero para la exportación
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.receptor.tipoDocumento || '36'}
                    onChange={(e) => handleInputChange('receptor', 'tipoDocumento', e.target.value)}
                    className={getFieldClassName('receptor.tipoDocumento')}
                    required
                  >
                    <option value="36">36 - NIT</option>
                    <option value="13">13 - DUI</option>
                    <option value="02">02 - Carné de Residencia</option>
                    <option value="03">03 - Pasaporte</option>
                    <option value="37">37 - Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.receptor.numDocumento || ''}
                    onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
                    placeholder="Número de documento del receptor"
                    className={getFieldClassName('receptor.numDocumento')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País Destino <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.receptor.codPais || '9905'}
                    onChange={(e) => handleInputChange('receptor', 'codPais', e.target.value)}
                    className={getFieldClassName('receptor.codPais')}
                    required
                  >
                    <option value="9905">9905 - Estados Unidos</option>
                    <option value="9320">9320 - México</option>
                    <option value="9539">9539 - Guatemala</option>
                    <option value="9565">9565 - Honduras</option>
                    <option value="9999">9999 - Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del País <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.receptor.nombrePais || ''}
                    onChange={(e) => handleInputChange('receptor', 'nombrePais', e.target.value)}
                    placeholder="Nombre del país destino"
                    className={getFieldClassName('receptor.nombrePais')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Persona <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.receptor.tipoPersona || 1}
                    onChange={(e) => handleInputChange('receptor', 'tipoPersona', parseInt(e.target.value))}
                    className={getFieldClassName('receptor.tipoPersona')}
                    required
                  >
                    <option value={1}>1 - Persona Jurídica</option>
                    <option value={2}>2 - Persona Natural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actividad Económica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.receptor.descActividad || ''}
                    onChange={(e) => handleInputChange('receptor', 'descActividad', e.target.value)}
                    placeholder="Actividad económica del receptor"
                    className={getFieldClassName('receptor.descActividad')}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección/Complemento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.receptor.complemento || ''}
                    onChange={(e) => handleInputChange('receptor', 'complemento', e.target.value)}
                    placeholder="Dirección completa del receptor extranjero"
                    className={getFieldClassName('receptor.complemento')}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información de Documentos Asociados */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Documentos Asociados <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Documentos relacionados con la exportación
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento Asociado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.otrosDocumentos?.[0]?.codDocAsociado || 1}
                    onChange={(e) => handleArrayInputChange('otrosDocumentos', '0', 'codDocAsociado', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={1}>1 - Factura</option>
                    <option value={2}>2 - Comprobante de Crédito Fiscal</option>
                    <option value={3}>3 - Nota de Crédito</option>
                    <option value={4}>4 - Guía de Transporte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.otrosDocumentos?.[0]?.descDocumento || ''}
                    onChange={(e) => handleArrayInputChange('otrosDocumentos', '0', 'descDocumento', e.target.value)}
                    placeholder="Descripción del documento asociado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalle del Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.otrosDocumentos?.[0]?.detalleDocumento || ''}
                    onChange={(e) => handleArrayInputChange('otrosDocumentos', '0', 'detalleDocumento', e.target.value)}
                    placeholder="Detalle del documento asociado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información de Venta por Terceros */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Venta por Cuenta de Terceros <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Información de la empresa que realiza la venta por cuenta de terceros
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIT del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nit || ''}
                    onChange={(e) => handleArrayInputChange('ventaTercero', '', 'nit', e.target.value)}
                    placeholder="NIT de la empresa tercera"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Tercero <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ventaTercero?.nombre || ''}
                    onChange={(e) => handleArrayInputChange('ventaTercero', '', 'nombre', e.target.value)}
                    placeholder="Nombre de la empresa tercera"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Factura de Sujeto Excluido */}
      {formData.identificacion.tipoDte === '14' && (
        <>
          {/* Información del Sujeto Excluido */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información del Sujeto Excluido <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Complete la información del sujeto excluido del IVA
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Sujeto Excluido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sujetoExcluido?.nombre || ''}
                    onChange={(e) => handleInputChange('sujetoExcluido', 'nombre', e.target.value)}
                    placeholder="Nombre completo del sujeto excluido"
                    className={getFieldClassName('sujetoExcluido.nombre')}
                    required={true}
                  />
                  {isFieldEmpty('sujetoExcluido.nombre') && (
                    <p className="text-sm text-red-600 mt-1">Nombre del sujeto excluido es requerido</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Actividad Económica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sujetoExcluido?.codActividad || ''}
                    onChange={(e) => handleInputChange('sujetoExcluido', 'codActividad', e.target.value)}
                    placeholder="Código de actividad económica"
                    className={getFieldClassName('sujetoExcluido.codActividad')}
                    required={true}
                  />
                  {isFieldEmpty('sujetoExcluido.codActividad') && (
                    <p className="text-sm text-red-600 mt-1">Código de actividad económica es requerido</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de Actividad Económica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sujetoExcluido?.descActividad || ''}
                    onChange={(e) => handleInputChange('sujetoExcluido', 'descActividad', e.target.value)}
                    placeholder="Descripción de la actividad económica"
                    className={getFieldClassName('sujetoExcluido.descActividad')}
                    required={true}
                  />
                  {isFieldEmpty('sujetoExcluido.descActividad') && (
                    <p className="text-sm text-red-600 mt-1">Descripción de actividad económica es requerida</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.sujetoExcluido?.telefono || ''}
                    onChange={(e) => handleInputChange('sujetoExcluido', 'telefono', e.target.value)}
                    placeholder="Número de teléfono (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.sujetoExcluido?.correo || ''}
                    onChange={(e) => handleInputChange('sujetoExcluido', 'correo', e.target.value)}
                    placeholder="correo@ejemplo.com (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 🆕 NUEVO: Secciones específicas para Comprobante de Donación */}
      {formData.identificacion.tipoDte === '15' && (
        <>
          {/* Información del Donatario */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información del Donatario (Quien Recibe) <span className="text-red-500">*</span>
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Complete la información de quien recibe la donación
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Donatario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.donatario?.nombre || ''}
                    onChange={(e) => handleInputChange('donatario', 'nombre', e.target.value)}
                    placeholder="Nombre completo del donatario"
                    className={getFieldClassName('donatario.nombre')}
                    required={true}
                  />
                  {isFieldEmpty('donatario.nombre') && (
                    <p className="text-sm text-red-600 mt-1">Nombre del donatario es requerido</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Actividad Económica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.donatario?.codActividad || ''}
                    onChange={(e) => handleInputChange('donatario', 'codActividad', e.target.value)}
                    placeholder="Código de actividad económica"
                    className={getFieldClassName('donatario.codActividad')}
                    required={true}
                  />
                  {isFieldEmpty('donatario.codActividad') && (
                    <p className="text-sm text-red-600 mt-1">Código de actividad económica es requerido</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de Actividad Económica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.donatario?.descActividad || ''}
                    onChange={(e) => handleInputChange('donatario', 'descActividad', e.target.value)}
                    placeholder="Descripción de la actividad económica"
                    className={getFieldClassName('donatario.descActividad')}
                    required={true}
                  />
                  {isFieldEmpty('donatario.descActividad') && (
                    <p className="text-sm text-red-600 mt-1">Descripción de actividad económica es requerida</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información del Donante */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información del Donante (Quien Donará) <span className="text-red-500">*</span>
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Nota:</strong> Complete la información de quien hace la donación
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Donante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.donante?.nombre || ''}
                    onChange={(e) => handleInputChange('donante', 'nombre', e.target.value)}
                    placeholder="Nombre completo del donante"
                    className={getFieldClassName('donante.nombre')}
                    required={true}
                  />
                  {isFieldEmpty('donante.nombre') && (
                    <p className="text-sm text-red-600 mt-1">Nombre del donante es requerido</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domicilio Fiscal <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.donante?.codDomiciliado || 1}
                    onChange={(e) => handleInputChange('donante', 'codDomiciliado', parseInt(e.target.value))}
                    className={getFieldClassName('donante.codDomiciliado')}
                    required={true}
                  >
                    <option value={1}>1 - Domiciliado</option>
                    <option value={2}>2 - No Domiciliado</option>
                  </select>
                  {isFieldEmpty('donante.codDomiciliado') && (
                    <p className="text-sm text-red-600 mt-1">Domicilio fiscal es requerido</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.donante?.codPais || "9320"}
                    onChange={(e) => handleInputChange('donante', 'codPais', e.target.value)}
                    className={getFieldClassName('donante.codPais')}
                    required={true}
                  >
                    <option value="9320">El Salvador</option>
                    <option value="9905">Estados Unidos</option>
                    <option value="9539">México</option>
                    <option value="9565">Guatemala</option>
                    <option value="9537">Honduras</option>
                    <option value="9540">Nicaragua</option>
                    <option value="9543">Costa Rica</option>
                    <option value="9546">Panamá</option>
                    <option value="9999">Otros</option>
                  </select>
                  {isFieldEmpty('donante.codPais') && (
                    <p className="text-sm text-red-600 mt-1">País es requerido</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detalle de Items - MEJORADO */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Detalle de Productos/Servicios ({formData.cuerpoDocumento.length})
          </h3>
          <button
            onClick={addNewItem}
            className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center"
            title="Agregar producto"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 🆕 NUEVO: Validación de cuerpo del documento */}
        {isFieldEmpty('cuerpoDocumento') && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Debe agregar al menos un producto o servicio
            </p>
          </div>
        )}

        {formData.cuerpoDocumento.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 relative">
            {/* Header del ítem */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">
                Ítem #{item.numItem}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => duplicateItem(index)}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Duplicar ítem"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {formData.cuerpoDocumento.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {formData.identificacion.tipoDte === '07' ? (
                // 🆕 NUEVO: Campos específicos para Comprobante de Retención
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de DTE Relacionado <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.tipoDte || '03'}
                      onChange={(e) => handleItemChange(index, 'tipoDte', e.target.value)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.tipoDte`)}
                      required
                    >
                      <option value="03">03 - Comprobante de Crédito Fiscal</option>
                      <option value="01">01 - Factura de Consumidor</option>
                      <option value="14">14 - Factura de Sujeto Excluido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.numDocumento || ''}
                      onChange={(e) => handleItemChange(index, 'numDocumento', e.target.value)}
                      placeholder="Número del documento relacionado"
                      className={getFieldClassName(`cuerpoDocumento.${index}.numDocumento`)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Emisión <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={item.fechaEmision || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleItemChange(index, 'fechaEmision', e.target.value)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.fechaEmision`)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Retención <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.codigoRetencionMH || '22'}
                      onChange={(e) => handleItemChange(index, 'codigoRetencionMH', e.target.value)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.codigoRetencionMH`)}
                      required
                    >
                      <option value="22">22 - IVA Retenido</option>
                      <option value="C4">C4 - Otro tipo de retención</option>
                      <option value="C9">C9 - Retención especial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IVA Retenido
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                      ${(item.ivaRetenido || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100).toFixed(2)}
                    </div>
                  </div>
                </>
              ) : formData.identificacion.tipoDte === '08' ? (
                // 🆕 NUEVO: Campos específicos para Comprobante de Liquidación
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de DTE Relacionado <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.tipoDte || '01'}
                      onChange={(e) => handleItemChange(index, 'tipoDte', e.target.value)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.tipoDte`)}
                      required
                    >
                      <option value="01">01 - Factura de Consumidor</option>
                      <option value="03">03 - Comprobante de Crédito Fiscal</option>
                      <option value="05">05 - Nota de Crédito</option>
                      <option value="06">06 - Nota de Débito</option>
                      <option value="11">11 - Factura de Exportación</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Documento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.numeroDocumento || ''}
                      onChange={(e) => handleItemChange(index, 'numeroDocumento', e.target.value)}
                      placeholder="Número del documento relacionado"
                      className={getFieldClassName(`cuerpoDocumento.${index}.numeroDocumento`)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Generación <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={item.fechaGeneracion || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleItemChange(index, 'fechaGeneracion', e.target.value)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.fechaGeneracion`)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Generación <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.tipoGeneracion || 1}
                      onChange={(e) => handleItemChange(index, 'tipoGeneracion', parseInt(e.target.value))}
                      className={getFieldClassName(`cuerpoDocumento.${index}.tipoGeneracion`)}
                      required
                    >
                      <option value={1}>1 - Generación Normal</option>
                      <option value={2}>2 - Generación por Contingencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IVA por Ítem
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                      ${(item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100).toFixed(2)}
                    </div>
                  </div>
                </>
              ) : formData.identificacion.tipoDte === '09' ? (
                // 🆕 NUEVO: Campos específicos para Documento Contable de Liquidación
                <>
                  <div className="md:col-span-5">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-800">
                        <strong>Nota:</strong> Para Documento Contable de Liquidación, los campos de liquidación se configuran en la sección superior. 
                        Aquí solo se muestran los productos/servicios para referencia.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // Campos para otros tipos de DTE
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                  placeholder="Descripción del producto o servicio"
                    className={getFieldClassName(`cuerpoDocumento.${index}.descripcion`)}
                    required={isFieldRequired(`cuerpoDocumento.${index}.descripcion`)}
                  />
                  {isFieldEmpty(`cuerpoDocumento.${index}.descripcion`) && (
                    <p className="text-sm text-red-600 mt-1">Descripción es requerida</p>
                  )}
                </div>
              )}
              
              {formData.identificacion.tipoDte === '07' ? (
                // 🆕 NUEVO: Campos específicos para Comprobante de Retención
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Sujeto a Retención <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.montoSujetoGrav || (item.cantidad * item.precioUni)}
                      onChange={(e) => handleItemChange(index, 'montoSujetoGrav', parseFloat(e.target.value) || 0)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.montoSujetoGrav`)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IVA Retenido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.ivaRetenido || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100}
                      onChange={(e) => handleItemChange(index, 'ivaRetenido', parseFloat(e.target.value) || 0)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.ivaRetenido`)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={item.descripcion || ''}
                      onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                      placeholder="Descripción de la retención"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              ) : formData.identificacion.tipoDte === '08' ? (
                // 🆕 NUEVO: Campos específicos para Comprobante de Liquidación
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ventas No Sujetas
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.ventaNoSuj || 0}
                      onChange={(e) => handleItemChange(index, 'ventaNoSuj', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ventas Exentas
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.ventaExenta || 0}
                      onChange={(e) => handleItemChange(index, 'ventaExenta', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ventas Gravadas <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.ventaGravada || (item.cantidad * item.precioUni)}
                      onChange={(e) => handleItemChange(index, 'ventaGravada', parseFloat(e.target.value) || 0)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.ventaGravada`)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exportaciones
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.exportaciones || 0}
                      onChange={(e) => handleItemChange(index, 'exportaciones', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IVA por Ítem <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100}
                      onChange={(e) => handleItemChange(index, 'ivaItem', parseFloat(e.target.value) || 0)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.ivaItem`)}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <input
                      type="text"
                      value={item.obsItem || ''}
                      onChange={(e) => handleItemChange(index, 'obsItem', e.target.value)}
                      placeholder="Observaciones sobre la liquidación"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                // Campos para otros tipos de DTE
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.cantidad}
                  onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 1)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.cantidad`)}
                      required={isFieldRequired(`cuerpoDocumento.${index}.cantidad`)}
                />
                    {isFieldEmpty(`cuerpoDocumento.${index}.cantidad`) && (
                      <p className="text-sm text-red-600 mt-1">Cantidad es requerida</p>
                    )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Unitario <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUni}
                  onChange={(e) => handleItemChange(index, 'precioUni', parseFloat(e.target.value) || 0)}
                      className={getFieldClassName(`cuerpoDocumento.${index}.precioUni`)}
                      required={isFieldRequired(`cuerpoDocumento.${index}.precioUni`)}
                />
                    {isFieldEmpty(`cuerpoDocumento.${index}.precioUni`) && (
                      <p className="text-sm text-red-600 mt-1">Precio unitario es requerido</p>
                    )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtotal
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                  ${((item.cantidad * item.precioUni) - item.montoDescu).toFixed(2)}
                </div>
              </div>
                </>
              )}
            </div>

            {/* Fila adicional para descuento - solo para tipos que no sean Comprobante de Retención */}
            {formData.identificacion.tipoDte !== '07' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.montoDescu}
                  onChange={(e) => handleItemChange(index, 'montoDescu', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                <div className="text-sm text-gray-600">
                  <strong>Cálculo:</strong> {item.cantidad} × ${item.precioUni.toFixed(2)} - ${item.montoDescu.toFixed(2)} = ${((item.cantidad * item.precioUni) - item.montoDescu).toFixed(2)}
                </div>
              </div>
            </div>
            )}
          </div>
        ))}

        {/* Resumen de ítems */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          {formData.identificacion.tipoDte === '07' ? (
            // 🆕 NUEVO: Resumen específico para Comprobante de Retención
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Total de {formData.cuerpoDocumento.length} retención(es):
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ${formData.cuerpoDocumento.reduce((total, item) => total + (item.montoSujetoGrav || (item.cantidad * item.precioUni)), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total IVA Retenido:
                </span>
                <span className="text-lg font-bold text-blue-900">
                  ${formData.cuerpoDocumento.reduce((total, item) => total + (item.ivaRetenido || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Comprobante de retención de IVA según documentos relacionados
              </p>
            </>
          ) : formData.identificacion.tipoDte === '08' ? (
            // 🆕 NUEVO: Resumen específico para Comprobante de Liquidación
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">No Sujeto</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${formData.cuerpoDocumento.reduce((total, item) => total + (item.ventaNoSuj || 0), 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">Exento</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${formData.cuerpoDocumento.reduce((total, item) => total + (item.ventaExenta || 0), 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">Gravado</div>
                  <div className="text-lg font-bold text-green-900">
                    ${formData.cuerpoDocumento.reduce((total, item) => total + (item.ventaGravada || (item.cantidad * item.precioUni)), 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">Exportación</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${formData.cuerpoDocumento.reduce((total, item) => total + (item.exportaciones || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-medium text-gray-700">
                  Total IVA Percibido:
                </span>
                <span className="text-lg font-bold text-green-900">
                  ${formData.cuerpoDocumento.reduce((total, item) => total + (item.ivaItem || Math.round((item.cantidad * item.precioUni) * 0.13 * 100) / 100), 0).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Comprobante de liquidación de documentos relacionados
              </p>
            </>
          ) : formData.identificacion.tipoDte === '09' ? (
            // 🆕 NUEVO: Resumen específico para Documento Contable de Liquidación
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">Valor Operaciones</div>
                  <div className="text-lg font-bold text-purple-900">
                    ${(formData.cuerpoDocumento?.valorOperaciones || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">IVA Percibido (2%)</div>
                  <div className="text-lg font-bold text-purple-900">
                    ${(formData.cuerpoDocumento?.ivaPercibido || 0).toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">Líquido a Pagar</div>
                  <div className="text-lg font-bold text-purple-900">
                    ${(formData.cuerpoDocumento?.liquidoApagar || 0).toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Documento contable de liquidación con período específico
              </p>
            </>
          ) : (
            // Resumen para otros tipos de DTE
            <>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total de {formData.cuerpoDocumento.length} ítem(s):
            </span>
            <span className="text-lg font-bold text-gray-900">
              ${getTotalGeneral().toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Los impuestos se calcularán automáticamente según el tipo de DTE seleccionado
          </p>
            </>
          )}
        </div>
      </div>

      {/* Información del Documento */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Documento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Generación
            </label>
            <input
              type="text"
              value={formData.identificacion.codigoGeneracion}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Control
            </label>
            <input
              type="text"
              value={formData.identificacion.numeroControl}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Emisión {isFieldRequired('identificacion.fecEmi') && '*'}
            </label>
            <input
              type="date"
              value={formData.identificacion.fecEmi}
              onChange={(e) => handleInputChange('identificacion', 'fecEmi', e.target.value)}
              className={getFieldClassName('identificacion.fecEmi')}
              required={isFieldRequired('identificacion.fecEmi')}
            />
            {isFieldEmpty('identificacion.fecEmi') && (
              <p className="text-sm text-red-600 mt-1">Fecha de emisión es requerida</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de DTE Seleccionado
            </label>
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-900 font-medium">
              {formData.identificacion.tipoDte} - {getTipoDteInfo().valor}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condición de Operación
            </label>
            <select
              value={formData.resumen.condicionOperacion}
              onChange={(e) => handleInputChange('resumen', 'condicionOperacion', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {catalogoCondicionOperacion.map((condicion) => (
                <option key={condicion.codigo} value={condicion.codigo}>
                  {condicion.valor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🆕 NUEVO: Resumen de validación */}
      {schemaReady && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Estado de Validación</h4>
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-700">
              {isFormValid 
                ? '✅ Todos los campos requeridos están completos'
                : `❌ Faltan ${missingRequiredFields.length} campos requeridos`
              }
            </span>
          </div>
          {!isFormValid && (
            <p className="text-xs text-gray-600 mt-2">
              Complete todos los campos marcados con * para continuar al siguiente paso
            </p>
          )}
        </div>
      )}

      {/* Información de muestra - ACTUALIZADA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Información</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Tipo DTE:</strong> Cada tipo tiene reglas específicas de cálculo e impuestos</li>
          <li>• <strong>Productos:</strong> Use el botón "+" para agregar múltiples ítems</li>
          <li>• <strong>Cálculos:</strong> Los impuestos se calcularán según el tipo de documento seleccionado</li>
          <li>• <strong>Validación:</strong> El documento será validado contra el schema oficial del MH</li>
          <li>• <strong>Campos requeridos:</strong> Los campos marcados con * son obligatorios para continuar</li>
        </ul>
      </div>

      {/* 🆕 NUEVO: Mensaje final de automatización */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-semibold text-green-900 mb-2">🎯 Resumen de Automatización</h4>
        <div className="text-sm text-green-800">
          <p className="mb-2">
            <strong>El sistema está completamente automatizado.</strong> Solo necesitas:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li><strong>Seleccionar el tipo de factura</strong> (arriba)</li>
            <li><strong>Completar los datos del receptor</strong> (nombre, documento)</li>
            <li><strong>Agregar productos/servicios</strong> (descripción, cantidad, precio)</li>
          </ol>
          <p className="mt-3 text-xs">
            Todo lo demás se completa automáticamente: datos del emisor, códigos, cálculos, validaciones y campos opcionales.
          </p>
          
          {/* 🆕 NUEVO: Información específica del tipo de DTE */}
          {formData.identificacion.tipoDte === '03' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h5 className="text-xs font-semibold text-blue-900 mb-2">📋 Información específica del CCF:</h5>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Receptor:</strong> Solo acepta NIT (no DUI ni otros documentos)</li>
                <li>• <strong>NRC:</strong> Campo obligatorio para el receptor</li>
                <li>• <strong>IVA Percibido:</strong> Se calcula automáticamente (1%)</li>
                <li>• <strong>Campos adicionales:</strong> Se incluyen automáticamente (extension, apendice, etc.)</li>
                <li>• <strong>Versión:</strong> Usa esquema v3 (más completo que v1)</li>
              </ul>
            </div>
          )}
          {formData.identificacion.tipoDte === '08' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <h5 className="text-xs font-semibold text-green-900 mb-2">📋 Información específica del CL:</h5>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• <strong>Receptor:</strong> Solo acepta NIT (no DUI ni otros documentos)</li>
                <li>• <strong>NRC:</strong> Campo obligatorio para el receptor</li>
                <li>• <strong>Documentos relacionados:</strong> Facturas, CCF, Notas de Crédito/Débito</li>
                <li>• <strong>Ventas por tipo:</strong> No sujetas, exentas, gravadas, exportaciones</li>
                <li>• <strong>IVA Percibido:</strong> Se calcula automáticamente (13%)</li>
                <li>• <strong>Responsables:</strong> Campos obligatorios de entrega y recepción</li>
                <li>• <strong>Versión:</strong> Usa esquema v1 (estructura específica)</li>
              </ul>
            </div>
          )}
          {formData.identificacion.tipoDte === '09' && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <h5 className="text-xs font-semibold text-purple-900 mb-2">📋 Información específica del DCL:</h5>
              <ul className="text-xs text-purple-800 space-y-1">
                <li>• <strong>Receptor:</strong> Solo acepta NIT (no DUI ni otros documentos)</li>
                <li>• <strong>NRC:</strong> Campo obligatorio para el receptor</li>
                <li>• <strong>Período de liquidación:</strong> Fechas de inicio y fin obligatorias</li>
                <li>• <strong>Estructura única:</strong> cuerpoDocumento como objeto único (no array)</li>
                <li>• <strong>IVA Percibido:</strong> Se calcula automáticamente (2%)</li>
                <li>• <strong>Responsable:</strong> Campos obligatorios de emisión y código de empleado</li>
                <li>• <strong>Campos específicos:</strong> Comisión, IVA de comisión, líquido a pagar</li>
                <li>• <strong>Versión:</strong> Usa esquema v1 (estructura específica)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DteForm;