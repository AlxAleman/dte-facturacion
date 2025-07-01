// src/calculadora/SignatureQRManager.jsx
import { useState, useRef } from 'react';
import { Upload, FileCheck, AlertCircle, CheckCircle, Download, QrCode, Key, Shield, Eye, EyeOff } from 'lucide-react';
import { digitalSignatureService } from '../components/services/digitalSignature';
import { useQRGenerator } from '../components/hooks/useQRGenerator';

const SignatureQRManager = ({ dteData, onDocumentSigned, onQRGenerated }) => {
  const [certificateFile, setCertificateFile] = useState(null);
  const [privateKeyFile, setPrivateKeyFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('certificate');
  
  const certificateInputRef = useRef(null);
  const keyInputRef = useRef(null);
  
  const {
    qrData,
    qrImage,
    isGenerating,
    error: qrError,
    generateQR,
    downloadQR,
    getQRInfo
  } = useQRGenerator();

  // Manejar carga de certificado
  const handleCertificateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.cer')) {
      setSignatureStatus({
        type: 'error',
        message: 'Por favor seleccione un archivo .cer válido'
      });
      return;
    }

    setIsLoading(true);
    setCertificateFile(file);
    
    try {
      const result = await digitalSignatureService.loadCertificate(file);
      setSignatureStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
    } catch (error) {
      setSignatureStatus({
        type: 'error',
        message: `Error al cargar certificado: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar carga de llave privada
  const handlePrivateKeyUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.key')) {
      setSignatureStatus({
        type: 'error',
        message: 'Por favor seleccione un archivo .key válido'
      });
      return;
    }

    setIsLoading(true);
    setPrivateKeyFile(file);
    
    try {
      const result = await digitalSignatureService.loadPrivateKey(file, password);
      setSignatureStatus({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
    } catch (error) {
      setSignatureStatus({
        type: 'error',
        message: `Error al cargar llave privada: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Firmar documento
  const handleSignDocument = async () => {
    if (!dteData) {
      setSignatureStatus({
        type: 'error',
        message: 'No hay documento para firmar'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await digitalSignatureService.signDocument(dteData);
      
      if (result.success) {
        setSignatureStatus({
          type: 'success',
          message: 'Documento firmado correctamente'
        });
        
        if (onDocumentSigned) {
          onDocumentSigned(result.signedDocument);
        }
        
        // Generar QR automáticamente después de firmar
        await handleGenerateQR(result.signedDocument);
      } else {
        setSignatureStatus({
          type: 'error',
          message: result.message,
          errors: result.errors
        });
      }
    } catch (error) {
      setSignatureStatus({
        type: 'error',
        message: `Error al firmar documento: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generar código QR
  const handleGenerateQR = async (documentData = dteData) => {
    if (!documentData) {
      setSignatureStatus({
        type: 'error',
        message: 'No hay documento para generar QR'
      });
      return;
    }

    try {
      const result = await generateQR(documentData, { size: 200 });
      
      if (result) {
        setSignatureStatus({
          type: 'success',
          message: 'Código QR generado correctamente'
        });
        
        if (onQRGenerated) {
          onQRGenerated(result);
        }
      }
    } catch (error) {
      setSignatureStatus({
        type: 'error',
        message: `Error al generar QR: ${error.message}`
      });
    }
  };

  // Obtener estado de los certificados
  const getSignatureStatus = () => {
    return digitalSignatureService.getStatus();
  };

  const status = getSignatureStatus();
  const qrInfo = getQRInfo();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Firma Digital y Código QR
        </h2>

        {/* Pestañas */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('certificate')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'certificate'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Certificados
          </button>
          <button
            onClick={() => setActiveTab('sign')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'sign'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileCheck className="w-4 h-4 inline mr-2" />
            Firmar
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'qr'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <QrCode className="w-4 h-4 inline mr-2" />
            Código QR
          </button>
        </div>

        {/* Contenido de pestañas */}
        {activeTab === 'certificate' && (
          <div className="space-y-6">
            {/* Estado de certificados */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Estado de Certificados</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Certificado (.cer)</span>
                  <div className="flex items-center gap-2">
                    {status.hasCertificate ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs ${status.hasCertificate ? 'text-green-600' : 'text-red-600'}`}>
                      {status.hasCertificate ? 'Cargado' : 'No cargado'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Llave Privada (.key)</span>
                  <div className="flex items-center gap-2">
                    {status.hasPrivateKey ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-xs ${status.hasPrivateKey ? 'text-green-600' : 'text-red-600'}`}>
                      {status.hasPrivateKey ? 'Cargada' : 'No cargada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargar certificado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificado Digital (.cer)
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => certificateInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Seleccionar Archivo
                </button>
                <span className="text-sm text-gray-600">
                  {certificateFile?.name || 'Ningún archivo seleccionado'}
                </span>
              </div>
              <input
                ref={certificateInputRef}
                type="file"
                accept=".cer"
                onChange={handleCertificateUpload}
                className="hidden"
              />
            </div>

            {/* Cargar llave privada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Llave Privada (.key)
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => keyInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Seleccionar Archivo
                  </button>
                  <span className="text-sm text-gray-600">
                    {privateKeyFile?.name || 'Ningún archivo seleccionado'}
                  </span>
                </div>
                
                {/* Contraseña */}
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña de la llave privada (opcional)"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <input
                ref={keyInputRef}
                type="file"
                accept=".key"
                onChange={handlePrivateKeyUpload}
                className="hidden"
              />
            </div>

            {/* Información del certificado */}
            {status.certificate && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Información del Certificado</h4>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-blue-800">Emisor:</dt>
                    <dd className="text-blue-900">{status.certificate.issuer}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-800">Número de Serie:</dt>
                    <dd className="text-blue-900 font-mono">{status.certificate.serialNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-800">Válido hasta:</dt>
                    <dd className="text-blue-900">{new Date(status.certificate.validTo).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sign' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Firmar Documento</h3>
              <p className="text-gray-600 mb-6">
                El documento será firmado digitalmente con su certificado
              </p>
              
              <button
                onClick={handleSignDocument}
                disabled={!status.isInitialized || isLoading || !dteData}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Firmando...' : 'Firmar Documento'}
              </button>
            </div>

            {!status.isInitialized && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">Certificados requeridos</span>
                </div>
                <p className="text-yellow-700 mt-1">
                  Debe cargar el certificado digital y la llave privada antes de firmar
                </p>
              </div>
            )}

            {!dteData && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-800 font-medium">Documento requerido</span>
                </div>
                <p className="text-gray-700 mt-1">
                  Complete el formulario del DTE antes de firmar
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Código QR</h3>
              <p className="text-gray-600 mb-6">
                Genere el código QR para consulta pública del documento
              </p>
            </div>

            {qrImage ? (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img src={qrImage} alt="Código QR" className="w-48 h-48" />
                </div>
                
                {qrInfo && (
                  <div className="bg-green-50 rounded-lg p-4 text-left">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Información del QR</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-green-800">Código:</dt>
                        <dd className="text-green-900 font-mono text-xs">{qrInfo.codigoGeneracion}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-green-800">Fecha:</dt>
                        <dd className="text-green-900">{qrInfo.fechaEmision}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-green-800">Total:</dt>
                        <dd className="text-green-900">${qrInfo.total}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-green-800">Estado:</dt>
                        <dd className="text-green-900">{qrInfo.estado}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                <button
                  onClick={() => downloadQR('qr-dte.png')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Descargar QR
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => handleGenerateQR()}
                  disabled={!dteData || isGenerating}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isGenerating ? 'Generando...' : 'Generar Código QR'}
                </button>
              </div>
            )}

            {qrError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">Error al generar QR</span>
                </div>
                <p className="text-red-700 mt-1">{qrError}</p>
              </div>
            )}
          </div>
        )}

        {/* Mensajes de estado */}
        {signatureStatus && (
          <div className={`mt-6 p-4 rounded-lg ${
            signatureStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {signatureStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                signatureStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {signatureStatus.message}
              </span>
            </div>
            {signatureStatus.errors && (
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {signatureStatus.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


export default SignatureQRManager;