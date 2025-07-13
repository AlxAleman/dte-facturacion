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
  Key,
  Download,
  Copy
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        Firma Digital y Código QR
      </h3>

      <div className="space-y-6">
        {/* Información del documento */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Documento a Firmar
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-blue-800 dark:text-blue-200">
            <div>• <strong>Tipo:</strong> {dteData?.identificacion?.tipoDte || 'N/A'}</div>
            <div>• <strong>Código:</strong> {dteData?.identificacion?.codigoGeneracion?.substring(0, 8) || 'N/A'}...</div>
            <div>• <strong>Fecha:</strong> {dteData?.identificacion?.fecEmi || 'N/A'}</div>
            <div>• <strong>Total:</strong> ${(dteData?.resumen?.totalPagar || 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Controles de firma */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de firma */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Firma Digital</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Algoritmo de Firma
                </label>
                <select
                  value={signature.algorithm}
                  onChange={(e) => setSignature(prev => ({ ...prev, algorithm: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="SHA256">SHA256</option>
                  <option value="SHA512">SHA512</option>
                  <option value="MD5">MD5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Clave Privada (Base64)
                </label>
                <textarea
                  value={signature.privateKey}
                  onChange={(e) => setSignature(prev => ({ ...prev, privateKey: e.target.value }))}
                  placeholder="Ingrese su clave privada en formato Base64..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={signDocument}
                  disabled={!certificatesLoaded || !dteData}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto ${
                    certificatesLoaded && dteData
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  Firmar Documento
                </button>
                
                <button
                  onClick={loadTestCertificates}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  Cargar Clave de Prueba
                </button>
              </div>
            </div>

            {/* Estado de la firma */}
            {/* The original code had signatureStatus and qrStatus, but they were not defined.
                Assuming they are meant to be part of the new_code's state or props,
                but the new_code doesn't define them.
                For now, I'll remove them as they are not present in the new_code's state/props.
                If they were meant to be added, the new_code would need to be updated. */}
          </div>

          {/* Panel de QR */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Código QR</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tamaño del QR
                </label>
                <select
                  value={qrCode?.size || 256} // Use qrCode?.size if available, otherwise default to 256
                  onChange={(e) => setQrCode(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value={128}>128x128 (Pequeño)</option>
                  <option value={256}>256x256 (Mediano)</option>
                  <option value={512}>512x512 (Grande)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel de Corrección
                </label>
                <select
                  value={qrCode?.errorCorrectionLevel || 'M'} // Use qrCode?.errorCorrectionLevel if available, otherwise default to 'M'
                  onChange={(e) => setQrCode(prev => ({ ...prev, errorCorrectionLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="L">L - Bajo (7%)</option>
                  <option value="M">M - Medio (15%)</option>
                  <option value="Q">Q - Alto (25%)</option>
                  <option value="H">H - Máximo (30%)</option>
                </select>
              </div>

              <button
                onClick={signDocument} // This button now calls signDocument directly
                disabled={!certificatesLoaded || !dteData}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? ( // Use isProcessing from original state
                  <>
                    <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                    Firmando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 inline mr-2" />
                    Generar Código QR
                  </>
                )}
              </button>
            </div>

            {/* Estado del QR */}
            {/* The original code had signatureStatus and qrStatus, but they were not defined.
                Assuming they are meant to be part of the new_code's state or props,
                but the new_code doesn't define them.
                For now, I'll remove them as they are not present in the new_code's state/props.
                If they were meant to be added, the new_code would need to be updated. */}
          </div>
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la firma */}
          {qrCode && ( // Use qrCode for signedDocument
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Información de la Firma Digital
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-800 dark:text-green-300">Algoritmo:</span>
                  <p className="text-green-700 dark:text-green-200">{qrCode.algorithm}</p>
                </div>
                <div>
                  <span className="font-medium text-green-800 dark:text-green-300">Estado:</span>
                  <p className="text-green-700 dark:text-green-200">{qrCode.status}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium text-green-800 dark:text-green-300">Sello:</span>
                  <p className="text-green-700 dark:text-green-200 font-mono text-xs break-all mt-1">
                    {qrCode.signatureValue}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Código QR generado */}
          {qrCode && ( // Use qrCode for qrData
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR Generado
              </h4>
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white p-2 rounded-lg">
                  <img
                    src={qrCode.url} // Use qrCode.url for the QR image source
                    alt="Código QR del DTE"
                    className="max-w-full h-auto"
                    style={{ maxWidth: `${qrCode.size}px` }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCode.url;
                      link.download = `qr-dte-${dteData?.identificacion?.tipoDte}-${Date.now()}.png`;
                      link.click();
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Descargar
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrCode.url);
                      alert('URL del QR copiada al portapapeles');
                    }}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <Copy className="w-4 h-4 inline mr-1" />
                    Copiar URL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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