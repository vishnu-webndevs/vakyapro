<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsageLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'request_type',
        'tokens',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

