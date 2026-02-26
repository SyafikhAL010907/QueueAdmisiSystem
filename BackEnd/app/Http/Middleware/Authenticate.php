<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     * Returning null for JSON/API requests prevents a 302 redirect response.
     */
    protected function redirectTo(Request $request): ?string
    {
        return $request->expectsJson() ? null : null;
    }
}
