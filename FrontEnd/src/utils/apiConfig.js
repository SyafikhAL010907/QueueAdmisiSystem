/**
 * Universal IP Configuration Utility
 * Senior Architect Strategy: Dynamic Host Detection
 */

export const getBaseUrl = () => {
    // Paksa pakai alamat Render biar pasti bisa konek
    return "https://queueadmisisystem.onrender.com";
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

