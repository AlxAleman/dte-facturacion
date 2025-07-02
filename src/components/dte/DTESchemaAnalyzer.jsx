import React, { useState, useCallback } from 'react';
import { Upload, FileText, Calculator, CheckCircle, AlertCircle, Download } from 'lucide-react';

const DTESchemaAnalyzer = () => {
  const [schemas, setSchemas] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [selectedSchema, setSelectedSchema] = useState('');
  const [loading, setLoading] = useState(false);

  // Configuración conocida de tipos DTE según tu tabla
  const knownDTETypes = {
    'FC': {
      file: 'fe-fc-v1.json',
      name: 'Factura de Consumidor',
      iva: 13,
      retencion: '1% - 10%',
      subtotal: 'resumen.subTotalVentas',
      ivaField: 'resumen.iva',
      retencionField: 'resumen.reteRenta'
    },
    'CCF': {
      file: 'fe-ccf-v3.json',
      name: 'Comprobante de Crédito Fiscal',
      iva: 13,
      retencion: '1% - 10%',
      subtotal: 'resumen.subTotalVentas',
      ivaField: 'resumen.iva',
      retencionField: 'resumen.reteRenta'
    },
    'FSE': {
      file: 'fe-fse-v1.json',
      name: 'Factura Sujeto Exento',
      iva: 0,
      retencion: 0,
      subtotal: 'resumen.subTotalVentas',
      ivaField: null,
      retencionField: null
    },
    'FEX': {
      file: 'fe-fex-v1.json',
      name: 'Factura de Exportación',
      iva: 0,
      retencion: 0,
      subtotal: 'resumen.subTotalVentas',
      ivaField: 'resumen.iva',
      retencionField: 'resumen.reteRenta'
    },
    'NC': {
      file: 'fe-nc-v3.json',
      name: 'Nota de Crédito',
      iva: 13,
      retencion: '1% - 10%',
      subtotal: 'resumen.subTotalVentas',
      ivaField: 'resumen.iva',
      retencionField: 'resumen.reteRenta'
    },
    'ND': {
      file: 'fe-nd-v3.json',
      name: 'Nota de Débito',
      iva: 13,
      retencion: '1% - 10%',
      subtotal: 'resumen.subTotalVentas',
      ivaField: 'resumen.iva',
      retencionField: 'resumen.reteRenta'
    },
    'CR': {
      file: 'fe-cr-v1.json',
      name: 'Comprobante de Retención',
      iva: 0,
      retencion: 10,
      subtotal: null,
      ivaField: null,
      retencionField: 'detalle.retencion'
    }
  };

  const handleFileUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    setLoading(true);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const schema = JSON.parse(e.target.result);
          const fileName = file.name;
          
          setSchemas(prev => ({
            ...prev,
            [fileName]: {
              name: fileName,
              data: schema,
              uploaded: new Date().toISOString()
            }
          }));
        } catch (error) {
          console.error(`Error parsing ${file.name}:`, error);
        }
      };
      reader.readAsText(file);
    });

    setTimeout(() => setLoading(false), 1000);
  }, []);

  const analyzeSchema = (schemaKey) => {
    const schema = schemas[schemaKey];
    if (!schema) return;

    const analysis = {
      fileName: schemaKey,
      schemaData: schema.data,
      requiredFields: [],
      optionalFields: [],
      calculationRules: {},
      dteTypeInfo: null
    };

    // Buscar tipo DTE basado en el nombre del archivo
    const dteType = Object.keys(knownDTETypes).find(type => 
      schemaKey.includes(knownDTETypes[type].file.replace('.json', ''))
    );

    if (dteType) {
      analysis.dteTypeInfo = knownDTETypes[dteType];
    }

    // Analizar propiedades del schema
    if (schema.data.properties) {
      Object.keys(schema.data.properties).forEach(prop => {
        const isRequired = schema.data.required?.includes(prop);
        
        if (isRequired) {
          analysis.requiredFields.push(prop);
        } else {
          analysis.optionalFields.push(prop);
        }
      });
    }

    // Buscar reglas de cálculo específicas
    const findCalculationRules = (obj, path = '') => {
      if (typeof obj !== 'object' || obj === null) return;

      Object.keys(obj).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Buscar campos relacionados con cálculos
        if (key.toLowerCase().includes('iva') || 
            key.toLowerCase().includes('impuesto') ||
            key.toLowerCase().includes('retencion') ||
            key.toLowerCase().includes('subtotal') ||
            key.toLowerCase().includes('total')) {
          
          analysis.calculationRules[currentPath] = obj[key];
        }

        if (typeof obj[key] === 'object') {
          findCalculationRules(obj[key], currentPath);
        }
      });
    };

    findCalculationRules(schema.data);

    setAnalysis(analysis);
    setSelectedSchema(schemaKey);
  };

  const generateCalculationRules = () => {
    if (!analysis) return {};

    const rules = {
      dteType: analysis.dteTypeInfo?.name || 'Desconocido',
      code: selectedSchema.split('-')[1]?.toUpperCase() || 'UNKNOWN',
      calculations: {
        iva: {
          applies: analysis.dteTypeInfo?.iva > 0,
          rate: analysis.dteTypeInfo?.iva || 0,
          field: analysis.dteTypeInfo?.ivaField
        },
        retencion: {
          applies: analysis.dteTypeInfo?.retencion !== 0,
          rate: analysis.dteTypeInfo?.retencion,
          field: analysis.dteTypeInfo?.retencionField
        },
        subtotal: {
          field: analysis.dteTypeInfo?.subtotal
        }
      },
      requiredFields: analysis.requiredFields,
      validationRules: analysis.calculationRules
    };

    return rules;
  };

  const exportAnalysis = () => {
    const rules = generateCalculationRules();
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dte-rules-${selectedSchema.replace('.json', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Calculator className="text-blue-600" />
          Analizador de Schemas DTE - El Salvador
        </h1>
        <p className="text-gray-600 mb-6">
          Herramienta para analizar los schemas oficiales del Ministerio de Hacienda y extraer reglas de cálculo específicas para cada tipo de DTE.
        </p>

        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
          <input
            type="file"
            multiple
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="schema-upload"
          />
          <label htmlFor="schema-upload" className="cursor-pointer">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Subir Schemas JSON del Ministerio de Hacienda
              </p>
              <p className="text-sm text-gray-500">
                Selecciona múltiples archivos .json de los schemas oficiales DTE
              </p>
            </div>
          </label>
        </div>

        {loading && (
          <div className="text-center text-blue-600 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Procesando schemas...
          </div>
        )}
      </div>

      {/* Schemas List */}
      {Object.keys(schemas).length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="text-green-600" />
            Schemas Cargados ({Object.keys(schemas).length})
          </h2>
          
          <div className="grid gap-3">
            {Object.keys(schemas).map(schemaKey => {
              const dteType = Object.keys(knownDTETypes).find(type => 
                schemaKey.includes(knownDTETypes[type].file.replace('.json', ''))
              );
              
              return (
                <div 
                  key={schemaKey}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedSchema === schemaKey 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => analyzeSchema(schemaKey)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">{schemaKey}</h3>
                      {dteType && (
                        <div className="flex gap-4 text-sm text-gray-600 mt-1">
                          <span className="font-medium">{knownDTETypes[dteType].name}</span>
                          <span>IVA: {knownDTETypes[dteType].iva}%</span>
                          <span>Retención: {knownDTETypes[dteType].retencion}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {dteType ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Análisis: {analysis.fileName}
            </h2>
            <button
              onClick={exportAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar Reglas
            </button>
          </div>

          {analysis.dteTypeInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-800 mb-2">Información del Tipo DTE</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Tipo:</span>
                  <p>{analysis.dteTypeInfo.name}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">IVA:</span>
                  <p>{analysis.dteTypeInfo.iva}%</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Retención:</span>
                  <p>{analysis.dteTypeInfo.retencion}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Archivo:</span>
                  <p>{analysis.dteTypeInfo.file}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Required Fields */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-800 mb-3">
                Campos Obligatorios ({analysis.requiredFields.length})
              </h3>
              <div className="max-h-60 overflow-y-auto">
                {analysis.requiredFields.map(field => (
                  <div key={field} className="text-sm text-red-700 py-1 border-b border-red-100 last:border-b-0">
                    {field}
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-800 mb-3">
                Campos Opcionales ({analysis.optionalFields.length})
              </h3>
              <div className="max-h-60 overflow-y-auto">
                {analysis.optionalFields.map(field => (
                  <div key={field} className="text-sm text-green-700 py-1 border-b border-green-100 last:border-b-0">
                    {field}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calculation Rules */}
          {Object.keys(analysis.calculationRules).length > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-bold text-yellow-800 mb-3">
                Reglas de Cálculo Detectadas ({Object.keys(analysis.calculationRules).length})
              </h3>
              <div className="max-h-80 overflow-y-auto">
                {Object.entries(analysis.calculationRules).map(([path, rule]) => (
                  <div key={path} className="mb-3 p-3 bg-white rounded border">
                    <div className="font-medium text-gray-800 mb-1">{path}</div>
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(rule, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Rules Preview */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3">Preview de Reglas Generadas</h3>
            <pre className="text-sm text-gray-700 overflow-x-auto bg-white p-4 rounded border">
              {JSON.stringify(generateCalculationRules(), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DTESchemaAnalyzer;