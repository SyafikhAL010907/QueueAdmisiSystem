<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): View
    {
        return view('profile.edit', [
            'user' => $request->user(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * [API] Update email / reset password — returns JSON.
     */
    public function updateApi(Request $request): JsonResponse
    {
        $user = $request->user();
        $rules = [];

        if ($request->filled('email')) {
            $rules['email'] = ['required', 'email', 'unique:users,email,' . $user->id];
        }
        if ($request->filled('new_password')) {
            $rules['current_password'] = ['required', 'string'];
            $rules['new_password'] = ['required', 'string', 'min:8'];
        }
        $request->validate($rules);

        if ($request->filled('email')) {
            $user->email = $request->email;
        }

        if ($request->filled('new_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'Password saat ini tidak sesuai.',
                    'errors' => ['current_password' => ['Password saat ini tidak sesuai.']],
                ], 422);
            }
            $user->password = Hash::make($request->new_password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
