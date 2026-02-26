"use client";

/**
 * QueueTable — Dual mode:
 *  mode="admin-dev"  → Split view:
 *                      TOP:    called rows (max 4) with 🖥️ Loket badge
 *                      BOTTOM: waiting rows with 4 loket call buttons
 *  mode="loket"      → Only waiting rows + single 📣 Panggil button
 */
export default function QueueTable({
  queues = [],
  callQueue,
  handleDone,     // kept for future use / loket mode
  handleCancel,
  mode = "admin-dev",
  userRole = "",
  callsLoading = {},
}) {
  // Extract loket number from role string (e.g. "Admin Loket 2" → 2)
  const extractLoket = (role) => {
    const match = role?.match(/(\d+)$/);
    return match ? parseInt(match[1]) : null;
  };

  const myLoketNumber = extractLoket(userRole);

  // Lokets currently busy (status: called)
  const busyLokets = queues
    .filter((q) => q.status === "called")
    .map((q) => Number(q.loket_id || q.loket));

  const calledQueues = queues.filter((q) => q.status === "called").slice(0, 4);
  const waitingQueues = queues.filter((q) => q.status === "waiting");

  const handleCall = async (q, loket) => {
    try { await callQueue(q.id, q.name, loket); } catch (err) {
      console.error("handleCall error:", err);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────
   *  SHARED: reusable table shell
   * ──────────────────────────────────────────────────────────────────── */
  const TableShell = ({ children, emptyMsg }) => (
    <div className="bg-white rounded-2xl border border-sky-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="bg-sky-50/80 text-sky-800 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4 text-center w-12">#</th>
              <th className="px-6 py-4 text-left">Tiket</th>
              <th className="px-6 py-4 text-left">Nama</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-50/50">
            {children || (
              <tr>
                <td colSpan="5" className="text-center py-12 text-slate-400 font-medium italic">
                  {emptyMsg}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const configs = {
      waiting: "bg-amber-50 text-amber-600 border-amber-100",
      called: "bg-sky-50 text-sky-600 border-sky-100 ml-[-4px]",
      completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
      canceled: "bg-rose-50 text-rose-600 border-rose-100",
    };
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${configs[status] || "bg-slate-50 text-slate-500 border-slate-100"}`}>
        {status}
      </span>
    );
  };

  /* ─────────────────────────────────────────────────────────────────────
   *  MODE: ADMIN DEV  — split view
   * ──────────────────────────────────────────────────────────────────── */
  if (mode === "admin-dev") {
    return (
      <div className="space-y-6">

        {/* ── TOP: Called (pinned) ───────────────────────────────────── */}
        <TableShell emptyMsg="Tidak ada antrian yang sedang dilayani.">
          {calledQueues.length > 0 &&
            calledQueues.map((q, i) => (
              <tr key={q.id} className="bg-sky-50/30 hover:bg-sky-50/60 transition-colors">
                <td className="px-6 py-4 text-center text-slate-400 font-medium">{i + 1}</td>
                <td className="px-6 py-4 font-black text-sky-700">{q.queue_number}</td>
                <td className="px-6 py-4 text-slate-600 font-semibold">{q.name}</td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={q.status} />
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black bg-white border border-sky-100 text-sky-600 shadow-sm">
                    <span className="p-1 bg-sky-500 rounded-lg text-white">🖥️</span>
                    Loket {q.loket}
                  </span>
                </td>
              </tr>
            ))}
        </TableShell>

        {/* ── Divider ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-2">
          <div className="flex-1 h-px bg-sky-100/50" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
            Daftar Tunggu
          </span>
          <div className="flex-1 h-px bg-sky-100/50" />
        </div>

        {/* ── BOTTOM: Waiting ────────────────────────────────────────── */}
        <TableShell emptyMsg="Tidak ada antrian yang menunggu 🎉">
          {waitingQueues.length > 0 &&
            waitingQueues.map((q, i) => (
              <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5 text-center text-slate-300">{i + 1}</td>
                <td className="px-6 py-5 font-black text-slate-600">{q.queue_number}</td>
                <td className="px-6 py-5 text-slate-500 font-medium">{q.name}</td>
                <td className="px-6 py-5 text-center">
                  <StatusBadge status={q.status} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap justify-center gap-2">
                    {[1, 2, 3, 4].map((loket) => {
                      const isBusy = busyLokets.includes(loket);
                      const isLoading = callsLoading[`${q.id}-${loket}`];
                      return (
                        <button
                          key={loket}
                          disabled={isBusy || isLoading}
                          onClick={() => handleCall(q, loket)}
                          className={`px-3 py-2 text-[10px] items-center justify-center font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-sm ${isBusy
                              ? "bg-slate-100 cursor-not-allowed text-slate-300 border border-slate-200"
                              : isLoading
                                ? "bg-sky-500 opacity-50 text-white cursor-wait border border-sky-500"
                                : "bg-white border border-sky-200 text-sky-600 hover:bg-sky-500 hover:text-white hover:border-sky-500 hover:shadow-sky-100"
                            }`}
                        >
                          {isLoading ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                          ) : (
                            `Loket ${loket}`
                          )}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
        </TableShell>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────
   *  MODE: LOKET  — only waiting rows + single Panggil button
   * ──────────────────────────────────────────────────────────────────── */
  return (
    <TableShell emptyMsg="Tidak ada antrian yang menunggu 🎉">
      {waitingQueues.length > 0 &&
        waitingQueues.map((q, i) => (
          <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
            <td className="px-6 py-5 text-center text-slate-300">{i + 1}</td>
            <td className="px-6 py-5 font-black text-sky-700">{q.queue_number}</td>
            <td className="px-6 py-5 text-slate-600 font-semibold">{q.name}</td>
            <td className="px-6 py-5 text-center">
              <StatusBadge status={q.status} />
            </td>
            <td className="px-6 py-5 text-center">
              {(() => {
                const isBusy = queues.some(q => q.status === 'called' && Number(q.loket) === myLoketNumber);
                const isLoading = callsLoading[`${q.id}-${myLoketNumber}`];
                return (
                  <button
                    onClick={() => handleCall(q, myLoketNumber)}
                    disabled={!myLoketNumber || isBusy || isLoading}
                    className={`px-6 py-2.5 text-xs flex items-center justify-center mx-auto font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-sky-100 ${isLoading
                        ? "bg-sky-500 opacity-50 cursor-wait text-white"
                        : "bg-sky-500 hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-500 text-white active:scale-95 transition-all"
                      } disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      "📣 Panggil"
                    )}
                  </button>
                );
              })()}
            </td>
          </tr>
        ))}
    </TableShell>
  );
}
