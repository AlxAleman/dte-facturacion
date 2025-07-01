// src/services/digitalSignature.js
// Servicio para manejo de firma digital de DTEs en El Salvador

export class DigitalSignatureService {
  constructor() {
    this.certificate = null;
    this.privateKey = null;
    this.isInitialized = false;
  }

  // Cargar certificado desde archivo .cer
  async loadCertificate(certificateFile) {
    try {
      const certificateData = await this.readFileAsArrayBuffer(certificateFile);
      
      // Convertir a formato base64
      const base64Certificate = this.arrayBufferToBase64(certificateData);
      
      // Importar certificado usando Web Crypto API
      const certificateBuffer = this.base64ToArrayBuffer(base64Certificate);
      
      // En un entorno real, aquí se validaría el certificado con las autoridades
      this.certificate = {
        data: base64Certificate,
        buffer: certificateBuffer,
        fileName: certificateFile.name,
        validFrom: new Date(), // En real se extraería del certificado
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // En real se extraería del certificado
        issuer: "Ministerio de Hacienda - El Salvador", // En real se extraería del certificado
        serialNumber: this.generateSerialNumber()
      };

      return {
        success: true,
        message: "Certificado cargado correctamente",
        certificate: this.certificate
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al cargar certificado: ${error.message}`,
        error
      };
    }
  }

  // Cargar llave privada desde archivo .key
  async loadPrivateKey(keyFile, password = '') {
    try {
      const keyData = await this.readFileAsText(keyFile);
      
      // En un entorno real, aquí se procesaría la llave privada PEM
      // y se desencriptaría con la contraseña
      this.privateKey = {
        data: keyData,
        fileName: keyFile.name,
        isEncrypted: keyData.includes('ENCRYPTED'),
        algorithm: 'RSA-4096' // El Salvador requiere RSA-4096
      };

      this.isInitialized = this.certificate && this.privateKey;

      return {
        success: true,
        message: "Llave privada cargada correctamente",
        privateKey: {
          fileName: this.privateKey.fileName,
          isEncrypted: this.privateKey.isEncrypted,
          algorithm: this.privateKey.algorithm
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al cargar llave privada: ${error.message}`,
        error
      };
    }
  }

  // Firmar documento DTE
  async signDocument(dteJson) {
    if (!this.isInitialized) {
      return {
        success: false,
        message: "Sistema de firma no inicializado. Cargue certificado y llave privada."
      };
    }

    try {
      // Validar estructura del DTE
      const validation = this.validateDTEStructure(dteJson);
      if (!validation.isValid) {
        return {
          success: false,
          message: "Estructura del DTE inválida",
          errors: validation.errors
        };
      }

      // Generar hash del documento
      const documentHash = await this.generateDocumentHash(dteJson);
      
      // Simular firma digital (en producción se usaría la llave privada real)
      const signature = await this.generateSignature(documentHash);
      
      // Crear documento firmado
      const signedDocument = {
        ...dteJson,
        firma: signature,
        certificado: this.certificate.data,
        fechaFirma: new Date().toISOString(),
        algoritmo: "RSA-SHA256"
      };

      return {
        success: true,
        message: "Documento firmado correctamente",
        signedDocument,
        signature: signature.valor,
        timestamp: signature.fecha
      };
    } catch (error) {
      return {
        success: false,
        message: `Error al firmar documento: ${error.message}`,
        error
      };
    }
  }

  // Verificar firma de un documento
  async verifySignature(signedDocument) {
    try {
      if (!signedDocument.firma) {
        return {
          isValid: false,
          message: "El documento no contiene firma digital"
        };
      }

      // Extraer componentes
      const { firma, certificado, ...documentData } = signedDocument;
      
      // Regenerar hash del documento original
      const documentHash = await this.generateDocumentHash(documentData);
      
      // Verificar firma (simulación)
      const isValid = await this.verifySignatureHash(documentHash, firma);
      
      return {
        isValid,
        message: isValid ? "Firma válida" : "Firma inválida",
        certificate: {
          issuer: "Ministerio de Hacienda - El Salvador",
          validFrom: this.certificate?.validFrom,
          validTo: this.certificate?.validTo
        },
        signatureDate: firma.fecha
      };
    } catch (error) {
      return {
        isValid: false,
        message: `Error al verificar firma: ${error.message}`,
        error
      };
    }
  }

  // Validar certificado
  validateCertificate() {
    if (!this.certificate) {
      return {
        isValid: false,
        message: "No hay certificado cargado",
        errors: ["Certificado no encontrado"]
      };
    }

    const errors = [];
    const now = new Date();

    // Verificar vigencia
    if (this.certificate.validTo < now) {
      errors.push("Certificado expirado");
    }

    if (this.certificate.validFrom > now) {
      errors.push("Certificado aún no es válido");
    }

    // Verificar emisor
    if (!this.certificate.issuer.includes("Ministerio de Hacienda")) {
      errors.push("Certificado no emitido por autoridad competente");
    }

    return {
      isValid: errors.length === 0,
      message: errors.length === 0 ? "Certificado válido" : "Certificado inválido",
      errors,
      certificate: {
        issuer: this.certificate.issuer,
        serialNumber: this.certificate.serialNumber,
        validFrom: this.certificate.validFrom,
        validTo: this.certificate.validTo
      }
    };
  }

  // Generar hash del documento
  async generateDocumentHash(document) {
    const jsonString = JSON.stringify(document, null, 0);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  // Generar firma digital (simulación)
  async generateSignature(documentHash) {
    // En producción, aquí se usaría la llave privada real para firmar el hash
    const timestamp = new Date().toISOString();
    const simulatedSignature = await this.generateSimulatedSignature(documentHash, timestamp);
    
    return {
      valor: simulatedSignature,
      fecha: timestamp,
      algoritmo: "RSA-SHA256",
      certificado: this.certificate.serialNumber
    };
  }

  // Generar firma simulada para desarrollo
  async generateSimulatedSignature(hash, timestamp) {
    const combined = hash + timestamp + this.certificate.serialNumber;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  // Verificar hash de firma
  async verifySignatureHash(documentHash, signature) {
    // Simulación de verificación
    const regeneratedSignature = await this.generateSimulatedSignature(documentHash, signature.fecha);
    return regeneratedSignature === signature.valor;
  }

  // Validar estructura del DTE
  validateDTEStructure(dte) {
    const errors = [];

    // Validaciones básicas requeridas
    if (!dte.identificacion) errors.push("Falta sección 'identificacion'");
    if (!dte.emisor) errors.push("Falta sección 'emisor'");
    if (!dte.receptor) errors.push("Falta sección 'receptor'");
    if (!dte.cuerpoDocumento) errors.push("Falta sección 'cuerpoDocumento'");
    if (!dte.resumen) errors.push("Falta sección 'resumen'");

    // Validar identificación
    if (dte.identificacion) {
      if (!dte.identificacion.codigoGeneracion) errors.push("Falta código de generación");
      if (!dte.identificacion.fecEmi) errors.push("Falta fecha de emisión");
      if (!dte.identificacion.tipoDocumento) errors.push("Falta tipo de documento");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utilidades
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Error al leer archivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Error al leer archivo'));
      reader.readAsText(file);
    });
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  generateSerialNumber() {
    return 'SV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Obtener información del estado actual
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasCertificate: !!this.certificate,
      hasPrivateKey: !!this.privateKey,
      certificate: this.certificate ? {
        fileName: this.certificate.fileName,
        issuer: this.certificate.issuer,
        serialNumber: this.certificate.serialNumber,
        validFrom: this.certificate.validFrom,
        validTo: this.certificate.validTo
      } : null,
      privateKey: this.privateKey ? {
        fileName: this.privateKey.fileName,
        isEncrypted: this.privateKey.isEncrypted,
        algorithm: this.privateKey.algorithm
      } : null
    };
  }

  // Limpiar certificados cargados
  clearCertificates() {
    this.certificate = null;
    this.privateKey = null;
    this.isInitialized = false;
  }
}

// Instancia singleton
export const digitalSignatureService = new DigitalSignatureService();