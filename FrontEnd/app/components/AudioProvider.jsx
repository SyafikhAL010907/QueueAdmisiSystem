"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { playVoice, getActiveLang } from "../lib/voiceEngine";
import { getBaseUrl, getReverbConfig } from "@/src/utils/apiConfig";

const AudioContext = createContext();

export function useAudioContext() {
    return useContext(AudioContext);
}

export function AudioProvider({ children }) {
    const pathname = usePathname();
    const isDisplayPage = pathname === '/display';

    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    // ── AUDIO UNLOCK OVERLAY STATE ───────────────────────────────────────────
    const [audioUnlocked, setAudioUnlocked] = useState(false);

    useEffect(() => {
        const status = localStorage.getItem('unj_audio_unlocked');
        if (status === 'true') {
            setAudioUnlocked(true);
        }
    }, []);

    const [currentCall, setCurrentCall] = useState(null);
    const [callVisible, setCallVisible] = useState(false);
    const callFadeTimer = useRef(null);
    const [isEchoOnline, setIsEchoOnline] = useState(false);

    const [callQueue, setCallQueue] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const langRef = useRef("id");
    // De-dupe guard: ref level komponen agar persist antar React Strict Mode re-run
    const lastHandledRef = useRef({ ts: 0, qNum: null });
    // Guard: hanya boleh ada 1 Echo instance
    const echoRef = useRef(null);

    const handleUnlockClick = useCallback(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            const dummy = new SpeechSynthesisUtterance(" ");
            dummy.volume = 0;
            window.speechSynthesis.speak(dummy);
            window.speechSynthesis.cancel();
        }
        setAudioUnlocked(true);
        localStorage.setItem('unj_audio_unlocked', 'true');
        console.log("🔓 Audio context UNLOCKED oleh user click.");
    }, []);

    const playAnnounce = useCallback((queueNumber, customerName, loket, overrideLang, onEnd) => {
        const isDisplayPage = window.location.pathname.includes('/display');

        // CONDITIONAL EXECUTION: Hanya play jika di halaman display
        if (isDisplayPage) {
            const lang = overrideLang || langRef.current || getActiveLang();
            langRef.current = lang;
            console.log(`🔊 playAnnounce dipanggil → qNum:"${queueNumber}" cName:"${customerName}" lNum:"${loket}" lang:"${lang}"`);
            playVoice(queueNumber, customerName, loket, lang, onEnd);
        } else {
            console.log(`🔇 Abaikan playVoice (bukan halaman display) → qNum:"${queueNumber}"`);
            // Segera panggil onEnd agar antrean di memory tidak tersendat 
            // walau suara tidak dimainkan secara fisik di tab ini
            if (onEnd) onEnd();
        }
    }, []);

    useEffect(() => {
        if (isSpeaking || callQueue.length === 0) return;

        // Hold processing queue if audio not unlocked yet
        if (!audioUnlocked) return;

        const item = callQueue[0];
        const qNum = item.queue_number ?? item.queueNumber ?? null;
        const cName = item.name ?? item.customer_name ?? "";
        const lNum = parseInt(item.loket ?? item.loket_number ?? 1, 10) || 1; // paksa integer bersih
        const eLang = item.lang ?? "id";

        if (!qNum) {
            setCallQueue(prev => prev.slice(1));
            return;
        }

        setIsSpeaking(true);
        langRef.current = eLang;
        setCurrentCall({ name: cName, queue_number: qNum, loket: lNum, _t: Date.now() });

        setCallVisible(true);
        if (callFadeTimer.current) clearTimeout(callFadeTimer.current);

        playAnnounce(qNum, cName, lNum, eLang, () => {
            setCallVisible(false); // Trigger fade out animation

            // Wait 800ms (duration of callFadeOut) before unmounting and proceeding
            callFadeTimer.current = setTimeout(() => {
                setCurrentCall(null); // Hard-reset state to completely unmount banner
                setIsSpeaking(false);
                setCallQueue(prev => prev.slice(1));
            }, 800);
        });
    }, [callQueue, isSpeaking, audioUnlocked, playAnnounce]);

    useEffect(() => {
        if (!hasMounted) return;
        if (typeof window === "undefined") return;
        // Guard: jika sudah ada koneksi aktif, jangan buat lagi
        if (echoRef.current) return;

        window.Pusher = Pusher;
        const echo = new Echo({
            broadcaster: 'reverb',
            key: 'azrdrsjgfa1g49yuqvml',
            ...getReverbConfig(),
            authEndpoint: `${getBaseUrl()}/api/broadcasting/auth`,
            auth: { headers: { Accept: 'application/json' } }
        });
        echoRef.current = echo;

        echo.connector.pusher.connection.bind('connected', () => setIsEchoOnline(true));
        echo.connector.pusher.connection.bind('unavailable', () => setIsEchoOnline(false));
        echo.connector.pusher.connection.bind('disconnected', () => setIsEchoOnline(false));

        // Definisikan handler SEBELUM listen
        function handleIncomingEvent(e) {
            const now = Date.now();
            const incomingQ = e.queue_number ?? e.queueNumber ?? null;
            // De-dupe: abaikan event sama dalam 3 detik (gunakan ref level komponen)
            if (
                incomingQ &&
                incomingQ === lastHandledRef.current.qNum &&
                (now - lastHandledRef.current.ts) < 3000
            ) {
                console.warn('⛔ Duplikat event diabaikan:', incomingQ, `(${now - lastHandledRef.current.ts}ms)`);
                return;
            }
            lastHandledRef.current.ts = now;
            lastHandledRef.current.qNum = incomingQ;
            console.log('📡 Event diterima:', incomingQ);
            setCallQueue(prev => [...prev, e]);
        }

        // SATU listener
        const channel = echo.channel('queue-channel');
        channel.listen('.queue.called', handleIncomingEvent);

        const handleStorageChange = (ev) => {
            if (ev.key === "queue_lang") langRef.current = ev.newValue || "id";
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            echoRef.current = null;
            echo.leave('queue-channel');
            echo.disconnect();
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [hasMounted]);

    return (
        <AudioContext.Provider value={{ audioUnlocked, handleUnlockClick, currentCall, callVisible, isEchoOnline, isSpeaking }}>
            {hasMounted && isDisplayPage && !audioUnlocked && (
                <div
                    onClick={handleUnlockClick}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer"
                    style={{ background: 'rgba(14, 28, 54, 0.85)', backdropFilter: 'blur(8px)' }}
                >
                    <div className="flex flex-col items-center gap-6 select-none">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-slate-900">!</div>
                        </div>
                        <div className="text-center">
                            <p className="text-sky-300 text-xs font-black uppercase tracking-[0.3em] mb-3 opacity-70">Sistem Antrian · Admisi UNJ</p>
                            <h2 className="text-white text-2xl md:text-3xl font-black tracking-tight leading-snug">KLIK DIMANA SAJA</h2>
                            <h2 className="text-sky-400 text-2xl md:text-3xl font-black tracking-tight">UNTUK AKTIFKAN KIOSK</h2>
                        </div>
                        <p className="text-slate-400 text-sm font-medium max-w-xs text-center leading-relaxed">Diperlukan agar sistem pengumuman suara otomatis dapat berfungsi</p>
                        <div className="mt-2 px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-2xl text-sm uppercase tracking-widest transition-all duration-200 shadow-lg shadow-sky-500/30">TAP TO ACTIVATE</div>
                    </div>
                </div>
            )}
            {children}
        </AudioContext.Provider>
    );
}
