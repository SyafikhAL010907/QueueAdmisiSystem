"use client";

import Image from "next/image";

export default function Header({ darkMode, toggleDarkMode }) {
  return (
    <div className="flex justify-between items-center mb-8 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-5">
        {/* LOGO */}
        <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-sky-50 transition-transform hover:scale-105">
          <Image
            src="/img/unj.png"
            alt="Logo UNJ"
            width={45}
            height={45}
            priority
          />
        </div>

        {/* TITLE */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-sky-900">
            Queue <span className="text-sky-500 font-medium">System</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Sistem Manajemen Antrian Admisi</p>
        </div>
      </div>
    </div>
  );
}
