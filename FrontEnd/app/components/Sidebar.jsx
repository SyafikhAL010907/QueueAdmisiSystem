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
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    <div className="flex h-screen bg-transparent">
      {/* SIDEBAR */}
      <aside
        className={`${collapsed ? "w-20" : "w-64"
          } bg-white/80 backdrop-blur-md border-r border-sky-100 text-slate-600 flex flex-col transition-all duration-300 z-50 fixed md:relative h-full ${collapsed ? "-translate-x-20 md:translate-x-0" : "translate-x-0"
          }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-sky-50">
          {!collapsed && (
            <h1 className="text-lg font-bold truncate text-sky-900 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Queue System
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-sky-50 text-sky-600 rounded-xl transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
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
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? "bg-sky-100 text-sky-700 font-semibold shadow-sm shadow-sky-100"
                  : "hover:bg-sky-50 hover:text-sky-600 hover:pl-4 text-slate-500"
                  }`}
              >
                <Icon size={20} className={isActive ? "text-sky-600" : "text-slate-400"} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* ⚙️ PENGATURAN — Dropdown Toggle */}
          <div>
            <button
              onClick={() => !collapsed && setSettingsOpen((prev) => !prev)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl w-full transition-all duration-200 ${settingsOpen
                ? "bg-sky-50 text-sky-700"
                : "hover:bg-sky-50 hover:text-sky-600 hover:pl-4 text-slate-500"
                }`}
            >
              <Settings size={20} className={`shrink-0 ${settingsOpen ? "text-sky-600" : "text-slate-400"}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left text-sm">Pengaturan</span>
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
              className={`overflow-hidden transition-all duration-300 ease-in-out ${settingsOpen && !collapsed ? "max-h-56 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
              {/* Profile Card — klik ke /profile */}
              <Link href="/profile"
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
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 group"
          >
            <LogOut
              size={20}
              className="shrink-0 group-hover:rotate-12 transition-transform duration-200"
            />
            {!collapsed && <span className="text-sm font-medium">Keluar</span>}
          </button>
          {!collapsed && (
            <p className="text-center text-[10px] text-slate-300 mt-2 font-medium tracking-wider">
              © 2026 UNJ QUEUE SYSTEM
            </p>
          )}
        </div>
      </aside>

      {/* MOBILE TRIGGER — Only visible when collapsed or on small screens if we wanted a separate button */}
      {/* For now, the aside handles itself with fixed position on mobile */}

      {/* CONTENT */}
      <div className={`flex-1 overflow-auto p-4 md:p-8 transition-all duration-300 ${collapsed ? "ml-0" : "ml-0 md:ml-0"}`}>
        {children}
      </div>
    </div>
  );
}
