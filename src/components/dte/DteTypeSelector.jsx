import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Shield, Calculator } from "lucide-react";

export default function DteTypeSelector() {
  const navigate = useNavigate();

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

        {/* Información adicional */}
        <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            💡 Información del Sistema
          </h3>
          <div className="text-zinc-300 text-sm space-y-2">
            <p><strong>Sistema Profesional:</strong> Ideal para usuarios que necesitan un proceso completo con validaciones automáticas, cálculos de impuestos, firma digital y generación de QR.</p>
            <p><strong>Características incluidas:</strong> Formulario intuitivo, múltiples productos, cálculos automáticos de IVA, firma digital con certificados, generación de QR y envío al Ministerio de Hacienda.</p>
            <p><strong>Compatibilidad:</strong> Funciona con todos los tipos de documentos electrónicos de El Salvador (Facturas, CCF, Notas de Crédito, etc.).</p>
          </div>
        </div>
      </div>
    </div>
  );
}