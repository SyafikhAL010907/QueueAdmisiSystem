/**
 * Universal IP Configuration Utility
 * Senior Architect Strategy: Dynamic Host Detection
 */

export const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        // Automatically detect the current host (works on Localhost, .91, or .238)
        const host = window.location.hostname;
        return `http://${host}:8000`;
    }
    // Fallback for SSR
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

export const getApiUrl = () => `${getBaseUrl()}/api`;

export const getReverbConfig = () => {
    if (typeof window !== 'undefined') {
        return {
            wsHost: window.location.hostname,
            wsPort: 8080,
            forceTLS: false,
            disableStats: true,
        };
    }
    return {
        wsHost: '127.0.0.1',
        wsPort: 8080,
        forceTLS: false,
    };
};
