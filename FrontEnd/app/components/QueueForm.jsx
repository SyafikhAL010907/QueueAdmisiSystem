export default function QueueForm({ name, setName, addQueue }) {
  return (
    <form
      onSubmit={addQueue}
      className="bg-white/60 backdrop-blur-sm p-5 md:p-6 rounded-2xl border border-sky-100 shadow-sm mb-8 flex flex-col sm:flex-row gap-4 transition-all hover:bg-white"
    >
      <div className="flex-1 relative group">
        <input
          type="text"
          placeholder="Masukkan Nama Customer..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-5 py-3.5 rounded-xl bg-sky-50/50 border border-sky-100 focus:border-sky-400 focus:ring-4 focus:ring-sky-100/50 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-sky-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-500 transition-all duration-300 shadow-md shadow-sky-100 active:scale-95 whitespace-nowrap uppercase tracking-wider text-xs md:text-sm"
      >
        Tambah Antrian
      </button>
    </form>
  );
}
