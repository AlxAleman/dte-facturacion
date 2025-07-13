// src/components/dte/ReceptorForm.jsx
import { useState } from "react";
import { FAKE_RECEIVERS } from "../../fakeReceivers"; // Ajusta el path
import { CATALOGS } from "../../data/catalogs";

export default function ReceptorForm({ value, setValue }) {
  const [buscando, setBuscando] = useState(false);

  const handleTipoDocumentoChange = e => {
    setValue({ ...value, tipoDocumento: e.target.value, numDocumento: "" });
  };

  const handleNumDocumentoChange = e => {
    setValue({ ...value, numDocumento: e.target.value });

    // Busca en la fakeDB
    const found = FAKE_RECEIVERS.find(r => r.documento === e.target.value);
    if (found) {
      setBuscando(true);
      setTimeout(() => {
        setValue({
          ...value,
          tipoDocumento: value.tipoDocumento,
          numDocumento: e.target.value,
          nombre: found.nombre,
          direccion: found.direccion,
          correo: found.correo,
          telefono: found.telefono
        });
        setBuscando(false);
      }, 500);
    }
  };

  return (
    <div>
      <label>Tipo de documento:</label>
      <select value={value.tipoDocumento || "36"} onChange={handleTipoDocumentoChange}>
        {CATALOGS.TIPOS_DOCUMENTO_IDENTIFICACION.map(opt => (
          <option key={opt.codigo} value={opt.codigo}>{opt.valor}</option>
        ))}
      </select>
      <label>Número de documento:</label>
      <input value={value.numDocumento || ""} onChange={handleNumDocumentoChange} />
      <label>Nombre:</label>
      <input
        value={value.nombre || ""}
        onChange={e => setValue({ ...value, nombre: e.target.value })}
      />
      <label>Dirección:</label>
      <input
        value={value.direccion || ""}
        onChange={e => setValue({ ...value, direccion: e.target.value })}
      />
      <label>Correo:</label>
      <input
        value={value.correo || ""}
        onChange={e => setValue({ ...value, correo: e.target.value })}
      />
      <label>Teléfono:</label>
      <input
        value={value.telefono || ""}
        onChange={e => setValue({ ...value, telefono: e.target.value })}
      />
      {buscando && <div>Buscando información...</div>}
    </div>
  );
}
