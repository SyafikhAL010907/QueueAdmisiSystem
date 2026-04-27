/**
 * Universal IP Configuration Utility
 * Senior Architect Strategy: Dynamic Host Detection
 */

export const getBaseUrl = () => {
    // Priority 1: Environment variable (set in Vercel/Render)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== 'undefined') {
        // Automatically detect the current host (Fallback for local dev)
        const host = window.location.hostname;
        return `http://${host}:8000`;
    }
    // Fallback for SSR
    return 'http://localhost:8000';
};

export const getApiUrl = () => `${getBaseUrl()}/api`;

export const getReverbConfig = () => {
    return {
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'),
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 443,
        forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    };
};

