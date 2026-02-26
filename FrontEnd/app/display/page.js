"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { playVoice, getActiveLang } from "../lib/voiceEngine";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ───────────────────────────────────────────────────────────────────────────
export default function DisplayPage() {
  // ── HYDRATION GUARD ──────────────────────────────────────────────────────
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  // ── AUDIO UNLOCK OVERLAY STATE ───────────────────────────────────────────
  // Chrome memblokir autoplay audio hingga ada interaksi user pertama kali.
  // Overlay ini memastikan user mengklik minimal 1x sebelum suara bisa keluar.
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const handleUnlockClick = () => {
    // Putar "dummy" utterance kosong untuk membuka kunci audio context browser
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const dummy = new SpeechSynthesisUtterance(" ");
      dummy.volume = 0;
      window.speechSynthesis.speak(dummy);
      window.speechSynthesis.cancel();
    }
    setAudioUnlocked(true);
    console.log("🔓 Audio context UNLOCKED oleh user click.");
  };

  const [currentCall, setCurrentCall] = useState(null);
  const [callVisible, setCallVisible] = useState(false);
  const callFadeTimer = useRef(null);
  const [queues, setQueues] = useState([]);
  const [time, setTime] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [isEchoOnline, setIsEchoOnline] = useState(false);

  // ── AUDIO QUEUE (FIFO) ────────────────────────────────────────────────────
  // callQueue  : array of raw event payloads yang menunggu untuk diumumkan
  // isSpeaking : true saat robot sedang berbicara (mencegah item berikutnya dimulai)
  const [callQueue, setCallQueue] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track active language via ref (tidak perlu re-render)
  const langRef = useRef("id");

  /* ══════════ VOICE TRIGGER ══════════════════════════════════════════════ */
  // onEnd callback diteruskan ke playVoice agar queue processor tahu kapan
  // suara selesai dan boleh memproses item berikutnya.
  const playAnnounce = useCallback((queueNumber, customerName, loket, overrideLang, onEnd) => {
    const lang = overrideLang || langRef.current || getActiveLang();
    langRef.current = lang;
    console.log(`🔊 playAnnounce dipanggil → qNum:"${queueNumber}" cName:"${customerName}" lNum:"${loket}" lang:"${lang}"`);
    playVoice(queueNumber, customerName, loket, lang, onEnd);
  }, []);

  /* ══════════ QUEUE PROCESSOR (FIFO ENGINE) ═══════════════════════════════ */
  useEffect(() => {
    // Hanya proses jika: robot tidak sedang bicara DAN ada item di antrian
    if (isSpeaking || callQueue.length === 0) return;

    // Ambil item pertama dari antrian (FIFO)
    const item = callQueue[0];
    const qNum = item.queue_number ?? item.queueNumber ?? null;
    const cName = item.name ?? item.customer_name ?? "";
    const lNum = item.loket ?? item.loket_number ?? 1;
    const eLang = item.lang ?? "id";

    if (!qNum) {
      // Payload tidak valid, lewati
      console.warn('⚠️ Queue item tidak valid, dilewati:', item);
      setCallQueue(prev => prev.slice(1));
      return;
    }

    console.log(`▶️ Memproses antrian (${callQueue.length} tersisa): qNum=${qNum}`);

    // Tandai robot sedang bicara
    setIsSpeaking(true);

    // Update UI ke item saat ini
    langRef.current = eLang;
    setCurrentCall({ name: cName, queue_number: qNum, loket: lNum });

    // Tampilkan banner & reset timer fade
    setCallVisible(true);
    if (callFadeTimer.current) clearTimeout(callFadeTimer.current);
    callFadeTimer.current = setTimeout(() => {
      setCallVisible(false);
    }, 5000);
    setQueues(prev => {
      let updated = prev.map(q => {
        if (q.status === 'called' && Number(q.loket) === Number(lNum)) {
          return { ...q, status: 'completed' };
        }
        return q;
      });
      const existingIdx = updated.findIndex(q => q.queue_number === qNum);
      if (existingIdx !== -1) {
        updated[existingIdx] = { ...updated[existingIdx], status: 'called', loket: lNum, updated_at: new Date().toISOString() };
      } else {
        updated.push({ id: Date.now(), queue_number: qNum, name: cName, status: 'called', loket: lNum, updated_at: new Date().toISOString() });
      }
      return updated;
    });

    // Panggil suara; onEnd akan memajukan antrian ke item berikutnya
    playAnnounce(qNum, cName, lNum, eLang, () => {
      console.log(`✅ Selesai bicara untuk ${qNum}. Memajukan antrian...`);
      setIsSpeaking(false);
      setCallQueue(prev => prev.slice(1));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callQueue, isSpeaking]);

  /* ══════════ BROADCASTING: Echo Setup ═══════════════════════════════════ */
  // WAJIB: guard hasMounted agar Echo hanya init SEKALI setelah client mount.
  useEffect(() => {
    if (!hasMounted) return;
    if (typeof window === "undefined") return;

    window.Pusher = Pusher;
    console.log('📡 Mencoba inisialisasi Echo...');
    const echo = new Echo({
      broadcaster: 'reverb',
      key: 'azrdrsjgfa1g49yuqvml',
      wsHost: window.location.hostname,
      wsPort: 8080,
      forceTLS: false,
      disableStats: true,
    });

    echo.connector.pusher.connection.bind('state_change', (states) => {
      console.log('🔄 Echo Connection State:', states.current);
    });
    echo.connector.pusher.connection.bind('connected', () => {
      console.log('✅ Status: ONLINE (WebSocket Terhubung)');
      setIsEchoOnline(true);
    });
    echo.connector.pusher.connection.bind('unavailable', () => {
      console.error('❌ Status: DISCONNECTED (Server Reverb Mati)');
      setIsEchoOnline(false);
    });
    echo.connector.pusher.connection.bind('disconnected', () => {
      setIsEchoOnline(false);
    });

    const channel = echo.channel('queue-channel');

    // ═══════════════════════════════════════════════════════════════════════════
    // STRATEGI TRIPLE-LISTEN: 3 cara mendengarkan event.
    // Salah satu PASTI menangkap sinyal dari Reverb.
    //
    // ATURAN NAMA EVENT DI LARAVEL ECHO:
    //   - broadcastAs() return 'queue.called'
    //     → Echo pakai: channel.listen('.queue.called', ...)  ← TITIK = nama custom
    //   - Tanpa broadcastAs() → channel.listen('queue.called', ...) ATAU full class
    //   - Raw Pusher bind: selalu pakai nama persis dari broadcastAs()
    // ═════════════════════════════════════════════════════════════════════════

    // ─── STRATEGI 1: .queue.called (titik di depan — konvensi broadcastAs) ───
    channel.listen('.queue.called', (e) => {
      console.log('✅ SINYAL MASUK: ', e, '[Strategi 1: .queue.called]');
      handleIncomingEvent(e);
    });

    // ─── STRATEGI 2: queue.called (tanpa titik — fallback konvensi lama) ────
    channel.listen('queue.called', (e) => {
      console.log('✅ SINYAL MASUK: ', e, '[Strategi 2: queue.called]');
      handleIncomingEvent(e);
    });

    // ─── STRATEGI 3: Raw Pusher bind — Absolute Fallback ────────────────────
    // Bypass semua logika Echo, langsung ke level WebSocket Reverb.
    // Ini PASTI menangkap event jika koneksi WebSocket terbentuk.
    const pusherChannel = echo.connector.pusher.subscribe('queue-channel');
    pusherChannel.bind('queue.called', (e) => {
      console.log('✅ SINYAL MASUK: ', e, '[Strategi 3: raw Pusher bind]');
      handleIncomingEvent(e);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // HANDLER TERPUSAT: Dipanggil dari kedua strategi di atas.
    // Menggunakan ref untuk mencegah double-execution jika kedua strategi
    // kebetulan sama-sama menangkap event yang sama.
    // ═══════════════════════════════════════════════════════════════════════════
    const lastHandledRef = { ts: 0, qNum: null };

    function handleIncomingEvent(e) {
      // De-duplication: jika event sama diterima dalam 1 detik (dari triple-listen), skip
      const now = Date.now();
      const incomingQ = e.queue_number ?? e.queueNumber ?? null;
      if (incomingQ && incomingQ === lastHandledRef.qNum && (now - lastHandledRef.ts) < 1000) {
        console.log('⏭️ Duplikat event dilewati:', incomingQ);
        return;
      }
      lastHandledRef.ts = now;
      lastHandledRef.qNum = incomingQ;

      console.log('🔥 Raw payload JSON:', JSON.stringify(e));
      console.log('📥 Masuk ke antrian (FIFO):', incomingQ);

      // PERUBAHAN UTAMA: Jangan langsung putar suara.
      // Masukkan payload ke callQueue — Queue Processor yang akan menanganinya.
      setCallQueue(prev => [...prev, e]);
    }

    // Sinkronisasi bahasa antar-tab via localStorage event
    const handleStorageChange = (ev) => {
      if (ev.key === "queue_lang") {
        langRef.current = ev.newValue || "id";
        console.log(`🌐 Bahasa Berubah: ${langRef.current}`);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      echo.disconnect();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [hasMounted, playAnnounce]);

  const [isError, setIsError] = useState(false);

  /* ══════════ POLL: full queue list (5 s) ════════════════════════════════ */
  useEffect(() => {
    async function fetchQueues() {
      try {
        const res = await fetch(`${API_URL}/api/queues`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Server response not OK");

        setErrorStatus(null);
        setIsError(false);
        const data = await res.json();
        setQueues(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("queues fetch error:", err);
        setErrorStatus("Koneksi Server Terputus (Retrying in 30s...)");
        setIsError(true);
      }
    }

    fetchQueues();
    const intervalTime = isError ? 30000 : 5000;
    const interval = setInterval(fetchQueues, intervalTime);
    return () => clearInterval(interval);
  }, [isError]);

  /* ══════════ CLOCK ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    const clock = setInterval(() => {
      setTime(new Date().toLocaleTimeString("id-ID"));
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  /* ══════════ DERIVED ════════════════════════════════════════════════════ */
  const waiting = queues.filter((q) => q.status === "waiting");

  function getActiveForLoket(loket) {
    return queues
      .filter((q) => q.status === "called" && Number(q.loket) === loket)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
  }

  /* ══════════ UI ═════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 text-slate-800 flex flex-col overflow-hidden relative font-sans">

      {/* ── AUDIO UNLOCK OVERLAY ─────────────────────────────────────────── */}
      {/* Muncul SEKALI saat pertama buka. Wajib diklik untuk unlock audio Chrome. */}
      {hasMounted && !audioUnlocked && (
        <div
          onClick={handleUnlockClick}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center cursor-pointer"
          style={{
            background: 'rgba(14, 28, 54, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex flex-col items-center gap-6 select-none">
            {/* Ikon speaker animasi */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-slate-900">
                !
              </div>
            </div>

            {/* Teks utama */}
            <div className="text-center">
              <p className="text-sky-300 text-xs font-black uppercase tracking-[0.3em] mb-3 opacity-70">
                Sistem Antrian · Admisi UNJ
              </p>
              <h2 className="text-white text-2xl md:text-3xl font-black tracking-tight leading-snug">
                KLIK DIMANA SAJA
              </h2>
              <h2 className="text-sky-400 text-2xl md:text-3xl font-black tracking-tight">
                UNTUK AKTIFKAN KIOSK
              </h2>
            </div>

            {/* Sub-teks */}
            <p className="text-slate-400 text-sm font-medium max-w-xs text-center leading-relaxed">
              Diperlukan agar sistem pengumuman suara otomatis dapat berfungsi
            </p>

            {/* Tombol visual */}
            <div className="mt-2 px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-black rounded-2xl text-sm uppercase tracking-widest transition-all duration-200 shadow-lg shadow-sky-500/30">
              TAP TO ACTIVATE
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR BANNER ────────────────────────────────────────────────── */}
      {hasMounted && errorStatus && (
        <div className="absolute top-0 left-0 w-full bg-rose-600/90 backdrop-blur-md text-white text-center py-2.5 text-sm font-bold z-[100] animate-pulse shadow-lg flex items-center justify-center gap-2">
          <span className="text-lg">⚠️</span> {errorStatus}
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 md:px-10 py-5 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-sm z-40">
        <div className="flex items-center gap-5">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-sky-50">
            <img src="/img/unj.png" alt="UNJ" className="h-12 md:h-14 w-auto" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-sky-900 leading-none">
              SISTEM <span className="text-sky-500 font-medium">ANTRIAN</span>
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lounge Eksekutif • Admisi UNJ</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="text-2xl font-black text-sky-900 tracking-tighter">{hasMounted ? time : "--:--:--"}</div>
            <div className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">WIB</div>
          </div>
        </div>
      </header>



      {/* ── MAIN SECTION ──────────────────────────────────────────────── */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 md:p-6 gap-6 md:gap-8 mt-4">

        {/* ===== LEFT : LOKET CARDS + WAITING LIST ===== */}
        <section className="w-full lg:w-1/3 flex flex-col gap-6 md:gap-8 overflow-auto custom-scrollbar">

          {/* Loket Cards 1–4 in 2×2 grid */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((loket) => {
              const active = hasMounted ? getActiveForLoket(loket) : null;
              return (
                <div
                  key={loket}
                  className={`relative overflow-hidden p-6 rounded-3xl text-center transition-all duration-700 active:scale-95 ${active
                    ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-2xl shadow-sky-300 ring-4 ring-sky-100"
                    : "bg-white border border-sky-50 text-slate-400 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:border-sky-200"
                    }`}
                >
                  {active && (
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                  )}

                  <h2 className={`text-[10px] font-black mb-3 uppercase tracking-[0.3em] ${active ? 'text-sky-100' : 'text-slate-300'}`}>
                    LOKET {loket}
                  </h2>

                  {active ? (
                    <div className="flex flex-col items-center">
                      <div className="text-3xl md:text-4xl font-black leading-none drop-shadow-md mb-2">
                        {active.queue_number}
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider opacity-90 truncate max-w-full italic">
                        {active.name}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isEchoOnline ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                        <span className={`w-2 h-2 rounded-full ${isEchoOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`}></span>
                      </div>
                      <span className={`text-[10px] font-bold tracking-widest ${isEchoOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {isEchoOnline ? 'STANDBY' : 'OFFLINE'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Waiting List */}
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl shadow-sm flex-1 overflow-auto border border-sky-50 relative group">
            <div className="sticky top-0 bg-white/0 backdrop-blur-sm pb-4 mb-2 flex items-center justify-between border-b border-sky-50/50">
              <h2 className="text-sm font-black text-sky-900 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full"></span>
                Daftar Antrian
              </h2>
              <span className="bg-sky-50 text-sky-600 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-sky-100">
                {hasMounted ? waiting.length : 0} TUNGGU
              </span>
            </div>

            <div className="space-y-3">
              {hasMounted && waiting.length ? (
                waiting.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-sky-50/50 hover:bg-sky-50 hover:translate-x-1 transition-all duration-300 group/item shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 flex items-center justify-center bg-sky-50 text-sky-600 font-black rounded-xl border border-sky-100 md:group-hover/item:rotate-12 transition-transform">
                        {q.queue_number.replace(/\D/g, '')}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-sky-900">{q.queue_number}</span>
                        <span className="text-[10px] font-bold text-slate-400 truncate w-32 md:w-48 capitalize">{(q.name || "").toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-200 group-hover/item:bg-sky-500 transition-colors"></div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-30 scale-75">
                  <div className="w-16 h-16 border-2 border-dashed border-sky-200 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">☕</span>
                  </div>
                  <p className="text-sm font-bold tracking-widest uppercase">Semua Selesai</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== RIGHT : VIDEO / PROFILE ===== */}
        <section className="w-full lg:w-2/3 flex flex-col gap-4">

          {/* ── CALLING BANNER (lebar sama dengan section video) ── */}
          {hasMounted && currentCall && (
            <div
              className="bg-gradient-to-r from-sky-200 via-blue-100 to-sky-200 text-sky-900 px-6 py-4 rounded-2xl shadow-xl shadow-sky-200/50 border border-sky-300 flex items-center justify-center gap-4 w-full"
              style={{
                animation: callVisible
                  ? 'callFadeIn 0.4s ease forwards'
                  : 'callFadeOut 0.8s ease forwards',
              }}
            >
              <div className="bg-sky-500 p-2.5 rounded-xl text-white shadow-lg animate-pulse flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Sedang Dipanggil</span>
                <span className="text-xl md:text-2xl font-black flex items-center gap-3">
                  {currentCall.name}
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
                  <span className="text-sky-600">LOKET {currentCall.loket}</span>
                </span>
              </div>
            </div>
          )}

          {/* ── VIDEO AREA ── */}
          <div className="flex-1 rounded-3xl overflow-hidden border border-sky-50 shadow-inner relative bg-black">
            <video
              src="/vidio/profile.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      </main>

      {/* ── RUNNING TEXT FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-gradient-to-r from-sky-100 to-blue-50 py-4 overflow-hidden border-t border-sky-200 z-40">
        <div className="marquee flex items-center">
          {[1, 2, 3].map(i => (
            <span key={i} className="text-sky-900 text-sm md:text-base font-black uppercase tracking-[0.1em] whitespace-nowrap">
              Selamat datang di Universitas Negeri Jakarta <span className="mx-6 text-sky-400">•</span>
              Sistem Admisi Digital Lounge Eksekutif <span className="mx-6 text-sky-400">•</span>
              Harap menunggu hingga nama Anda dipanggil <span className="mx-6 text-sky-400">•</span>
              Harap siapkan dokumen pendukung Anda <span className="mx-6 text-sky-400">•</span>
              Terima kasih atas kesabaran Anda <span className="mx-6 text-sky-400">•••</span>
            </span>
          ))}
        </div>
      </footer>

      {/* Global CSS for animations */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
        @keyframes callFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes callFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-8px); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e0f2fe;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #bae6fd;
        }
      `}</style>
    </div>
  );
}
