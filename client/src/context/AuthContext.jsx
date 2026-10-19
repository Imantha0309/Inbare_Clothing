import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Parse } from '../services/parse.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchCartRef = useRef(null);

    function setFetchCart(fn) {
        fetchCartRef.current = fn;
    }

    // Transform Parse User object to a plain JSON-serializable shape
    const serializeUser = (parseUser) => {
        if (!parseUser) return null;
        return {
            id: parseUser.id,
            username: parseUser.get('username'),
            email: parseUser.get('email'),
            firstName: parseUser.get('firstName'),
            lastName: parseUser.get('lastName'),
            role: parseUser.get('role'),
            phone: parseUser.get('phone'),
            street: parseUser.get('street'),
            city: parseUser.get('city'),
            state: parseUser.get('state'),
            zipCode: parseUser.get('zipCode'),
            country: parseUser.get('country'),
            avatar: parseUser.get('avatar'),
            isEmailVerified: parseUser.get('emailVerified'),
            isActive: parseUser.get('isActive'),
            createdAt: parseUser.createdAt,
            updatedAt: parseUser.updatedAt,
        };
    };

    useEffect(() => {
        const currentUser = Parse.User.current();
        if (currentUser) {
            setUser(serializeUser(currentUser));
        }
        setLoading(false);
    }, []);

    async function login(email, password) {
        try {
            // Parse uses username for login; we allow email as username
            const parseUser = await Parse.User.logIn(email, password);
            const userData = serializeUser(parseUser);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            fetchCartRef.current?.();
            return { data: { user: userData } };
        } catch (err) {
            throw { response: { data: { message: err.message } } };
        }
    }

    async function register(firstName, lastName, email, password) {
        try {
            const user = new Parse.User();
            user.set("username", email);
            user.set("email", email);
            user.set("password", password);
            user.set("firstName", firstName);
            user.set("lastName", lastName);
            user.set("role", "customer");
            user.set("isEmailVerified", false);
            user.set("isActive", true);

            const parseUser = await user.signUp();
            const userData = serializeUser(parseUser);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            fetchCartRef.current?.();
            return { data: { user: userData } };
        } catch (err) {
            throw { response: { data: { message: err.message } } };
        }
    }

    async function logout() {
        try {
            await Parse.User.logOut();
        } catch (err) {
            // ignore logout errors
        }
        localStorage.removeItem('user');
        setUser(null);
    }

    async function updateProfile(data) {
        try {
            const currentUser = Parse.User.current();
            if (!currentUser) throw new Error('Not logged in');

            const { firstName, lastName, phone, street, city, state, zipCode, country } = data;
            if (firstName) currentUser.set('firstName', firstName);
            if (lastName) currentUser.set('lastName', lastName);
            if (phone) currentUser.set('phone', phone);
            if (street) currentUser.set('street', street);
            if (city) currentUser.set('city', city);
            if (state) currentUser.set('state', state);
            if (zipCode) currentUser.set('zipCode', zipCode);
            if (country) currentUser.set('country', country);

            const updatedUser = await currentUser.save();
            const userData = serializeUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { data: { user: userData } };
        } catch (err) {
            throw { response: { data: { message: err.message } } };
        }
    }

    async function forgotPassword(email) {
        try {
            await Parse.User.requestPasswordReset(email);
            return { data: { message: 'Password reset email sent' } };
        } catch (err) {
            throw { response: { data: { message: err.message } } };
        }
    }

    // Parse handles password reset via email link, not a token URL
    // This is kept for API compatibility but Parse uses email-based reset
    async function resetPassword(token, password) {
        try {
            // Parse doesn't support token-based reset from client.
            // Use Parse.User.requestPasswordReset(email) instead.
            throw new Error('Use forgotPassword to request a reset link via email.');
        } catch (err) {
            throw { response: { data: { message: err.message } } };
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, setFetchCart, forgotPassword, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
