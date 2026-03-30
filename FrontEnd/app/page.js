"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBaseUrl } from "@/src/utils/apiConfig";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const BASE_URL = getBaseUrl();

      // Ambil CSRF cookie Laravel Sanctum
      await fetch(`${BASE_URL}/sanctum/csrf-cookie`, {
        credentials: "include",
        headers: { "Accept": "application/json" },
      });

      // Login request — gunakan /api/login agar masuk ke API route, bukan web route
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login gagal");
      }

      // Ambil data user langsung dari login response
      const data = await res.json();

      // DEBUG — lihat response asli dari Laravel di Console
      console.log('[Login Response]', data);

      // Simpan ke localStorage agar Sidebar bisa baca role & user info
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect sesuai role
      if (data.role === "Admin Dev") router.push("/users");
      else if (data.role.includes("Admin Loket")) router.push("/queue");
      else router.push("/");

    } catch (err) {
      const msg = err.message === "Failed to fetch"
        ? "Koneksi Server Terputus (Pastikan Backend nyala)"
        : (err.message || "Terjadi kesalahan");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-sky-100 w-full max-w-md mx-4 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

        {/* Logo UNJ */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-sky-50">
            <img src="/img/unj.png" alt="UNJ Logo" className="h-20 w-auto" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2 text-sky-900">
          Sistem Manajemen Antrian
        </h1>
        <p className="text-center text-slate-500 mb-8">
          Silahkan masuk ke Lounge Eksekutif
        </p>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl mb-6 text-center text-sm animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-sky-50/50 border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none placeholder:text-slate-400"
              placeholder="nama@unj.ac.id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-sky-50/50 border border-sky-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all outline-none placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center mt-3 ml-1">
              <input
                type="checkbox"
                id="showPassword"
                className="w-4 h-4 rounded border-sky-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label htmlFor="showPassword" className="text-slate-600 text-sm ml-2 cursor-pointer select-none">
                Tampilkan password
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 text-white py-3.5 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-500 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : null}
            {loading ? "Menghubungkan..." : "Masuk Sekarang"}
          </button>
        </form>

      </div>
    </div>
  );
}