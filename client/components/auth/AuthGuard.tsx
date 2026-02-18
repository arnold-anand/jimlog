'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import axios from '@/lib/axios';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, accessToken, initialized, setAuth, logout, setInitialized } = useAuthStore();
    const [verifying, setVerifying] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            if (initialized) return;

            // If we have a user in local storage, verify they are still valid
            if (user && accessToken) {
                setVerifying(true);
                try {
                    const { data } = await axios.get('/auth/me');
                    setAuth(data, accessToken);
                } catch (error) {
                    console.error('Session verification failed:', error);
                    logout();
                } finally {
                    setVerifying(false);
                }
            } else {
                try {
                    await axios.get('/auth/me');
                    setInitialized(true);
                } catch (e) {
                    setInitialized(true);
                }
            }
        };

        checkAuth();
    }, [initialized, user, accessToken, setAuth, logout, setInitialized]);

    // Redirection logic
    useEffect(() => {
        if (!initialized || verifying) return;

        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

        if (!user && !isPublicRoute) {
            router.replace('/login');
        } else if (user && isPublicRoute) {
            router.replace('/dashboard');
        }
    }, [initialized, user, pathname, router, verifying]);

    if (verifying || !initialized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
                <p className="text-sm font-medium animate-pulse">Verifying session...</p>
            </div>
        );
    }

    // Prevent flicker: if we are supposed to redirect, don't show children
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (!user && !isPublicRoute) return null;
    if (user && isPublicRoute) return null;

    return <>{children}</>;
}
