import React, { useState, useMemo, useEffect } from 'react';
import { CATALOGS } from '../../data/catalogs';
import { actividadesEconomicas, buscarActividadPorCodigo, buscarActividadPorNombre } from '../../data/catalogoActividadEconomica';
import { 
  catalogoDepartamentos,
  catalogoMunicipios,
  buscarPorCodigo
} from '../../data/catalogoGeneral';

const ReceptorForm = ({ 
  formData, 
  onDataChange, 
  requiredFields = [], 
  isFieldEmpty, 
  getFieldClassName,
  tipoDte = "01",
  showNrc = true,
  showActividad = true,
  showDireccion = true,
  showContacto = true
}) => {
  const [showActividadSuggestions, setShowActividadSuggestions] = useState(false);

  // Memoizar resultados de búsqueda para evitar re-renders innecesarios
  const resultadosBusqueda = useMemo(() => {
    if (!formData.receptor.descActividad || formData.receptor.descActividad.trim() === '') {
      return [];
    }
    return buscarActividadPorNombre(formData.receptor.descActividad).slice(0, 10);
  }, [formData.receptor.descActividad]);

  // Manejar clic fuera del buscador de actividad económica
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

  // Manejar cambios en campos del formulario
  const handleInputChange = (field, value) => {
    const updatedReceptor = {
      ...formData.receptor,
      [field]: value
    };

    // Auto-completar campos del receptor basado en tipo de documento
    if (field === 'tipoDocumento') {
      // Si es DUI, limpiar NRC automáticamente
      if (value === '13') {
        updatedReceptor.nrc = null;
      }
      // Si es NIT, establecer NRC vacío para que el usuario lo complete
      else if (value === '36') {
        updatedReceptor.nrc = '';
      }
    }

    // Auto-completar actividad económica si está vacía
    if (field === 'nombre' && value && !updatedReceptor.codActividad) {
      const actividadDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
      updatedReceptor.codActividad = actividadDefault.codigo;
      updatedReceptor.descActividad = actividadDefault.valor;
    }

    // Auto-completar dirección si está vacía
    if (field === 'nombre' && value && !updatedReceptor.direccion?.departamento) {
      const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
      const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };
      
      updatedReceptor.direccion = {
        ...updatedReceptor.direccion,
        departamento: departamentoDefault.codigo,
        municipio: municipioDefault.codigo,
        complemento: updatedReceptor.direccion?.complemento || "Dirección por defecto"
      };
    }

    onDataChange({
      ...formData,
      receptor: updatedReceptor
    });
  };

  // Manejar cambios en campos anidados (como direcciones)
  const handleNestedInputChange = (nestedField, field, value) => {
    onDataChange({
      ...formData,
      receptor: {
        ...formData.receptor,
        [nestedField]: {
          ...formData.receptor[nestedField],
          [field]: value
        }
      }
    });
  };

  // Completar automáticamente campos opcionales
  const handleAutoComplete = () => {
    const actividadDefault = buscarActividadPorCodigo("62010") || { codigo: "62010", valor: "Programación informática" };
    const departamentoDefault = buscarPorCodigo(catalogoDepartamentos, "06") || { codigo: "06", valor: "San Salvador" };
    const municipioDefault = buscarPorCodigo(catalogoMunicipios, "23") || { codigo: "23", valor: "SAN SALVADOR CENTRO" };
    
    const updatedReceptor = {
      ...formData.receptor,
      codActividad: formData.receptor.codActividad || actividadDefault.codigo,
      descActividad: formData.receptor.descActividad || actividadDefault.valor,
      nombreComercial: formData.receptor.nombreComercial || formData.receptor.nombre,
      telefono: formData.receptor.telefono || "0000-0000",
      correo: formData.receptor.correo || "cliente@ejemplo.com",
      direccion: {
        ...formData.receptor.direccion,
        departamento: formData.receptor.direccion?.departamento || departamentoDefault.codigo,
        municipio: formData.receptor.direccion?.municipio || municipioDefault.codigo,
        complemento: formData.receptor.direccion?.complemento || "Dirección por defecto"
      }
    };

    onDataChange({
      ...formData,
      receptor: updatedReceptor
    });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Información del Receptor</h3>
        <button
          type="button"
          onClick={handleAutoComplete}
          className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 transition-colors"
        >
          🤖 Completar automáticamente
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Receptor {requiredFields.includes('receptor.nombre') && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={formData.receptor.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            placeholder="Nombre completo o razón social"
            className={getFieldClassName ? getFieldClassName('receptor.nombre') : "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
            required={requiredFields.includes('receptor.nombre')}
          />
          {isFieldEmpty && isFieldEmpty('receptor.nombre') && (
            <p className="text-sm text-red-600 mt-1">Nombre del receptor es requerido</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Documento {requiredFields.includes('receptor.tipoDocumento') && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formData.receptor.tipoDocumento}
            onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
            className={getFieldClassName ? getFieldClassName('receptor.tipoDocumento') : "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
            required={requiredFields.includes('receptor.tipoDocumento')}
          >
            {CATALOGS.TIPOS_DOCUMENTO.map(tipo => (
              <option key={tipo.codigo} value={tipo.codigo}>
                {tipo.codigo} - {tipo.valor}
              </option>
            ))}
          </select>
          {isFieldEmpty && isFieldEmpty('receptor.tipoDocumento') && (
            <p className="text-sm text-red-600 mt-1">Tipo de documento es requerido</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Documento {requiredFields.includes('receptor.numDocumento') && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={formData.receptor.numDocumento}
            onChange={(e) => handleInputChange('numDocumento', e.target.value)}
            placeholder={formData.receptor.tipoDocumento === '13' ? 'DUI (ej: 12345678-9)' : 'NIT (ej: 0614-123456-789-0)'}
            className={getFieldClassName ? getFieldClassName('receptor.numDocumento') : "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
            required={requiredFields.includes('receptor.numDocumento')}
          />
          {isFieldEmpty && isFieldEmpty('receptor.numDocumento') && (
            <p className="text-sm text-red-600 mt-1">Número de documento es requerido</p>
          )}
        </div>
        
        {showNrc && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NRC {tipoDte === '03' ? <span className="text-red-500">*</span> : (formData.receptor.tipoDocumento === '36' && '*')}
            </label>
            <input
              type="text"
              value={formData.receptor.nrc || ''}
              onChange={(e) => handleInputChange('nrc', e.target.value)}
              placeholder={tipoDte === '03' ? 'Número de registro de contribuyente' : (formData.receptor.tipoDocumento === '13' ? 'No aplica para DUI' : 'Número de registro de contribuyente')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${tipoDte === '03' ? '' : (formData.receptor.tipoDocumento === '13' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : '')}`}
              disabled={tipoDte === '03' ? false : formData.receptor.tipoDocumento === '13'}
              required={tipoDte === '03' ? true : formData.receptor.tipoDocumento === '36'}
            />
            {tipoDte === '03' ? (
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
        )}
        
        {showContacto && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.receptor.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
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
                onChange={(e) => handleInputChange('correo', e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}
        
        {showActividad && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actividad Económica
            </label>
            <div className="actividad-search-container relative">
              <input
                type="text"
                value={formData.receptor.descActividad}
                onChange={(e) => handleInputChange('descActividad', e.target.value)}
                onFocus={() => setShowActividadSuggestions(true)}
                placeholder="Buscar actividad económica"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showActividadSuggestions && resultadosBusqueda.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {resultadosBusqueda.map((actividad, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => {
                        handleInputChange('codActividad', actividad.codigo);
                        handleInputChange('descActividad', actividad.valor);
                        setShowActividadSuggestions(false);
                      }}
                    >
                      <div className="font-medium">{actividad.codigo}</div>
                      <div className="text-sm text-gray-600">{actividad.valor}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {showDireccion && (
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
                  onChange={(e) => handleNestedInputChange('direccion', 'departamento', e.target.value)}
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
                  onChange={(e) => handleNestedInputChange('direccion', 'municipio', e.target.value)}
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
                  onChange={(e) => handleNestedInputChange('direccion', 'complemento', e.target.value)}
                  placeholder="Dirección específica"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptorForm; 