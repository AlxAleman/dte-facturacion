import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Shield, Calculator } from "lucide-react";

const DTE_TYPES = [
  { key: "fe-fc-v1", name: "Factura Electrónica" },
  { key: "fe-ccf-v3", name: "Comprobante de Crédito Fiscal" },
  { key: "fe-nr-v3", name: "Nota de Remisión Electrónica" },
  { key: "fe-nc-v3", name: "Nota de Crédito Electrónica" },
  { key: "fe-nd-v3", name: "Nota de Débito Electrónica" },
  { key: "fe-cl-v1", name: "Comprobante de Liquidación" },
  { key: "fe-cr-v1", name: "Comprobante de Retención" },
  { key: "fe-cd-v1", name: "Comprobante de Donación" },
  { key: "fe-dcl-v1", name: "Documento Contable de Liquidación" },
  { key: "fe-fex-v1", name: "Factura de Exportación Electrónica" },
  { key: "fe-fse-v1", name: "Factura Sujeto Excluido Electrónica" },
  { key: "anulacion-schema-v2", name: "Evento de Anulación/Invalidación" },
  { key: "contingencia-schema-v3", name: "Evento de Contingencia" },
];

export default function DteTypeSelector() {
  const navigate = useNavigate();

  const handleSelect = (key) => {
    navigate(`/emitir/${key}`);
  };

  const handleProfessionalSystem = () => {
    navigate('/dte/nuevo');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900 p-4">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Sistema Profesional - Destacado */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl border border-blue-400">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                Sistema Profesional
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-semibold">
                  NUEVO
                </span>
              </h2>
              <p className="text-blue-100">Proceso completo guiado con todas las funcionalidades</p>
            </div>
          </div>
          
          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2 text-white/90">
              <Calculator className="w-5 h-5 text-yellow-300" />
              <span className="text-sm">Cálculos Automáticos</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Shield className="w-5 h-5 text-green-300" />
              <span className="text-sm">Firma Digital</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Zap className="w-5 h-5 text-purple-300" />
              <span className="text-sm">Validación en Tiempo Real</span>
            </div>
          </div>
          
          <button
            onClick={handleProfessionalSystem}
            className="w-full md:w-auto px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ✨ Usar Sistema Profesional
          </button>
        </div>

        {/* Sistema Tradicional */}
        <div className="bg-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-bold">
              Sistema Tradicional
            </h2>
            <span className="text-xs bg-zinc-600 text-zinc-300 px-3 py-1 rounded-full">
              Compatible
            </span>
          </div>
          
          <p className="text-zinc-400 mb-6 text-sm">
            Selecciona el tipo específico de documento que deseas crear
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DTE_TYPES.map(dte => (
              <button
                key={dte.key}
                onClick={() => handleSelect(dte.key)}
                className="py-3 px-4 bg-blue-500 hover:bg-blue-600 transition-colors text-white rounded-lg font-medium shadow text-sm hover:shadow-lg transform hover:scale-105 duration-200"
              >
                {dte.name}
              </button>
            ))}
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            💡 Recomendación
          </h3>
          <div className="text-zinc-300 text-sm space-y-2">
            <p><strong>Sistema Profesional:</strong> Ideal para usuarios que necesitan un proceso completo con validaciones automáticas, cálculos de impuestos, firma digital y generación de QR.</p>
            <p><strong>Sistema Tradicional:</strong> Para usuarios avanzados que prefieren control granular sobre cada tipo de documento específico.</p>
          </div>
        </div>
      </div>
    </div>
  );
}