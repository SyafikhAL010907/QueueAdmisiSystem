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
        wsHost: "queueadmisisystem.onrender.com", // HUBUNGKAN KE SERVER RENDER
        wsPort: 443,
        wssPort: 443,
        forceTLS: true, // WAJIB PAKAI HTTPS/WSS DI RENDER
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    };
};


