import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    _id: string;
    email: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    initialized: boolean;
    setAuth: (user: User, accessToken: string) => void;
    logout: () => void;
    setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            initialized: false,
            setAuth: (user, accessToken) => set({ user, accessToken, initialized: true }),
            logout: () => set({ user: null, accessToken: null, initialized: true }),
            setInitialized: (val) => set({ initialized: val }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, accessToken: state.accessToken }), // Don't persist initialized
        }
    )
);
