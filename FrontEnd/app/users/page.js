"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

    // Add form
    const [addForm, setAddForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "Admin Loket 1" });
    // Edit form
    const [editForm, setEditForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/api/users`, {
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error("Gagal memuat data. Pastikan sudah login.");
            setUsers(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        // Fetch available roles from DB ENUM
        fetch(`${API_URL}/api/roles`, { headers: { Accept: "application/json" } })
            .then((r) => r.json())
            .then((roles) => {
                if (Array.isArray(roles) && roles.length > 0) {
                    setAvailableRoles(roles);
                    // Set default ke opsi pertama bukan AdminDev
                    const firstNonDev = roles.find((r) => !r.includes("Dev")) || roles[0];
                    setAddForm((prev) => ({ ...prev, role: firstNonDev }));
                }
            })
            .catch(() => {
                // Fallback jika API gagal
                setAvailableRoles(["Admin Dev", "Admin Loket 1", "Admin Loket 2", "Admin Loket 3", "Admin Loket 4"]);
            });
    }, [fetchUsers]);

    // ── Add ────────────────────────────────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();
        if (addForm.password !== addForm.confirmPassword) {
            alert("Password dan Konfirmasi Password tidak sama!");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/users`, {
                method: "POST",
                credentials: "include",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                body: JSON.stringify({ name: addForm.name, email: addForm.email, password: addForm.password, role: addForm.role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal menambah admin.");
            setShowAdd(false);
            setAddForm({ name: "", email: "", password: "", confirmPassword: "", role: "AdminLoket1" });
            await fetchUsers();
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
            const res = await fetch(`${API_URL}/api/users/${editTarget.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { Accept: "application/json", "Content-Type": "application/json" },
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

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async (id, name) => {
        if (!confirm(`Hapus admin "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
        setDeleting(id);
        try {
            const res = await fetch(`${API_URL}/api/users/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error("Gagal menghapus admin.");
            await fetchUsers();
        } catch (err) {
            alert(err.message);
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
                                                    onClick={() => handleDelete(user.id, user.name)}
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
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pilih Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={addForm.role}
                                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition bg-white"
                                required
                            >
                                {availableRoles.length > 0 ? (
                                    availableRoles
                                        .filter((r) => r !== "Admin Dev")
                                        .map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))
                                ) : (
                                    // Fallback sementara saat loading roles
                                    <option value={addForm.role}>{addForm.role}</option>
                                )}
                            </select>
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
        </Sidebar>
    );
}
