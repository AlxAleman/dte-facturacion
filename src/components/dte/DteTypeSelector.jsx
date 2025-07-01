import { useNavigate } from "react-router-dom";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <div className="bg-zinc-800 rounded-2xl p-10 w-full max-w-2xl shadow-2xl">
        <h2 className="text-white text-2xl font-bold mb-8 text-center">
          Selecciona el tipo de Documento a Emitir
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DTE_TYPES.map(dte => (
            <button
              key={dte.key}
              onClick={() => handleSelect(dte.key)}
              className="py-3 px-2 bg-blue-500 hover:bg-blue-700 transition-colors text-white rounded-lg font-semibold shadow"
            >
              {dte.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
