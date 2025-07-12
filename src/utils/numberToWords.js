// src/utils/numberToWords.js
// Función para convertir números a palabras en español

const unidades = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'
];

const decenas = [
  '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
];

const especiales = {
  11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
  16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
  21: 'VEINTIUNO', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
  25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
};

const centenas = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
];

const miles = ['', 'MIL', 'MILLÓN', 'MILLONES'];

export const numberToWords = (number) => {
  if (number === 0) return 'CERO';
  if (number < 0) return 'MENOS ' + numberToWords(Math.abs(number));

  const integerPart = Math.floor(number);
  const decimalPart = Math.round((number - integerPart) * 100);

  let result = '';

  // Procesar parte entera
  if (integerPart > 0) {
    result = convertInteger(integerPart);
  }

  // Procesar parte decimal
  if (decimalPart > 0) {
    if (result) result += ' CON ';
    result += convertInteger(decimalPart) + ' CENTAVOS';
  } else if (result) {
    result += ' DÓLARES';
  }

  return result;
};

const convertInteger = (num) => {
  if (num === 0) return '';
  if (num < 10) return unidades[num];
  if (num < 100) return convertDecenas(num);
  if (num < 1000) return convertCentenas(num);
  if (num < 1000000) return convertMiles(num);
  if (num < 1000000000) return convertMillones(num);
  return 'NÚMERO MUY GRANDE';
};

const convertDecenas = (num) => {
  if (especiales[num]) return especiales[num];
  if (num < 30) return 'VEINTI' + unidades[num - 20];
  
  const decena = Math.floor(num / 10);
  const unidad = num % 10;
  
  if (unidad === 0) return decenas[decena];
  if (unidad === 1) return decenas[decena] + ' Y UNO';
  return decenas[decena] + ' Y ' + unidades[unidad];
};

const convertCentenas = (num) => {
  if (num === 100) return 'CIEN';
  
  const centena = Math.floor(num / 100);
  const resto = num % 100;
  
  let result = centenas[centena];
  if (resto > 0) {
    result += ' ' + convertDecenas(resto);
  }
  
  return result;
};

const convertMiles = (num) => {
  const miles = Math.floor(num / 1000);
  const resto = num % 1000;
  
  let result = '';
  
  if (miles === 1) {
    result = 'MIL';
  } else if (miles > 1) {
    result = convertInteger(miles) + ' MIL';
  }
  
  if (resto > 0) {
    if (result) result += ' ';
    result += convertInteger(resto);
  }
  
  return result;
};

const convertMillones = (num) => {
  const millones = Math.floor(num / 1000000);
  const resto = num % 1000000;
  
  let result = '';
  
  if (millones === 1) {
    result = 'UN MILLÓN';
  } else {
    result = convertInteger(millones) + ' MILLONES';
  }
  
  if (resto > 0) {
    if (result) result += ' ';
    result += convertInteger(resto);
  }
  
  return result;
};

export default numberToWords; 