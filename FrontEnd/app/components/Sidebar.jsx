"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  UserCircle2,
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let storedRole = localStorage.getItem("role");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        // Jika role di user object lebih baru, prioritaskan itu
        if (parsed?.role) storedRole = parsed.role;
      } catch { }
    }
    // Normalisasi role lama ke format baru dengan spasi
    if (storedRole === "dev" || storedRole === "AdminDev") storedRole = "Admin Dev";
    if (storedRole === "admin" || storedRole === "AdminLoket1") storedRole = "Admin Loket 1";
    if (storedRole === "AdminLoket2") storedRole = "Admin Loket 2";
    if (storedRole === "AdminLoket3") storedRole = "Admin Loket 3";
    if (storedRole === "AdminLoket4") storedRole = "Admin Loket 4";
    if (storedRole) setRole(storedRole);
  }, []);

  // Tutup dropdown saat sidebar di-collapse
  useEffect(() => {
    if (collapsed) setSettingsOpen(false);
  }, [collapsed]);

  const handleLogout = async () => {
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      });
    } catch { }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const getRoleBadge = (userRole) => {
    if (!userRole) return null;
    const isDev = userRole === "Admin Dev";
    return (
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDev ? "bg-purple-500 text-yellow-200" : "bg-blue-500 text-white"
          }`}
      >
        {userRole}
      </span>
    );
  };

  const allMenuItems = [
    {
      name: "Manajemen Antrian", path: "/queue", icon: LayoutDashboard,
      // Tampil untuk SEMUA role (Admin Dev + semua Admin Loket)
      show: !!role
    },
    {
      name: "Rekapan Data", path: "/rekapan", icon: BarChart3,
      show: role === "Admin Dev"
    },
    {
      name: "Manajemen User", path: "/users", icon: Users,
      show: role === "Admin Dev"
    },
  ];

  const menuItems = allMenuItems.filter((item) => item.show);

  return (
    <div className="flex h-screen bg-slate-50/50 overflow-hidden">
      {/* MOBILE HEADER - Only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-sky-100 flex items-center justify-between px-6 z-40">
        <h1 className="text-lg font-bold text-sky-900 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
          Queue System
        </h1>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* OVERLAY for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex flex-col bg-white/95 backdrop-blur-xl border-r border-sky-100 text-slate-600 transition-all duration-300 ease-in-out lg:relative
          ${isMobileOpen ? "translate-x-0 w-full" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-sky-50 h-16 shrink-0">
          {(!collapsed || isMobileOpen) && (
            <h1 className="text-lg font-bold truncate text-sky-900 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Queue System
            </h1>
          )}
          <div className="flex items-center gap-2">
            {/* Toggle button - desktop only */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 hover:bg-sky-50 text-sky-600 rounded-xl transition-all duration-300"
            >
              <div className={`transition-transform duration-500 ${collapsed ? "rotate-180" : ""}`}>
                <ChevronLeft size={20} />
              </div>
            </button>
            {/* Close button - mobile only */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* MAIN MENU — flex-1 agar dorong logout ke bawah */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${isActive
                  ? "bg-sky-100 text-sky-700 font-semibold shadow-sm shadow-sky-100"
                  : "hover:bg-sky-50 hover:text-sky-600 hover:pl-4 text-slate-500"
                  } ${collapsed && !isMobileOpen ? "justify-center px-2 hover:pl-2" : ""}`}
                title={collapsed ? item.name : ""}
              >
                <Icon size={22} className={`shrink-0 transition-colors ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                {(!collapsed || isMobileOpen) && <span className="truncate transition-opacity duration-300">{item.name}</span>}
              </Link>
            );
          })}

          {/* ⚙️ PENGATURAN — Dropdown Toggle */}
          <div>
            <button
              onClick={() => {
                if (!collapsed || isMobileOpen) {
                  setSettingsOpen((prev) => !prev);
                } else {
                  // If collapsed desktop, we could either expand or just act like a link to profile
                  // The user said "tanpa harus menekan tanda >" - maybe they want it to work as-is
                  setSettingsOpen((prev) => !prev);
                }
              }}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl w-full transition-all duration-300 ${settingsOpen
                ? "bg-sky-50 text-sky-700"
                : "hover:bg-sky-50 hover:text-sky-600 hover:pl-4 text-slate-500"
                } ${collapsed && !isMobileOpen ? "justify-center px-2 hover:pl-2" : ""}`}
              title={collapsed ? "Pengaturan" : ""}
            >
              <Settings size={22} className={`shrink-0 transition-colors ${settingsOpen ? "text-sky-600" : "text-slate-400"}`} />
              {(!collapsed || isMobileOpen) && (
                <>
                  <span className="flex-1 text-left text-sm truncate">Pengaturan</span>
                  <ChevronDown
                    size={16}
                    className={`text-sky-300 transition-transform duration-300 ${settingsOpen ? "rotate-180" : "rotate-0"
                      }`}
                  />
                </>
              )}
            </button>

            {/* Dropdown Panel — slide down */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${(settingsOpen && !collapsed) || (settingsOpen && isMobileOpen) ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              {/* Profile Card — klik ke /profile */}
              <Link href="/profile"
                onClick={() => setIsMobileOpen(false)}
                className="mx-2 mt-1 rounded-2xl bg-sky-50/50 border border-sky-100 p-4 space-y-3 block hover:bg-sky-100/50 transition-colors cursor-pointer"
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <UserCircle2 size={36} className="text-sky-500" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight text-slate-700">
                      {currentUser?.name || "—"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {currentUser?.email || "—"}
                    </p>
                  </div>
                </div>
                {/* Role Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Role:</span>
                  {getRoleBadge(currentUser?.role)}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* LOGOUT — pinned di bawah, minimalis */}
        <div className="p-3 border-t border-sky-50 shrink-0">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 group ${collapsed && !isMobileOpen ? "justify-center px-2" : ""}`}
            title={collapsed ? "Keluar" : ""}
          >
            <LogOut
              size={22}
              className="shrink-0 group-hover:rotate-12 transition-transform duration-200"
            />
            {(!collapsed || isMobileOpen) && <span className="text-sm font-medium truncate">Keluar</span>}
          </button>
          {(!collapsed || isMobileOpen) && (
            <p className="text-center text-[10px] text-slate-300 mt-2 font-medium tracking-wider truncate">
              © 2026 UNJ QUEUE SYSTEM
            </p>
          )}
        </div>
      </aside>

      {/* CONTENT */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden pt-16 lg:pt-0`}>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
