<?php

namespace App\Http\Middleware;

use Closure;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WorkingHoursMiddleware
{
    /**
     * Route patterns yang TETAP boleh diakses di luar jam kerja
     */
    protected array $exemptRoutes = [
        'api/login',
        'api/logout',
        'sanctum/csrf-cookie',
        'api/health',
        'api/operating-status',
    ];

    /**
     * Handle an incoming request.
     * Blokir semua request di luar jam kerja: Senin-Sabtu, 08:30-17:00 WIB
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip check untuk exempt routes
        foreach ($this->exemptRoutes as $route) {
            if ($request->is($route)) {
                return $next($request);
            }
        }

        if (!self::isOpen()) {
            $now = Carbon::now('Asia/Jakarta');
            return response()->json([
                'message' => 'Sistem antrian sedang offline. Di luar jam operasional.',
                'working_hours' => 'Senin - Sabtu, 08:30 - 17:00 WIB',
                'current_time' => $now->toDateTimeString(),
                'is_open' => false,
            ], 503);
        }

        return $next($request);
    }

    /**
     * Static helper: cek apakah sekarang dalam jam kerja
     */
    public static function isOpen(): bool
    {
        $now = Carbon::now('Asia/Jakarta');
        $dayOfWeek = $now->dayOfWeekIso; // 1=Senin ... 7=Minggu
        $currentTime = $now->format('H:i');

        // Senin(1) - Sabtu(6), jam 08:30 - 16:59 WIB
        $isWorkingDay = $dayOfWeek >= 1 && $dayOfWeek <= 6;
        $isWorkingHour = $currentTime >= '08:30' && $currentTime < '17:00';

        return $isWorkingDay && $isWorkingHour;
    }
}
