// src/components/dte/forms/shared/EmisorSection.jsx
// Componente compartido para la información del emisor

import React from 'react';

const EmisorSection = ({ formData, onDataChange }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Información del Emisor
      </h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          🚧 Sección del Emisor en construcción
        </p>
        <p className="text-sm text-blue-600 mt-2">
          NIT: {formData?.emisor?.nit || 'No configurado'}
        </p>
      </div>
    </div>
  );
};

export default EmisorSection; 