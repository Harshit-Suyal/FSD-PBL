import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const cleanToken = (value) => {
    if (!value) return null;
    if (value === 'undefined' || value === 'null') return null;
    return value;
};

const getStoredUser = () => {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const getStoredToken = () => {
    const direct = cleanToken(localStorage.getItem('token'));
    if (direct) return direct;

    const user = getStoredUser();
    return cleanToken(user?.token || user?.accessToken);
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => getStoredToken());
    const [user, setUser] = useState(() => {
        const storedUser = getStoredUser();
        return getStoredToken() ? storedUser : null;
    });

    const login = useCallback((userData) => {
        const tok = cleanToken(userData?.token || userData?.accessToken);
        if (!tok) {
            throw new Error('Authentication token missing in login response. Please login again.');
        }
        const { token: _token, accessToken: _accessToken, ...rest } = userData;
        localStorage.setItem('token', tok);
        localStorage.setItem('user', JSON.stringify(rest));
        setToken(tok);
        setUser(rest);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedData) => {
        const merged = { ...user, ...updatedData };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
