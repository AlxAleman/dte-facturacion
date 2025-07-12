# Formularios Modulares DTE

## Tabla de mapeo: Código de Tipo DTE ↔ Componente

| Código | Nombre Oficial                        | Componente (archivo)                      |
|--------|---------------------------------------|-------------------------------------------|
| 01     | Factura de Consumidor                 | FacturaConsumidor.jsx                     |
| 03     | Comprobante de Crédito Fiscal         | ComprobanteCreditoFiscal.jsx              |
| 04     | Nota de Remisión                      | NotaRemision.jsx                          |
| 05     | Nota de Crédito                       | NotaCredito.jsx                           |
| 06     | Nota de Débito                        | NotaDebito.jsx                            |
| 07     | Comprobante de Retención              | ComprobanteRetencion.jsx                  |
| 08     | Comprobante de Liquidación            | ComprobanteLiquidacion.jsx                |
| 09     | Documento Contable de Liquidación     | DocumentoContableLiquidacion.jsx          |
| 11     | Factura de Exportación                | FacturaExportacion.jsx                    |
| 14     | Factura de Sujeto Excluido            | FacturaSujetoExcluido.jsx                 |
| 15     | Comprobante de Donación               | ComprobanteDonacion.jsx                   |

---

## 📋 Descripción

Este sistema modular reemplaza el archivo monolítico `DteForm.jsx` (3,762 líneas) con una arquitectura modular y mantenible que separa los formularios por tipo de DTE y utiliza componentes compartidos reutilizables.

## 🏗️ Arquitectura

```
src/components/dte/forms/
├── DteFormContainer.jsx          # Coordinador principal
├── DteFormContainer.export.js    # Exportación para evitar imports circulares
├── TestDteFormContainer.jsx      # Componente de prueba
├── index.js                      # Exportaciones principales
├── README.md                     # Esta documentación
├── shared/                       # Componentes compartidos
│   ├── EmisorInfo.jsx           # Información del emisor (solo lectura)
│   ├── ReceptorForm.jsx         # Formulario del receptor
│   └── CuerpoDocumento.jsx      # Gestión de productos/servicios
└── types/                        # Formularios específicos por tipo
    ├── index.js                  # Exportaciones de tipos
    ├── FacturaConsumidor.jsx     # Tipo 01
    ├── ComprobanteCreditoFiscal.jsx # Tipo 03
    ├── NotaRemision.jsx          # Tipo 04
    ├── NotaCredito.jsx           # Tipo 05
    ├── NotaDebito.jsx            # Tipo 06
    ├── ComprobanteRetencion.jsx  # Tipo 07
    ├── ComprobanteLiquidacion.jsx # Tipo 08
    ├── DocumentoContableLiquidacion.jsx # Tipo 09
    ├── FacturaExportacion.jsx    # Tipo 11
    ├── FacturaSujetoExcluido.jsx # Tipo 14
    └── ComprobanteDonacion.jsx   # Tipo 15
```

## ✅ Tipos de DTE Soportados

| Tipo | Nombre | Versión | Estado |
|------|--------|---------|--------|
| 01 | Factura de Consumidor | 1 | ✅ Implementado |
| 03 | Comprobante de Crédito Fiscal | 3 | ✅ Implementado |
| 04 | Nota de Remisión | 3 | 🔄 Pendiente |
| 05 | Nota de Crédito | 3 | 🔄 Pendiente |
| 06 | Nota de Débito | 3 | 🔄 Pendiente |
| 07 | Comprobante de Retención | 1 | 🔄 Pendiente |
| 08 | Comprobante de Liquidación | 1 | 🔄 Pendiente |
| 09 | Documento Contable de Liquidación | 1 | 🔄 Pendiente |
| 11 | Factura de Exportación | 1 | 🔄 Pendiente |
| 14 | Factura de Sujeto Excluido | 1 | 🔄 Pendiente |
| 15 | Comprobante de Donación | 1 | 🔄 Pendiente |

## 🚀 Uso

### Uso Básico

```jsx
import DteFormContainer from './components/dte/forms/DteFormContainer.export';

function App() {
  const handleDataChange = (data, validation) => {
    console.log('Datos del formulario:', data);
    console.log('Estado de validación:', validation);
  };

  return (
    <DteFormContainer
      onDataChange={handleDataChange}
      initialData={null}
      tipoDte="01"
    />
  );
}
```

### Uso con Datos Iniciales

```jsx
const initialData = {
  identificacion: {
    tipoDte: "01",
    // ... otros campos
  },
  emisor: {
    // ... datos del emisor
  },
  receptor: {
    // ... datos del receptor
  }
  // ... resto de datos
};

<DteFormContainer
  onDataChange={handleDataChange}
  initialData={initialData}
  tipoDte="01"
/>
```

### Componente de Prueba

```jsx
import TestDteFormContainer from './components/dte/forms/TestDteFormContainer';

// Usar en desarrollo para probar todos los tipos
<TestDteFormContainer />
```

## 🔧 Componentes Compartidos

### EmisorInfo.jsx
- **Propósito**: Mostrar información del emisor (solo lectura)
- **Props**: `formData`
- **Características**: 
  - Datos configurados automáticamente desde `src/config/empresa.js`
  - Campos de solo lectura
  - Información contextual

### ReceptorForm.jsx
- **Propósito**: Formulario del receptor con validación
- **Props**: 
  - `formData`
  - `onDataChange`
  - `requiredFields`
  - `isFieldEmpty`
  - `getFieldClassName`
  - `tipoDte`
  - `showNrc`, `showActividad`, `showDireccion`, `showContacto`
- **Características**:
  - Auto-completado inteligente
  - Validación en tiempo real
  - Búsqueda de actividad económica
  - Campos condicionales según tipo de DTE

### CuerpoDocumento.jsx
- **Propósito**: Gestión de productos/servicios
- **Props**:
  - `formData`
  - `onDataChange`
  - `requiredFields`
  - `isFieldEmpty`
  - `getFieldClassName`
  - `showCodigo`, `showDescripcion`, `showCantidad`, `showPrecio`, `showDescuento`, `showSubtotal`
  - `title`
- **Características**:
  - Agregar/remover/duplicar ítems
  - Cálculos automáticos
  - Validación por ítem
  - Campos configurables

## 📝 Formularios Específicos

### FacturaConsumidor.jsx (Tipo 01)
- **Versión**: 1
- **Campos requeridos**: nombre, tipoDocumento, numDocumento, cuerpoDocumento
- **Características específicas**:
  - NRC requerido solo para NIT
  - IVA 13% sobre operaciones gravadas
  - Retención 1% - 10% según aplique

### ComprobanteCreditoFiscal.jsx (Tipo 03)
- **Versión**: 3
- **Campos requeridos**: nombre, nit, nrc, cuerpoDocumento
- **Características específicas**:
  - Solo NIT del receptor (no tipoDocumento/numDocumento)
  - NRC obligatorio
  - Campo específico `ivaPerci1` para IVA percibido
  - IVA 13% con derecho a crédito fiscal

## 🔄 Migración Completada

### ✅ Lo que se ha migrado:
1. **Estructura modular** completa
2. **Componentes compartidos** reutilizables
3. **FacturaConsumidor** (tipo 01) - Completamente funcional
4. **ComprobanteCreditoFiscal** (tipo 03) - Completamente funcional
5. **Sistema de validación** en tiempo real
6. **Auto-completado** inteligente
7. **Interfaz responsiva** y moderna
8. **Información contextual** por tipo de DTE

### 🔄 Próximos pasos:
1. Implementar los tipos restantes (04-15)
2. Migrar lógica específica de cada tipo
3. Agregar validaciones específicas por tipo
4. Implementar campos especiales (documentoRelacionado, ventaTercero, etc.)

## 🧪 Pruebas

### Ejecutar pruebas:
1. Navegar a `/test-dte-forms` (si está configurado)
2. Usar el componente `TestDteFormContainer`
3. Probar diferentes tipos de DTE
4. Verificar validaciones
5. Comprobar auto-completado

### Funcionalidades de prueba:
- ✅ Cambio de tipo de DTE
- ✅ Generación de datos de prueba
- ✅ Limpieza de datos
- ✅ Visualización de estado de validación
- ✅ Debug en consola

## 🎯 Beneficios de la Migración

### Antes (DteForm.jsx):
- ❌ 3,762 líneas en un solo archivo
- ❌ Difícil mantenimiento
- ❌ Lógica mezclada para todos los tipos
- ❌ Reutilización limitada
- ❌ Testing complejo

### Después (Sistema Modular):
- ✅ Archivos pequeños y enfocados
- ✅ Mantenimiento fácil
- ✅ Lógica separada por tipo
- ✅ Componentes reutilizables
- ✅ Testing simplificado
- ✅ Escalabilidad mejorada

## 📚 Dependencias

- React 18+
- Lucide React (iconos)
- Tailwind CSS (estilos)
- Catálogos oficiales del MH

## 🔗 Archivos Relacionados

- `src/config/empresa.js` - Configuración del emisor
- `src/components/data/` - Catálogos oficiales
- `src/utils/geoCatalogs.js` - Catálogos geográficos
- `src/services/schemaValidator.js` - Validación de esquemas

## 🤝 Contribución

Para agregar un nuevo tipo de DTE:

1. Crear archivo en `types/NombreTipo.jsx`
2. Implementar lógica específica
3. Agregar exportación en `types/index.js`
4. Actualizar `DTE_COMPONENTS` en `DteFormContainer.jsx`
5. Agregar información en `DTE_INFO`
6. Probar con `TestDteFormContainer`

## 📞 Soporte

Para dudas o problemas:
1. Revisar esta documentación
2. Verificar los ejemplos de uso
3. Probar con el componente de prueba
4. Revisar la consola del navegador para errores 