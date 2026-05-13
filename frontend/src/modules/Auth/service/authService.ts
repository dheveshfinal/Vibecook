const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const authService = {
    async login(email: string, password: string) {
        const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Login failed");
        }

        const data = await res.json();
        localStorage.setItem("chefai_token", data.access_token);
        return data;
    },

    async signup(fullName: string, email: string, password: string) {
        const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName, email, password }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Signup failed");
        }
        return res.json();
    },

    async loginWithGoogle() {
        // UI placeholder as requested: "dont need google but we can have only ui"
        alert("Google Login is currently in UI-only mode.");
        return null;
    },

    async handleGoogleCallback() {
        return null; // Not using Google for now
    },

    async forgotPassword(email: string) {
        const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        return res.json();
    },

    async logout() {
        localStorage.removeItem("chefai_token");
    },

    async syncProfile() {
        const token = localStorage.getItem("chefai_token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/v1/auth/sync-profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) console.error("Profile sync failed");
        return res.json();
    },

    getUserRole() {
        const token = localStorage.getItem("chefai_token");
        if (!token) return "user";
        try {
            // JWT format: header.payload.signature
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            return decodedPayload.role || "user";
        } catch (e) {
            console.error("Error decoding token role:", e);
            return "user";
        }
    },

    isAuthenticated() {
        return !!localStorage.getItem("chefai_token");
    },

    getToken() {
        return localStorage.getItem("chefai_token");
    }
};
