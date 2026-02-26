<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    protected $fillable = [
        'queue_number',
        'name',
        'status',
        'loket',
    ];
}
