<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceApiKeyBackup extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_api_key_id',
        'key_encrypted',
        'last_four',
        'rotated_by_admin_id',
    ];
}

