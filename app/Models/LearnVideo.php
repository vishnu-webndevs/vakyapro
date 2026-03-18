<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearnVideo extends Model
{
    protected $fillable = [
        'title',
        'description',
        'category',
        'video_url',
        'thumbnail_url',
        'duration',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];
}

