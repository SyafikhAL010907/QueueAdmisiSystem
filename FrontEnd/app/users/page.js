"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { getApiUrl } from "@/src/utils/apiConfig";

const API_URL = getApiUrl();

// ─── Notification Modal (pengganti alert) ───────────────────────────────────
// type: 'error' | 'warning' | 'info'
function NotifModal({ notif, onClose }) {
    if (!notif) return null;
    const cfg = {
        error:   { bg: "bg-red-50",    border: "border-red-200",    icon: "🚫", titleColor: "text-red-700",    btnColor: "bg-red-600 hover:bg-red-700",    label: "Tidak Bisa Dihapus" },
        warning: { bg: "bg-orange-50", border: "border-orange-200", icon: "⚠️",  titleColor: "text-orange-700", btnColor: "bg-orange-500 hover:bg-orange-600", label: "Ada Antrian Aktif" },
        info:    { bg: "bg-blue-50",   border: "border-blue-200",   icon: "ℹ️",  titleColor: "text-blue-700",   btnColor: "bg-blue-600 hover:bg-blue-700",   label: "Info" },
    };
    const c = cfg[notif.type] || cfg.info;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm border-2 ${c.border}`}>
                {/* Header strip */}
                <div className={`${c.bg} ${c.border} border-b rounded-t-2xl px-6 py-4 flex items-center gap-3`}>
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                        <p className={`font-bold text-base ${c.titleColor}`}>{c.label}</p>
                        <p className="text-xs text-gray-500">{notif.subtitle || "Perhatikan informasi di bawah ini."}</p>
                    </div>
                </div>
                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-gray-700 text-sm leading-relaxed">{notif.message}</p>
                    {notif.detail && (
                        <div className={`mt-3 p-3 rounded-lg ${c.bg} border ${c.border}`}>
                            <p className="text-xs font-semibold text-gray-500 mb-1">{notif.detailLabel || "Detail:"}</p>
                            {notif.detail.map((d, i) => (
                                <p key={i} className={`text-sm font-medium ${c.titleColor}`}>{d}</p>
                            ))}
                        </div>
                    )}
                </div>
                {/* Footer */}
                <div className="px-6 pb-5 flex justify-end">
                    <button onClick={onClose}
                        className={`px-5 py-2 ${c.btnColor} text-white rounded-lg text-sm font-semibold transition`}>
                        Mengerti
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({ target, onConfirm, onClose, loading }) {
    if (!target) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-2 border-red-200">
                <div className="bg-red-50 border-b border-red-200 rounded-t-2xl px-6 py-4 flex items-center gap-3">
                    <span className="text-3xl">🗑️</span>
                    <div>
                        <p className="font-bold text-base text-red-700">Konfirmasi Hapus</p>
                        <p className="text-xs text-gray-500">Tindakan ini tidak bisa dibatalkan</p>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <p className="text-gray-700 text-sm">Yakin ingin menghapus akun admin ini?</p>
                    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-xs text-gray-400 mb-1">Akun yang akan dihapus:</p>
                        <p className="font-semibold text-gray-800">{target.name}</p>
                        <p className="text-xs text-gray-500">{target.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">{target.role}</span>
                    </div>
                </div>
                <div className="px-6 pb-5 flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">Batal</button>
                    <button onClick={onConfirm} disabled={loading}
                        className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition flex items-center gap-2">
                        {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
                        {loading ? "Menghapus..." : "Ya, Hapus"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Reusable Modal Wrapper ───────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

// ─── Form Field ───────────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, required }) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // Modal states
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // Notifikasi & konfirmasi hapus
    const [notif, setNotif] = useState(null);          // { type, message, detail, ... }
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name, email, role }

    // Add form
    const [addForm, setAddForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [nextLoketRole, setNextLoketRole] = useState(""); // auto-detect dari API
    // Edit form
    const [editForm, setEditForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { 
                    Accept: "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
            });
            if (!res.ok) throw new Error("Gagal memuat data. Pastikan sudah login.");
            setUsers(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch next loket role otomatis (loket-count + 1)
    const fetchNextLoket = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/loket-count`, {
                headers: { 
                    Accept: "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
            });
            const data = await res.json();
            const next = (data?.count ?? 0) + 1;
            setNextLoketRole(`Admin Loket ${next}`);
        } catch {
            setNextLoketRole("Admin Loket 1");
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchNextLoket();
    }, [fetchUsers, fetchNextLoket]);

    // ── Add ────────────────────────────────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();
        if (addForm.password !== addForm.confirmPassword) {
            alert("Password dan Konfirmasi Password tidak sama!");
            return;
        }
        if (!nextLoketRole) {
            alert("Gagal mendeteksi role loket berikutnya. Coba refresh halaman.");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: "POST",
                headers: { 
                    Accept: "application/json", 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: addForm.name, email: addForm.email, password: addForm.password, role: nextLoketRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menambah admin.");
            setShowAdd(false);
            setAddForm({ name: "", email: "", password: "", confirmPassword: "" });
            // Refresh data dan hitung ulang loket berikutnya
            await fetchUsers();
            await fetchNextLoket();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Edit ────────────────────────────────────────────────────────────────────
    const openEdit = (user) => {
        setEditTarget(user);
        setEditForm({ name: user.name, email: user.email, password: "", confirmPassword: "" });
        setShowEdit(true);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (editForm.password && editForm.password !== editForm.confirmPassword) {
            alert("Password baru dan Konfirmasi tidak sama!");
            return;
        }
        setSubmitting(true);
        try {
            const body = { name: editForm.name, email: editForm.email };
            if (editForm.password) body.password = editForm.password;
            const res = await fetch(`${API_URL}/users/${editTarget.id}`, {
                method: "PATCH",
                headers: { 
                    Accept: "application/json", 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal mengupdate admin.");
            setShowEdit(false);
            await fetchUsers();
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────────
    // Validasi sebelum hapus:
    // 1. Harus loket dengan nomor TERTINGGI
    // 2. Tidak boleh ada antrian aktif (waiting / called) di loket tsb
    const handleDeleteRequest = async (user) => {
        const match = user.role.match(/Admin Loket (\d+)/);
        if (!match) {
            // Bukan loket biasa, langsung tampil konfirmasi
            setDeleteConfirm(user);
            return;
        }
        const loketNum = parseInt(match[1]);

        // Hitung nomor loket tertinggi yang ada
        const loketUsers = users.filter((u) => /Admin Loket (\d+)/.test(u.role));
        const maxLoket = Math.max(...loketUsers.map((u) => parseInt(u.role.match(/Admin Loket (\d+)/)[1])));

        // Validasi 1: Harus nomor tertinggi
        if (loketNum < maxLoket) {
            setNotif({
                type: "error",
                subtitle: "Urutan hapus tidak valid",
                message: `Loket harus dihapus dari nomor terbesar ke terkecil. Hapus dulu Loket ${maxLoket} sebelum menghapus Loket ${loketNum}.`,
                detailLabel: "Urutan yang benar:",
                detail: Array.from({ length: maxLoket }, (_, i) => maxLoket - i)
                    .map((n) => `${n === loketNum ? "→" : ""} Admin Loket ${n}${n === maxLoket ? " (hapus ini dulu)" : n === loketNum ? " (yang mau dihapus)" : ""}`),
            });
            return;
        }

        // Validasi 2: Cek antrian aktif di loket ini
        try {
            const res = await fetch(`${API_URL}/queues`, {
                headers: { 
                    Accept: "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
            });
            const allQueues = await res.json();
            const activeQueues = Array.isArray(allQueues)
                ? allQueues.filter(
                      (q) => String(q.loket) === String(loketNum) && (q.status === "waiting" || q.status === "called")
                  )
                : [];

            if (activeQueues.length > 0) {
                setNotif({
                    type: "warning",
                    subtitle: `Masih ada ${activeQueues.length} antrian aktif`,
                    message: `Loket ${loketNum} masih memiliki antrian yang belum selesai. Selesaikan atau batalkan semua antrian di loket ini sebelum menghapus akunnya.`,
                    detailLabel: "Antrian aktif di Loket " + loketNum + ":",
                    detail: activeQueues.slice(0, 5).map(
                        (q) => `• ${q.queue_number} — ${q.name} (${q.status === "called" ? "Sedang dilayani" : "Menunggu"})`
                    ).concat(activeQueues.length > 5 ? [`... dan ${activeQueues.length - 5} lainnya`] : []),
                });
                return;
            }
        } catch {
            // Jika gagal fetch antrian, tetap lanjut ke konfirmasi
        }

        // Lolos semua validasi → tampil modal konfirmasi
        setDeleteConfirm(user);
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteConfirm) return;
        setDeleting(deleteConfirm.id);
        try {
            const res = await fetch(`${API_URL}/users/${deleteConfirm.id}`, {
                method: "DELETE",
                headers: { 
                    Accept: "application/json",
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
            });
            if (!res.ok) throw new Error("Gagal menghapus admin.");
            setDeleteConfirm(null);
            await fetchUsers();
            await fetchNextLoket();
        } catch (err) {
            setNotif({ type: "error", subtitle: "Gagal", message: err.message });
        } finally {
            setDeleting(null);
        }
    };

    const filtered = users.filter(
        (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Sidebar>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola akun Admin operasional sistem antrian.</p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                    <button onClick={fetchUsers}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition font-medium">
                        ↺ Refresh
                    </button>
                    <button onClick={() => setShowAdd(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition font-medium shadow">
                        + Tambah Akun
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">⚠️ {error}</div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl shadow overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            Memuat data admin...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            {search ? "Tidak ada admin yang cocok." : "Belum ada admin terdaftar."}
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-blue-50 text-blue-800 text-left">
                                <tr>
                                    <th className="px-5 py-3 font-semibold w-10">#</th>
                                    <th className="px-5 py-3 font-semibold">Nama</th>
                                    <th className="px-5 py-3 font-semibold">Email</th>
                                    <th className="px-5 py-3 font-semibold">Role</th>
                                    <th className="px-5 py-3 font-semibold">Terdaftar</th>
                                    <th className="px-5 py-3 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((user, idx) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-5 py-4 text-gray-400">{idx + 1}</td>
                                        <td className="px-5 py-4 font-medium text-gray-800">{user.name}</td>
                                        <td className="px-5 py-4 text-gray-500">{user.email}</td>
                                        <td className="px-5 py-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${user.role === "AdminDev"
                                                ? "bg-purple-100 text-purple-700"
                                                : "bg-blue-100 text-blue-700"
                                                }`}>{user.role}</span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString("id-ID", {
                                                day: "2-digit", month: "short", year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-400 hover:text-white transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(user)}
                                                    disabled={deleting === user.id}
                                                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                                                >
                                                    {deleting === user.id ? "..." : "Hapus"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-3 text-right">Total: {filtered.length} admin</p>
            </div>

            {/* ── MODAL: TAMBAH ─────────────────────────────────────────────────── */}
            {showAdd && (
                <Modal title="Tambah Akun Admin" onClose={() => setShowAdd(false)}>
                    <form onSubmit={handleAdd}>
                        <Field label="Nama Lengkap" value={addForm.name} required
                            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                            placeholder="Contoh: Budi Santoso" />
                        <Field label="Email" type="email" value={addForm.email} required
                            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                            placeholder="email@domain.com" />
                        <Field label="Password" type="password" value={addForm.password} required
                            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                            placeholder="Min. 8 karakter" />
                        <Field label="Konfirmasi Password" type="password" value={addForm.confirmPassword} required
                            onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                            placeholder="Ulangi password" />
                        {/* Role otomatis — info badge */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                            <span className="text-blue-500 text-lg">🏷️</span>
                            <div>
                                <p className="text-sm font-medium text-blue-700">Role otomatis ditetapkan:</p>
                                <p className="text-base font-bold text-blue-800">
                                    {nextLoketRole || "Memuat..."}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowAdd(false)}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Batal</button>
                            <button type="submit" disabled={submitting}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition">
                                {submitting ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── MODAL: EDIT ───────────────────────────────────────────────────── */}
            {showEdit && editTarget && (
                <Modal title={`Edit Admin — ${editTarget.name}`} onClose={() => setShowEdit(false)}>
                    <form onSubmit={handleEdit}>
                        <Field label="Nama Lengkap" value={editForm.name} required
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Nama lengkap" />
                        <Field label="Email" type="email" value={editForm.email} required
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="email@domain.com" />
                        <p className="text-xs text-gray-400 mb-3">Kosongkan password jika tidak ingin mengubahnya.</p>
                        <Field label="Password Baru" type="password" value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            placeholder="Min. 8 karakter (opsional)" />
                        <Field label="Konfirmasi Password Baru" type="password" value={editForm.confirmPassword}
                            onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                            placeholder="Ulangi password baru" />
                        <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowEdit(false)}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Batal</button>
                            <button type="submit" disabled={submitting}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition">
                                {submitting ? "Menyimpan..." : "Update"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {/* ── MODAL: NOTIFIKASI (error / warning) ───────────────── */}
            <NotifModal notif={notif} onClose={() => setNotif(null)} />

            {/* ── MODAL: KONFIRMASI HAPUS ───────────────────────────── */}
            <DeleteConfirmModal
                target={deleteConfirm}
                onConfirm={handleDeleteConfirmed}
                onClose={() => setDeleteConfirm(null)}
                loading={deleting === deleteConfirm?.id}
            />
        </Sidebar>
    );
}
