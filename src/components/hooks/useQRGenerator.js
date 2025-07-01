// src/hooks/useQRGenerator.js
import { useState, useCallback } from 'react';

export const useQRGenerator = () => {
  const [qrData, setQrData] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Función para generar la cadena QR según especificaciones de El Salvador
  const generateQRString = useCallback((dteData) => {
    try {
      const {
        emisor,
        receptor,
        identificacion,
        resumen,
        selloRecibido
      } = dteData;

      // Formato oficial: https://admin.factura.gob.sv/consultaPublica?ambiente=00&codGen=CODIGO&fechaEmi=FECHA
      const baseUrl = "https://admin.factura.gob.sv/consultaPublica";
      const ambiente = "00"; // 00 = Producción, 01 = Pruebas
      
      const qrString = `${baseUrl}?ambiente=${ambiente}&codGen=${identificacion.codigoGeneracion}&fechaEmi=${identificacion.fecEmi}`;
      
      setQrData({
        url: qrString,
        codigoGeneracion: identificacion.codigoGeneracion,
        fechaEmision: identificacion.fecEmi,
        emisor: emisor.nombre,
        receptor: receptor.nombre || "CONSUMIDOR FINAL",
        total: resumen.totalPagar,
        sello: selloRecibido || "PENDIENTE"
      });

      return qrString;
    } catch (err) {
      setError(`Error al generar cadena QR: ${err.message}`);
      return null;
    }
  }, []);

  // Función para generar imagen QR usando una API externa
  const generateQRImage = useCallback(async (qrString, size = 200) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Usando QR Server API (gratuita)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrString)}`;
      
      // Verificar que la URL sea válida
      const response = await fetch(qrUrl);
      if (!response.ok) {
        throw new Error('Error al generar código QR');
      }

      setQrImage(qrUrl);
      return qrUrl;
    } catch (err) {
      setError(`Error al generar imagen QR: ${err.message}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Función para generar QR usando Canvas (alternativa local)
  const generateQRCanvas = useCallback((qrString, size = 200) => {
    return new Promise((resolve) => {
      // Esta función requeriría una librería como qrcode.js
      // Para simplicidad, usaremos la API externa
      resolve(generateQRImage(qrString, size));
    });
  }, [generateQRImage]);

  // Función principal para generar QR completo
  const generateQR = useCallback(async (dteData, options = {}) => {
    const { size = 200, format = 'url' } = options;
    
    setIsGenerating(true);
    setError(null);

    try {
      // Generar la cadena QR
      const qrString = generateQRString(dteData);
      if (!qrString) {
        throw new Error('No se pudo generar la cadena QR');
      }

      // Generar la imagen QR
      let qrImageUrl;
      if (format === 'canvas') {
        qrImageUrl = await generateQRCanvas(qrString, size);
      } else {
        qrImageUrl = await generateQRImage(qrString, size);
      }

      return {
        qrString,
        qrImageUrl,
        qrData: qrData
      };
    } catch (err) {
      setError(`Error al generar QR: ${err.message}`);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [generateQRString, generateQRImage, generateQRCanvas, qrData]);

  // Función para validar datos antes de generar QR
  const validateQRData = useCallback((dteData) => {
    const errors = [];

    if (!dteData.identificacion?.codigoGeneracion) {
      errors.push('Código de generación requerido');
    }

    if (!dteData.identificacion?.fecEmi) {
      errors.push('Fecha de emisión requerida');
    }

    if (!dteData.emisor?.nombre) {
      errors.push('Nombre del emisor requerido');
    }

    if (!dteData.resumen?.totalPagar) {
      errors.push('Total a pagar requerido');
    }

    // Validar formato del código de generación (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (dteData.identificacion?.codigoGeneracion && !uuidRegex.test(dteData.identificacion.codigoGeneracion)) {
      errors.push('Formato de código de generación inválido (debe ser UUID v4)');
    }

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dteData.identificacion?.fecEmi && !fechaRegex.test(dteData.identificacion.fecEmi)) {
      errors.push('Formato de fecha inválido (debe ser YYYY-MM-DD)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Función para descargar imagen QR
  const downloadQR = useCallback(async (filename = 'qr-code.png') => {
    if (!qrImage) {
      setError('No hay imagen QR para descargar');
      return;
    }

    try {
      const response = await fetch(qrImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Error al descargar QR: ${err.message}`);
    }
  }, [qrImage]);

  // Función para limpiar estado
  const clearQR = useCallback(() => {
    setQrData(null);
    setQrImage(null);
    setError(null);
  }, []);

  // Función para obtener información del QR
  const getQRInfo = useCallback(() => {
    if (!qrData) return null;

    return {
      url: qrData.url,
      codigoGeneracion: qrData.codigoGeneracion,
      fechaEmision: qrData.fechaEmision,
      emisor: qrData.emisor,
      receptor: qrData.receptor,
      total: qrData.total,
      sello: qrData.sello,
      estado: qrData.sello === "PENDIENTE" ? "Pendiente" : "Procesado"
    };
  }, [qrData]);

  return {
    qrData,
    qrImage,
    isGenerating,
    error,
    generateQR,
    generateQRString,
    generateQRImage,
    validateQRData,
    downloadQR,
    clearQR,
    getQRInfo
  };
};