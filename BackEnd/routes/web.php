<?php

use App\Models\Queue;

Route::get('/', function () {
    if (auth()->user()->role === 'AdminDev') {
        return redirect()->route('admin.users.index');
    }

    $queues = Queue::orderBy('created_at')->get();
    return view('queue', compact('queues'));
})->middleware('auth')->name('dashboard');

Route::post('/add', function (\Illuminate\Http\Request $request) {
    $lastQueue = Queue::latest()->first();
    $number = $lastQueue ? $lastQueue->id + 1 : 1;

    Queue::create([
        'queue_number' => 'A' . str_pad($number, 3, '0', STR_PAD_LEFT),
        'name' => $request->name
    ]);

    return redirect('/');
});

Route::post('/update/{id}/{status}', function ($id, $status) {
    $queue = Queue::findOrFail($id);
    $queue->update(['status' => $status]);
    return redirect('/');
});

Route::delete('/delete/{id}', function ($id) {
    $queue = Queue::findOrFail($id);
    $queue->delete();
    return redirect('/');
});

Route::get('/display', function () {
    $current = Queue::where('status', 'called')->latest()->first();
    return view('display', compact('current'));
});

/* API JSON untuk AJAX */
Route::get('/queues-json', function () {
    return response()->json(
        Queue::orderBy('created_at')->get()
    );
});

Route::view('/mobile', 'mobile');

// Redundant dashboard route removed to unify with root dashboard route

// Admin Management Routes for AdminDev
Route::middleware(['auth', 'can:manage-admins'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', \App\Http\Controllers\Admin\UserController::class)->except(['show']);
});

require __DIR__ . '/auth.php';
