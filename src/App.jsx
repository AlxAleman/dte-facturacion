import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import DteTypeSelector from "./components/dte/DteTypeSelector";
import DteForm from "./components/dte/DteForm";
import DteHistory from "./components/dte/DteHistory";
import DteContingency from "./components/dte/DteContingency";
import DteInvalidation from "./components/dte/DteInvalidation";

export default function App() {
  // Mock autenticación simple (luego usarás AuthContext y hook real)
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/"
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
        <Route
          path="/historial"
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
          path="/invalidacion"
          element={
            isAuthenticated ? <DteInvalidation /> : <Navigate to="/login" replace />
          }
        />
        {/* Fallback: cualquier ruta no encontrada */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}
