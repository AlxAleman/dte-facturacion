// src/components/dte/forms/shared/ProductItemsSection.jsx
// Componente compartido para la sección de productos/ítems

import React from 'react';

const ProductItemsSection = ({ formData, onDataChange }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Productos y Servicios
      </h3>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-purple-800">
          🚧 Sección de Productos en construcción
        </p>
        <p className="text-sm text-purple-600 mt-2">
          Ítems: {formData?.cuerpoDocumento?.length || 0}
        </p>
      </div>
    </div>
  );
};

export default ProductItemsSection; 