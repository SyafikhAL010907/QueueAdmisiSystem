<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QueueCalled implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $queue_number;
    public $name;
    public $loket;
    public $lang;

    /**
     * Create a new event instance.
     */
    public function __construct($queue_number, $name, $loket, $lang = 'id')
    {
        $this->queue_number = $queue_number;
        $this->name = $name;
        $this->loket = (int) $loket;
        $this->lang = $lang;
    }

    /**
     * Data yang dikirim ke semua listener WebSocket.
     * Gunakan field name yang KONSISTEN dengan frontend.
     */
    public function broadcastWith(): array
    {
        return [
            'queue_number' => $this->queue_number,
            'name' => $this->name,
            'loket' => $this->loket,
            'lang' => $this->lang,
        ];
    }

    /**
     * Channel tujuan broadcast (Public Channel).
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('queue-channel'),
        ];
    }

    /**
     * Nama event yang didengar oleh frontend:
     * channel.listen('queue.called', ...)
     */
    public function broadcastAs(): string
    {
        return 'queue.called';
    }
}
