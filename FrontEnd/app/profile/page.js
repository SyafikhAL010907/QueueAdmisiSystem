"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { getApiUrl } from "@/src/utils/apiConfig";
import { UserCircle2, Mail, Lock, CheckCircle, AlertCircle } from "lucide-react";

const API_URL = getApiUrl();

// ─── Toast component ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all animate-in slide-in-from-top-2 duration-300 ${type === "success" ? "bg-green-500" : "bg-red-500"
            }`}>
            {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message}
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ title, children }) {
    return (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-5 pb-3 border-b">{title}</h2>
            {children}
        </div>
    );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, error }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition
          ${error ? "border-red-400 focus:ring-red-300" : "focus:ring-blue-400"}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [toast, setToast] = useState(null);

    // Email form
    const [email, setEmail] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailError, setEmailError] = useState("");

    // Password form
    const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
    const [pwErrors, setPwErrors] = useState({});
    const [pwLoading, setPwLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setCurrentUser(parsed);
                setEmail(parsed.email || "");
            } catch { }
        }
    }, []);

    const showToast = (message, type = "success") => setToast({ message, type });

    // ── Update Email ────────────────────────────────────────────────────────────
    const handleEmailUpdate = async (e) => {
        e.preventDefault();
        setEmailError("");
        // Basic format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Format email tidak valid.");
            return;
        }
        setEmailLoading(true);
        try {
            const res = await fetch(`${API_URL}/user/profile`, {
                method: "PUT",
                credentials: "include",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal update email.");
            // Sync localStorage
            const updated = { ...currentUser, email: data.user.email };
            setCurrentUser(updated);
            localStorage.setItem("user", JSON.stringify(updated));
            showToast("Email berhasil diperbarui!");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setEmailLoading(false);
        }
    };

    // ── Update Password ─────────────────────────────────────────────────────────
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!pwForm.current) errs.current = "Password saat ini wajib diisi.";
        if (!pwForm.new || pwForm.new.length < 8) errs.new = "Password baru minimal 8 karakter.";
        if (pwForm.new !== pwForm.confirm) errs.confirm = "Konfirmasi password tidak cocok.";
        if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }
        setPwErrors({});
        setPwLoading(true);
        try {
            const res = await fetch(`${API_URL}/user/profile`, {
                method: "PUT",
                credentials: "include",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.new }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.errors?.current_password) {
                    setPwErrors({ current: data.errors.current_password[0] });
                } else throw new Error(data.message || "Gagal update password.");
                return;
            }
            setPwForm({ current: "", new: "", confirm: "" });
            showToast("Password berhasil diubah!");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setPwLoading(false);
        }
    };

    const roleBadgeClass = currentUser?.role === "Admin Dev"
        ? "bg-purple-100 text-purple-700"
        : "bg-blue-100 text-blue-700";

    return (
        <Sidebar>
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <div className="max-w-xl mx-auto">
                {/* ── Avatar Header ───────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow p-8 mb-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <UserCircle2 size={80} className="text-blue-300" />
                        <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-1">{currentUser?.name || "—"}</h1>
                    <p className="text-sm text-gray-400 mb-3">{currentUser?.email || "—"}</p>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${roleBadgeClass}`}>
                        {currentUser?.role || "—"}
                    </span>
                </div>

                {/* ── Informasi Akun ──────────────────────────────────────────────── */}
                <Card title="✉️ Informasi Akun — Ubah Email">
                    <form onSubmit={handleEmailUpdate}>
                        <Field
                            label="Email Baru"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@domain.com"
                            error={emailError}
                        />
                        <button
                            type="submit"
                            disabled={emailLoading}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition"
                        >
                            {emailLoading ? "Menyimpan..." : "Simpan Email"}
                        </button>
                    </form>
                </Card>

                {/* ── Keamanan — Ganti Password ───────────────────────────────────── */}
                <Card title="🔒 Keamanan — Ganti Password">
                    <form onSubmit={handlePasswordUpdate}>
                        <Field
                            label="Password Saat Ini"
                            type="password"
                            value={pwForm.current}
                            onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                            placeholder="Password lama"
                            error={pwErrors.current}
                        />
                        <Field
                            label="Password Baru"
                            type="password"
                            value={pwForm.new}
                            onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })}
                            placeholder="Min. 8 karakter"
                            error={pwErrors.new}
                        />
                        <Field
                            label="Konfirmasi Password Baru"
                            type="password"
                            value={pwForm.confirm}
                            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                            placeholder="Ulangi password baru"
                            error={pwErrors.confirm}
                        />
                        <button
                            type="submit"
                            disabled={pwLoading}
                            className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition"
                        >
                            {pwLoading ? "Memperbarui..." : "Ganti Password"}
                        </button>
                    </form>
                </Card>

                <button
                    onClick={() => router.back()}
                    className="text-sm text-gray-400 hover:text-gray-600 transition"
                >
                    ← Kembali
                </button>
            </div>
        </Sidebar>
    );
}
