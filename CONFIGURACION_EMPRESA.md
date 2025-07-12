# Configuración de Empresa - DTE Facturación

## 📋 Descripción

El sistema de facturación electrónica permite configurar los datos de la empresa emisora de forma centralizada, evitando que el usuario tenga que ingresar estos datos en cada factura.

## 🏢 Datos Configurables

### Datos Principales
- **Nombre de la Empresa** (requerido)
- **NIT** (requerido)
- **Nombre Comercial** (opcional)
- **Descripción de Actividad** (opcional)

### Información de Contacto
- **Dirección**
- **Teléfono**
- **Correo Electrónico**
- **NRC** (Número de Registro de Contribuyente)

### Configuración de Facturación
- **Serie de Facturación** (por defecto: "A")
- **Moneda** (por defecto: "USD")
- **Ambiente** (test/production)

## 🔧 Métodos de Configuración

### 1. Configuración Visual (Recomendado)

1. Abrir la aplicación
2. Hacer clic en el botón **"Configurar Empresa"** en la parte superior derecha
3. Editar los campos necesarios
4. Guardar la configuración

### 2. Configuración Manual en Código

Editar el archivo `src/config/empresa.js`:

```javascript
export const EMPRESA_CONFIG = {
  // 🏢 DATOS PRINCIPALES DE LA EMPRESA
  nombre: "Mi Empresa S.A. de C.V.",
  nit: "0614-123456-789-0",
  nombreComercial: "Mi Empresa",
  descActividad: "Comercio al por mayor y menor de productos diversos",
  
  // 📍 INFORMACIÓN DE CONTACTO
  direccion: "Calle Principal #123, Colonia Centro, San Salvador",
  telefono: "+503 2222-3333",
  correo: "facturacion@miempresa.com",
  
  // 🏛️ INFORMACIÓN TRIBUTARIA
  nrc: "123456-7",
  
  // ⚙️ CONFIGURACIÓN DE FACTURACIÓN
  serieFactura: "A",
  moneda: "USD",
  ambiente: "test"
};
```

## ✅ Validaciones

El sistema valida automáticamente:

- **Campos requeridos**: Nombre y NIT son obligatorios
- **Formato de NIT**: Debe seguir el patrón `XXXX-XXXXXX-XXX-X`
- **Formato de email**: Debe ser un email válido
- **Configuración completa**: Verifica que todos los campos necesarios estén presentes

## 🔄 Actualización de Datos

### Cambios en Tiempo Real
- Los cambios en la configuración se reflejan inmediatamente en el formulario
- Los datos del emisor aparecen como campos de solo lectura
- Se muestra una nota indicando que los datos vienen de la configuración

### Persistencia
- Los cambios se guardan en `localStorage` del navegador
- Para producción, considere implementar persistencia en base de datos

## 🎯 Beneficios

1. **Eficiencia**: No hay que ingresar datos repetitivos
2. **Consistencia**: Los datos son uniformes en todas las facturas
3. **Validación**: Errores de tipeo se eliminan
4. **Mantenimiento**: Cambios centralizados en un solo lugar
5. **Multiempresa**: Fácil configuración para diferentes empresas

## 🚀 Implementación para Múltiples Empresas

### Opción 1: Configuración por Archivo
Crear diferentes archivos de configuración:

```javascript
// src/config/empresa1.js
export const EMPRESA_CONFIG = { /* datos empresa 1 */ };

// src/config/empresa2.js  
export const EMPRESA_CONFIG = { /* datos empresa 2 */ };
```

### Opción 2: Configuración Dinámica
Implementar un selector de empresa en la interfaz:

```javascript
const empresas = {
  empresa1: { nombre: "Empresa 1", nit: "..." },
  empresa2: { nombre: "Empresa 2", nit: "..." }
};
```

### Opción 3: Base de Datos
Para implementaciones más robustas, almacenar la configuración en una base de datos con autenticación de usuarios.

## 🔒 Seguridad

- Los datos sensibles como certificados digitales deben almacenarse de forma segura
- En producción, use variables de entorno para configuraciones críticas
- Implemente autenticación para acceder a la configuración de empresa

## 📞 Soporte

Para dudas sobre la configuración:
1. Revisar la validación en la interfaz
2. Verificar el formato de los datos
3. Consultar la documentación oficial del MH para formatos específicos

---

**Nota**: Esta configuración es fundamental para el correcto funcionamiento del sistema de facturación electrónica. Asegúrese de que todos los datos sean precisos y estén actualizados. 