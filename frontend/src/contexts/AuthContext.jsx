import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

// Leitura segura do localStorage (evita erro se o JSON estiver corrompido)
function lerUsuarioSalvo() {
    try {
        const salvo = localStorage.getItem("user");
        return salvo ? JSON.parse(salvo) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(lerUsuarioSalvo);

    // Chamado pelo Acesso.jsx após o login bem-sucedido
    function login(novoToken, dadosUsuario) {
        localStorage.setItem("token", novoToken);
        localStorage.setItem("user", JSON.stringify(dadosUsuario));
        setToken(novoToken);
        setUser(dadosUsuario);
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    }

    // O interceptor do api.js dispara "auth:expired" quando a API devolve 401
    useEffect(() => {
        const aoExpirar = () => logout();
        window.addEventListener("auth:expired", aoExpirar);
        return () => window.removeEventListener("auth:expired", aoExpirar);
    }, []);

    const value = {
        token,
        user,
        autenticado: !!token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook de acesso ao contexto
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um <AuthProvider>.");
    }

    return context;
}