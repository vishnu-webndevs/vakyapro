<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider',
        'key_encrypted',
        'last_four',
        'created_by_admin_id',
        'updated_by_admin_id',
    ];
}

