import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { jwtVerify } from 'jose';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserData {
    id: string;
    name: string;
    email: string;
    userType: string;
}

export const getUser = (): UserData | null => {
    try {
        const userData = getCookie('user');
        if (!userData) return null;

        return JSON.parse(userData as string);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

export const isAuthenticated = (): boolean => {
    const token = getCookie('token');
    return !!token;
};

export const logout = () => {
    deleteCookie('token');
    deleteCookie('user');

    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
    }
};

export const verifyToken = async (token: string): Promise<boolean> => {
    try {
        const secretKey = new TextEncoder().encode(
            process.env.JWT_SECRET || 'your-secret-key'
        );

        await jwtVerify(token, secretKey);
        return true;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
};

export const getUserRole = (): string | null => {
    const user = getUser();
    return user ? user.userType : null;
};

// Function to refresh the token if needed
export const refreshTokenIfNeeded = async (): Promise<void> => {
    try {
        const token = getCookie('token') as string;
        if (!token) return;

        // Check if the token is about to expire
        const response = await fetch('/api/check-token');
        const data = await response.json();

        if (!data.success) {
            // Token is invalid, redirect to login
            logout();
            return;
        }

        // Token is valid, check expiration time
        const expiresAt = new Date(data.exp).getTime();
        const now = new Date().getTime();
        const timeUntilExpiry = expiresAt - now;

        // If token expires in less than 5 minutes (300000 ms), refresh it
        if (timeUntilExpiry < 300000) {
            console.log('Token about to expire, refreshing...');
            const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                // Update token cookie
                setCookie('token', refreshData.token, {
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    path: '/'
                });
                console.log('Token refreshed successfully');
            }
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
    }
};

// Custom hook for authentication protection
export function useAuth() {
    const router = useRouter();

    useEffect(() => {
        // Check authentication status
        if (typeof window !== 'undefined') {
            const isLoggedIn = isAuthenticated();

            if (!isLoggedIn) {
                // Store current path for redirect after login if needed
                const currentPath = window.location.pathname;
                if (currentPath !== '/auth/login' && currentPath !== '/auth/signup') {
                    const redirectUrl = encodeURIComponent(currentPath);
                    router.push(`/auth/login?redirect=${redirectUrl}`);
                } else {
                    router.push('/auth/login');
                }
            } else {
                // If logged in, refresh token if needed
                refreshTokenIfNeeded();
            }
        }
    }, [router]);

    // Return user data for convenience
    return { user: getUser(), isAuthenticated: isAuthenticated() };
}