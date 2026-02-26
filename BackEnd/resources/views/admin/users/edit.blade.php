<x-app-layout>
    <x-slot name="header">
        <h2 class="font-bold text-2xl text-purple-600 leading-tight">
            {{ __('Edit Admin') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-3xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-purple-100 shadow-sm mb-8">
                <h1 class="text-3xl font-black text-gray-800 mb-6">Edit Data Admin</h1>

                @if ($errors->any())
                    <div class="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl mb-6">
                        <ul class="list-disc list-inside font-bold text-sm">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                <form action="{{ route('admin.users.update', $user) }}" method="POST" class="flex flex-col gap-4">
                    @csrf
                    @method('PUT')
                    <div>
                        <x-input-label for="name" value="Nama Lengkap" />
                        <x-text-input id="name" name="name" type="text" class="mt-1 block w-full" :value="old('name', $user->name)" required autofocus />
                    </div>
                    <div>
                        <x-input-label for="email" value="Email Address" />
                        <x-text-input id="email" name="email" type="email" class="mt-1 block w-full"
                            :value="old('email', $user->email)" required />
                    </div>
                    <hr class="my-4 border-purple-50">
                    <div>
                        <x-input-label for="password" value="Password Baru (Opsional)" />
                        <x-text-input id="password" name="password" type="password" class="mt-1 block w-full"
                            autoComplete="new-password" />
                        <p class="text-xs text-gray-400 mt-2 font-medium">Biarkan kosong jika tidak ingin mengubah
                            password.</p>
                    </div>
                    <div>
                        <x-input-label for="password_confirmation" value="Konfirmasi Password Baru" />
                        <x-text-input id="password_confirmation" name="password_confirmation" type="password"
                            class="mt-1 block w-full" autoComplete="new-password" />
                    </div>

                    <div class="flex gap-4 mt-8">
                        <button type="submit"
                            class="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition shadow-lg active:scale-95">Simpan
                            Perubahan</button>
                        <a href="{{ route('admin.users.index') }}"
                            class="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-8 py-4 rounded-2xl font-bold transition active:scale-95 flex items-center">Batal</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</x-app-layout>