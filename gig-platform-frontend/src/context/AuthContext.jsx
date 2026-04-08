import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const cleanToken = (value) => {
    if (!value) return null;
    if (value === 'undefined' || value === 'null') return null;
    return value;
};

const getStorage = () => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage;
};

const clearLegacyLocalAuth = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
};

const getStoredUser = () => {
    const storage = getStorage();
    try {
        const stored = storage?.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

const getStoredToken = () => {
    const storage = getStorage();
    const direct = cleanToken(storage?.getItem('token'));
    if (direct) return direct;

    const user = getStoredUser();
    return cleanToken(user?.token || user?.accessToken);
};

const decodeJwtPayload = (token) => {
    try {
        const base64Url = token?.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
};

const getStoredAuth = () => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (!storedToken || !storedUser?._id) {
        return { token: null, user: null };
    }

    const payload = decodeJwtPayload(storedToken);
    if (payload?.id && String(payload.id) !== String(storedUser._id)) {
        return { token: null, user: null };
    }

    if (!payload) {
        // If token payload cannot be decoded reliably, keep current auth instead of forcing logout.
        return { token: storedToken, user: storedUser };
    }

    return { token: storedToken, user: storedUser };
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => getStoredAuth().token);
    const [user, setUser] = useState(() => getStoredAuth().user);

    const login = useCallback((userData) => {
        const storage = getStorage();
        const tok = cleanToken(userData?.token || userData?.accessToken);
        if (!tok) {
            throw new Error('Authentication token missing in login response. Please login again.');
        }
        const { token: _token, accessToken: _accessToken, ...rest } = userData;
        storage?.setItem('token', tok);
        storage?.setItem('user', JSON.stringify(rest));
        clearLegacyLocalAuth();
        setToken(tok);
        setUser(rest);
    }, []);

    const logout = useCallback(() => {
        const storage = getStorage();
        storage?.removeItem('token');
        storage?.removeItem('user');
        clearLegacyLocalAuth();
        setToken(null);
        setUser(null);
    }, []);

    const updateUser = useCallback((updatedData) => {
        const storage = getStorage();
        setUser((prev) => {
            const merged = { ...(prev || {}), ...updatedData };
            storage?.setItem('user', JSON.stringify(merged));
            return merged;
        });
    }, []);

    useEffect(() => {
        clearLegacyLocalAuth();
        return undefined;
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token && !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
