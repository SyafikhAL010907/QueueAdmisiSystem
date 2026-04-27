<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Reverb Server
    |--------------------------------------------------------------------------
    |
    | This option controls the default server used by Reverb to handle
    | incoming messages as well as broadcasting message to all your
    | connected clients. At this time only "reverb" is supported.
    |
    */

    'default' => env('REVERB_SERVER', 'reverb'),

    /*
    |--------------------------------------------------------------------------
    | Reverb Servers
    |--------------------------------------------------------------------------
    |
    | Here you may define details for each of the supported Reverb servers.
    | Each server has its own configuration options that are defined in
    | the array below. You should ensure all the options are present.
    |
    */

    'servers' => [

        'reverb' => [
            'host' => '0.0.0.0', // DENGERIN SEMUA JALUR
            'port' => 8080,
            'path' => '',
            'hostname' => null, // BIARIN OTOMATIS
            'options' => [
                'tls' => [],
            ],


            'max_request_size' => env('REVERB_MAX_REQUEST_SIZE', 10_000),
            'max_message_size' => env('REVERB_MAX_MESSAGE_SIZE', 10_000),

            'scaling' => [
                'enabled' => env('REVERB_SCALING_ENABLED', false),
                'channel' => env('REVERB_SCALING_CHANNEL', 'reverb'),
                'server' => [
                    'url' => env('REDIS_URL'),
                    'host' => env('REDIS_HOST', '127.0.0.1'),
                    'port' => env('REDIS_PORT', '6379'),
                    'username' => env('REDIS_USERNAME'),
                    'password' => env('REDIS_PASSWORD'),
                    'database' => env('REDIS_DB', '0'),
                    'timeout' => env('REDIS_TIMEOUT', 60),
                ],
            ],
            'pulse_ingest_interval' => env('REVERB_PULSE_INGEST_INTERVAL', 15),
            'telescope_ingest_interval' => env('REVERB_TELESCOPE_INGEST_INTERVAL', 15),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Reverb Applications
    |--------------------------------------------------------------------------
    |
    | Here you may define how Reverb applications are managed. If you choose
    | to use the "config" provider, you may define an array of apps which
    | your server will support, including their connection credvventials.
    |
    */

    'apps' => [

        'provider' => 'config',

        'apps' => [
            [
                'key' => 'azrdrsjgfa1g49yuqvml',
                'secret' => 'fgtx1u9w0h4q6vmnrkzl',
                'app_id' => '123456',
                'options' => [
                    'host' => 'queueadmisisystem.onrender.com',
                    'port' => 443,
                    'scheme' => 'https',
                    'useTLS' => true,
                ],
                'allowed_origins' => ['*'],
                'ping_interval' => 60,
                'activity_timeout' => 30,
            ],
        ],


    ],

];
