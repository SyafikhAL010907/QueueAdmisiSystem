<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Queue;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

// --- Auth ---
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

// DEBUG ROUTE (Hapus nanti)
Route::get('/debug-db', function() {
    return [
        'total_users' => \App\Models\User::count(),
        'users' => \App\Models\User::select('id', 'name', 'email', 'role')->get(),
        'env_app_key' => substr(env('APP_KEY'), 0, 10) . '...',
    ];
});


// --- Roles (public — dipakai dropdown Tambah Akun) ---
Route::get('/roles', function () {
    // Cari nomor loket tertinggi dari user yang ada
    $users = \App\Models\User::where('role', 'like', 'Admin Loket %')->get('role');

    $maxLoket = 0;
    foreach ($users as $user) {
        preg_match('/Admin Loket (\d+)/', $user->role, $m);
        if (!empty($m[1]) && (int)$m[1] > $maxLoket) {
            $maxLoket = (int)$m[1];
        }
    }

    // Jika belum ada loket sama sekali, mulai dari 1; selalu sediakan slot +1 berikutnya
    $upTo = max(1, $maxLoket + 1);

    $roles = ['Admin Loket ' . $upTo]; // default option teratas = loket baru
    // Tambahkan semua loket yang sudah ada (urut dari 1)
    for ($i = 1; $i <= $maxLoket; $i++) {
        $roles[] = 'Admin Loket ' . $i;
    }

    // Urutkan dan hapus duplikat
    $roles = array_values(array_unique($roles));
    sort($roles);

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

    // Create new admin (validasi dinamis — support loket berapapun)
    Route::post('/users', function (Request $request) {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            // Role harus 'Admin Dev' ATAU 'Admin Loket {angka}'
            'role'     => ['required', 'string', 'regex:/^(Admin Dev|Admin Loket \d+)$/'],
        ]);
        $user = \App\Models\User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role'     => $validated['role'],
        ]);
        return response()->json($user->only('id', 'name', 'email', 'role', 'created_at'), 201);
    });

    // Update admin (password optional) — support semua role loket
    Route::patch('/users/{id}', function (Request $request, $id) {
        // Cari user yang BUKAN AdminDev (semua role loket bisa di-edit)
        $user = \App\Models\User::whereNotIn('role', ['AdminDev', 'Admin Dev'])->findOrFail($id);
        $rules = [
            'name'  => ['required', 'string', 'max:255'],
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

    // Delete admin — support semua role loket
    Route::delete('/users/{id}', function ($id) {
        $user = \App\Models\User::whereNotIn('role', ['AdminDev', 'Admin Dev'])->findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'Admin berhasil dihapus.']);
    });

});

// --- Queue ---
Route::get('/queues', [QueueController::class, 'index']);
Route::post('/queues', [QueueController::class, 'store']);
Route::get('/queues/stats', [QueueController::class, 'stats']);
Route::get('/queue/current-calling', [QueueController::class, 'currentCalling']);

// Loket count — jumlah loket aktif (Publik untuk Display)
Route::get('/loket-count', function () {
    $count = \App\Models\User::where('role', 'like', 'Admin Loket %')
        ->count();
    return response()->json(['count' => max(1, $count)]);
});

Route::post('/queues/{id}/call', [QueueController::class, 'call']);
Route::post('/queues/{id}/recall', [QueueController::class, 'recall']);
Route::post('/queues/{id}/complete', [QueueController::class, 'complete']);
Route::post('/queues/{id}/cancel', [QueueController::class, 'cancel']);
Route::delete('/queues/{id}', [QueueController::class, 'destroy']);

// Global delete with AdminDev verification
Route::delete('/queues', function (Request $request) {
    if (!$request->user() || !in_array($request->user()->role, ['Admin Dev', 'AdminDev'])) {
        return response()->json(['message' => 'Unauthorized. Hanya AdminDev yang diizinkan.'], 403);
    }
    return app(QueueController::class)->destroyAll();
})->middleware('auth');
