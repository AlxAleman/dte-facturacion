// src/components/context/AuthContext.jsx
import { createContext, useContext } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Puedes adaptar estos campos, el nombre no importa mientras coincida con los datos disponibles
  const user = {
    nombre: "Super Tienda SA de CV",
    nit: "1234-567890-101-2",
    establecimiento: "0001",
    direccion: "Calle Principal #123",
    telefono: "2212-3333",
    correo: "comercio@ejemplo.com",
    // ...agrega aquí TODO lo que tu usuario pueda tener
  };

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
