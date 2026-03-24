<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Blog extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'category_id',
        'featured_image',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Blog $blog) {
            if (! is_string($blog->slug) || trim($blog->slug) === '') {
                $blog->slug = static::uniqueSlugFrom($blog->title, $blog->id);
            }
        });
    }

    public static function uniqueSlugFrom(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $base = $base !== '' ? $base : 'blog';

        $slug = $base;
        $suffix = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    public function excerpt(int $maxLength = 180): string
    {
        $text = preg_replace('/\s+/u', ' ', strip_tags((string) $this->content));
        $text = is_string($text) ? trim($text) : '';
        if ($text === '') {
            return '';
        }

        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        return rtrim((string) mb_substr($text, 0, $maxLength - 1)).'…';
    }
}

