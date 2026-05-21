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

/**
 * Cek apakah sekarang dalam jam kerja (Senin-Sabtu, 09:00-17:00 WIB)
 * Digunakan oleh frontend untuk menghentikan polling di luar jam kerja
 */
export const isWorkingHours = () => {
    const now = new Date();
    // Convert ke WIB (UTC+7)
    const wibStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const wib = new Date(wibStr);
    const day = wib.getDay(); // 0=Minggu, 6=Sabtu
    const hour = wib.getHours();

    const isWorkingDay = day >= 1 && day <= 6; // Senin-Sabtu
    const isWorkingHour = hour >= 9 && hour < 17; // 09:00-16:59

    return isWorkingDay && isWorkingHour;
};

/**
 * Fetch status operasional dari backend (selalu tersedia, tidak dibatasi jam kerja)
 * Returns: { is_open, working_hours, current_time, current_day }
 */
export const fetchOperatingStatus = async () => {
    try {
        const res = await fetch(`${getApiUrl()}/operating-status`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('Failed');
        return await res.json();
    } catch {
        // Fallback ke client-side check kalau backend unreachable
        return {
            is_open: isWorkingHours(),
            working_hours: 'Senin - Sabtu, 09:00 - 17:00 WIB',
            current_time: new Date().toISOString(),
            fallback: true,
        };
    }
};
