'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import axios from '@/lib/axios';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, accessToken, initialized, setAuth, logout, setInitialized } = useAuthStore();
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            if (initialized) return;

            // If we have a user in local storage, verify they are still valid
            if (user && accessToken) {
                setVerifying(true);
                try {
                    const { data } = await axios.get('/auth/me');
                    // data: { _id, email }
                    setAuth(data, accessToken);
                } catch (error) {
                    console.error('Session verification failed:', error);
                    // logout() will set initialized: true
                    logout();
                } finally {
                    setVerifying(false);
                }
            } else {
                // If we don't have a user, try to refresh immediately in case cookie exists
                try {
                    // Axios interceptor handles refresh loop if this 401s, 
                    // but we can try explicitly to see if we get back in.
                    await axios.get('/auth/me');
                    // setAuth is handled by the axios interceptor on successful refresh
                    setInitialized(true);
                } catch (e) {
                    setInitialized(true);
                }
            }
        };

        checkAuth();
    }, [initialized, user, accessToken, setAuth, logout, setInitialized]);

    if (verifying || !initialized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
                <p className="text-sm font-medium animate-pulse">Verifying session...</p>
            </div>
        );
    }

    return <>{children}</>;
}
