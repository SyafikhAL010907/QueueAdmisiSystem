<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Queue;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

// --- Auth ---
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

// --- Roles (public — dipakai dropdown Tambah Akun) ---
Route::get('/roles', function () {
    // Ambil definisi ENUM langsung dari MySQL
    $result = \Illuminate\Support\Facades\DB::select(
        "SHOW COLUMNS FROM users LIKE 'role'"
    );
    // Format: enum('Admin Dev','Admin Loket 1',...)
    $rawType = $result[0]->Type ?? '';
    preg_match("/^enum\((.+)\)$/i", $rawType, $matches);
    $roles = [];
    if (!empty($matches[1])) {
        // Hapus petik dan split koma
        $roles = array_map(
            fn($v) => trim($v, "' \""),
            explode(',', $matches[1])
        );
    }
    return response()->json($roles);
});

// --- Users & Profile API (protected) ---
Route::middleware('auth')->group(function () {
    // Profile (semua role)
    Route::put('/user/profile', [\App\Http\Controllers\ProfileController::class, 'updateApi']);

    // List all users (exclude AdminDev from list)
    Route::get('/users', function () {
        return response()->json(
            \App\Models\User::whereNotIn('role', ['AdminDev', 'Admin Dev'])
                ->select('id', 'name', 'email', 'role', 'created_at')
                ->latest()->get()
        );
    });

    // Create new admin
    Route::post('/users', function (Request $request) {
        $validRoles = ['Admin Dev', 'Admin Loket 1', 'Admin Loket 2', 'Admin Loket 3', 'Admin Loket 4'];
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:' . implode(',', $validRoles)],
        ]);
        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);
        return response()->json($user->only('id', 'name', 'email', 'role', 'created_at'), 201);
    });

    // Update admin (password optional)
    Route::patch('/users/{id}', function (Request $request, $id) {
        $user = \App\Models\User::where('role', 'admin')->findOrFail($id);
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email,' . $user->id],
        ];
        if ($request->filled('password')) {
            $rules['password'] = ['string', 'min:8'];
        }
        $validated = $request->validate($rules);
        $data = ['name' => $validated['name'], 'email' => $validated['email']];
        if ($request->filled('password')) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }
        $user->update($data);
        return response()->json($user->only('id', 'name', 'email', 'created_at'));
    });

    // Delete admin
    Route::delete('/users/{id}', function ($id) {
        $user = \App\Models\User::where('role', 'admin')->findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'Admin berhasil dihapus.']);
    });
});

// --- Queue ---
Route::get('/queues', [QueueController::class, 'index']);
Route::post('/queues', [QueueController::class, 'store']);
Route::get('/queues/stats', [QueueController::class, 'stats']);
Route::get('/queue/current-calling', [QueueController::class, 'currentCalling']);
Route::post('/queues/{id}/call', [QueueController::class, 'call']);
Route::post('/queues/{id}/recall', [QueueController::class, 'recall']);
Route::post('/queues/{id}/complete', [QueueController::class, 'complete']);
Route::post('/queues/{id}/cancel', [QueueController::class, 'cancel']);

