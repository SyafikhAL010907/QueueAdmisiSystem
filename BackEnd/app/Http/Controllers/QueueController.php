<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    // Get all queue
    public function index()
    {
        return response()->json(
            Queue::orderBy('created_at')->get(['id', 'queue_number', 'name', 'status', 'loket', 'updated_at'])
        );
    }

    // Add customer
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required'
        ]);

        $lastQueue = Queue::latest()->first();
        $number = $lastQueue ? $lastQueue->id + 1 : 1;

        $queue = Queue::create([
            'queue_number' => 'A' . str_pad($number, 3, '0', STR_PAD_LEFT),
            'name' => $request->name,
            'status' => 'waiting'
        ]);

        return response()->json($queue);
    }

    // ✅ CALL — accepts integer loket OR role string like "Admin Loket 3"
    public function call(Request $request, $id)
    {
        $request->validate([
            'loket' => 'nullable|integer|between:1,9',
            'role' => 'nullable|string',
        ]);

        $loket = $request->loket;

        // Ekstrak nomor dari role string jika loket tidak dikirim langsung
        if (!$loket && $request->filled('role')) {
            preg_match('/(\d+)$/', $request->role, $m);
            $loket = isset($m[1]) ? (int) $m[1] : null;
        }

        if (!$loket) {
            return response()->json(['message' => 'Loket tidak dikenali.'], 422);
        }

        // Check if there's already an active queue for this loket
        $activeQueue = Queue::where('loket', $loket)
            ->where('status', 'called')
            ->exists();

        if ($activeQueue) {
            return response()->json(['message' => 'Anda masih memiliki antrian aktif!'], 400);
        }

        $queue = Queue::findOrFail($id);
        $queue->status = 'called';
        $queue->loket = $loket;
        $queue->updated_at = now();
        $queue->save();

        // Broadcast ke SEMUA tab tanpa terkecuali (termasuk tab Display)
        $lang = $request->lang ?? 'id';
        broadcast(new \App\Events\QueueCalled(
            $queue->queue_number,
            $queue->name,
            $loket,
            $lang
        ));

        return response()->json($queue);
    }

    // RECALL — rebroadcast existing called queue
    public function recall(Request $request, $id)
    {
        $queue = Queue::where('status', 'called')->findOrFail($id);

        // Broadcast ke SEMUA tab
        $lang = $request->lang ?? 'id';
        broadcast(new \App\Events\QueueCalled(
            $queue->queue_number,
            $queue->name,
            $queue->loket,
            $lang
        ));

        return response()->json($queue);
    }

    // Complete
    public function complete($id)
    {
        $queue = Queue::findOrFail($id);
        $queue->update([
            'status' => 'completed',
            'loket' => null
        ]);

        return response()->json($queue);
    }

    // Cancel
    public function cancel($id)
    {
        $queue = Queue::findOrFail($id);
        $queue->update([
            'status' => 'canceled',
            'loket' => null
        ]);

        return response()->json($queue);
    }

    // Stats
    public function stats()
    {
        return response()->json([
            'waiting' => Queue::where('status', 'waiting')->count(),
            'called' => Queue::where('status', 'called')->count(),
            'completed' => Queue::where('status', 'completed')->count(),
            'canceled' => Queue::where('status', 'canceled')->count(),
        ]);
    }

    // Current Calling - returns the latest called queue
    public function currentCalling()
    {
        $queue = Queue::where('status', 'called')
            ->orderBy('updated_at', 'desc')
            ->first(['id', 'queue_number', 'name', 'status', 'loket', 'updated_at']);

        return response()->json($queue);
    }
}
