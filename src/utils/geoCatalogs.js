// src/utils/geoCatalogs.js

export const DEPARTAMENTOS = {
  '01': 'Ahuachapán',
  '02': 'Santa Ana',
  '03': 'Sonsonate',
  '04': 'Chalatenango',
  '05': 'La Libertad',
  '06': 'San Salvador',
  '07': 'Cuscatlán',
  '08': 'La Paz',
  '09': 'Cabañas',
  '10': 'San Vicente',
  '11': 'Usulután',
  '12': 'San Miguel',
  '13': 'Morazán',
  '14': 'La Unión'
};

export const MUNICIPIOS = {
  '06': {
    '01': 'San Salvador',
    '02': 'Aguilares',
    '03': 'Apopa',
    '04': 'Ayutuxtepeque',
    '05': 'Cuscatancingo',
    '06': 'Delgado',
    '07': 'El Paisnal',
    '08': 'Guazapa',
    '09': 'Ilopango',
    '10': 'Mejicanos',
    '11': 'Nejapa',
    '12': 'Panchimalco',
    '13': 'Rosario de Mora',
    '14': 'San Marcos',
    '15': 'San Martín',
    '16': 'Santiago Texacuangos',
    '17': 'Santo Tomás',
    '18': 'Soyapango',
    '19': 'Tonacatepeque'
  }
  // Puedes agregar más municipios según necesidad
};

export function getNombreDepartamento(codigo) {
  return DEPARTAMENTOS[codigo] || codigo;
}

export function getNombreMunicipio(dep, mun) {
  return (MUNICIPIOS[dep] && MUNICIPIOS[dep][mun]) || mun;
} 