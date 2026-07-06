<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrePrompt extends Model
{
    protected $fillable = [
        'title',
        'category',
        'sort_order',
        'is_active',
        'variants',
    ];

    protected $casts = [
        'variants' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}

