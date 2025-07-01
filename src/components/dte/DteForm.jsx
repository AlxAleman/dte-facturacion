// src/components/dte/DteForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { SCHEMAS } from "../schemas/schemas";
import { useAuth } from "../context/AuthContext";
import FacturaPreview from "./FacturaPreview";
import { useReactToPrint } from "react-to-print";

// Render recursivo, inputs de emisor readonly
function RenderSchema({ schema, value, setValue, path = "" }) {
  const isEmisor = path.startsWith("emisor");

  if (!schema || !schema.properties) return null;

  const simpleFields = [];
  const complexFields = [];

  Object.entries(schema.properties).forEach(([key, prop]) => {
    const fullPath = path ? `${path}.${key}` : key;
    const val = value?.[key];

    if (prop.type === "object" || prop.type === "array") {
      complexFields.push(
        <div key={fullPath} className="col-span-2 mb-6 p-4 rounded bg-zinc-700">
          <div className="font-bold mb-3 text-blue-300 uppercase tracking-wide">{prop.title || key}</div>
          {prop.type === "object" ? (
            <RenderSchema
              schema={prop}
              value={val || {}}
              setValue={obj =>
                setValue({
                  ...value,
                  [key]: obj,
                })
              }
              path={fullPath}
            />
          ) : (
            // Array rendering
            <div>
              <button
                type="button"
                className="mb-2 py-1 px-3 bg-blue-500 text-white rounded"
                onClick={() => setValue({ ...value, [key]: [...(val || []), {}] })}
              >
                + Agregar {prop.items?.title || "ítem"}
              </button>
              <div className="flex flex-col gap-2">
                {(val || []).map((item, idx) => (
                  <div key={idx} className="mb-2 border rounded p-2 bg-zinc-800">
                    <RenderSchema
                      schema={prop.items}
                      value={item}
                      setValue={itemVal =>
                        setValue({
                          ...value,
                          [key]: val.map((v, i) => (i === idx ? itemVal : v)),
                        })
                      }
                      path={`${fullPath}[${idx}]`}
                    />
                    <button
                      type="button"
                      className="mt-2 py-1 px-3 bg-red-500 text-white rounded"
                      onClick={() =>
                        setValue({
                          ...value,
                          [key]: val.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      simpleFields.push(
        <div key={fullPath} className="mb-4 flex flex-col">
          <label className="text-white font-semibold mb-1">{prop.title || key}</label>
          <input
            className="p-2 rounded border border-zinc-500 bg-zinc-900 text-white w-full focus:outline-none focus:border-blue-500 transition-all"
            type={prop.type === "number" ? "number" : "text"}
            value={val || ""}
            onChange={e => setValue({ ...value, [key]: e.target.value })}
            required={schema.required?.includes(key)}
            autoComplete="off"
            readOnly={isEmisor}
            tabIndex={isEmisor ? -1 : 0}
            style={isEmisor ? { background: "#232334", opacity: 0.85 } : {}}
          />
        </div>
      );
    }
  });

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">{simpleFields}</div>
      {complexFields}
    </div>
  );
}

export default function DteForm() {
  const { tipo } = useParams();
  const schema = SCHEMAS[tipo];
  const [formData, setFormData] = useState({});
  const [jsonOutput, setJsonOutput] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const facturaRef = useRef();
  const { user } = useAuth() || {};

  // Autollenado dinámico de "emisor"
  useEffect(() => {
    if (
      schema &&
      schema.properties &&
      schema.properties["emisor"] &&
      user &&
      !formData.emisor
    ) {
      const emisorFields = Object.keys(schema.properties["emisor"].properties || {});
      const emisorAutofill = {};
      emisorFields.forEach(field => {
        if (user[field] !== undefined) {
          emisorAutofill[field] = user[field];
        } else {
          emisorAutofill[field] = "";
        }
      });

      setFormData(prev => ({
        ...prev,
        emisor: emisorAutofill,
      }));
    }
    // eslint-disable-next-line
  }, [schema, user]);

  // Manejo de tabs
  const sectionKeys = Object.keys(schema?.properties || {});
  useEffect(() => {
    if (!activeTab && sectionKeys.length > 0) setActiveTab(sectionKeys[0]);
    // eslint-disable-next-line
  }, [schema]);

  const handleTabClick = key => setActiveTab(key);

  const handleSectionChange = (sectionKey, val) => {
    setFormData(prev => ({
      ...prev,
      [sectionKey]: val,
    }));
  };

  const handleGenerateJSON = () => {
    setJsonOutput(JSON.stringify(formData, null, 2));
  };

  // Para imprimir factura
  const handlePrint = useReactToPrint({
    content: () => facturaRef.current,
  });

  // Obtén datos para el preview (ajusta si tu schema es diferente)
  const emisor = formData.emisor;
  const receptor = formData.receptor;
  const items = formData.cuerpoDocumento?.detalle || [];
  const resumen = formData.resumen;
  const infoAdicional = formData.extension?.infoAdicional || "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 relative">
      <div className="bg-zinc-800 rounded-2xl max-w-6xl w-full shadow-2xl flex"
           style={{ minHeight: 750, minWidth: 1240 }}>
        {/* Tabs verticales */}
        <div className="flex flex-col w-64 p-8 border-r border-zinc-700">
          <h2 className="text-white text-lg font-bold mb-6 text-center tracking-wide">
            {schema?.title || "DTE"}
          </h2>
          <div className="flex flex-col gap-2">
            {sectionKeys.map(key => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={`py-2 px-3 rounded-lg font-bold text-left transition-colors
                  ${activeTab === key ? "bg-blue-600 text-white shadow" : "bg-zinc-700 text-zinc-200 hover:bg-blue-800"}`}
              >
                {schema.properties[key]?.title || key}
              </button>
            ))}
          </div>
        </div>
        {/* Formulario a la derecha */}
        <div
          className="flex-1 p-10 flex flex-col justify-between relative"
          style={{
            minHeight: "700px",
            minWidth: "800px",
            maxHeight: "900px",
            maxWidth: "1100px",
            overflowY: "auto",
            transition: "min-height 0.2s, max-height 0.2s, min-width 0.2s, max-width 0.2s"
          }}
        >
          {activeTab && schema.properties[activeTab] && (
            Object.keys(schema.properties[activeTab].properties || {}).length > 0 ? (
              <RenderSchema
                schema={schema.properties[activeTab]}
                value={formData[activeTab] || {}}
                setValue={val => handleSectionChange(activeTab, val)}
                path={activeTab}
              />
            ) : (
              <div className="text-zinc-400 py-12 text-center">No hay campos en esta sección.</div>
            )
          )}
          {jsonOutput && (
            <pre className="mt-8 bg-zinc-900 p-4 rounded text-green-300 text-xs overflow-x-auto">
              {jsonOutput}
            </pre>
          )}
        </div>
      </div>
      {/* Botones de acción fuera del form */}
      <div className="flex gap-4 mt-8 justify-end w-full max-w-6xl">
        <button
          onClick={() => setShowPreview(true)}
          className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl text-lg tracking-wide"
          type="button"
        >
          Ver factura / Imprimir
        </button>
        <button
          onClick={handleGenerateJSON}
          className="py-3 px-8 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded-xl shadow-xl text-lg tracking-wide"
          type="button"
        >
          Generar JSON
        </button>
      </div>

      {/* Modal para vista previa */}
      {showPreview && (
  <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-start justify-center overflow-auto">
    <div className="relative min-w-[820px] min-h-[1100px] max-h-full flex flex-col justify-start items-center">
      {/* Botón cerrar arriba a la derecha */}
      <button
        onClick={() => setShowPreview(false)}
        className="fixed top-6 right-8 z-50 py-2 px-4 bg-red-500 text-white rounded shadow print:hidden"
      >
        Cerrar
      </button>
      {/* Factura centrada */}
      <FacturaPreview
        ref={facturaRef}
        emisor={emisor}
        receptor={receptor}
        items={items}
        resumen={resumen}
        infoAdicional={infoAdicional}
      />
      <div className="flex gap-4 mt-6 justify-end print:hidden">
        <button
          className="py-2 px-4 bg-green-600 text-white rounded"
          onClick={handlePrint}
        >
          Imprimir
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
