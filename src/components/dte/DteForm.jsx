import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, FileText } from 'lucide-react';
import { CATALOGS, getCatalogValue } from '../data/catalogs';

// 🆕 ÚNICA LÍNEA NUEVA - Agregar validación
import ValidationIndicator from '../services/ValidationIndicator';

// Función helper para generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

const DteForm = ({ onDataChange, initialData }) => {
  const [formData, setFormData] = useState({
    identificacion: {
      version: 1,
      ambiente: "01", // Pruebas
      tipoDte: "01", // Factura - Default
      numeroControl: "DTE-01-00000001-000000000000001",
      codigoGeneracion: generateUUID(),
      tipoModelo: "1",
      tipoOperacion: "1",
      fecEmi: new Date().toISOString().split('T')[0],
      horEmi: new Date().toTimeString().split(' ')[0],
      tipoMoneda: "USD"
    },
    emisor: {
      nit: "12345678901234",
      nrc: "123456-7",
      nombre: "EMPRESA DE PRUEBA S.A. DE C.V.",
      codActividad: "62010",
      descActividad: "Programación informática",
      direccion: {
        departamento: "06",
        municipio: "01",
        complemento: "Colonia Test, Calle Test #123"
      },
      telefono: "22334455",
      correo: "test@empresa.com"
    },
    receptor: {
      nombre: "",
      numDocumento: "",
      nrc: "",
      nombreComercial: "",
      actividad: "",
      telefono: "",
      correo: "",
      tipoDocumento: "13",
      direccion: {
        departamento: "05",
        municipio: "02",
        complemento: ""
      }
    },
    cuerpoDocumento: [
      {
        numItem: 1,
        tipoItem: 2,
        descripcion: "",
        cantidad: 1,
        uniMedida: 16, // Servicio
        precioUni: 0,
        montoDescu: 0,
        ventaNoSuj: 0,
        ventaExenta: 0,
        ventaGravada: 0
      }
    ],
    resumen: {
      totalNoSuj: 0,
      totalExenta: 0,
      totalGravada: 0,
      subTotalVentas: 0,
      descuNoSuj: 0,
      descuExenta: 0,
      descuGravada: 0,
      porcentajeDescuento: 0,
      totalDescu: 0,
      subTotal: 0,
      ivaPerci: 0,
      ivaRete: 0,
      reteRenta: 0,
      montoTotalOperacion: 0,
      totalNoGravado: 0,
      totalPagar: 0,
      condicionOperacion: 1, // Contado
      pagos: [
        {
          codigo: "01", // Billetes y monedas
          montoPago: 0,
          referencia: null,
          plazo: null,
          periodo: null
        }
      ]
    }
  });

  // Flag para saber si estamos inicializando con datos existentes
  const [isInitialized, setIsInitialized] = useState(false);

  // 🔧 FIX: Restaurar datos solo una vez al montar
  useEffect(() => {
    if (initialData && !isInitialized) {
      console.log('📝 Restaurando datos del formulario (una sola vez):', initialData);
      setFormData(initialData);
      setIsInitialized(true);
    } else if (!initialData && !isInitialized) {
      // Si no hay datos iniciales, marcar como inicializado para permitir onDataChange
      console.log('✅ Sin datos iniciales, habilitando formulario');
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  // Notificar cambios al componente padre (solo después de inicializar)
  useEffect(() => {
    if (onDataChange && isInitialized) {
      onDataChange(formData);
    }
  }, [formData, onDataChange, isInitialized]);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // 🆕 Manejar cambio de tipo DTE
  const handleTipoDteChange = (tipoDte) => {
    // Actualizar el número de control según el tipo
    const numeroControl = `DTE-${tipoDte}-00000001-000000000000001`;
    
    setFormData(prev => ({
      ...prev,
      identificacion: {
        ...prev.identificacion,
        tipoDte: tipoDte,
        numeroControl: numeroControl
      }
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: prev.cuerpoDocumento.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // ✨ NUEVAS FUNCIONES PARA MÚLTIPLES PRODUCTOS
  const addNewItem = () => {
    const newItem = {
      numItem: formData.cuerpoDocumento.length + 1,
      tipoItem: 2,
      descripcion: "",
      cantidad: 1,
      uniMedida: 16, // Servicio
      precioUni: 0,
      montoDescu: 0,
      ventaNoSuj: 0,
      ventaExenta: 0,
      ventaGravada: 0
    };

    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: [...prev.cuerpoDocumento, newItem]
    }));
  };

  const removeItem = (index) => {
    if (formData.cuerpoDocumento.length > 1) {
      setFormData(prev => ({
        ...prev,
        cuerpoDocumento: prev.cuerpoDocumento
          .filter((_, i) => i !== index)
          .map((item, i) => ({ ...item, numItem: i + 1 })) // Renumerar items
      }));
    }
  };

  const duplicateItem = (index) => {
    const itemToDuplicate = { ...formData.cuerpoDocumento[index] };
    itemToDuplicate.numItem = formData.cuerpoDocumento.length + 1;
    
    setFormData(prev => ({
      ...prev,
      cuerpoDocumento: [...prev.cuerpoDocumento, itemToDuplicate]
    }));
  };

  // Calcular total general
  const getTotalGeneral = () => {
    return formData.cuerpoDocumento.reduce((total, item) => {
      return total + ((item.cantidad * item.precioUni) - item.montoDescu);
    }, 0);
  };

  // 🆕 Obtener información del tipo DTE seleccionado
  const getTipoDteInfo = () => {
    const tipoInfo = CATALOGS.TIPOS_DTE.find(tipo => tipo.codigo === formData.identificacion.tipoDte);
    return tipoInfo || { valor: "Tipo no encontrado", esquema: "unknown" };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Formulario de Documento Tributario Electrónico
      </h2>

      {/* 🆕 ÚNICA SECCIÓN NUEVA - Indicador de validación */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Estado de Validación</h3>
        <ValidationIndicator 
          jsonData={formData}
          tipoDte={formData.identificacion.tipoDte}
          className="text-sm"
        />
      </div>

      {/* 🆕 SELECTOR DE TIPO DTE - NUEVO */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Tipo de Documento Tributario
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Tipo de DTE *
            </label>
            <select
              value={formData.identificacion.tipoDte}
              onChange={(e) => handleTipoDteChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {CATALOGS.TIPOS_DTE.map(tipo => (
                <option key={tipo.codigo} value={tipo.codigo}>
                  {tipo.codigo} - {tipo.valor}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="bg-white border border-gray-200 rounded-md p-3 w-full">
              <div className="text-sm text-gray-600">
                <strong>Documento seleccionado:</strong>
                <div className="text-lg font-semibold text-blue-600 mt-1">
                  {getTipoDteInfo().valor}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Schema: {getTipoDteInfo().esquema}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del tipo seleccionado */}
        <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Información del Tipo DTE:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            {formData.identificacion.tipoDte === "01" && (
              <>
                <p>• <strong>Factura de Consumidor:</strong> Para ventas a consumidores finales</p>
                <p>• <strong>IVA:</strong> 13% sobre operaciones gravadas</p>
                <p>• <strong>Retención:</strong> 1% - 10% según aplique</p>
              </>
            )}
            {formData.identificacion.tipoDte === "03" && (
              <>
                <p>• <strong>Comprobante de Crédito Fiscal:</strong> Para ventas a empresas</p>
                <p>• <strong>IVA:</strong> 13% con derecho a crédito fiscal</p>
                <p>• <strong>Incluye:</strong> IVA Percibido además del retenido</p>
              </>
            )}
            {formData.identificacion.tipoDte === "14" && (
              <>
                <p>• <strong>Factura de Sujeto Excluido:</strong> Para sujetos exentos de IVA</p>
                <p>• <strong>IVA:</strong> 0% (exento)</p>
                <p>• <strong>Retención:</strong> No aplica</p>
              </>
            )}
            {formData.identificacion.tipoDte === "11" && (
              <>
                <p>• <strong>Factura de Exportación:</strong> Para operaciones de exportación</p>
                <p>• <strong>IVA:</strong> 0% (exportación)</p>
                <p>• <strong>Monto mínimo:</strong> $100.00</p>
              </>
            )}
            {!["01", "03", "14", "11"].includes(formData.identificacion.tipoDte) && (
              <p>• Consulte la documentación oficial del MH para este tipo de documento</p>
            )}
          </div>
        </div>
      </div>

      {/* Información del Receptor */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Receptor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Receptor *
            </label>
            <input
              type="text"
              value={formData.receptor.nombre}
              onChange={(e) => handleInputChange('receptor', 'nombre', e.target.value)}
              placeholder="Nombre completo o razón social"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Documento *
            </label>
            <input
              type="text"
              value={formData.receptor.numDocumento}
              onChange={(e) => handleInputChange('receptor', 'numDocumento', e.target.value)}
              placeholder="DUI, NIT, Pasaporte, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NRC
            </label>
            <input
              type="text"
              value={formData.receptor.nrc || ''}
              onChange={(e) => handleInputChange('receptor', 'nrc', e.target.value)}
              placeholder="Número de registro de contribuyente"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Comercial
            </label>
            <input
              type="text"
              value={formData.receptor.nombreComercial || ''}
              onChange={(e) => handleInputChange('receptor', 'nombreComercial', e.target.value)}
              placeholder="Nombre comercial (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actividad Económica
            </label>
            <input
              type="text"
              value={formData.receptor.actividad || ''}
              onChange={(e) => handleInputChange('receptor', 'actividad', e.target.value)}
              placeholder="Descripción de la actividad económica"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.receptor.telefono || ''}
              onChange={(e) => handleInputChange('receptor', 'telefono', e.target.value)}
              placeholder="Número de teléfono"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.receptor.correo || ''}
              onChange={(e) => handleInputChange('receptor', 'correo', e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección Completa *
            </label>
            <input
              type="text"
              value={formData.receptor.direccion?.complemento || ''}
              onChange={(e) => handleInputChange('receptor', 'direccion', {
                ...formData.receptor.direccion,
                complemento: e.target.value
              })}
              placeholder="Dirección completa del receptor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Detalle de Items - MEJORADO */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Detalle de Productos/Servicios ({formData.cuerpoDocumento.length})
          </h3>
          <button
            onClick={addNewItem}
            className="w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center"
            title="Agregar producto"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {formData.cuerpoDocumento.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 relative">
            {/* Header del ítem */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">
                Ítem #{item.numItem}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => duplicateItem(index)}
                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                  title="Duplicar ítem"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {formData.cuerpoDocumento.length > 1 && (
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                  placeholder="Descripción del producto o servicio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.cantidad}
                  onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Unitario *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUni}
                  onChange={(e) => handleItemChange(index, 'precioUni', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtotal
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
                  ${((item.cantidad * item.precioUni) - item.montoDescu).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Fila adicional para descuento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.montoDescu}
                  onChange={(e) => handleItemChange(index, 'montoDescu', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                <div className="text-sm text-gray-600">
                  <strong>Cálculo:</strong> {item.cantidad} × ${item.precioUni.toFixed(2)} - ${item.montoDescu.toFixed(2)} = ${((item.cantidad * item.precioUni) - item.montoDescu).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Resumen de ítems */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total de {formData.cuerpoDocumento.length} ítem(s):
            </span>
            <span className="text-lg font-bold text-gray-900">
              ${getTotalGeneral().toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Los impuestos se calcularán automáticamente según el tipo de DTE seleccionado
          </p>
        </div>
      </div>

      {/* Información del Documento */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Documento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Generación
            </label>
            <input
              type="text"
              value={formData.identificacion.codigoGeneracion}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Control
            </label>
            <input
              type="text"
              value={formData.identificacion.numeroControl}
              readOnly
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Emisión
            </label>
            <input
              type="date"
              value={formData.identificacion.fecEmi}
              onChange={(e) => handleInputChange('identificacion', 'fecEmi', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de DTE Seleccionado
            </label>
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-900 font-medium">
              {formData.identificacion.tipoDte} - {getTipoDteInfo().valor}
            </div>
          </div>
        </div>
      </div>

      {/* Información de muestra - ACTUALIZADA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Información</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Tipo DTE:</strong> Cada tipo tiene reglas específicas de cálculo e impuestos</li>
          <li>• <strong>Productos:</strong> Use el botón "+" para agregar múltiples ítems</li>
          <li>• <strong>Cálculos:</strong> Los impuestos se calcularán según el tipo de documento seleccionado</li>
          <li>• <strong>Validación:</strong> El documento será validado contra el schema oficial del MH</li>
        </ul>
      </div>
    </div>
  );
};

export default DteForm;