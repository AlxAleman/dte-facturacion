import React from "react";
import QRCode from "react-qr-code";

const FacturaPreview = React.forwardRef(
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
    // Validación de datos esenciales con debugging
    const validationChecks = {
      emisorNombre: !emisor?.nombre,
      receptorNombre: !receptor?.nombre,
      itemsArray: !Array.isArray(items),
      itemsVacio: Array.isArray(items) && items.length === 0
    };
    
    const datosIncompletos = validationChecks.emisorNombre || validationChecks.receptorNombre || validationChecks.itemsArray || validationChecks.itemsVacio;
    
    if (datosIncompletos) {
      return (
        <div
          ref={ref}
          style={{
            backgroundColor: "white",
            color: "#b91c1c",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "816px",
            minHeight: "1056px",
            padding: "12px",
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            lineHeight: "1.2",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "8px" }}>⚠️ Datos incompletos</h2>
            <p style={{ marginBottom: "12px" }}>Por favor, completa todos los datos del emisor, receptor y productos en el formulario antes de generar la vista previa o imprimir el PDF.</p>
            <div style={{ fontSize: "14px" }}>
              {validationChecks.emisorNombre && <p style={{ margin: "4px 0" }}>❌ Falta nombre del emisor</p>}
              {validationChecks.receptorNombre && <p style={{ margin: "4px 0" }}>❌ Falta nombre del receptor</p>}
              {validationChecks.itemsArray && <p style={{ margin: "4px 0" }}>❌ Los productos no están en formato correcto</p>}
              {validationChecks.itemsVacio && <p style={{ margin: "4px 0" }}>❌ No hay productos agregados</p>}
            </div>
          </div>
        </div>
      );
    }

    // QR
    const qrValue = resumen?.codigoGeneracion
      ? `https://portaldte.mh.gob.sv/consulta?codGen=${resumen.codigoGeneracion}&fecha=${resumen.fechaEmision || ""}`
      : "https://portaldte.mh.gob.sv/";

    // Cálculos automáticos de totales
    const sumaVentas = items.reduce((sum, item) => {
      const precio = item.precioUni || item.precio || 0;
      const cantidad = item.cantidad || 0;
      return sum + cantidad * precio;
    }, 0);
    const totalDescuento = items.reduce((sum, item) => sum + (item.montoDescu || item.descuento || 0), 0);
    const subTotal = sumaVentas - totalDescuento;

    // Calcular suma de gravadas (igual que en la tabla)
    const sumaGravadas = items.reduce((sum, item) => {
      const precio = item.precioUni || item.precio || 0;
      const cantidad = item.cantidad || 0;
      const descuento = item.montoDescu || item.descuento || 0;
      const totalProducto = cantidad * precio - descuento;
      let noSujetas = Number(item.noSujetas) || 0;
      let exentas = Number(item.exentas) || 0;
      let gravadas = Number(item.gravadas) || 0;
      if (noSujetas === 0 && exentas === 0 && gravadas === 0) {
        gravadas = totalProducto;
      } else if (noSujetas > 0 || exentas > 0) {
        gravadas = totalProducto - noSujetas - exentas;
        if (gravadas < 0) gravadas = 0;
      }
      return sum + gravadas;
    }, 0);

    // IVA automático 13% sobre gravadas
    const ivaRetenido = +(sumaGravadas * 0.13).toFixed(2);
    // Retención de renta: si viene en infoAdicional o firmas, usarlo, si no, 0
    let retencionRenta = 0;
    if (resumen && resumen.retencionRenta) {
      retencionRenta = Number(resumen.retencionRenta) || 0;
    } else if (infoAdicional && infoAdicional.retencionRenta) {
      retencionRenta = Number(infoAdicional.retencionRenta) || 0;
    }
    // Total a pagar
    const totalPagar = subTotal + ivaRetenido + retencionRenta;

    // Filas vacías para mantener formato
    const emptyRows = [];
    const totalRowsNeeded = 8;
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
        style={{
          backgroundColor: "white",
          color: "black",
          margin: "0 auto",
          width: "816px",
          minHeight: "1056px",
          padding: "12px",
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          lineHeight: "1.2",
        }}
      >
        {/* ENCABEZADO */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: "60px" }}>
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: "50px", height: "50px", objectFit: "contain" }}
              />
            </div>
            <div style={{ textAlign: "center", flex: "1" }}>
              <div style={{ fontWeight: "bold", fontSize: "16px", lineHeight: "1.2" }}>
                DOCUMENTO TRIBUTARIO ELECTRÓNICO<br />
                FACTURA
              </div>
            </div>
            <div style={{ textAlign: "right", width: "120px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "10px" }}>
                Página {pagina} de {paginasTotales}
              </div>
              <QRCode value={qrValue} size={70} />
            </div>
          </div>
          <div style={{ marginTop: "8px", backgroundColor: "#f9fafb", padding: "8px", border: "1px solid #d1d5db", fontSize: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Código de Generación:</span> {resumen.codigoGeneracion}</div>
                <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Número de Control:</span> {resumen.numeroControl}</div>
                <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Sello de Recepción:</span> {resumen.selloRecepcion}</div>
              </div>
              <div>
                <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Modelo de Facturación:</span> {resumen.modeloFacturacion}</div>
                <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Tipo de Transmisión:</span> {resumen.tipoTransmision}</div>
                <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Fecha y Hora de Generación:</span> {resumen.fechaEmision}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* EMISOR Y RECEPTOR */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <div style={{ width: "50%", border: "1px solid black", fontSize: "8px" }}>
            <div style={{ backgroundColor: "#e5e7eb", padding: "4px", fontWeight: "bold", textAlign: "center", borderBottom: "1px solid black" }}>EMISOR</div>
            <div style={{ padding: "8px" }}>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Nombre o razón social:</span> {emisor.nombre}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Nombre Comercial:</span> {emisor.nombreComercial}</div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><span style={{ fontWeight: "bold" }}>NIT:</span> {emisor.nit}</div>
                <div><span style={{ fontWeight: "bold" }}>NRC:</span> {emisor.nrc}</div>
              </div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Actividad económica:</span> {emisor.actividad || emisor.descActividad}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Dirección:</span> {formatDireccion(emisor.direccion)}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Teléfono:</span> {emisor.telefono}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Correo:</span> {emisor.correo}</div>
            </div>
          </div>
          <div style={{ width: "50%", border: "1px solid black", fontSize: "8px" }}>
            <div style={{ backgroundColor: "#e5e7eb", padding: "4px", fontWeight: "bold", textAlign: "center", borderBottom: "1px solid black" }}>RECEPTOR</div>
            <div style={{ padding: "8px" }}>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Nombre:</span> {receptor.nombre}</div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
                <div><span style={{ fontWeight: "bold" }}>NIT:</span> {receptor.nit}</div>
                <div><span style={{ fontWeight: "bold" }}>NRC:</span> {receptor.nrc}</div>
              </div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Actividad económica:</span> {receptor.actividad || receptor.descActividad}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Dirección:</span> {formatDireccion(receptor.direccion)}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Teléfono:</span> {receptor.telefono}</div>
              <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Correo:</span> {receptor.correo}</div>
            </div>
          </div>
        </div>
        
        {/* TABLA DE PRODUCTOS */}
        <table style={{ width: "100%", border: "1px solid black", marginBottom: "12px", borderCollapse: "collapse", fontSize: "8px" }}>
          <thead>
            <tr style={{ backgroundColor: "#e5e7eb" }}>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "25px" }}>No.</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "45px" }}>Cant.</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "60px" }}>Unidad</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "60px" }}>Código</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold" }}>Descripción</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "65px" }}>Precio Unit.</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "50px" }}>Desc.</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "55px" }}>No Sujetas</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "55px" }}>Exentas</th>
              <th style={{ border: "1px solid black", padding: "4px", textAlign: "center", fontWeight: "bold", width: "55px" }}>Gravadas</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              // Mapear campos del formulario a campos del preview
              const precio = item.precioUni || item.precio || 0;
              const cantidad = item.cantidad || 0;
              const descuento = item.montoDescu || item.descuento || 0;
              
              // Calcular el total de la línea
              const totalProducto = cantidad * precio - descuento;
              
              // Lógica mejorada: por defecto, el total va a "Gravadas"
              // Solo si hay valores explícitos en noSujetas o exentas, se respetan esos valores
              let noSujetas = Number(item.noSujetas) || 0;
              let exentas = Number(item.exentas) || 0;
              let gravadas = Number(item.gravadas) || 0;
              
              // Si no hay valores explícitos en ninguna de las tres columnas, asignar todo a gravadas
              if (noSujetas === 0 && exentas === 0 && gravadas === 0) {
                gravadas = totalProducto;
                noSujetas = 0;
                exentas = 0;
              }
              // Si hay valores explícitos, respetarlos pero asegurar que gravadas tenga el resto
              else if (noSujetas > 0 || exentas > 0) {
                // Si hay noSujetas o exentas explícitas, gravadas debe ser el resto
                gravadas = totalProducto - noSujetas - exentas;
                if (gravadas < 0) gravadas = 0; // Evitar valores negativos
              }
              // Si solo hay gravadas explícita, mantenerla
              else if (gravadas > 0) {
                // Mantener el valor explícito de gravadas
              }
              
              return (
                <tr key={i}>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "center" }}>{i + 1}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "center" }}>{cantidad}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "center" }}>{item.unidad || 'UNI'}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "center" }}>{item.codigo || ''}</td>
                  <td style={{ border: "1px solid black", padding: "4px" }}>{item.descripcion || ''}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${Number(precio).toFixed(2)}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${Number(descuento).toFixed(2)}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${Number(noSujetas).toFixed(2)}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${Number(exentas).toFixed(2)}</td>
                  <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${Number(gravadas).toFixed(2)}</td>
                </tr>
              );
            })}
            {emptyRows.map((i) => (
              <tr key={`empty-${i}`} style={{ height: "16px" }}>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
                <td style={{ border: "1px solid black", padding: "4px" }}></td>
              </tr>
            ))}
            {/* Fila de totales */}
            <tr style={{ fontWeight: "bold", backgroundColor: "#f3f4f6" }}>
              <td colSpan={6} style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>Suma de ventas:</td>
              <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}></td>
              <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${items.reduce((sum, item) => sum + (Number(item.noSujetas) || 0), 0).toFixed(2)}</td>
              <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${items.reduce((sum, item) => sum + (Number(item.exentas) || 0), 0).toFixed(2)}</td>
              <td style={{ border: "1px solid black", padding: "4px", textAlign: "right" }}>${items.reduce((sum, item) => {
                const precio = item.precioUni || item.precio || 0;
                const cantidad = item.cantidad || 0;
                const descuento = item.montoDescu || item.descuento || 0;
                const totalProducto = cantidad * precio - descuento;
                let noSujetas = Number(item.noSujetas) || 0;
                let exentas = Number(item.exentas) || 0;
                let gravadas = Number(item.gravadas) || 0;
                if (noSujetas === 0 && exentas === 0 && gravadas === 0) {
                  gravadas = totalProducto;
                } else if (noSujetas > 0 || exentas > 0) {
                  gravadas = totalProducto - noSujetas - exentas;
                  if (gravadas < 0) gravadas = 0;
                }
                return sum + gravadas;
              }, 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        {/* SECCIÓN INFERIOR */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ width: "50%", border: "1px solid black", fontSize: "8px" }}>
            <div style={{ backgroundColor: "#e5e7eb", padding: "4px", fontWeight: "bold", textAlign: "center", borderBottom: "1px solid black" }}>INFORMACIÓN ADICIONAL</div>
            <div style={{ padding: "8px", minHeight: "60px" }}>
              {infoAdicional || ""}
            </div>
            <div style={{ borderTop: "1px solid black", padding: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span><span style={{ fontWeight: "bold" }}>Nombre entrega:</span> {firmas.entrega?.nombre}</span>
                <span><span style={{ fontWeight: "bold" }}>Doc:</span> {firmas.entrega?.documento}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span><span style={{ fontWeight: "bold" }}>Nombre recibe:</span> {firmas.recibe?.nombre}</span>
                <span><span style={{ fontWeight: "bold" }}>Doc:</span> {firmas.recibe?.documento}</span>
              </div>
              <div><span style={{ fontWeight: "bold" }}>Valor en letras:</span> {valorLetras}</div>
            </div>
          </div>
          <div style={{ width: "50%", border: "1px solid black", fontSize: "8px" }}>
            <div style={{ backgroundColor: "#e5e7eb", padding: "4px", fontWeight: "bold", textAlign: "center", borderBottom: "1px solid black" }}>Suma Total de Operaciones:</div>
            <div style={{ padding: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "10px", borderBottom: "1px solid #000", background: "#f3f4f6" }}>
                <span>Suma Total de Operaciones:</span>
                <span></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>Suma Total de Operaciones:</span>
                <span style={{ fontWeight: "bold" }}>${sumaVentas.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>Total Descuento:</span>
                <span>${totalDescuento.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>Sub-Total:</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>IVA Retenido:</span>
                <span>${ivaRetenido.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>Retención Renta:</span>
                <span>${retencionRenta.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>Monto Total de la Operación:</span>
                <span>${(subTotal + ivaRetenido + retencionRenta).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>Total Otros montos no afectos:</span>
                <span>0.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "12px", borderTop: "1px solid #000", marginTop: "8px" }}>
                <span>Total a Pagar:</span>
                <span>${totalPagar.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #d1d5db" }}>
                <span style={{ fontWeight: "bold" }}>Condición de la Operación:</span>
                <span>{condicionOperacion}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* PIE DE PÁGINA */}
        <div style={{ textAlign: "center", marginTop: "8px", fontSize: "7px", color: "#666" }}>
          Documento generado electrónicamente, válido para efectos fiscales según la normativa vigente.
        </div>
      </div>
    );
  }
);

export default FacturaPreview;