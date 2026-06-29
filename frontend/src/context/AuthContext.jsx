import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        // Hydrate from localStorage
        const saved = localStorage.getItem('akash_user');
        if (saved) {
            try { 
                const u = JSON.parse(saved);
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                fetch(`${API_BASE}/users`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${u.token}`
                    },
                    body: JSON.stringify({ id: u.sub, email: u.email, name: u.name, picture: u.picture })
                }).catch(() => {});
                return u; 
            } catch (e) { }
        }
        return null;
    });

    const loginWithGoogle = async (credentialResponse) => {
        const payload = parseJwt(credentialResponse.credential);
        const newUser = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            sub: payload.sub, // unique user id
            token: credentialResponse.credential, // raw Google JWT for backend verification
        };
        setUser(newUser);
        localStorage.setItem('akash_user', JSON.stringify(newUser));

        // Register/update user in the SQLite backend
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        if (API_BASE) {
            fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newUser.token}`
                },
                body: JSON.stringify({
                    id: newUser.sub,
                    email: newUser.email,
                    name: newUser.name,
                    picture: newUser.picture
                })
            }).catch(e => console.error("Failed to sync user with backend:", e));
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('akash_user');
    };

    return (
        <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
    return ctx;
}

// Utility to decode JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}
