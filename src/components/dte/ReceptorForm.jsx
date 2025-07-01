// src/components/dte/ReceptorForm.jsx
import { useState } from "react";
import { FAKE_RECEIVERS } from "../../fakeReceivers"; // Ajusta el path

export default function ReceptorForm({ value, setValue }) {
  const [buscando, setBuscando] = useState(false);

  const handleDocumentoChange = e => {
    const doc = e.target.value;
    setValue({ ...value, documento: doc });

    // Busca en la fakeDB
    const found = FAKE_RECEIVERS.find(r => r.documento === doc);

    if (found) {
      setBuscando(true);
      setTimeout(() => {
        setValue(found); // Llena todos los campos del receptor
        setBuscando(false);
      }, 500); // Simula un fetch lento
    }
  };

  // Resto de los campos del receptor
  return (
    <div>
      <label>Documento:</label>
      <input value={value.documento || ""} onChange={handleDocumentoChange} />
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
