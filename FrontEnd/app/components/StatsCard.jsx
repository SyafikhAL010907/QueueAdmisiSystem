// ✅ Component kecil dipisah di luar
// ✅ Component kecil dipisah di luar
function StatCard({ title, value, colorClass, iconColor }) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white border border-sky-50 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300 relative overflow-hidden group`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110 ${iconColor}`}></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <h2 className={`text-4xl font-black mt-2 bg-gradient-to-br ${colorClass} bg-clip-text text-transparent`}>{value}</h2>
    </div>
  );
}

// ✅ Component utama
export default function StatsCards({ queues = [] }) {
  const waiting = queues.filter((q) => q.status === "waiting").length;
  const called = queues.filter((q) => q.status === "called").length;
  const completed = queues.filter((q) => q.status === "completed").length;
  const canceled = queues.filter((q) => q.status === "canceled").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="Waiting" value={waiting} colorClass="from-amber-500 to-orange-400" iconColor="bg-amber-500" />
      <StatCard title="Called" value={called} colorClass="from-sky-500 to-blue-500" iconColor="bg-sky-500" />
      <StatCard title="Completed" value={completed} colorClass="from-emerald-500 to-teal-400" iconColor="bg-emerald-500" />
      <StatCard title="Canceled" value={canceled} colorClass="from-rose-500 to-pink-500" iconColor="bg-rose-500" />
    </div>
  );
}
