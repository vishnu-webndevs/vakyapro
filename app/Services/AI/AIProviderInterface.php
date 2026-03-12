<?php

namespace App\Services\AI;

interface AIProviderInterface
{
    /**
     * Generate content based on a prompt.
     */
    public function generate(string $prompt, array $options = []): string;
}
