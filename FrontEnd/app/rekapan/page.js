"use client";

import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  Legend,
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function RekapanPage() {
  const [queues, setQueues] = useState([]);
  const [filter, setFilter] = useState("day");
  const [errorStatus, setErrorStatus] = useState(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    async function fetchRekapan() {
      try {
        const res = await fetch(`${API_URL}/api/queues`, {
          headers: { Accept: "application/json" },
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Rekapan & Analitik Antrian
          </h1>

          <button
            onClick={exportExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow"
          >
            Export Excel
          </button>
        </div>

        {/* FILTER */}
        <div className="bg-white p-6 rounded-xl shadow flex items-center gap-6">
          <label className="font-semibold">Filter Statistik:</label>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          >
            <option value="day">Per Hari</option>
            <option value="month">Per Bulan</option>
            <option value="year">Per Tahun</option>
          </select>

          <div className="ml-auto text-gray-600">
            Total Data: <span className="font-bold">{queues.length}</span>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-blue-600 text-white p-6 rounded-xl shadow">
            <h2 className="text-sm opacity-80">Total Selesai</h2>
            <p className="text-3xl font-bold">{queues.length}</p>
          </div>

          <div className="bg-yellow-400 text-black p-6 rounded-xl shadow">
            <h2 className="text-sm opacity-80">Periode Aktif</h2>
            <p className="text-3xl font-bold">{filter.toUpperCase()}</p>
          </div>

          <div className="bg-purple-600 text-white p-6 rounded-xl shadow">
            <h2 className="text-sm opacity-80">Rata-rata / Periode</h2>
            <p className="text-3xl font-bold">
              {chartData.length
                ? Math.round(queues.length / chartData.length)
                : 0}
            </p>
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="grid grid-cols-2 gap-6">
          {/* BAR CHART */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-4">Grafik Batang</h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#1e3a8a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LINE CHART */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-4">Grafik Tren</h2>

            <Line data={lineChartData} />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white p-6 rounded-xl shadow overflow-auto">
          <h2 className="font-bold mb-4">Detail Data Selesai</h2>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-3">No</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Loket</th>
                <th className="p-3">Tanggal Selesai</th>
              </tr>
            </thead>

            <tbody>
              {currentData && currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium">{item.queue_number}</td>
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.loket}</td>
                    <td className="p-3 text-gray-500">
                      {new Date(item.updated_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-400">
                    Tidak ada data rekapan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
