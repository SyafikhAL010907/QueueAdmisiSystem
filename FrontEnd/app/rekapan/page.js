"use client";

import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Trash2 } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import DashboardLayout from "../components/Sidebar";
import { getApiUrl } from "@/src/utils/apiConfig";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend,
);

const API_URL = getApiUrl();

export default function RekapanPage() {
  const [queues, setQueues] = useState([]);
  const [filter, setFilter] = useState("day");
  const [errorStatus, setErrorStatus] = useState(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    async function fetchRekapan() {
      try {
        const res = await fetch(`${API_URL}/queues`, {
          headers: { 
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
        });
        if (!res.ok) throw new Error("Gagal fetch data");
        const allData = await res.json();

        // Filter for completed and canceled
        const filtered = allData.filter(q => q.status === "completed" || q.status === "canceled");

        setQueues(filtered);
        setErrorStatus(null);
      } catch (err) {
        console.error("fetchRekapan error:", err);
        setErrorStatus("Koneksi Server Terputus");
      }
    }
    fetchRekapan();
  }, []);

  const handleDeleteRecord = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Data?",
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      customClass: {
        popup: "rounded-3xl shadow-2xl border border-rose-100",
        confirmButton: "px-6 py-2.5 rounded-xl font-bold shadow-md shadow-rose-500/30 transition-all",
        cancelButton: "px-6 py-2.5 rounded-xl font-bold transition-all",
      },
    });

    if (!result.isConfirmed) return;

    // ⚡ Optimistic update — hapus dari UI dulu
    const prevQueues = queues;
    setQueues(prev => prev.filter(q => q.id !== id));

    try {
      const res = await fetch(`${API_URL}/queues/${id}`, {
        method: "DELETE",
        headers: { 
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });
      if (!res.ok) throw new Error("Gagal menghapus data");

      Swal.fire({
        title: "Terhapus!", icon: "success",
        toast: true, position: "top-end",
        timer: 1200, showConfirmButton: false, timerProgressBar: true,
      });
    } catch (err) {
      // Rollback jika gagal
      setQueues(prevQueues);
      Swal.fire("Gagal", err.message, "error");
    }
  };


  const handleGlobalDelete = async () => {
    const result = await Swal.fire({
      title: "HAPUS SELURUH DATA?",
      html: "Peringatan: Semua data antrian (Selesai & Batal) akan <b>DIHAPUS PERMANEN</b> dari database!<br/><br/>Ketik <b>HAPUS</b> di bawah ini untuk konfirmasi:",
      icon: "error",
      background: "#fff5f5",
      input: "text",
      inputPlaceholder: "Ketik HAPUS untuk konfirmasi",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "YA, BERSIHKAN SEMUA!",
      cancelButtonText: "Jangan, Batalkan",
      customClass: {
        popup: "rounded-3xl shadow-2xl border-2 border-rose-200",
        title: "text-rose-600 font-black tracking-tight",
        htmlContainer: "text-slate-600 font-medium",
        confirmButton: "px-6 py-3 rounded-xl font-black shadow-lg shadow-rose-500/40 hover:bg-rose-600 transition-all",
        cancelButton: "px-6 py-3 rounded-xl font-bold bg-slate-500 hover:bg-slate-600 transition-all text-white",
        input: "text-center font-black tracking-widest uppercase border-rose-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl"
      },
      preConfirm: (inputValue) => {
        if (inputValue !== "HAPUS") {
          Swal.showValidationMessage("Anda harus mengetik HAPUS dengan benar.");
          return false;
        }
        return true;
      }
    });

    if (!result.isConfirmed) return;

    try {
      // Periksa role dari localStorage karena kita perlu AdminDev
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        Swal.fire("Unauthorized!", "Anda harus login sebagai Admin Dev.", "error");
        return;
      }

      const parsedUser = JSON.parse(savedUser);
      // Boleh Admin Dev atau admin operasional biasa
      if (!["Admin Dev", "AdminDev", "admin"].includes(parsedUser.role)) {
        Swal.fire("Akses Ditolak!", "Hanya Admin yang dapat menghapus seluruh data.", "error");
        return;
      }

      // Check if the frontend sends token automatically; if not, we must rely on Sanctum cookies.
      // fetch cross-port usually requires credentials: "include" for sanctum, so we'll add it.
      const res = await fetch(`${API_URL}/queues`, {
        method: "DELETE",
        headers: { 
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Gagal menghapus semua data");
      }

      // ⚠️ WARNING requirement: Set frontend state 'queues' to [] directly
      setQueues([]);

      Swal.fire({
        title: "Bersih Total!",
        text: "Semua data antrian berhasil dihapus!",
        icon: "success",
        confirmButtonColor: "#10b981",
        customClass: {
          popup: "rounded-3xl border border-emerald-100",
          confirmButton: "rounded-xl font-bold"
        }
      });
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    }
  };

  /* ================= EXPORT ================= */

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(queues);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapan");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(fileData, "rekapan-antrian.xlsx");
  };

  /* ================= GROUP DATA ================= */

  const chartData = useMemo(() => {
    const grouped = {};

    queues.forEach((item) => {
      const date = new Date(item.updated_at);
      let key;

      if (filter === "day") {
        key = date.toLocaleDateString();
      } else if (filter === "month") {
        key = `${date.getMonth() + 1}-${date.getFullYear()}`;
      } else if (filter === "year") {
        key = date.getFullYear();
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.keys(grouped).map((key) => ({
      name: key,
      total: grouped[key],
    }));
  }, [queues, filter]);

  /* ================= LINE CHART DATA ================= */

  const lineChartData = {
    labels: chartData.map((item) => item.name),
    datasets: [
      {
        label: "Jumlah Antrian Selesai",
        data: chartData.map((item) => item.total),
        borderColor: "#1e3a8a",
        backgroundColor: "rgba(30,58,138,0.2)",
        tension: 0.4,
      },
    ],
  };

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentData = (queues || []).slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil((queues || []).length / rowsPerPage);
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {errorStatus && (
          <div className="bg-red-600 text-white text-center py-2 font-bold rounded-lg animate-pulse">
            ⚠️ {errorStatus}
          </div>
        )}
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800">
            Rekapan & Analitik Antrian
          </h1>

          <button
            onClick={exportExcel}
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-green-600/20 font-semibold transition-all active:scale-95"
          >
            Export Excel
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <label className="font-bold text-slate-700">Filter Statistik:</label>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-auto border border-sky-100 px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
          >
            <option value="day">Per Hari</option>
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>

          <div className="md:ml-auto text-slate-500 font-medium">
            Total Data: <span className="font-black text-sky-600">{queues.length}</span>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="p-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-xl shadow-blue-600/20">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Total Selesai</h2>
              <p className="text-4xl font-black tracking-tight">{queues.length}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-6 rounded-2xl shadow-xl shadow-amber-500/20">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Periode Aktif</h2>
              <p className="text-4xl font-black tracking-tight">{filter.toUpperCase()}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-fuchsia-700 text-white p-6 rounded-2xl shadow-xl shadow-purple-600/20">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Rata-rata / Periode</h2>
              <p className="text-4xl font-black tracking-tight">
                {chartData.length
                  ? Math.round(queues.length / chartData.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BAR CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
            <h2 className="font-black text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              Grafik Batang
            </h2>

            <div className="h-[300px] md:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} fontWeight="bold" stroke="#94a3b8" />
                  <YAxis fontSize={11} fontWeight="bold" stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LINE CHART */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
            <h2 className="font-black text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-600 rounded-full"></span>
              Grafik Tren
            </h2>

            <div className="h-[300px] md:h-[400px] w-full">
              <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* TABLE HEADER & GLOBAL DELETE BUTTON */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-slate-700 uppercase tracking-widest text-sm">
              Detail Data Selesai
            </h2>
            <button
              onClick={handleGlobalDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all"
            >
              <Trash2 size={18} />
              Hapus Semua Data
            </button>
          </div>

          <div className="overflow-x-auto shadow-inner rounded-xl border border-sky-50">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-sky-100">
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">No</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Nama</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Loket</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Tanggal Selesai</th>
                  <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-sky-50">
                {currentData && currentData.length > 0 ? (
                  currentData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-sky-50/50 transition-colors"
                    >
                      <td className="p-4 font-bold text-sky-700">{item.queue_number}</td>
                      <td className="p-4 font-medium text-slate-700">{item.name}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg font-bold text-xs ${item.loket ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'}`}>
                          {item.loket ? `Loket ${item.loket}` : 'Loket ?'}
                        </span>
                      </td>
                      <td className="p-4 flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-medium">
                          {new Date(item.updated_at).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeleteRecord(item.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                      <td className="p-4">
                        {item.status === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                            Dibatalkan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-20 text-slate-300 font-bold italic">
                      Tidak ada data rekapan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* PAGINATION */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {/* Previous */}
            <button
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>

            {/* Page Numbers */}
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 rounded ${currentPage === index + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
                  }`}
              >
                {index + 1}
              </button>
            ))}

            {/* Next */}
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
