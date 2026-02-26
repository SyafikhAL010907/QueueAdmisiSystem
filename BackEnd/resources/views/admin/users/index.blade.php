<x-app-layout>
    <x-slot name="header">
        <h2 class="font-bold text-2xl text-purple-600 leading-tight">
            {{ __('Manajemen Admin') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-6xl mx-auto sm:px-6 lg:px-8">
            <div
                class="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-purple-100 shadow-sm mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-4xl font-black text-gray-800 mb-1 tracking-tight">Manajemen Admin</h1>
                    <p class="text-purple-400 font-bold uppercase text-xs tracking-widest">Akses Khusus AdminDev</p>
                </div>
                <a href="{{ route('admin.users.create') }}"
                    class="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition shadow-lg transform active:scale-95">
                    Tambah Admin
                </a>
            </div>

            @if(session('success'))
                <div class="bg-green-50 border border-green-100 text-green-600 px-6 py-4 rounded-2xl font-bold shadow-sm mb-8 animate-bounce"
                    role="alert">
                    <span class="block sm:inline">{{ session('success') }}</span>
                </div>
            @endif

            <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm border border-blue-50 overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gradient-to-r from-purple-50 to-blue-50">
                        <tr>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider">Nama</th>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider">Email</th>
                            <th class="p-5 font-bold text-gray-600 text-sm uppercase tracking-wider text-center">Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($admins as $admin)
                            <tr class="hover:bg-purple-50/50 transition duration-300 group">
                                <td class="p-5 font-bold text-gray-700">{{ $admin->name }}</td>
                                <td class="p-5 text-gray-500 font-medium">{{ $admin->email }}</td>
                                <td class="p-5 flex gap-2 justify-center">
                                    <a href="{{ route('admin.users.edit', $admin) }}"
                                        class="bg-white border border-purple-200 hover:bg-purple-50 text-purple-600 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95">Edit</a>
                                    <form action="{{ route('admin.users.destroy', $admin) }}" method="POST"
                                        onsubmit="return confirm('Yakin ingin menghapus admin ini?');">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit"
                                            class="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95">Hapus</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="3" class="p-4 text-center text-gray-500">Belum ada data
                                    admin.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</x-app-layout>