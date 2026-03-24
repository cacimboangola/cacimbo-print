<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Polling Interval (seconds)
    |--------------------------------------------------------------------------
    |
    | How often the local print agent should poll for new print jobs.
    |
    */
    'polling_interval' => env('PRINT_POLLING_INTERVAL', 3),

    /*
    |--------------------------------------------------------------------------
    | Max Retry Attempts
    |--------------------------------------------------------------------------
    |
    | Maximum number of times a failed print job will be retried.
    |
    */
    'max_attempts' => env('PRINT_MAX_ATTEMPTS', 5),

    /*
    |--------------------------------------------------------------------------
    | Printer Types
    |--------------------------------------------------------------------------
    |
    | Available printer types in the system.
    |
    */
    'types' => ['kitchen', 'bar', 'receipt'],

];
