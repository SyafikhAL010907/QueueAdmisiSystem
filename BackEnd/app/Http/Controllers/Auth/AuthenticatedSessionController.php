<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): View
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('Login Attempt', [
            'email' => $request->email,
            'has_session' => $request->hasSession(),
            'headers' => $request->headers->all(),
        ]);

        try {
            $request->authenticate();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Login Authentication Failed', [
                'message' => $e->getMessage(),
                'email' => $request->email
            ]);
            throw $e;
        }

        $request->session()->regenerate();


        if ($request->wantsJson()) {
            $user = $request->user();

            // Normalisasi role: handle legacy format tanpa spasi → format dengan spasi
            // Format baru (sudah pakai spasi) langsung diteruskan tanpa mapping
            $role = $user->role;
            $legacyMap = [
                'AdminDev'    => 'Admin Dev',
                'AdminLoket1' => 'Admin Loket 1',
                'AdminLoket2' => 'Admin Loket 2',
                'AdminLoket3' => 'Admin Loket 3',
                'AdminLoket4' => 'Admin Loket 4',
            ];
            // Jika ada di legacy map → konversi. Jika sudah format baru → langsung pakai.
            $normalizedRole = $legacyMap[$role] ?? $role;

            return response()->json([
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $normalizedRole,
                ],
                'role' => $normalizedRole,
            ]);
        }

        if ($request->user()->role === 'AdminDev') {
            return redirect()->intended(route('admin.users.index'));
        }

        return redirect()->intended('/');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
