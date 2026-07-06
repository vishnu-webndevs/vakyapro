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
        'views_count',
        'watch_time_ms',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'views_count' => 'integer',
        'watch_time_ms' => 'integer',
    ];
}
