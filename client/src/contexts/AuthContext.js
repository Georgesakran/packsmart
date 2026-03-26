import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const token = localStorage.getItem("packsmart_token");

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        console.error("Load user error:", error);
        localStorage.removeItem("packsmart_token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });

    const { token, user } = response.data;

    localStorage.setItem("packsmart_token", token);
    setUser(user);

    return response.data;
  };

  const register = async (firstName, lastName, email, password) => {
    const response = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
    });

    const { token, user } = response.data;

    localStorage.setItem("packsmart_token", token);
    setUser(user);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("packsmart_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}