<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function get()
    {
        return response()->json(
            Announcement::latest()->first()
        );
    }

    public function update(Request $request)
    {
        $request->validate([
            'message' => 'required'
        ]);

        $announcement = Announcement::create([
            'message' => $request->message
        ]);

        return response()->json($announcement);
    }
}
