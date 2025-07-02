import React, { forwardRef } from "react";
import QRCode from "react-qr-code";

const FacturaPreview = forwardRef(
  (
    {
      emisor = {},
      receptor = {},
      items = [],
      resumen = {},
      infoAdicional = "",
      firmas = {},
      valorLetras = "",
      condicionOperacion = "Contado",
      pagina = 1,
      paginasTotales = 1,
    },
    ref
  ) => {
    // DEMO data
    emisor = {
      nombre: "LABORATORIOS CENTRO GINECOLÓGICO, S.A. de C.V.",
      nombreComercial: "LABORATORIOS CENTRO GINECOLÓGICO, S.A. de C.V.",
      nit: "06142104881042",
      nrc: "64211",
      actividad: "SERVICIOS DE ANÁLISIS Y ESTUDIOS DE DIAGNÓSTICO",
      direccion: "LOC. 145, CENTRO COMERCIAL LAS RAMBLAS, SANTA TECLA LA LIBERTAD SUR LA LIBERTAD",
      telefono: "22471441, 22471443",
      correo: "dte.labo@cegisa.com",
      ...emisor,
    };

    receptor = {
      nombre: "ANA MARCELA RETANA DE CISNEROS",
      nit: "03737081-8",
      nrc: "",
      actividad: "",
      direccion: "URB SANTA MONICA 13 CL ORIENTE #33 SANTA TECLA LA LIBERTAD ESTE LA LIBERTAD",
      telefono: "7910-0434",
      correo: "lameretana@gmail.com",
      ...receptor,
    };

    items = items.length > 0 ? items : [
      {
        cantidad: 1,
        unidad: "Unidad",
        codigo: "LB30027",
        descripcion: "CREATININA EN SANGRE",
        precio: 7.6,
        descuento: 0,
        noSujetas: 0,
        exentas: 0,
        gravadas: 7.6,
      },
      {
        cantidad: 1,
        unidad: "Unidad",
        codigo: "LB30058",
        descripcion: "NITRÓGENO URÉICO",
        precio: 7.6,
        descuento: 0,
        noSujetas: 0,
        exentas: 0,
        gravadas: 7.6,
      },
      {
        cantidad: 1,
        unidad: "Unidad",
        codigo: "LB6003",
        descripcion: "GENERAL DE ORINA",
        precio: 5.6,
        descuento: 0,
        noSujetas: 0,
        exentas: 0,
        gravadas: 5.6,
      },
    ];

    resumen = {
      codigoGeneracion: "CC01C1DD-G6CF-459D-A04E-F9AC87C7FCC2",
      numeroControl: "DTE-01-300P201-000000000024933",
      selloRecepcion: "2B50E2F1C3A1D8AD1E7097CET2A544UVB",
      modeloFacturacion: "Modelo Facturación Previo",
      tipoTransmision: "Transmisión Normal",
      fechaEmision: "2025-06-21 10:44:43",
      subTotal: 20.8,
      totalPagar: 20.8,
      ...resumen,
    };

    valorLetras = valorLetras || "Veinte 80/100 dólares";
    firmas = firmas || {
      entrega: { nombre: "KAREN LISETH RAMOS HERNANDEZ", documento: "06488947" },
      recibe: { nombre: "ANA MARCELA RETANA DE CISNEROS", documento: "03737081-8" },
    };

    const qrValue = resumen?.codigoGeneracion
      ? `https://portaldte.mh.gob.sv/consulta?codGen=${resumen.codigoGeneracion}&fecha=${resumen.fechaEmision || ""}`
      : "https://portaldte.mh.gob.sv/";

    const sumVentas = items.reduce(
      (sum, item) => ({
        noSujetas: sum.noSujetas + Number(item.noSujetas || 0),
        exentas: sum.exentas + Number(item.exentas || 0),
        gravadas: sum.gravadas + Number(item.gravadas || 0),
      }),
      { noSujetas: 0, exentas: 0, gravadas: 0 }
    );

    // Filas vacías optimizadas para mantener compacto
    const emptyRows = [];
    const totalRowsNeeded = 8; // Reducido para ser más compacto
    const currentRows = items.length;
    for (let i = currentRows; i < totalRowsNeeded; i++) {
      emptyRows.push(i);
    }

    const formatDireccion = (direccion) => {
      if (typeof direccion === 'string') {
        return direccion;
      }
      if (typeof direccion === 'object' && direccion) {
        const { departamento, municipio, complemento } = direccion;
        return complemento || `${municipio || ''} ${departamento || ''}`.trim() || 'Sin dirección';
      }
      return 'Sin dirección';
    };

    return (
      <div
        ref={ref}
        className="bg-white text-black mx-auto print:bg-white"
        style={{
          width: "816px",
          minHeight: "1056px",
          padding: "12px", // Padding reducido para ser compacto
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          lineHeight: "1.2",
        }}
      >
        {/* ENCABEZADO COMPACTO Y PROFESIONAL */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            {/* SOLO LOGO REAL */}
            <div style={{ width: "60px" }}>
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: "50px", height: "50px", objectFit: "contain" }}
              />
            </div>

            {/* TÍTULO COMPACTO */}
            <div className="text-center flex-1">
              <div className="font-bold" style={{ fontSize: "16px", lineHeight: "1.2" }}>
                DOCUMENTO TRIBUTARIO ELECTRÓNICO<br />
                FACTURA
              </div>
            </div>

            {/* PÁGINA Y QR COMPACTOS */}
            <div className="text-right" style={{ width: "120px" }}>
              <div className="font-bold mb-2" style={{ fontSize: "10px" }}>
                Página {pagina} de {paginasTotales}
              </div>
              <QRCode value={qrValue} size={70} />
            </div>
          </div>

          {/* METADATOS COMPACTOS DEBAJO */}
          <div className="mt-2 bg-gray-50 p-2 border border-gray-300" style={{ fontSize: "8px" }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div><span className="font-bold">Código de Generación:</span> {resumen.codigoGeneracion}</div>
                <div><span className="font-bold">Número de Control:</span> {resumen.numeroControl}</div>
                <div><span className="font-bold">Sello de Recepción:</span> {resumen.selloRecepcion}</div>
              </div>
              <div className="space-y-1">
                <div><span className="font-bold">Modelo de Facturación:</span> {resumen.modeloFacturacion}</div>
                <div><span className="font-bold">Tipo de Transmisión:</span> {resumen.tipoTransmision}</div>
                <div><span className="font-bold">Fecha y Hora de Generación:</span> {resumen.fechaEmision}</div>
              </div>
            </div>
          </div>
        </div>

        {/* EMISOR Y RECEPTOR COMPACTOS */}
        <div className="flex gap-2 mb-3">
          <div className="w-1/2 border border-black" style={{ fontSize: "8px" }}>
            <div className="bg-gray-200 p-1 font-bold text-center border-b border-black">EMISOR</div>
            <div className="p-2 space-y-1">
              <div><span className="font-bold">Nombre o razón social:</span> {emisor.nombre}</div>
              <div><span className="font-bold">Nombre Comercial:</span> {emisor.nombreComercial}</div>
              <div className="flex gap-4">
                <div><span className="font-bold">NIT:</span> {emisor.nit}</div>
                <div><span className="font-bold">NRC:</span> {emisor.nrc}</div>
              </div>
              <div><span className="font-bold">Actividad económica:</span> {emisor.actividad}</div>
              <div><span className="font-bold">Dirección:</span> {formatDireccion(emisor.direccion)}</div>              <div className="flex gap-4">
                <div><span className="font-bold">Teléfono:</span> {emisor.telefono}</div>
                <div><span className="font-bold">Correo:</span> {emisor.correo}</div>
              </div>
            </div>
          </div>

          <div className="w-1/2 border border-black" style={{ fontSize: "8px" }}>
            <div className="bg-gray-200 p-1 font-bold text-center border-b border-black">RECEPTOR</div>
            <div className="p-2 space-y-1">
              <div><span className="font-bold">Nombre o razón social:</span> {receptor.nombre}</div>
              <div className="flex gap-4">
                <div><span className="font-bold">NIT/DUI:</span> {receptor.nit}</div>
                <div><span className="font-bold">NRC:</span> {receptor.nrc || "---"}</div>
              </div>
              <div><span className="font-bold">Actividad económica:</span> {receptor.actividad || "---"}</div>
              <div><span className="font-bold">Dirección:</span> {formatDireccion(receptor.direccion)}</div>
              <div><span className="font-bold">Nombre Comercial:</span> {receptor.nombreComercial || "---"}</div>
              <div className="flex gap-4">
                <div><span className="font-bold">Tel:</span> {receptor.telefono}</div>
                <div><span className="font-bold">Correo:</span> {receptor.correo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA COMPACTA */}
        <table className="w-full border border-black mb-3" style={{ borderCollapse: "collapse", fontSize: "8px" }}>
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-1 text-center font-bold" style={{ width: "25px" }}>No.</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "45px" }}>Cant.</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "60px" }}>Unidad</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "60px" }}>Código</th>
              <th className="border border-black p-1 text-center font-bold">Descripción</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "65px" }}>Precio Unit.</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "50px" }}>Desc.</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "55px" }}>No Sujetas</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "55px" }}>Exentas</th>
              <th className="border border-black p-1 text-center font-bold" style={{ width: "55px" }}>Gravadas</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="border border-black p-1 text-center">{i + 1}</td>
                <td className="border border-black p-1 text-center">{item.cantidad}</td>
                <td className="border border-black p-1 text-center">{item.unidad}</td>
                <td className="border border-black p-1 text-center">{item.codigo}</td>
                <td className="border border-black p-1">{item.descripcion}</td>
                <td className="border border-black p-1 text-right">${Number(item.precio).toFixed(5)}</td>
                <td className="border border-black p-1 text-right">${Number(item.descuento).toFixed(2)}</td>
                <td className="border border-black p-1 text-right">${Number(item.noSujetas).toFixed(2)}</td>
                <td className="border border-black p-1 text-right">${Number(item.exentas).toFixed(2)}</td>
                <td className="border border-black p-1 text-right">${Number(item.gravadas).toFixed(2)}</td>
              </tr>
            ))}
            {emptyRows.map((i) => (
              <tr key={`empty-${i}`} style={{ height: "16px" }}>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            ))}
            <tr className="bg-gray-100">
              <td colSpan={7} className="border border-black p-1 text-right font-bold">Suma de ventas:</td>
              <td className="border border-black p-1 text-right font-bold">${sumVentas.noSujetas.toFixed(2)}</td>
              <td className="border border-black p-1 text-right font-bold">${sumVentas.exentas.toFixed(2)}</td>
              <td className="border border-black p-1 text-right font-bold">${sumVentas.gravadas.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* SECCIÓN INFERIOR COMPACTA */}
        <div className="flex gap-2">
          <div className="w-1/2 border border-black" style={{ fontSize: "8px" }}>
            <div className="bg-gray-200 p-1 font-bold text-center border-b border-black">INFORMACIÓN ADICIONAL</div>
            <div className="p-2" style={{ minHeight: "60px" }}>
              {infoAdicional || ""}
            </div>
            <div className="border-t border-black p-2">
              <div className="flex justify-between mb-1">
                <span><span className="font-bold">Nombre entrega:</span> {firmas.entrega?.nombre}</span>
                <span><span className="font-bold">Doc:</span> {firmas.entrega?.documento}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span><span className="font-bold">Nombre recibe:</span> {firmas.recibe?.nombre}</span>
                <span><span className="font-bold">Doc:</span> {firmas.recibe?.documento}</span>
              </div>
              <div><span className="font-bold">Valor en letras:</span> {valorLetras}</div>
            </div>
          </div>

          <div className="w-1/2 border border-black" style={{ fontSize: "8px" }}>
            <div className="bg-gray-200 p-1 font-bold text-center border-b border-black">Suma Total de Operaciones:</div>
            <div className="p-2 space-y-1">
              <div className="flex justify-between">
                <span>Suma Total de Operaciones:</span>
                <span className="font-bold">${Number(resumen.subTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Descuento:</span>
                <span>${Number(items.reduce((a, b) => a + (b.descuento || 0), 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sub-Total:</span>
                <span>${Number(resumen.subTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA Retenido:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Retención Renta:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Monto Total de la Operación:</span>
                <span>${Number(resumen.totalPagar || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Otros montos no afectos:</span>
                <span>0.00</span>
              </div>
              <div className="flex justify-between border-t border-black pt-1 mt-1 font-bold">
                <span>Total a Pagar:</span>
                <span>${Number(resumen.totalPagar || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1 pt-1 border-t border-gray-300">
                <span className="font-bold">Condición de la Operación:</span>
                <span>{condicionOperacion}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA */}
        <div className="text-center mt-2" style={{ fontSize: "7px", color: "#666" }}>
          Documento generado electrónicamente, válido para efectos fiscales según la normativa vigente.
        </div>
      </div>
    );
  }
);

export default FacturaPreview;