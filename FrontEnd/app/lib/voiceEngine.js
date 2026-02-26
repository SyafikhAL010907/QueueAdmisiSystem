export const getActiveLang = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("queue_lang") || "id";
    }
    return "id";
};

export const SUPPORTED_LANGS = [
    { code: "id", label: "🇮🇩 ID" },
    { code: "en", label: "🇬🇧 EN" },
    { code: "zh", label: "🇨🇳 ZH" },
];

/**
 * Mainkan pengumuman suara antrian.
 * @param {string} queueNumber  - Nomor antrian (e.g. "A010")
 * @param {string} customerName - Nama pasien/pelanggan
 * @param {string|number} loket - Nomor loket tujuan
 * @param {string} lang         - Kode bahasa: 'id' | 'en' | 'zh'
 * @param {Function} [onEnd]    - Callback dipanggil saat suara SELESAI diucapkan
 */
export const playVoice = (queueNumber, customerName, loket, lang = 'id', onEnd = null) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        if (onEnd) onEnd();
        return;
    }

    // CATATAN: window.speechSynthesis.cancel() DIHAPUS dari sini.
    // Pembatalan sekarang menjadi tanggung jawab pemanggil (queue processor).
    // Ini memungkinkan antrian FIFO berjalan tanpa saling memotong.

    let langCode = 'id-ID';
    let textToSpeak = '';

    // Trik Pemisah Angka: "A010" menjadi "A 0 1 0" agar dibaca per huruf/angka
    const spelledNumber = queueNumber ? queueNumber.toString().split('').join(' ') : '';
    const safeName = customerName || '';

    if (lang === 'zh') {
        langCode = 'zh-CN';
        textToSpeak = `排队号码 (Páiduì hàomǎ) ${spelledNumber}, ${safeName}, 请前往 (qǐng qiánwǎng) 窗口 (chuāngkǒu) ${loket}`;
    } else if (lang === 'en') {
        langCode = 'en-US';
        textToSpeak = `Queue Number ${spelledNumber}, ${safeName}, please proceed to counter ${loket}`;
    } else {
        langCode = 'id-ID';
        textToSpeak = `Nomor Antrian ${spelledNumber}, ${safeName}, silakan menuju ke loket ${loket}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 1.3;
    utterance.pitch = 1.0;

    // Pasang callback onEnd ke event utterance.onend
    utterance.onend = () => {
        console.log(`✅ Suara selesai untuk: ${queueNumber}`);
        if (onEnd) onEnd();
    };

    // Fallback jika onend tidak terpicu (bug browser tertentu)
    utterance.onerror = (err) => {
        console.error(`🚨 SpeechSynthesis error:`, err);
        if (onEnd) onEnd();
    };

    // (Opsional) Memaksa browser mencari voice profile yang pas
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.includes(langCode.replace('_', '-')));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
};
