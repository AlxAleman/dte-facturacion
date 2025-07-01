// src/components/context/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";

// Usuarios demo para login (puedes agregar más)
const fakeUsers = [
  {
    username: "demo",
    password: "demo123",
    name: "Demo User",
    role: "admin",
    correo: "demo@demo.com"
  },
  // Puedes agregar más usuarios si quieres
];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username, password) => {
    // Simula delay de petición real
    await new Promise((res) => setTimeout(res, 500));
    const found = fakeUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) throw new Error("Usuario o contraseña incorrectos");
    setUser(found);
    localStorage.setItem("user", JSON.stringify(found));
    localStorage.setItem("token", "fake-token-demo");
    return found;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
