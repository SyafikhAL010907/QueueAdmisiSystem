"use client"; // 🚀 Penting agar tidak Hydration Error
import { useState, useEffect, useRef } from "react";
import { getApiUrl } from "@/src/utils/apiConfig";

const API_URL = getApiUrl();

export default function MobileQueue() {
    const [name, setName] = useState("");
    const [queueData, setQueueData] = useState(null); // { id, queue_number, status, loket }
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    // Status ref to track changes and prevent re-triggering haptic/voice
    const lastStatusRef = useRef(null);

    // 🛡️ Guard agar tidak error saat refresh (Hydration Guard)
    useEffect(() => {
        setHasMounted(true);
    }, []);

    /* ══════════ ACTIONS ══════════════════════════════════════════════════ */

    const handleTakeQueue = async () => {
        if (isSubmitting || !name.trim()) {
            if (!name.trim()) alert("Masukkan nama Anda terlebih dahulu, bro!");
            return;
        }

        setIsSubmitting(true);
        setIsLoading(true);
        try {
            // 🔗 Endpoint sama dengan logic lama
            const response = await fetch(`${API_URL}/queues`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({ name: name }),
            });

            if (response.ok) {
                const data = await response.json();
                setQueueData(data);
                console.log("🚀 Tiket Berhasil Diambil:", data);
            } else {
                const err = await response.json();
                alert(`Gagal: ${err.message || "Terjadi kesalahan"}`);
            }
        } catch (error) {
            console.error("Error ambil antrian:", error);
            alert("Gagal ambil antrian. Cek koneksi server lo, bro!");
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    /* ══════════ POLLING ══════════════════════════════════════════════════ */

    useEffect(() => {
        // Poll only if we have a ticket and it's not finished
        if (!queueData?.id || queueData.status === "completed" || queueData.status === "canceled") return;

        const pollStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/queues`, {
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) return;

                const allQueues = await res.json();
                const myQueue = allQueues.find((q) => q.id === queueData.id);

                if (myQueue && myQueue.status !== queueData.status) {
                    setQueueData(myQueue);
                    console.log("🔄 Status Update:", myQueue.status);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        const interval = setInterval(pollStatus, 3000);
        return () => clearInterval(interval);
    }, [queueData?.id, queueData?.status]);

    /* ══════════ TRIGGERS (VOICE & HAPTIC) ════════════════════════════════ */

    useEffect(() => {
        if (!queueData) {
            lastStatusRef.current = null;
            return;
        }

        // 🔥 Trigger saat dipanggil
        if (queueData.status === "called" && lastStatusRef.current !== "called") {
            // Haptic Feedback saja (vibrate) — suara diumumkan dari layar Display/TV
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([500, 200, 500, 200, 500]);
            }
            // ⛔ TIDAK play voice di sini — mobile bukan speaker utama
            // Suara diputar oleh AudioProvider di halaman /display
        }

        // 🕒 Auto-Reset (Tunggu 4 detik setelah selesai/batal)
        if (
            (queueData.status === "completed" || queueData.status === "canceled") &&
            lastStatusRef.current !== queueData.status
        ) {
            setTimeout(() => {
                setQueueData(null);
                setName("");
                setIsLoading(false);
            }, 4000);
        }

        lastStatusRef.current = queueData.status;
    }, [queueData]);

    /* ══════════ UI RENDERING ═════════════════════════════════════════════ */

    if (!hasMounted) return null; // Cegah kedip/error saat loading pertama

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between px-10 py-12 font-sans">

            {/* HEADER SECTION */}
            <header className="text-center pt-10">
                <img src='/img/unj.png' className='w-24 mx-auto mb-4 drop-shadow-xl' alt="Logo UNJ" />
                <h1 className='text-3xl font-black text-sky-900 tracking-tight'>Ambil Antrian</h1>
                <p className='text-slate-500 font-medium'>Lounge Eksekutif - Admisi UNJ</p>
            </header>

            {/* INPUT CARD SECTION */}
            <main className="flex-1 flex items-center justify-center relative z-10 px-4">
                <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(8,112,184,0.12)] p-8 md:p-10 border border-white/50">
                    {!queueData ? (
                        /* STAGE 1: Input Name */
                        <div className="space-y-6">
                            <div className="text-center space-y-2 mb-4">
                                <h2 className="text-xl font-bold text-sky-900 tracking-tight">Selamat Datang</h2>
                                <p className="text-sm text-slate-500 leading-relaxed italic px-2">
                                    "Selamat datang tamu yang terhormat, silakan ambil nomor antrian dengan memasukkan nama Anda."
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-sky-800 ml-1">Nama Pengunjung</label>
                                <input
                                    type="text"
                                    placeholder="Silakan masukkan Nama Anda di sini..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                    className='w-full px-4 md:px-5 py-5 rounded-2xl bg-slate-50 border-2 border-sky-50 focus:border-sky-500 focus:bg-white outline-none transition-all text-lg font-semibold text-slate-800 placeholder:text-[10px] sm:placeholder:text-sm md:placeholder:text-base'
                                />
                            </div>

                            <button
                                onClick={handleTakeQueue}
                                disabled={isSubmitting}
                                className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all bg-sky-600 text-white shadow-sky-600/40 ${isSubmitting ? "opacity-50 cursor-not-allowed pointer-events-none" : "hover:scale-105 active:scale-95 hover:bg-sky-700"}`}
                            >
                                {isSubmitting ? "Memproses..." : "Ambil Antrian"}
                            </button>
                        </div>
                    ) : (
                        /* STAGE 2: Waiting / Called / Done */
                        <div className="space-y-6 text-center">
                            <div className="py-4 border-b border-slate-100">
                                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">
                                    Nomor Antrian Anda
                                </p>
                                <div
                                    className={`text-7xl font-black text-sky-900 tracking-tighter ${queueData.status === "waiting" ? "animate-pulse" : ""
                                        }`}
                                >
                                    {queueData.queue_number}
                                </div>
                            </div>

                            {queueData.status === "waiting" && (
                                <div className="space-y-4">
                                    <div className="inline-block bg-amber-100 text-amber-700 border border-amber-200 font-black px-4 py-1 rounded-full text-[10px]">
                                        STATUS: MENUNGGU
                                    </div>
                                    <p className="text-slate-600 text-base">
                                        Halo <span className="text-sky-700 font-extrabold">{queueData.name}</span>, <br />
                                        Harap tunggu giliran Anda dipanggil.
                                    </p>
                                </div>
                            )}

                            {queueData.status === "called" && (
                                <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="inline-block px-6 py-2 rounded-full bg-sky-600 text-white text-sm font-black shadow-xl shadow-sky-600/30 animate-bounce">
                                        SEKARANG GILIRAN ANDA!
                                    </div>
                                    <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100">
                                        <p className="text-sky-500 text-sm font-bold uppercase mb-1">
                                            Silakan Menuju
                                        </p>
                                        <p className="text-5xl font-black text-sky-900 tracking-tighter">
                                            LOKET {queueData.loket}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {queueData.status === "completed" && (
                                <div className="py-6 space-y-2">
                                    <div className="text-green-500 text-5xl mb-4">✅</div>
                                    <p className="text-slate-800 font-bold text-xl">Selesai!</p>
                                    <p className="text-slate-400 text-sm">Terima kasih telah berkunjung.</p>
                                </div>
                            )}

                            {queueData.status === "canceled" && (
                                <div className="py-6 space-y-2">
                                    <div className="text-red-400 text-5xl mb-4">❌</div>
                                    <p className="text-slate-800 font-bold text-xl">Dibatalkan</p>
                                    <p className="text-slate-400 text-sm">Antrian Anda telah dibatalkan.</p>
                                </div>
                            )}

                            <p className="text-slate-300 text-[10px] pt-2">
                                ID: {queueData.id}
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* FOOTER INFO */}
            <footer className="pb-6 relative z-10">
                <p className='text-xs text-slate-400 text-center leading-relaxed px-10'>
                    Harap menunggu di Lounge. Nama Anda akan dipanggil secara otomatis melalui pengeras suara.
                </p>
            </footer>
        </div>
    );
}
