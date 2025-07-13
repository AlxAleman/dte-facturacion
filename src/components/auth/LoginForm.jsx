// src/components/auth/LoginForm.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-sm border border-gray-200 dark:border-gray-700"
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">Iniciar sesión</h2>
        <label className="block mb-2 text-gray-700 dark:text-gray-300">
          Usuario
          <input
            type="text"
            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </label>
        <label className="block mb-4 text-gray-700 dark:text-gray-300">
          Contraseña
          <input
            type="password"
            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <div className="mb-4 text-red-600 border border-red-200 bg-red-50 p-2 rounded text-sm text-center animate-shake">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <div className="mt-4 text-gray-400 dark:text-gray-500 text-xs">
        Usuario: <b>demo</b> <br />
        Contraseña: <b>demo123</b>
      </div>
    </div>
  );
}
