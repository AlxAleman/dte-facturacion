// src/components/dte/forms/index.js
// Exporta todos los formularios y componentes

// Coordinador principal
export { default as DteFormContainer } from './DteFormContainer.export';

// Componentes compartidos
export { default as EmisorSection } from './shared/EmisorSection';
export { default as DocumentInfoSection } from './shared/DocumentInfoSection';
export { default as ProductItemsSection } from './shared/ProductItemsSection';
export { default as ValidationSummary } from './shared/ValidationSummary';

// Formularios específicos por tipo
export { default as FacturaConsumidor } from './types/FacturaConsumidor';
export { default as CreditoFiscal } from './types/CreditoFiscal';
export { default as NotaRemision } from './types/NotaRemision';
export { default as NotaCredito } from './types/NotaCredito';
export { default as NotaDebito } from './types/NotaDebito';
export { default as ComprobanteRetencion } from './types/ComprobanteRetencion';
export { default as ComprobanteLiquidacion } from './types/ComprobanteLiquidacion';
export { default as DocumentoContable } from './types/DocumentoContable';
export { default as FacturaExportacion } from './types/FacturaExportacion';
export { default as SujetoExcluido } from './types/SujetoExcluido';
export { default as ComprobanteDonacion } from './types/ComprobanteDonacion';

// Mapeo de tipos de DTE a componentes
export const DTE_FORM_MAPPING = {
  "01": "FacturaConsumidor",
  "03": "CreditoFiscal", 
  "04": "NotaRemision",
  "05": "NotaCredito",
  "06": "NotaDebito",
  "07": "ComprobanteRetencion",
  "08": "ComprobanteLiquidacion",
  "09": "DocumentoContable",
  "11": "FacturaExportacion",
  "14": "SujetoExcluido",
  "15": "ComprobanteDonacion"
}; 