"use client";

import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

import Header from "../components/Header";
import StatsCards from "../components/StatsCard";
import QueueForm from "../components/QueueForm";
import QueueTable from "../components/QueueTable";
import DashboardLayout from "../components/Sidebar";
import { SUPPORTED_LANGS, getActiveLang } from "../lib/voiceEngine";
import { getApiUrl } from "@/src/utils/apiConfig";

const BASE_URL = getApiUrl();

export default function QueuePage() {
  const [queues, setQueues] = useState([]);
  const [name, setName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [activeLang, setActiveLang] = useState("id");
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("theme") === "dark"
      : false,
  );
  const [showModal, setShowModal] = useState(false);
  const [recallsLoading, setRecallsLoading] = useState({});
  const [callsLoading, setCallsLoading] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isError, setIsError] = useState(false);

  // Derive mode from role
  const isLoketMode = userRole.includes("Admin Loket");
  const mode = isLoketMode ? "loket" : "admin-dev";

  // Init role + lang from localStorage on mount
  useEffect(() => {
    setActiveLang(getActiveLang());
    const stored = localStorage.getItem("user");
    let role = localStorage.getItem("role") || "";
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.role) role = parsed.role;
      } catch { }
    }
    // Normalize legacy role values
    if (role === "dev" || role === "AdminDev") role = "Admin Dev";
    if (role === "admin" || role === "AdminLoket1") role = "Admin Loket 1";
    if (role === "AdminLoket2") role = "Admin Loket 2";
    if (role === "AdminLoket3") role = "Admin Loket 3";
    if (role === "AdminLoket4") role = "Admin Loket 4";
    setUserRole(role);
  }, []);

  /* ══════════ FETCHING ══════════════════════════════════════════════════ */
  const fetchQueues = async () => {
    try {
      const res = await fetch(`${BASE_URL}/queues`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setQueues(Array.isArray(data) ? data : []);
      setIsError(false);
    } catch (err) {
      console.error("fetchQueues error:", err);
      setIsError(true);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchQueues();
    // 🚀 Anti-Loop: slow down if error
    const intervalTime = isError ? 30000 : 5000;
    const interval = setInterval(fetchQueues, intervalTime);
    return () => clearInterval(interval);
  }, [isError]);

  /* ══════════ ACTIONS ══════════════════════════════════════════════════ */
  const handleTambah = async (e) => {
    e.preventDefault();
    console.log("DEBUG: handleTambah triggered!", { name });
    try {
      const res = await fetch(`${BASE_URL}/queues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      console.log("DEBUG: handleTambah response status:", res.status);

      if (res.status === 200 || res.status === 201) {
        Swal.fire("Berhasil!", "Antrian ditambahkan", "success");
        setName("");
        fetchQueues();
      } else if (res.status === 419) {
        Swal.fire({
          icon: "error",
          title: "CSRF Error (419)",
          text: "Sesi Anda telah berakhir atau terjadi masalah keamanan (CSRF Token Invalid). Harap panggil kembali atau refresh halaman.",
          confirmButtonText: "Paham",
          confirmButtonColor: "#d33",
        });
      } else {
        const data = await res.json();
        Swal.fire("Gagal", data.message || "Gagal menambah antrian", "error");
      }
    } catch (err) {
      console.error("handleTambah error:", err);
      Swal.fire({
        icon: "error",
        title: "Koneksi Server Terputus",
        text: "Gagal menghubungi server. Pastikan Backend aktif di localhost:8000.",
        confirmButtonText: "Coba Lagi",
      });
    }
  };

  const handleDone = async (id) => {
    console.log("DEBUG: handleDone triggered for ID:", id);
    try {
      const res = await fetch(`${BASE_URL}/queues/${id}/complete`, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      console.log("DEBUG: handleDone response status:", res.status);
      if (res.ok) {
        Swal.fire("Berhasil!", "Antrian selesai", "success");
        fetchQueues();
      } else {
        const data = await res.json();
        Swal.fire("Gagal", data.message || "Gagal menyelesaikan antrian", "error");
      }
    } catch (err) {
      console.error("DEBUG: handleDone error:", err);
      Swal.fire({
        icon: "error",
        title: "Koneksi Server Terputus",
        text: "Gagal menghubungi server untuk menyelesaikan antrian.",
      });
    }
  };
  const handleRecall = async (id) => {
    setRecallsLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${BASE_URL}/queues/${id}/recall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ lang: localStorage.getItem("queue_lang") || activeLang }),
        credentials: "include", // Pastiin ini tetep ada buat nembus CORS
      });
      // ... sisa kodingan lo ...
      console.log("DEBUG: handleRecall response status:", res.status);
      if (res.ok) {
        // Simple visual feedback
        Swal.fire({
          icon: "success",
          title: "Dipanggil Kembali",
          text: "Sinyal panggil ulang telah dikirim ke Display",
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end"
        });
        setRecallsLoading(prev => ({ ...prev, [id]: false }));
      } else {
        const data = await res.json();
        Swal.fire("Gagal", data.message || "Gagal memanggil ulang antrian", "error");
      }
    } catch (err) {
      console.error("DEBUG: handleRecall error:", err);
      Swal.fire({
        icon: "error",
        title: "Koneksi Terputus",
        text: "Gagal menghubungi server untuk memanggil ulang.",
      });
    } finally {
      setRecallsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCancel = async (id) => {
    console.log("DEBUG: handleCancel triggered for ID:", id);
    try {
      const res = await fetch(`${BASE_URL}/queues/${id}/cancel`, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      console.log("DEBUG: handleCancel response status:", res.status);
      if (res.ok) {
        Swal.fire("Berhasil!", "Antrian dibatalkan", "success");
        fetchQueues();
      } else {
        const data = await res.json();
        Swal.fire("Gagal", data.message || "Gagal membatalkan antrian", "error");
      }
    } catch (err) {
      console.error("DEBUG: handleCancel error:", err);
      Swal.fire({
        icon: "error",
        title: "Koneksi Server Terputus",
        text: "Gagal menghubungi server untuk membatalkan antrian.",
      });
    }
  };

  /**
   * callQueue — sends call request to backend, then:
   * 1. Sets localStorage('call_trigger') to signal Display page instantly
   * 2. Refreshes local queue list
   */
  const callQueue = async (id, name, loket) => {
    console.log("🚀 Memanggil API...", { id, name, loket });
    // ... sisa kodingan fetch lo ...
    console.log("Remote: Perintah suara dikirim ke Display...");

    // Pre-emptive check: already called?
    const isBusy = queues.some(q => q.status === 'called' && Number(q.loket) === loket);
    if (isBusy) {
      Swal.fire({
        icon: 'warning',
        title: 'Loket Sibuk',
        text: 'Wajib selesaikan antrian saat ini (Klik Selesai/Batal) sebelum memanggil antrian berikutnya!',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    // 🚀 Turn on custom spinner for queue buttons
    setCallsLoading(prev => ({ ...prev, [`${id}-${loket}`]: true }));

    setShowModal(true);
    Swal.fire({
      title: "Memanggil...",
      text: `Memanggil ${name} ke Loket ${loket}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
    });

    try {
      const res = await fetch(`${BASE_URL}/queues/${id}/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        // Loket mode: kirim role string, biarkan backend ekstrak nomornya
        // Admin Dev mode: kirim integer loket langsung
        body: JSON.stringify(
          isLoketMode
            ? { role: userRole, lang: localStorage.getItem("queue_lang") || activeLang }
            : { loket: loket, lang: localStorage.getItem("queue_lang") || activeLang }
        ),
        credentials: "include",
      });

      console.log("DEBUG: callQueue response status:", res.status);

      // (Logic ini sekarang dipindahkan ke dalam finally untuk fallback, dan dipanggil langsung jika OK)

      if (!res.ok) {
        setShowModal(false);
        Swal.close();
        if (res.status === 419) {
          Swal.fire("CSRF Error", "Sesi berakhir atau CSRF tidak valid (419)", "error");
        } else {
          const err = await res.json();
          Swal.fire("Gagal", err.message || "Tidak bisa memanggil antrian.", "error");
        }
        return;
      }

      console.log("✅ API Berhasil!");
      setShowModal(false);
      Swal.close();

      // 🔄 Force refresh queue list di background (tanpa await agar UI instan merespon)
      fetchQueues();
    } catch (err) {
      console.error("callQueue error:", err);
      Swal.fire({
        icon: "error",
        title: "Koneksi Server Terputus",
        text: "Gagal memanggil antrian. Periksa koneksi backend.",
      });
    } finally {
      // Ultimate fallback: tutup modal jika masih terbuka
      setShowModal(false);
      Swal.close();
      setCallsLoading(prev => ({ ...prev, [`${id}-${loket}`]: false }));
    }
  };

  /* ══════════ LANGUAGE ═════════════════════════════════════════════════ */
  const changeLang = (code) => {
    setActiveLang(code);
    localStorage.setItem("queue_lang", code);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  /* ══════════ UI ═══════════════════════════════════════════════════════ */
  return (
    <DashboardLayout>
      <div
        className="bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-sky-100 min-h-full transition-all duration-500"
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        {/* ── Language Toggle ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-8 bg-sky-50/50 p-4 rounded-2xl border border-sky-100/50">
          <div className="flex items-center gap-2 text-sky-800 font-bold text-sm uppercase tracking-wider">
            <span className="p-1.5 bg-white rounded-lg shadow-sm">🔊</span>
            Bahasa Suara :
          </div>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 ${activeLang === l.code
                  ? "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200 translate-y-[-1px]"
                  : "bg-white text-slate-500 border-sky-100 hover:border-sky-300 hover:bg-sky-50"
                  }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <StatsCards queues={queues} />

        {/* ── NOW SERVING PANEL ────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 ml-1">
            <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div>
            <h2 className="text-lg font-black text-sky-900 uppercase tracking-tight">Sedang Dilayani</h2>
          </div>
          {(() => {
            const lokets = isLoketMode
              ? [Number(userRole.match(/(\d+)$/)?.[1])]
              : [1, 2, 3, 4];

            return (
              <div className={`grid gap-4 ${isLoketMode ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
                {lokets.map((loketNum) => {
                  const serving = queues
                    .filter((q) => q.status === "called" && Number(q.loket) === loketNum)
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

                  return (
                    <div
                      key={loketNum}
                      className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 ${serving
                        ? "border-sky-200 bg-gradient-to-br from-white to-sky-50/50 shadow-md shadow-sky-100"
                        : "border-slate-100 bg-slate-50/50 opacity-80"
                        }`}
                    >
                      {serving && (
                        <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
                      )}

                      <div className="p-4 relative z-10">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${serving ? 'bg-sky-500 text-white shadow-sm shadow-sky-200' : 'bg-slate-200 text-slate-500'}`}>
                            Loket {loketNum}
                          </span>
                          {serving && <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-ping"></span>}
                        </div>

                        {serving ? (
                          <>
                            <div className="mb-2">
                              <p className="text-3xl font-black text-sky-900 leading-none mb-1">
                                {serving.queue_number}
                              </p>
                              <p className="text-sm font-medium text-slate-500 truncate">{serving.name}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-sky-100/50">
                              <button
                                onClick={() => handleDone(serving.id)}
                                className="w-full py-2 text-xs font-bold rounded-xl bg-emerald-500 text-white hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 transition-all shadow-sm active:scale-95"
                              >
                                ✓ SELESAI
                              </button>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRecall(serving.id)}
                                  disabled={recallsLoading[serving.id]}
                                  className={`flex-1 py-2 text-xs font-bold rounded-xl bg-sky-500 text-white hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-500 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1 ${recallsLoading[serving.id] ? "opacity-50 cursor-wait" : ""}`}
                                >
                                  {recallsLoading[serving.id] ? (
                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  ) : (
                                    "📢 PANGGIL"
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCancel(serving.id)}
                                  className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Standby</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        <QueueForm name={name} setName={setName} addQueue={handleTambah} />

        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4 ml-1">
            <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div>
            <h2 className="text-lg font-black text-sky-900 uppercase tracking-tight">Status Antrian</h2>
          </div>
          <QueueTable
            queues={queues}
            callQueue={callQueue}
            handleDone={handleDone}
            handleCancel={handleCancel}
            mode={mode}
            userRole={userRole}
            callsLoading={callsLoading}
          />
        </div>

        {isLoadingData && queues.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium italic animate-pulse">Menghubungkan ke server...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
