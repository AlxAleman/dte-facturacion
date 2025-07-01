// src/calculadora/SignatureQRManager.jsx
import { useState } from 'react';
import { Shield } from 'lucide-react';

function SignatureQRManager({ dteData, onDocumentSigned, onQRGenerated }) {
  const [message, setMessage] = useState('Componente cargado correctamente');

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        Firma Digital y Código QR
      </h2>
      <p className="text-gray-600">{message}</p>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 text-sm">
          ✅ Componente funcionando correctamente
        </p>
        <p className="text-blue-600 text-xs mt-2">
          Props recibidas: {dteData ? 'DTE presente' : 'Sin DTE'}
        </p>
      </div>
    </div>
  );
}

export default SignatureQRManager;