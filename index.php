<?php

declare(strict_types=1);

header('Content-Type: text/html; charset=UTF-8');

const API_BASE = 'https://www.msit.edu.in';
const SITE_BASE = 'https://preview8.tecnixs.com';

function normalize_path(string $input): string
{
    $value = trim($input);
    if ($value === '') {
        return '/';
    }

    $value = parse_url($value, PHP_URL_PATH) ?: '/';
    $value = preg_replace('#/+#', '/', $value) ?: '/';

    if ($value[0] !== '/') {
        $value = '/' . $value;
    }

    if (strlen($value) > 1) {
        $value = rtrim($value, '/');
    }

    return $value ?: '/';
}

function current_request_path(): string
{
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    return normalize_path($uri);
}

function current_absolute_url(string $path): string
{
    return rtrim(SITE_BASE, '/') . ($path === '/' ? '/' : $path);
}

function escape_html(?string $value): string
{
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function clean_string(mixed $value): string
{
    return trim((string)($value ?? ''));
}

function first_non_empty(mixed ...$values): string
{
    foreach ($values as $value) {
        $clean = clean_string($value);
        if ($clean !== '') {
            return $clean;
        }
    }

    return '';
}

function http_get_json(string $url): ?array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
            ],
        ]);

        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 200 && $code < 300 && is_string($body) && $body !== '') {
            $json = json_decode($body, true);
            return is_array($json) ? $json : null;
        }

        return null;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 10,
            'header' => "Accept: application/json\r\n",
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    if (!is_string($body) || $body === '') {
        return null;
    }

    $json = json_decode($body, true);
    return is_array($json) ? $json : null;
}

function fetch_meta_payload(string $path): array
{
    $absoluteUrl = current_absolute_url($path);

    $url1 = rtrim(API_BASE, '/') . '/api/public/meta-tags/resolve?path=' . urlencode($absoluteUrl);
    $payload = http_get_json($url1);

    if (is_array($payload)) {
        return $payload;
    }

    $url2 = rtrim(API_BASE, '/') . '/api/public/meta-tags/resolve?path=' . urlencode($path);
    $payload = http_get_json($url2);

    return is_array($payload) ? $payload : [];
}

function extract_charset_value(mixed $bucket, array $standard = []): string
{
    if (is_string($bucket)) {
        return clean_string($bucket);
    }

    if (is_array($bucket)) {
        foreach ($bucket as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $clean = clean_string($value);
                if ($clean !== '') {
                    return $clean;
                }
            }

            if (is_string($key) && strtolower(clean_string($key)) === 'charset') {
                $cleanVal = clean_string($value);
                if ($cleanVal !== '') {
                    return $cleanVal;
                }
            }
        }
    }

    if (isset($standard['charset'])) {
        return clean_string($standard['charset']);
    }

    return '';
}

function append_meta_name_lines(array &$lines, array $items, array $skip = []): void
{
    foreach ($items as $name => $content) {
        $name = clean_string($name);
        $content = clean_string($content);

        if ($name === '' || $content === '') {
            continue;
        }

        if (in_array(strtolower($name), $skip, true)) {
            continue;
        }

        $lines[] = '<meta name="' . escape_html($name) . '" content="' . escape_html($content) . '" />';
    }
}

function append_meta_property_lines(array &$lines, array $items): void
{
    foreach ($items as $property => $content) {
        $property = clean_string($property);
        $content = clean_string($content);

        if ($property === '' || $content === '') {
            continue;
        }

        $lines[] = '<meta property="' . escape_html($property) . '" content="' . escape_html($content) . '" />';
    }
}

function append_meta_http_equiv_lines(array &$lines, array $items): void
{
    foreach ($items as $httpEquiv => $content) {
        $httpEquiv = clean_string($httpEquiv);
        $content = clean_string($content);

        if ($httpEquiv === '' || $content === '') {
            continue;
        }

        $lines[] = '<meta http-equiv="' . escape_html($httpEquiv) . '" content="' . escape_html($content) . '" />';
    }
}

function build_dynamic_meta_block(array $payload): string
{
    $meta = is_array($payload['meta'] ?? null) ? $payload['meta'] : [];

    $charsetBucket = $meta['charset'] ?? ($payload['charset'] ?? null);
    $standard      = is_array($meta['standard'] ?? null) ? $meta['standard'] : [];
    $opengraph     = is_array($meta['opengraph'] ?? null) ? $meta['opengraph'] : [];
    $twitter       = is_array($meta['twitter'] ?? null) ? $meta['twitter'] : [];
    $http          = is_array($meta['http'] ?? null) ? $meta['http'] : [];

    $title = first_non_empty(
        $payload['title'] ?? null,
        $standard['title'] ?? null
    );

    $canonical = first_non_empty(
        $payload['canonical'] ?? null,
        $standard['canonical'] ?? null,
        $standard['canonical_url'] ?? null
    );

    $charset = extract_charset_value($charsetBucket, $standard);

    $lines = [];
    $lines[] = '<!-- Dynamic Meta Tags -->';

    if ($title !== '') {
        $lines[] = '<title>' . escape_html($title) . '</title>';
    }

    if ($canonical !== '') {
        $lines[] = '<link rel="canonical" href="' . escape_html($canonical) . '" />';
    }

    if ($charset !== '') {
        $lines[] = '<meta charset="' . escape_html($charset) . '" />';
    }

    append_meta_name_lines($lines, $standard, ['title', 'canonical', 'canonical_url', 'charset']);
    append_meta_property_lines($lines, $opengraph);
    append_meta_name_lines($lines, $twitter);
    append_meta_http_equiv_lines($lines, $http);

    return implode("\n", $lines);
}

function inject_dynamic_meta_at_head_top(string $html, string $dynamicBlock): string
{
    if (preg_match('/<head\b[^>]*>/i', $html, $matches, PREG_OFFSET_CAPTURE)) {
        $fullHeadTag = $matches[0][0];
        $headPos = $matches[0][1];
        $insertPos = $headPos + strlen($fullHeadTag);

        return substr($html, 0, $insertPos)
            . "\n" . $dynamicBlock . "\n"
            . substr($html, $insertPos);
    }

    return $dynamicBlock . "\n" . $html;
}

$templatePath = __DIR__ . '/index.html';

if (!file_exists($templatePath)) {
    http_response_code(500);
    echo 'Built index.html not found.';
    exit;
}

$path = current_request_path();
$template = file_get_contents($templatePath);

if ($template === false) {
    http_response_code(500);
    echo 'Unable to read frontend template.';
    exit;
}

$payload = fetch_meta_payload($path);
$dynamicBlock = build_dynamic_meta_block($payload);
$html = inject_dynamic_meta_at_head_top($template, $dynamicBlock);

echo $html;