import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import DteTypeSelector from "./components/dte/DteTypeSelector";
import DteForm from "./components/dte/DteForm";
import DteHistory from "./components/dte/DteHistory";
import DteContingency from "./components/dte/DteContingency";
import DteInvalidation from "./components/dte/DteInvalidation";
import DTEManager from "./components/dte/DTEManager";  // ← Sistema profesional

export default function App() {
  // Mock autenticación simple
  // const isAuthenticated = !!localStorage.getItem("token");
  const isAuthenticated = true;

  return (
    <Router>
      <Routes>
        {/* Ruta de Login - Sin autenticación requerida */}
        <Route path="/login" element={<LoginForm />} />
        
        {/* ================================ */}
        {/* RUTA PRINCIPAL - SISTEMA PROFESIONAL */}
        {/* ================================ */}
        <Route
  path="/"
  element={
    isAuthenticated ? <DteTypeSelector /> : <Navigate to="/login" replace />
  }
/>
        
        {/* ================================ */}
        {/* SISTEMA PROFESIONAL - RUTAS PRINCIPALES */}
        {/* ================================ */}
        <Route
          path="/dte/nuevo"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/dte/profesional"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/sistema-profesional"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        
        {/* ================================ */}
        {/* SISTEMA TRADICIONAL - PARA CASOS ESPECIALES */}
        {/* ================================ */}
        <Route
          path="/tradicional"
          element={
            isAuthenticated ? <DteTypeSelector /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/selector"
          element={
            isAuthenticated ? <DteTypeSelector /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/emitir/:tipo"
          element={
            isAuthenticated ? <DteForm /> : <Navigate to="/login" replace />
          }
        />
        
        {/* ================================ */}
        {/* RUTAS DE GESTIÓN */}
        {/* ================================ */}
        <Route
          path="/historial"
          element={
            isAuthenticated ? <DteHistory /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/dte/historial"
          element={
            isAuthenticated ? <DteHistory /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/contingencia"
          element={
            isAuthenticated ? <DteContingency /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/dte/contingencia"
          element={
            isAuthenticated ? <DteContingency /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/invalidacion"
          element={
            isAuthenticated ? <DteInvalidation /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/dte/invalidacion"
          element={
            isAuthenticated ? <DteInvalidation /> : <Navigate to="/login" replace />
          }
        />
        
        {/* ================================ */}
        {/* ACCESOS DIRECTOS POR TIPO */}
        {/* ================================ */}
        <Route
          path="/factura"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/ccf"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/nota-credito"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/nota-debito"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        
        {/* ================================ */}
        {/* RUTAS DE DESARROLLO */}
        {/* ================================ */}
        <Route
          path="/test/profesional"
          element={
            isAuthenticated ? <DTEManager /> : <Navigate to="/login" replace />
          }
        />
        
        {/* Comparación de sistemas */}
        <Route
          path="/comparar"
          element={
            isAuthenticated ? (
              <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-6xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Comparación de Sistemas
                  </h1>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-blue-600 mb-4">
                        Sistema Profesional
                      </h2>
                      <DTEManager />
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-green-600 mb-4">
                        Sistema Tradicional
                      </h2>
                      <DteTypeSelector />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* ================================ */}
        {/* REDIRECTS ÚTILES */}
        {/* ================================ */}
        <Route
          path="/crear-dte"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/nuevo-dte"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/emitir"
          element={<Navigate to="/tradicional" replace />}
        />
        
        {/* ================================ */}
        {/* PÁGINA 404 */}
        {/* ================================ */}
        <Route
          path="/404"
          element={
            isAuthenticated ? (
              <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-6">Página no encontrada</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Ir al Sistema Profesional
                    </button>
                    <button
                      onClick={() => window.location.href = '/tradicional'}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Sistema Tradicional
                    </button>
                    <button
                      onClick={() => window.location.href = '/historial'}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Ver Historial
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Fallback final */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? <Navigate to="/404" replace /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </Router>
  );
}