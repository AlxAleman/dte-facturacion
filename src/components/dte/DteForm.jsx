import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

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
      tipoDte: "01", // Factura
      numeroControl: "DTE-01-00000001-000000000000001",
      codigoGeneracion: generateUUID(), // ← Generar directamente aquí
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Formulario de Documento Tributario Electrónico
      </h2>

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
            Los impuestos se calcularán automáticamente en el siguiente paso
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
              Fecha de Emisión
            </label>
            <input
              type="date"
              value={formData.identificacion.fecEmi}
              onChange={(e) => handleInputChange('identificacion', 'fecEmi', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Información de muestra */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Información</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use el botón "Agregar Producto" para incluir múltiples ítems</li>
          <li>• Puede duplicar productos similares con el ícono +</li>
          <li>• Los cálculos de impuestos se realizarán automáticamente en el siguiente paso</li>
          <li>• El código de generación se genera automáticamente</li>
        </ul>
      </div>
    </div>
  );
};

export default DteForm;