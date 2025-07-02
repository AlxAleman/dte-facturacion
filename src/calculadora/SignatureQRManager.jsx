// src/calculadora/SignatureQRManager.jsx
import { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  QrCode, 
  RefreshCw,
  TestTube,
  FileText,
  Key
} from 'lucide-react';

function SignatureQRManager({ dteData, onDocumentSigned, onQRGenerated }) {
  const [certificatesLoaded, setCertificatesLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signature, setSignature] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [documentSigned, setDocumentSigned] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('ready'); // ready, signing, completed

  // Auto-cargar certificados de prueba al montar
  useEffect(() => {
    loadTestCertificates();
  }, []);

  // Cargar certificados de prueba automáticamente
  const loadTestCertificates = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Simular carga de certificados
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCertificatesLoaded(true);
      console.log('🔐 Certificados de prueba cargados automáticamente');

    } catch (err) {
      setError('Error cargando certificados de prueba: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Firmar documento
  const signDocument = async () => {
    if (!certificatesLoaded) {
      setError('Certificados no cargados correctamente');
      return;
    }

    if (!dteData) {
      setError('No hay datos del DTE para firmar');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setStep('signing');

      // Simular proceso de firma (2-3 segundos)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generar firma simulada
      const mockSignature = {
        algorithm: 'SHA256withRSA',
        timestamp: new Date().toISOString(),
        certificateSerial: 'TEST-DTE-2025-001',
        signatureValue: generateMockSignature(),
        documentHash: generateDocumentHash(dteData),
        status: 'valid',
        environment: 'testing',
        issuer: 'CN=Autoridad Certificadora DGII, C=SV',
        subject: 'CN=Certificado de Prueba DTE, O=DGII, C=SV'
      };

      setSignature(mockSignature);

      // Generar código QR automáticamente
      const qrData = generateQRCode(dteData, mockSignature);
      setQrCode(qrData);

      // Crear documento firmado completo
      const signedDocument = {
        ...dteData,
        firma: mockSignature,
        qr: qrData,
        fechaFirma: mockSignature.timestamp,
        estado: 'firmado'
      };

      setDocumentSigned(true);
      setStep('completed');

      // Notificar al DTEManager
      if (onDocumentSigned) {
        onDocumentSigned(signedDocument);
        console.log('📄 Documento firmado enviado al DTEManager');
      }

      if (onQRGenerated) {
        onQRGenerated(qrData.url);
        console.log('📱 QR generado enviado al DTEManager');
      }

    } catch (err) {
      setError('Error firmando documento: ' + err.message);
      setStep('ready');
    } finally {
      setIsProcessing(false);
    }
  };

  // Generar código QR
  const generateQRCode = (dteData, signature) => {
    const codigoGeneracion = dteData?.identificacion?.codigoGeneracion || generateUUID();
    const fechaEmision = dteData?.identificacion?.fecEmi || new Date().toISOString().split('T')[0];
    
    // URL oficial del Ministerio de Hacienda para consulta pública
    const qrUrl = `https://admin.factura.gob.sv/consultaPublica?ambiente=00&codGen=${codigoGeneracion}&fechaEmi=${fechaEmision}`;
    
    return {
      url: qrUrl,
      codigoGeneracion,
      fechaEmision,
      numeroControl: dteData?.identificacion?.numeroControl || generateControlNumber(),
      timestamp: signature.timestamp
    };
  };

  // Generar hash del documento
  const generateDocumentHash = (dteData) => {
    const dataString = JSON.stringify(dteData);
    return 'SHA256:' + btoa(dataString).substring(0, 64);
  };

  // Generar firma simulada
  const generateMockSignature = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let signature = '';
    for (let i = 0; i < 344; i++) {
      signature += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return signature;
  };

  // Utilidades
  const generateUUID = () => {
    return 'A1B2C3D4-E5F6-7890-ABCD-' + Date.now().toString().substring(8);
  };

  const generateControlNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const sequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `DTE-${year}-${sequence}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        Firma Digital y Código QR
      </h2>

      {/* Estado de certificados */}
      <div className="mb-6">
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <Key className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Certificados de Prueba</h3>
            <p className="text-sm text-gray-600">
              {isProcessing && !certificatesLoaded ? 'Cargando certificados...' : 
               certificatesLoaded ? 'Certificados cargados automáticamente para testing' :
               'Certificados no disponibles'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Serie: TEST-DTE-2025-001 | Válido hasta: 2025-12-31
            </p>
          </div>
          <div className="flex-shrink-0">
            {certificatesLoaded ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : isProcessing ? (
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            ) : (
              <AlertCircle className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Sección principal de firma */}
      {step === 'ready' && (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Listo para Firmar
            </h3>
            <p className="text-gray-600">
              El documento será firmado digitalmente con certificados de prueba
            </p>
          </div>

          <button
            onClick={signDocument}
            disabled={!certificatesLoaded || !dteData}
            className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto ${
              certificatesLoaded && dteData
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Shield className="h-5 w-5" />
            Firmar Documento
          </button>
        </div>
      )}

      {/* Proceso de firma */}
      {step === 'signing' && (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="h-10 w-10 text-purple-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Firmando Documento...
            </h3>
            <p className="text-gray-600">
              Aplicando firma digital y generando código QR
            </p>
          </div>
        </div>
      )}

      {/* Documento firmado */}
      {step === 'completed' && signature && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Documento Firmado Exitosamente!
            </h3>
            <p className="text-gray-600">
              El documento ha sido firmado y el código QR generado
            </p>
          </div>

          {/* Información de la firma */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Información de la Firma Digital
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Algoritmo:</span>
                <p className="text-green-700">{signature.algorithm}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Timestamp:</span>
                <p className="text-green-700">{new Date(signature.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Certificado:</span>
                <p className="text-green-700">{signature.certificateSerial}</p>
              </div>
              <div>
                <span className="font-medium text-green-800">Estado:</span>
                <p className="text-green-700 font-semibold">✓ Válida</p>
              </div>
            </div>
          </div>

          {/* Código QR */}
          {qrCode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR para Consulta Pública
              </h4>
              <div className="text-center">
                <div className="inline-block bg-white p-4 rounded-lg border-2 border-blue-300 mb-4">
                  <QrCode className="h-24 w-24 text-blue-600 mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">Código QR generado</p>
                </div>
                <div className="text-xs text-blue-800 space-y-1">
                  <p><strong>Código:</strong> {qrCode.codigoGeneracion}</p>
                  <p><strong>Fecha:</strong> {qrCode.fechaEmision}</p>
                  <p className="break-all max-w-md mx-auto">{qrCode.url}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estados del proceso */}
      <div className="space-y-3 mt-6">
        {/* Estado: Documento requerido */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          dteData ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex-shrink-0">
            {dteData ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-medium ${dteData ? 'text-green-800' : 'text-yellow-800'}`}>
              {dteData ? 'Documento listo para firmar' : 'Documento requerido'}
            </p>
            <p className={`text-sm ${dteData ? 'text-green-700' : 'text-yellow-700'}`}>
              {dteData ? 
                `DTE con ${dteData.cuerpoDocumento?.length || 0} ítem(s) cargado` :
                'Complete el formulario del DTE antes de firmar'
              }
            </p>
          </div>
        </div>

        {/* Estado: Certificados */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          certificatesLoaded ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex-shrink-0">
            {certificatesLoaded ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Key className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <p className={`font-medium ${certificatesLoaded ? 'text-green-800' : 'text-gray-600'}`}>
              Certificados de prueba cargados
            </p>
            <p className={`text-sm ${certificatesLoaded ? 'text-green-700' : 'text-gray-500'}`}>
              Certificados configurados automáticamente para testing
            </p>
          </div>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Error en el proceso</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadTestCertificates}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información de testing */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TestTube className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Modo de Pruebas Activo</h4>
            <div className="text-sm text-blue-700 mt-1 space-y-1">
              <p>• Certificados de prueba cargados automáticamente</p>
              <p>• Firma digital simulada para testing seguro</p>
              <p>• QR generado apunta al ambiente de pruebas</p>
              <p>• Todos los procesos son simulados y seguros</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignatureQRManager;