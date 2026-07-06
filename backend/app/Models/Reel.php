<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reel extends Model
{
    protected $fillable = [
        'created_by',
        'title',
        'description',
        'prompt',
        'video_url',
        'video_path',
        'thumbnail_url',
        'is_active',
        'order',
        'views_count',
        'watch_time_ms',
        'likes_count',
        'saves_count',
        'shares_count',
        'comments_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
        'views_count' => 'integer',
        'watch_time_ms' => 'integer',
        'likes_count' => 'integer',
        'saves_count' => 'integer',
        'shares_count' => 'integer',
        'comments_count' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Admin::class, 'created_by');
    }

    public function likes(): HasMany
    {
        return $this->hasMany(\App\Models\ReelLike::class);
    }

    public function saves(): HasMany
    {
        return $this->hasMany(\App\Models\ReelSave::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(\App\Models\ReelComment::class);
    }
}
