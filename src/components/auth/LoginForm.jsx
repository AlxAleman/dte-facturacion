import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock: usuario demo / demo123 (puedes cambiarlo)
    if (user === "demo" && pass === "demo123") {
      localStorage.setItem("token", "mock-token-123");
      navigate("/");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", justifyContent: "center", alignItems: "center",
      background: "#18181b"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#23232b",
        borderRadius: 8,
        padding: 32,
        boxShadow: "0 0 32px #000a",
        display: "flex", flexDirection: "column", gap: 16, minWidth: 300
      }}>
        <h2 style={{ color: "#fff", marginBottom: 8 }}>Iniciar Sesión</h2>
        <input
          type="text"
          placeholder="Usuario"
          value={user}
          onChange={e => setUser(e.target.value)}
          style={{ padding: 10, borderRadius: 4, border: "1px solid #444" }}
          autoFocus
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={pass}
          onChange={e => setPass(e.target.value)}
          style={{ padding: 10, borderRadius: 4, border: "1px solid #444" }}
        />
        {error && <span style={{ color: "red", fontSize: 14 }}>{error}</span>}
        <button
          type="submit"
          style={{
            padding: 10, borderRadius: 4, border: "none",
            background: "#3b82f6", color: "#fff", fontWeight: "bold"
          }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
