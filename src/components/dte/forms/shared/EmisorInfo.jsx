import React from 'react';
import { getEmisorData } from '../../../../config/empresa';
import { getNombreDepartamento, getNombreMunicipio } from '../../../../utils/geoCatalogs';

const EmisorInfo = ({ formData }) => {
  return (
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
            Nombre del Emisor *
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
            NIT *
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
            NRC *
          </label>
          <input
            type="text"
            value={formData.emisor.nrc}
            readOnly
            placeholder="Número de registro de contribuyente"
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
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          💡 <strong>Nota:</strong> Los datos del emisor se configuran automáticamente desde 
          <code className="bg-blue-100 px-1 rounded">src/config/empresa.js</code>. 
          Para cambiar estos datos, edite el archivo de configuración.
        </p>
      </div>
    </div>
  );
};

export default EmisorInfo; 