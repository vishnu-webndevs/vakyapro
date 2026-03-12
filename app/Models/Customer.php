<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'external_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }
}
