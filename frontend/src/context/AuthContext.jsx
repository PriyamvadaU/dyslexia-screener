import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('lexiscreen_token');
      const storedUser = localStorage.getItem('lexiscreen_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('[AuthContext] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('lexiscreen_token', userToken);
    localStorage.setItem('lexiscreen_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lexiscreen_token');
    localStorage.removeItem('lexiscreen_user');
    localStorage.removeItem('lexiscreen_active_child_id');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(user && token), loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
