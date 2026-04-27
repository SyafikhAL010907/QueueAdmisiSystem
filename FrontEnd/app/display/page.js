"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioContext } from "../components/AudioProvider";
import { getApiUrl } from "@/src/utils/apiConfig";

const API_URL = getApiUrl();

// ───────────────────────────────────────────────────────────────────────────
export default function DisplayPage() {
  // ── HYDRATION GUARD ──────────────────────────────────────────────────────
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  // Global Audio Engine context
  const { currentCall, callVisible } = useAudioContext();

  // Sync global `currentCall` into local `queues` array to update the screen
  useEffect(() => {
    if (!currentCall) return;
    setQueues(prev => {
      let updated = prev.map(q => {
        if (q.status === 'called' && Number(q.loket) === Number(currentCall.loket)) {
          return { ...q, status: 'completed' };
        }
        return q;
      });
      const existingIdx = updated.findIndex(q => q.queue_number === currentCall.queue_number);
      if (existingIdx !== -1) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          status: 'called',
          loket: currentCall.loket,
          updated_at: new Date().toISOString()
        };
      } else {
        updated.push({
          id: Date.now(),
          queue_number: currentCall.queue_number,
          name: currentCall.name,
          status: 'called',
          loket: currentCall.loket,
          updated_at: new Date().toISOString()
        });
      }
      return updated;
    });
  }, [currentCall]);

  const [queues, setQueues] = useState([]);
  const [time, setTime] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [loketCount, setLoketCount] = useState(4);

  const [isError, setIsError] = useState(false);

  // Fetch jumlah loket aktif (dinamis)
  useEffect(() => {
    fetch(`${API_URL}/loket-count`, {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => { if (data?.count) setLoketCount(data.count); })
      .catch(() => setLoketCount(4));
  }, []);

  /* ══════════ POLL: full queue list (5 s) ════════════════════════════════ */
  useEffect(() => {
    async function fetchQueues() {
      try {
        const res = await fetch(`${API_URL}/queues`, {
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
      {/* Overlay telah dipindahkan ke AudioProvider global di layout */}

      {/* ── ERROR BANNER ────────────────────────────────────────────────── */}
      {hasMounted && errorStatus && (
        <div className="absolute top-0 left-0 w-full bg-rose-600/90 backdrop-blur-md text-white text-center py-2.5 text-sm font-bold z-[100] animate-pulse shadow-lg flex items-center justify-center gap-2">
          <span className="text-lg">⚠️</span> {errorStatus}
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="h-24 lg:h-32 flex items-center justify-between lg:justify-center lg:gap-10 px-6 lg:px-12 shrink-0 relative z-10 transition-all duration-500">
        <div className="flex items-center gap-4 lg:gap-6 group">
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
      <main className="flex-1 overflow-hidden p-4 lg:p-8">
        {/* Main Grid: Vertical stack on mobile, 12-col grid on desktop (lg) */}
        <div className="h-full w-full flex flex-col lg:grid lg:grid-cols-12 gap-8 overflow-y-auto lg:overflow-hidden custom-scrollbar">

          {/* ===== LEFT : SIDEBAR (STATUS LOKET & DAFTAR TUNGGU) (4 cols on desktop) ===== */}
          <section className="w-full lg:col-span-4 flex flex-col h-full gap-4 mb-2 lg:mb-0 lg:overflow-hidden">

            {/* ── STATUS LOKET ── */}
            <div className="flex flex-col shrink-0">
              <h2 className="text-xs font-black text-sky-900 uppercase tracking-[0.2em] flex items-center gap-2 px-1 mb-2">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></span>
                Status Loket
              </h2>
              <div className={`grid gap-3 ${loketCount > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {Array.from({ length: loketCount }, (_, i) => i + 1).map((loket) => {
                  const active = hasMounted ? getActiveForLoket(loket) : null;
                  return (
                    <div
                      key={loket}
                      className={`relative overflow-hidden py-2 px-3 lg:py-3 lg:px-4 rounded-3xl text-center transition-all duration-700 ${active
                        ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl shadow-sky-200 ring-2 ring-sky-100"
                        : "bg-white border border-sky-100 text-slate-300 opacity-80"
                        }`}
                    >
                      <h3 className={`text-[9px] font-black mb-1 uppercase tracking-widest ${active ? 'text-sky-100' : 'text-slate-300'}`}>
                        LOKET {loket}
                      </h3>

                      {active ? (
                        <div className="flex flex-col items-center">
                          <div className="text-xl lg:text-2xl font-black leading-none mb-1">
                            {active.queue_number}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-tight opacity-90 truncate max-w-full italic px-1">
                            {active.name}
                          </div>
                        </div>
                      ) : (
                        <div className="py-1 flex flex-col items-center opacity-40">
                          <span className="text-[9px] font-bold tracking-[0.2em]">STANDBY</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── DAFTAR TUNGGU ── */}
            <div className="flex flex-col flex-1 overflow-hidden mt-1">
              <h2 className="text-xs font-black text-sky-900 uppercase tracking-[0.2em] flex items-center gap-2 px-1 shrink-0 mb-3">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                Daftar Tunggu
                <span className="ml-auto bg-sky-50 text-sky-600 text-[10px] px-2 py-0.5 rounded-lg border border-sky-100 font-extrabold">
                  {hasMounted ? waiting.length : 0}
                </span>
              </h2>

              <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-3xl p-3 border border-sky-100 overflow-hidden flex flex-col">
                <div className="overflow-y-auto h-full pr-2 custom-scrollbar space-y-2">
                  {hasMounted && waiting.length ? (
                    waiting.map((q) => (
                      <div key={q.id} className="flex items-center gap-3 p-2 rounded-2xl bg-white/80 border border-sky-50 shadow-sm hover:translate-x-1 transition-all duration-300">
                        <span className="w-8 h-8 shrink-0 flex items-center justify-center bg-sky-50 text-sky-600 font-black rounded-xl border border-sky-100 text-xs">
                          {q.queue_number.replace(/\D/g, '')}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-sky-900 truncate">{q.queue_number}</span>
                          <span className="text-[10px] font-bold text-slate-400 truncate capitalize">{(q.name || "").toLowerCase()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                      <span className="text-3xl mb-3">✨</span>
                      <p className="text-[10px] font-black tracking-widest uppercase">Kosong</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===== RIGHT : VIDEO & CALLING BANNER (8 cols on desktop) ===== */}
          <section className="w-full lg:col-span-8 flex flex-col gap-6 mb-8 lg:mb-0 lg:h-full">
            {/* ── CALLING BANNER ── */}
            <div
              className="grid transition-all duration-1500 ease-in-out"
              style={{ gridTemplateRows: hasMounted && currentCall ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="h-auto md:h-24 lg:h-auto shrink-0 transition-all duration-500">
                  <div
                    className="h-auto min-h-[120px] py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-3xl shadow-2xl shadow-sky-200 border border-sky-400 flex items-center justify-center px-8 gap-6 overflow-hidden relative"
                    style={{
                      animation: callVisible
                        ? 'callFadeIn 0.4s ease forwards'
                        : 'callFadeOut 0.8s ease forwards',
                    }}
                  >
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl animate-pulse shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-100 opacity-80 mb-1 leading-none">Sedang Dipanggil</span>
                      <h2 className="text-2xl lg:text-3xl font-black leading-tight whitespace-normal break-words">
                        {currentCall?.name || '...'}
                        <span className="text-sky-200 font-light mx-2">—</span>
                        <span className="bg-white text-sky-600 px-3 py-1 rounded-xl text-lg lg:text-xl inline-block mt-2 md:mt-0">LOKET {currentCall?.loket || '-'}</span>
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── VIDEO AREA ── */}
            <div className="flex-1 w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative bg-black min-h-[300px] transition-all duration-1500 ease-in-out transform-gpu">
              <video
                src="/vidio/profile.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Profile Label Overlay */}
              <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Admisi UNJ Profile</p>
              </div>
            </div>
          </section>

        </div>
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
