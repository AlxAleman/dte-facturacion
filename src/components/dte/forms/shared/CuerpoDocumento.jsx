import React from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';

const CuerpoDocumento = ({ 
  formData, 
  onDataChange, 
  requiredFields = [], 
  isFieldEmpty, 
  getFieldClassName,
  showCodigo = true,
  showDescripcion = true,
  showCantidad = true,
  showPrecio = true,
  showDescuento = true,
  showSubtotal = true,
  title = "Productos/Servicios",
  tipoDte = "01"
}) => {

  // Asegurar que formData y cuerpoDocumento existan
  const safeFormData = formData || {};
  const safeCuerpoDocumento = safeFormData.cuerpoDocumento || [];

  // 🆕 Función para crear item básico (solo campos de entrada)
  const createBasicItem = (baseItem = {}) => {
    return {
      // ✅ SOLO CAMPOS DE ENTRADA DEL USUARIO
      numItem: baseItem.numItem || 1,
      codigo: baseItem.codigo || "",
      descripcion: baseItem.descripcion || "",
      cantidad: baseItem.cantidad || 1,
      precioUni: baseItem.precioUni || 0,
      montoDescu: baseItem.montoDescu || 0,
      
      // 🆕 CAMPOS TÉCNICOS CON VALORES POR DEFECTO (ocultos del usuario)
      tipoItem: 2, // Siempre 2 = Bienes y servicios
      uniMedida: "59", // Siempre 59 = Unidad por defecto
      
      // Los demás campos se agregarán en el Paso 2 (cálculos)
      // ventaNoSuj, ventaExenta, ventaGravada, tributos, psv, noGravado, ivaItem, totalItem
    };
  };

  // Manejar cambios en ítems del cuerpo del documento
  const handleItemChange = (index, field, value) => {
    const updatedCuerpoDocumento = safeCuerpoDocumento.map((item, i) => {
      if (i === index) {
        return createBasicItem({ ...item, [field]: value });
      }
      return item;
    });

    onDataChange({
      ...safeFormData,
      cuerpoDocumento: updatedCuerpoDocumento
    });
  };

  // Agregar nuevo ítem
  const addNewItem = () => {
    const newItem = createBasicItem({
      numItem: safeCuerpoDocumento.length + 1,
      codigo: "",
      descripcion: "",
      cantidad: 1,
      precioUni: 0,
      montoDescu: 0
    });

    onDataChange({
      ...safeFormData,
      cuerpoDocumento: [...safeCuerpoDocumento, newItem]
    });
  };

  // Remover ítem
  const removeItem = (index) => {
    if (safeCuerpoDocumento.length > 1) {
      const updatedCuerpoDocumento = safeCuerpoDocumento
        .filter((_, i) => i !== index)
        .map((item, i) => createBasicItem({ ...item, numItem: i + 1 }));

      onDataChange({
        ...safeFormData,
        cuerpoDocumento: updatedCuerpoDocumento
      });
    }
  };

  // Duplicar ítem
  const duplicateItem = (index) => {
    const itemToDuplicate = createBasicItem({
      ...safeCuerpoDocumento[index],
      numItem: safeCuerpoDocumento.length + 1
    });
    
    onDataChange({
      ...safeFormData,
      cuerpoDocumento: [...safeCuerpoDocumento, itemToDuplicate]
    });
  };

  // Calcular total general SIMPLE (solo para visualización)
  const getTotalGeneral = () => {
    return safeCuerpoDocumento.reduce((total, item) => {
      return total + ((item.cantidad * item.precioUni) - item.montoDescu);
    }, 0);
  };

  // Si no hay ítems, mostrar al menos uno inicial
  const itemsToRender = safeCuerpoDocumento.length > 0 
    ? safeCuerpoDocumento.map(item => createBasicItem(item))
    : [createBasicItem({
        numItem: 1,
        codigo: "",
        descripcion: "",
        cantidad: 1,
        precioUni: 0,
        montoDescu: 0
      })];

  // 🆕 Auto-actualizar si los items no tienen campos técnicos
  React.useEffect(() => {
    if (safeCuerpoDocumento.length > 0) {
      const hasIncompleteItems = safeCuerpoDocumento.some(item => 
        typeof item.tipoItem === 'undefined' || 
        typeof item.uniMedida === 'undefined'
      );
      
      if (hasIncompleteItems) {
        console.log('🔧 Agregando campos técnicos básicos...');
        onDataChange({
          ...safeFormData,
          cuerpoDocumento: itemsToRender
        });
      }
    }
  }, [safeCuerpoDocumento.length]);

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        <button
          type="button"
          onClick={addNewItem}
          className="w-full sm:w-auto px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </button>
      </div>
      
      <div className="space-y-4">
        {itemsToRender.map((item, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Producto #{item.numItem}</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => duplicateItem(index)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                  title="Duplicar producto"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {itemsToRender.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* SOLO CAMPOS BÁSICOS DE ENTRADA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {showCodigo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={item.codigo}
                    onChange={(e) => handleItemChange(index, 'codigo', e.target.value)}
                    placeholder="Código del producto"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
              
              {showDescripcion && (
                <div className={showCodigo ? "md:col-span-2" : "md:col-span-3"}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                    placeholder="Descripción del producto o servicio"
                    className={getFieldClassName ? getFieldClassName(`cuerpoDocumento.${index}.descripcion`) : "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"}
                    required
                  />
                  {isFieldEmpty && isFieldEmpty(`cuerpoDocumento.${index}.descripcion`) && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">Descripción es requerida</p>
                  )}
                </div>
              )}
              
              {showCantidad && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                    placeholder="1"
                    min="0.01"
                    step="0.01"
                    className={getFieldClassName ? getFieldClassName(`cuerpoDocumento.${index}.cantidad`) : "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"}
                    required
                  />
                </div>
              )}
              
              {showPrecio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio Unitario <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={item.precioUni}
                    onChange={(e) => handleItemChange(index, 'precioUni', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className={getFieldClassName ? getFieldClassName(`cuerpoDocumento.${index}.precioUni`) : "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"}
                    required
                  />
                </div>
              )}
            </div>
            
            {/* Segunda fila para descuento y subtotal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {showDescuento && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descuento
                  </label>
                  <input
                    type="number"
                    value={item.montoDescu}
                    onChange={(e) => handleItemChange(index, 'montoDescu', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
              
              {showSubtotal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subtotal (sin IVA)
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md font-medium">
                    ${((item.cantidad * item.precioUni) - item.montoDescu).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Total general SIN IVA (para el Paso 1) */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">Total General (sin IVA):</span>
          <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">${getTotalGeneral().toFixed(2)}</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Los impuestos se calcularán en el siguiente paso
        </p>
      </div>
    </div>
  );
};

export default CuerpoDocumento;