// src/components/dte/forms/shared/ValidationSummary.jsx
// Componente compartido para el resumen de validación

import React from 'react';

const ValidationSummary = ({ formData, validationErrors }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Resumen de Validación
      </h3>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-orange-800">
          🚧 Resumen de Validación en construcción
        </p>
        <p className="text-sm text-orange-600 mt-2">
          Errores: {validationErrors?.length || 0}
        </p>
      </div>
    </div>
  );
};

export default ValidationSummary; 