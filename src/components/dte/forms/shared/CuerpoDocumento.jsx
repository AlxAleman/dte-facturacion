import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

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
  title = "Productos/Servicios"
}) => {

  // Asegurar que formData y cuerpoDocumento existan
  const safeFormData = formData || {};
  const safeCuerpoDocumento = safeFormData.cuerpoDocumento || [];

  // Manejar cambios en ítems del cuerpo del documento
  const handleItemChange = (index, field, value) => {
    const updatedCuerpoDocumento = safeCuerpoDocumento.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );

    onDataChange({
      ...safeFormData,
      cuerpoDocumento: updatedCuerpoDocumento
    });
  };

  // Agregar nuevo ítem
  const addNewItem = () => {
    const newItem = {
      numItem: safeCuerpoDocumento.length + 1,
      codigo: "",
      descripcion: "",
      cantidad: 1,
      precioUni: 0,
      montoDescu: 0
    };

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
        .map((item, i) => ({ ...item, numItem: i + 1 }));

      onDataChange({
        ...safeFormData,
        cuerpoDocumento: updatedCuerpoDocumento
      });
    }
  };

  // Duplicar ítem
  const duplicateItem = (index) => {
    const itemToDuplicate = { ...safeCuerpoDocumento[index] };
    itemToDuplicate.numItem = safeCuerpoDocumento.length + 1;
    
    onDataChange({
      ...safeFormData,
      cuerpoDocumento: [...safeCuerpoDocumento, itemToDuplicate]
    });
  };

  // Calcular total general
  const getTotalGeneral = () => {
    return safeCuerpoDocumento.reduce((total, item) => {
      return total + ((item.cantidad * item.precioUni) - item.montoDescu);
    }, 0);
  };

  // Si no hay ítems, mostrar al menos uno inicial
  const itemsToRender = safeCuerpoDocumento.length > 0 ? safeCuerpoDocumento : [
    {
      numItem: 1,
      codigo: "",
      descripcion: "",
      cantidad: 1,
      precioUni: 0,
      montoDescu: 0
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={addNewItem}
          className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200 transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </button>
      </div>
      
      <div className="space-y-4">
        {itemsToRender.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Producto #{item.numItem}</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => duplicateItem(index)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Duplicar producto"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {itemsToRender.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {showCodigo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={item.codigo}
                    onChange={(e) => handleItemChange(index, 'codigo', e.target.value)}
                    placeholder="Código del producto"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              
              {showDescripcion && (
                <div className={showCodigo ? "md:col-span-2" : "md:col-span-3"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción {requiredFields.includes(`cuerpoDocumento.${index}.descripcion`) && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={item.descripcion}
                    onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                    placeholder="Descripción del producto o servicio"
                    className={getFieldClassName ? getFieldClassName(`cuerpoDocumento.${index}.descripcion`) : "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
                    required={requiredFields.includes(`cuerpoDocumento.${index}.descripcion`)}
                  />
                  {isFieldEmpty && isFieldEmpty(`cuerpoDocumento.${index}.descripcion`) && (
                    <p className="text-sm text-red-600 mt-1">Descripción es requerida</p>
                  )}
                </div>
              )}
              
              {showCantidad && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad {requiredFields.includes(`cuerpoDocumento.${index}.cantidad`) && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => handleItemChange(index, 'cantidad', parseFloat(e.target.value) || 0)}
                    placeholder="1"
                    min="0"
                    step="0.01"
                    className={getFieldClassName ? getFieldClassName(`cuerpoDocumento.${index}.cantidad`) : "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
                    required={requiredFields.includes(`cuerpoDocumento.${index}.cantidad`)}
                  />
                  {isFieldEmpty && isFieldEmpty(`cuerpoDocumento.${index}.cantidad`) && (
                    <p className="text-sm text-red-600 mt-1">Cantidad es requerida</p>
                  )}
                </div>
              )}
              
              {showPrecio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unitario {requiredFields.includes(`cuerpoDocumento.${index}.precioUni`) && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    value={item.precioUni}
                    onChange={(e) => handleItemChange(index, 'precioUni', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={getFieldClassName ? getFieldClassName(`cuerpoDocumento.${index}.precioUni`) : "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
                    required={requiredFields.includes(`cuerpoDocumento.${index}.precioUni`)}
                  />
                  {isFieldEmpty && isFieldEmpty(`cuerpoDocumento.${index}.precioUni`) && (
                    <p className="text-sm text-red-600 mt-1">Precio unitario es requerido</p>
                  )}
                </div>
              )}
              
              {showDescuento && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descuento
                  </label>
                  <input
                    type="number"
                    value={item.montoDescu}
                    onChange={(e) => handleItemChange(index, 'montoDescu', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              
              {showSubtotal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtotal
                  </label>
                  <input
                    type="text"
                    value={`$${((item.cantidad * item.precioUni) - item.montoDescu).toFixed(2)}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showSubtotal && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-lg font-semibold text-blue-900">
            Total General: ${getTotalGeneral().toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CuerpoDocumento; 