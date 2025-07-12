// src/components/dte/forms/shared/DocumentInfoSection.jsx
// Componente compartido para la información del documento

import React from 'react';

const DocumentInfoSection = ({ formData, onDataChange }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Información del Documento
      </h3>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">
          🚧 Información del Documento en construcción
        </p>
        <p className="text-sm text-green-600 mt-2">
          Tipo DTE: {formData?.identificacion?.tipoDte || 'No definido'}
        </p>
      </div>
    </div>
  );
};

export default DocumentInfoSection; 