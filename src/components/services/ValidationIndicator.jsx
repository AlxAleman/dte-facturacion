// PASO 2: Componente indicador muy simple
// src/components/validation/ValidationIndicator.jsx

import React, { useState, useEffect } from 'react';
import { realDTEValidator } from '../../services/realDTEValidator';

const ValidationIndicator = ({ jsonData, tipoDte, className = '' }) => {
  const [result, setResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!jsonData || !tipoDte) return;
      
      setIsValidating(true);
      try {
        if (!realDTEValidator.isInitialized) {
          await realDTEValidator.initialize();
        }
        const validationResult = realDTEValidator.validateDocument(jsonData, tipoDte);
        setResult(validationResult);
      } catch (error) {
        setResult({ isValid: false, errors: [error.message] });
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validate, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [jsonData, tipoDte]);

  if (isValidating) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
        <span className="text-sm text-gray-600">Validando...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="w-4 h-4 bg-gray-300 rounded-full mr-2"></div>
        <span className="text-sm text-gray-500">Sin validar</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`w-4 h-4 rounded-full mr-2 ${
        result.isValid ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className={`text-sm ${
        result.isValid ? 'text-green-700' : 'text-red-700'
      }`}>
        {result.isValid ? 'Válido' : `${result.errors?.length || 0} errores`}
      </span>
    </div>
  );
};

export default ValidationIndicator;