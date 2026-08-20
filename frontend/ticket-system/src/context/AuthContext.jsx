import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  login as apiLogin,
  getCurrentUser,
  getToken,
  setToken,
  clearToken,
  setUnauthorizedHandler,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // restoring session from a stored token

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // If a request gets a 401 (expired/invalid token), drop the session.
  // ProtectedRoute then redirects to the right login page on its own.
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  // Restore the session on first load if a token is already stored.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then((me) => setUser(me))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedInUser, token } = await apiLogin(email, password);
    setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
