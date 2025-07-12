// src/components/data/catalogoPaises.js
// Catálogo oficial de países para DTE

export const paises = [
  { codigo: "001", valor: "El Salvador" },
  { codigo: "002", valor: "Guatemala" },
  { codigo: "003", valor: "Honduras" },
  { codigo: "004", valor: "Nicaragua" },
  { codigo: "005", valor: "Costa Rica" },
  { codigo: "006", valor: "Panamá" },
  { codigo: "007", valor: "Belice" },
  { codigo: "008", valor: "México" },
  { codigo: "009", valor: "Estados Unidos" },
  { codigo: "010", valor: "Canadá" },
  { codigo: "011", valor: "Argentina" },
  { codigo: "012", valor: "Bolivia" },
  { codigo: "013", valor: "Brasil" },
  { codigo: "014", valor: "Chile" },
  { codigo: "015", valor: "Colombia" },
  { codigo: "016", valor: "Ecuador" },
  { codigo: "017", valor: "Guyana" },
  { codigo: "018", valor: "Paraguay" },
  { codigo: "019", valor: "Perú" },
  { codigo: "020", valor: "Surinam" },
  { codigo: "021", valor: "Uruguay" },
  { codigo: "022", valor: "Venezuela" },
  { codigo: "023", valor: "España" },
  { codigo: "024", valor: "Francia" },
  { codigo: "025", valor: "Alemania" },
  { codigo: "026", valor: "Italia" },
  { codigo: "027", valor: "Reino Unido" },
  { codigo: "028", valor: "China" },
  { codigo: "029", valor: "Japón" },
  { codigo: "030", valor: "Corea del Sur" },
  { codigo: "031", valor: "India" },
  { codigo: "032", valor: "Australia" },
  { codigo: "033", valor: "Nueva Zelanda" },
  { codigo: "034", valor: "Sudáfrica" },
  { codigo: "035", valor: "Egipto" },
  { codigo: "036", valor: "Marruecos" },
  { codigo: "037", valor: "Nigeria" },
  { codigo: "038", valor: "Kenia" },
  { codigo: "039", valor: "Ghana" },
  { codigo: "040", valor: "Etiopía" },
  { codigo: "041", valor: "Tanzania" },
  { codigo: "042", valor: "Uganda" },
  { codigo: "043", valor: "Zambia" },
  { codigo: "044", valor: "Zimbabue" },
  { codigo: "045", valor: "Angola" },
  { codigo: "046", valor: "Mozambique" },
  { codigo: "047", valor: "Madagascar" },
  { codigo: "048", valor: "Camerún" },
  { codigo: "049", valor: "Costa de Marfil" },
  { codigo: "050", valor: "Senegal" },
  { codigo: "051", valor: "Mali" },
  { codigo: "052", valor: "Burkina Faso" },
  { codigo: "053", valor: "Níger" },
  { codigo: "054", valor: "Chad" },
  { codigo: "055", valor: "Sudán" },
  { codigo: "056", valor: "Sudán del Sur" },
  { codigo: "057", valor: "República Centroafricana" },
  { codigo: "058", valor: "República Democrática del Congo" },
  { codigo: "059", valor: "República del Congo" },
  { codigo: "060", valor: "Gabón" },
  { codigo: "061", valor: "Guinea Ecuatorial" },
  { codigo: "062", valor: "Santo Tomé y Príncipe" },
  { codigo: "063", valor: "Cabo Verde" },
  { codigo: "064", valor: "Guinea-Bisáu" },
  { codigo: "065", valor: "Guinea" },
  { codigo: "066", valor: "Sierra Leona" },
  { codigo: "067", valor: "Liberia" },
  { codigo: "068", valor: "Togo" },
  { codigo: "069", valor: "Benín" },
  { codigo: "070", valor: "Ruanda" },
  { codigo: "071", valor: "Burundi" },
  { codigo: "072", valor: "República Democrática del Congo" },
  { codigo: "073", valor: "República del Congo" },
  { codigo: "074", valor: "Gabón" },
  { codigo: "075", valor: "Guinea Ecuatorial" },
  { codigo: "076", valor: "Santo Tomé y Príncipe" },
  { codigo: "077", valor: "Cabo Verde" },
  { codigo: "078", valor: "Guinea-Bisáu" },
  { codigo: "079", valor: "Guinea" },
  { codigo: "080", valor: "Sierra Leona" },
  { codigo: "081", valor: "Liberia" },
  { codigo: "082", valor: "Togo" },
  { codigo: "083", valor: "Benín" },
  { codigo: "084", valor: "Ruanda" },
  { codigo: "085", valor: "Burundi" },
  { codigo: "086", valor: "República Democrática del Congo" },
  { codigo: "087", valor: "República del Congo" },
  { codigo: "088", valor: "Gabón" },
  { codigo: "089", valor: "Guinea Ecuatorial" },
  { codigo: "090", valor: "Santo Tomé y Príncipe" },
  { codigo: "091", valor: "Cabo Verde" },
  { codigo: "092", valor: "Guinea-Bisáu" },
  { codigo: "093", valor: "Guinea" },
  { codigo: "094", valor: "Sierra Leona" },
  { codigo: "095", valor: "Liberia" },
  { codigo: "096", valor: "Togo" },
  { codigo: "097", valor: "Benín" },
  { codigo: "098", valor: "Ruanda" },
  { codigo: "099", valor: "Burundi" },
  { codigo: "100", valor: "Otros países" }
];

// Función para buscar país por código
export const buscarPaisPorCodigo = (codigo) => {
  return paises.find(pais => pais.codigo === codigo) || null;
};

// Función para buscar país por nombre
export const buscarPaisPorNombre = (nombre) => {
  const nombreLower = nombre.toLowerCase();
  return paises.filter(pais => 
    pais.valor.toLowerCase().includes(nombreLower)
  );
};

// Función para obtener el nombre del país por código
export const getNombrePais = (codigo) => {
  const pais = buscarPaisPorCodigo(codigo);
  return pais ? pais.valor : 'País no encontrado';
};

// Función para obtener el código del país por nombre
export const getCodigoPais = (nombre) => {
  const pais = paises.find(p => p.valor.toLowerCase() === nombre.toLowerCase());
  return pais ? pais.codigo : null;
}; 