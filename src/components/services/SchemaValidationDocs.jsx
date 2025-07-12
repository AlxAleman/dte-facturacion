// src/components/services/SchemaValidationDocs.jsx
// Documentación del sistema de validación de esquemas

import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Code,
  Download,
  Eye
} from 'lucide-react';
import { schemaValidator } from '../../services/schemaValidator.js';

const SchemaValidationDocs = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCodeExamples, setShowCodeExamples] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BookOpen },
    { id: 'schemas', label: 'Esquemas', icon: FileText },
    { id: 'validation', label: 'Validación', icon: CheckCircle },
    { id: 'components', label: 'Componentes', icon: Code },
    { id: 'examples', label: 'Ejemplos', icon: Eye }
  ];

  const schemaInfo = schemaValidator.listAvailableSchemas();

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Sistema de Validación de Esquemas
        </h3>
        <p className="text-blue-800 mb-4">
          Este sistema valida automáticamente que cada tipo de DTE cumpla con los esquemas JSON oficiales 
          del Ministerio de Hacienda de El Salvador.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold text-blue-900">Validación en Tiempo Real</div>
            <div className="text-blue-700">Verificación automática mientras editas</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold text-blue-900">Esquemas Oficiales</div>
            <div className="text-blue-700">Basado en especificaciones MH</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold text-blue-900">Reportes Detallados</div>
            <div className="text-blue-700">Análisis completo de errores</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Características
          </h4>
          <ul className="space-y-2 text-gray-700">
            <li>• Validación contra esquemas JSON oficiales</li>
            <li>• Detección de campos faltantes</li>
            <li>• Validación de formatos y tipos</li>
            <li>• Análisis específico por tipo de DTE</li>
            <li>• Reportes de validación descargables</li>
            <li>• Cache de validaciones para rendimiento</li>
            <li>• Validación en tiempo real con debounce</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Tipos de Validación
          </h4>
          <ul className="space-y-2 text-gray-700">
            <li>• <strong>Esquema:</strong> Estructura JSON oficial</li>
            <li>• <strong>Cálculos:</strong> Impuestos y totales</li>
            <li>• <strong>Negocio:</strong> Reglas específicas DTE</li>
            <li>• <strong>Formato:</strong> Patrones y validaciones</li>
            <li>• <strong>Requeridos:</strong> Campos obligatorios</li>
            <li>• <strong>Específicos:</strong> Validaciones por tipo</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderSchemas = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Esquemas Disponibles ({schemaInfo.length})
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemaInfo.map((schema) => (
            <div key={schema.tipoDte} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">
                  {schema.tipoDte}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {schema.schemaName}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {schema.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Mapeo de Tipos DTE</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo DTE</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Esquema</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IVA</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Retención</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schemaInfo.map((schema) => {
                const dteInfo = schemaValidator.getSchemaInfo(schema.tipoDte);
                return (
                  <tr key={schema.tipoDte} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {schema.tipoDte}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {schema.title}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 font-mono">
                      {schema.schemaName}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        dteInfo?.iva?.applies 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dteInfo?.iva?.applies ? `${(dteInfo.iva.rate * 100).toFixed(0)}%` : 'No aplica'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        dteInfo?.retencion?.applies 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dteInfo?.retencion?.applies ? `${(dteInfo.retencion.rate * 100).toFixed(0)}%` : 'No aplica'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderValidation = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Proceso de Validación
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Inicialización</h4>
              <p className="text-sm text-gray-600">
                Carga y compila todos los esquemas JSON oficiales en memoria
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Validación de Esquema</h4>
              <p className="text-sm text-gray-600">
                Verifica que el JSON cumpla con la estructura oficial del tipo de DTE
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Análisis de Campos</h4>
              <p className="text-sm text-gray-600">
                Identifica campos faltantes, inválidos o con formato incorrecto
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Validación Específica</h4>
              <p className="text-sm text-gray-600">
                Aplica reglas específicas según el tipo de DTE (montos mínimos, campos requeridos, etc.)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              5
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Reporte</h4>
              <p className="text-sm text-gray-600">
                Genera un reporte detallado con errores, advertencias y recomendaciones
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Tipos de Errores
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Campos faltantes:</strong> Campos requeridos no presentes</li>
            <li>• <strong>Formato inválido:</strong> Patrones o tipos incorrectos</li>
            <li>• <strong>Valores fuera de rango:</strong> Números o fechas inválidas</li>
            <li>• <strong>Estructura incorrecta:</strong> Objetos o arrays mal formados</li>
            <li>• <strong>Validaciones específicas:</strong> Reglas de negocio DTE</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Tipos de Advertencias
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Campos opcionales:</strong> Campos recomendados faltantes</li>
            <li>• <strong>Montos mínimos:</strong> Valores por debajo del mínimo</li>
            <li>• <strong>Fechas futuras:</strong> Fechas de emisión futuras</li>
            <li>• <strong>Inconsistencias:</strong> Datos que no coinciden</li>
            <li>• <strong>Recomendaciones:</strong> Mejoras sugeridas</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderComponents = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Componentes Disponibles
        </h3>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">SchemaValidationIndicator</h4>
            <p className="text-sm text-gray-600 mb-3">
              Componente visual que muestra el estado de validación en tiempo real
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              {`<SchemaValidationIndicator 
  dteData={dteData}
  tipoDte="01"
  onValidationChange={handleValidation}
  showDetails={true}
/>`}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">DteFinalReview</h4>
            <p className="text-sm text-gray-600 mb-3">
              Componente completo de revisión final antes del envío
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              {`<DteFinalReview
  dteData={dteData}
  calculations={calculations}
  onValidationComplete={handleComplete}
  onProceedToSend={handleSend}
/>`}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">useSchemaValidation Hook</h4>
            <p className="text-sm text-gray-600 mb-3">
              Hook personalizado para manejar validaciones de manera eficiente
            </p>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              {`const {
  validateDocument,
  validateField,
  generateReport,
  isInitialized,
  isValidating
} = useSchemaValidation();`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExamples = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Ejemplos de Uso
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Validación Básica</h4>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              {`// Validar documento completo
const result = await schemaValidator.validateDocument(dteData, "01");

if (result.isValid) {
  console.log("Documento válido");
} else {
  console.log("Errores:", result.errors);
  console.log("Advertencias:", result.warnings);
}`}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Validación de Campo Específico</h4>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              {`// Validar campo específico
const fieldResult = schemaValidator.validateField(
  dteData, 
  "identificacion.numeroControl", 
  "01"
);

if (!fieldResult.isValid) {
  console.log("Error en campo:", fieldResult.error);
}`}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Generar Reporte</h4>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              {`// Generar reporte completo
const report = schemaValidator.generateValidationReport(dteData, "01");

console.log("Resumen:", report.summary);
console.log("Recomendaciones:", report.recommendations);`}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Hook en Componente</h4>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
              {`function MyComponent() {
  const { validateDocument, isInitialized } = useSchemaValidation();
  
  useEffect(() => {
    if (isInitialized && dteData) {
      validateDocument(dteData, tipoDte);
    }
  }, [dteData, tipoDte]);
  
  return <SchemaValidationIndicator dteData={dteData} tipoDte={tipoDte} />;
}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'schemas': return renderSchemas();
      case 'validation': return renderValidation();
      case 'components': return renderComponents();
      case 'examples': return renderExamples();
      default: return renderOverview();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Documentación del Sistema de Validación
        </h1>
        <p className="text-gray-600">
          Guía completa para usar el sistema de validación de esquemas DTE
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          <p>
            Sistema de validación basado en esquemas oficiales del Ministerio de Hacienda de El Salvador
          </p>
          <p className="mt-1">
            Última actualización: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SchemaValidationDocs; 