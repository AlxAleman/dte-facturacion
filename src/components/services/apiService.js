// src/components/services/apiService.js
// API Service para tu estructura específica

import { digitalSignatureService } from './digitalSignature';
import { schemaValidator } from './schemaValidator';

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://api.factura.gob.sv';
    this.testURL = import.meta.env.VITE_TEST_API_URL || 'https://apitest.dtes.mh.gob.sv';
    this.isProduction = import.meta.env.MODE === 'production';
    this.token = null;
    this.user = null;
  }

  // Configurar ambiente (producción o pruebas)
  setEnvironment(isProduction) {
    this.isProduction = isProduction;
  }

  // Obtener URL base según ambiente
  getBaseURL() {
    return this.isProduction ? this.baseURL : this.testURL;
  }

  // Configurar token de autenticación
  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('dte_auth_token', token);
    } else {
      localStorage.removeItem('dte_auth_token');
    }
  }

  // Obtener token de autenticación
  getAuthToken() {
    if (!this.token) {
      this.token = localStorage.getItem('dte_auth_token');
    }
    return this.token;
  }

  // Realizar petición HTTP
  async request(endpoint, options = {}) {
    const url = `${this.getBaseURL()}${endpoint}`;
    const token = this.getAuthToken();
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Agregar token de autenticación si existe
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return {
        success: true,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('API Request Error:', error);
      
      // ✅ CORREGIDO: En modo desarrollo, simular respuestas
      if (import.meta.env.MODE === 'development') {
        return this.simulateResponse(endpoint, options);
      }
      
      return {
        success: false,
        error: error.message,
        status: 500
      };
    }
  }

  // Simular respuestas para desarrollo
  async simulateResponse(endpoint, options) {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    if (endpoint.includes('/auth/login')) {
      return {
        success: true,
        data: {
          token: 'fake-jwt-token-' + Date.now(),
          user: {
            id: 1,
            email: 'test@empresa.com',
            name: 'Usuario Test',
            nit: '12345678901234',
            empresa: 'Empresa Test S.A.',
            environment: this.isProduction ? 'PRODUCCION' : 'PRUEBAS'
          }
        }
      };
    }

    if (endpoint.includes('/dte/send')) {
      return {
        success: true,
        data: {
          codigoGeneracion: options.body ? JSON.parse(options.body).identificacion?.codigoGeneracion : null,
          selloRecibido: 'SELLO-' + Date.now(),
          fhProcesamiento: new Date().toISOString(),
          estado: 'PROCESADO',
          observaciones: []
        }
      };
    }

    return {
      success: false,
      error: 'Endpoint no encontrado',
      status: 404
    };
  }

  // Autenticación
  async login(credentials) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success) {
        this.setAuthToken(response.data.token);
        this.user = response.data.user;
        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Error de autenticación: ${error.message}`
      };
    }
  }

  // Enviar DTE
  async sendDTE(dteData) {
    try {
      // Validar documento antes de enviar
      const validation = schemaValidator.validateDocumentByType(dteData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Documento inválido',
          validationErrors: validation.errors
        };
      }

      // Firmar documento si no está firmado
      let signedDocument = dteData;
      if (!dteData.firma && digitalSignatureService.getStatus().isInitialized) {
        const signResult = await digitalSignatureService.signDocument(dteData);
        if (!signResult.success) {
          return {
            success: false,
            error: 'Error al firmar documento',
            signatureError: signResult.message
          };
        }
        signedDocument = signResult.signedDocument;
      }

      // Enviar al Ministerio de Hacienda
      const response = await this.request('/dte/send', {
        method: 'POST',
        body: JSON.stringify({
          dte: signedDocument,
          ambiente: this.isProduction ? '00' : '01'
        })
      });

      if (response.success) {
        // Guardar en historial local
        this.saveToHistory(signedDocument, response.data);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar DTE: ${error.message}`
      };
    }
  }

  // Utilidades
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }

  // ✅ CORREGIDO: Guardar en historial local (desarrollo)
  saveToHistory(dte, response) {
    if (import.meta.env.MODE !== 'development') return;

    const historyItem = {
      codigoGeneracion: dte.identificacion.codigoGeneracion,
      tipoDocumento: dte.identificacion.tipoDocumento,
      fechaEmision: dte.identificacion.fecEmi,
      receptor: dte.receptor?.nombre || 'CONSUMIDOR FINAL',
      total: dte.resumen?.totalPagar || 0,
      estado: response.estado || 'PROCESADO',
      selloRecibido: response.selloRecibido,
      fhProcesamiento: response.fhProcesamiento || new Date().toISOString(),
      dte: dte
    };

    const history = this.getLocalHistory();
    history.unshift(historyItem);
    
    // Mantener solo los últimos 100 registros
    const limitedHistory = history.slice(0, 100);
    localStorage.setItem('dte_history', JSON.stringify(limitedHistory));
  }

  getLocalHistory() {
    try {
      const history = localStorage.getItem('dte_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error al obtener historial local:', error);
      return [];
    }
  }
}

// Instancia singleton
export const apiService = new ApiService();
export default apiService;