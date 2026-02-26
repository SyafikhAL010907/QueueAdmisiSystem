<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('manage-admins');

        $admins = User::where('role', 'admin')->latest()->get();
        return view('admin.users.index', compact('admins'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('manage-admins');

        return view('admin.users.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('manage-admins');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin', // Force role to admin
        ]);

        return redirect()->route('admin.users.index')->with('success', 'Admin berhasil ditambahkan.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        Gate::authorize('manage-admins');

        // Ensure AdminDev can only edit 'admin' role accounts (or maybe themselves, but let's stick to admin)
        if ($user->role !== 'admin') {
            abort(403, 'Aksi tidak diizinkan.');
        }

        return view('admin.users.edit', compact('user'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        Gate::authorize('manage-admins');

        if ($user->role !== 'admin') {
            abort(403, 'Aksi tidak diizinkan.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => $request->filled('password') ? ['confirmed', 'min:8'] : ['nullable'],
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('admin.users.index')->with('success', 'Admin berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        Gate::authorize('manage-admins');

        if ($user->role !== 'admin') {
            abort(403, 'Aksi tidak diizinkan.');
        }

        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'Admin berhasil dihapus.');
    }
}
