<?php

namespace App\Services\AI;

interface AIProviderInterface
{
    /**
     * Generate content based on a prompt.
     *
     * @param string $prompt
     * @param array $options
     * @return string
     */
    public function generate(string $prompt, array $options = []): string;
}
