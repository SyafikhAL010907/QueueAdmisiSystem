<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__.'/../routes/channels.php',
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
        $middleware->validateCsrfTokens(except: [
            'login',
            'logout',
            'api/*',
        ]);
        $middleware->redirectGuestsTo(fn() => request()->expectsJson() ? null : route('login'));
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->shouldRenderJsonWhen(fn() => true);
    })->create();
