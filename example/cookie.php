<?php
declare(strict_types = 1);

/**
 * Cookie Proxy for JS Limitations to enable cookie inject for NeWplayer
 * POST: Body = cookie string (format: "name=val; attr;; name2=val2; attr")
 * DELETE: Query ?name=xxx or Body = cookie name
 */

function setCookieFromString(string $cookieStr): void {
    $parts = array_map('trim', explode(';', $cookieStr));
    if (empty($parts[0])) return;

    // Parse name=value
    $nv = array_shift($parts);
    if (!str_contains($nv, '=')) return;

    [$name,
        $value] = explode('=', $nv, 2);
    $name = trim($name);
    $value = trim($value);

    $opts = [
        'expires' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => false,
        'samesite' => 'Lax'
    ];

    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === '') continue;

        if (str_contains($part, '=')) {
            [$k,
                $v] = explode('=', $part, 2);
            $k = strtolower(trim($k));
            $v = trim($v, " \t\n\r\0\x0B\"");

            switch ($k) {
                case 'max-age':
                    $opts['expires'] = time() + (int)$v;
                    break;
                case 'expires':
                    $opts['expires'] = strtotime($v) ?: 0;
                    break;
                case 'path':
                    $opts['path'] = $v;
                    break;
                case 'domain':
                    $opts['domain'] = $v;
                    break;
                case 'samesite':
                    $opts['samesite'] = ucfirst(strtolower($v));
                    break;
            }
        } else {
            $flag = strtolower($part);
            if ($flag === 'secure') $opts['secure'] = true;
            if ($flag === 'httponly') $opts['httponly'] = true;
        }
    }

    // PHP 7.3+ options array syntax
    setcookie($name, $value, $opts);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $body = file_get_contents('php://input');
        if ($body === false || $body === '') {
            http_response_code(400);
            header('Content-Type: text/plain');
            die('Empty body');
        }

        // Split by double semicolon (;; ) - format from your example
        $cookies = preg_split('/\s*;;\s*/', $body, -1, PREG_SPLIT_NO_EMPTY);
        $count = 0;

        foreach ($cookies as $cookie) {
            $cookie = trim($cookie);
            if ($cookie === '') continue;
            setCookieFromString($cookie);
            $count++;
        }

        http_response_code(204); // No Content
        exit;

        case 'DELETE':
            // Support ?name=xxx or raw body
            $name = $_GET['name'] ?? '';
            if ($name === '') {
                $name = trim(file_get_contents('php://input'));
            }

            if ($name === '') {
                http_response_code(400);
                header('Content-Type: text/plain');
                die('Cookie name required');
            }

            // Expire the cookie
            setcookie($name, '', [
                'expires' => time() - 86400,
                'path' => '/',
                'domain' => '',
                'secure' => false,
                'httponly' => false
            ]);

            http_response_code(204);
            exit;

            default:
                http_response_code(405);
                header('Content-Type: text/plain');
                die('Method not allowed');
            }