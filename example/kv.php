<?php
/**
 * KV Store for PHP-FPM 
 * A simple implementation of key-value store using SQLite3.
 * to keepalive and sync config for NeWplayer.
 * Note: default path is /cgi-bin/kv.php, you can modify it in `src/api/request.ts`.
 */

declare(strict_types=1);

// --- Config ---
define('DB_FILE', __DIR__ . '/kv.sqlite3');
define('MAX_KEY', 256);
define('MAX_VAL', 65536);  // 64K limit
define('LIST_MAX', 10000);

// --- DB Init (lightweight) ---
$db = new SQLite3(DB_FILE);
$db->busyTimeout(2000);
// WAL mode for concurrent read/write under FPM
@$db->exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;');
@$db->exec('CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY, v TEXT, t INTEGER DEFAULT (strftime("%s","now")))');
@$db->exec('CREATE INDEX IF NOT EXISTS idx_k ON kv(k)');

// --- Parse Request ---
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';

// Extract path, remove query string if manually parsing (parse_url handles it)
$path = parse_url($uri, PHP_URL_PATH);
$path = urldecode(trim($path, '/'));

// If routed via /index.php/key, remove script name
$script = basename($_SERVER['SCRIPT_NAME'] ?? '');
if (strpos($path, $script) === 0) {
    $path = trim(substr($path, strlen($script)), '/');
}

$key = $path;

// --- Helpers ---
function err(int $code, string $msg): void {
    http_response_code($code);
    header('Content-Type: application/json');
    die(json_encode(['err' => $msg]));
}

function ok(array $data = [], int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json');
    die(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function okText(string $data): void {
    http_response_code(200);
    header('Content-Type: text/plain; charset=utf-8');
    die($data);
}

// --- Validation ---
if (strlen($key) > MAX_KEY || str_contains($key, "\0") || str_contains($key, '?')) {
    err(400, 'Bad key');
}

// --- Routing ---
try {
    switch ($method) {
        case 'GET':
            // LIST: GET /prefix?list=1 or GET /?list=1&prefix=foo/
            if (isset($_GET['list']) || $key === '' || str_ends_with($key, '/')) {
                $prefix = $_GET['prefix'] ?? $key;
                $stmt = $db->prepare("SELECT k FROM kv WHERE k LIKE :p ORDER BY k LIMIT " . LIST_MAX);
                $stmt->bindValue(':p', $prefix . '%', SQLITE3_TEXT);
                $res = $stmt->execute();
                $keys = [];
                while ($row = $res->fetchArray(SQLITE3_NUM)) $keys[] = $row[0];
                ok(['keys' => $keys, 'n' => count($keys)]);
            }
            
            // FIND: GET /?find=keyword
            if (isset($_GET['find'])) {
                $q = '%' . strtr($_GET['find'], ['%' => '\\%', '_' => '\\_']) . '%';
                $stmt = $db->prepare("SELECT k,v FROM kv WHERE k LIKE :q OR v LIKE :q LIMIT 1000");
                $stmt->bindValue(':q', $q, SQLITE3_TEXT);
                $res = $stmt->execute();
                $items = [];
                while ($row = $res->fetchArray(SQLITE3_ASSOC)) $items[] = $row;
                ok(['find' => $_GET['find'], 'items' => $items, 'n' => count($items)]);
            }
            
            // GET single
            if ($key === '') err(400, 'Key required');
            $stmt = $db->prepare("SELECT v FROM kv WHERE k=:k");
            $stmt->bindValue(':k', $key, SQLITE3_TEXT);
            $res = $stmt->execute()->fetchArray(SQLITE3_NUM);
            if (!$res) err(404, 'Not found');
            
            // Content negotiation: ?raw=1 or Accept: text/plain
            if (isset($_GET['raw']) || (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'text/plain'))) {
                okText($res[0]);
            }
            ok(['key' => $key, 'value' => $res[0]]);
            
        case 'PUT':
            if ($key === '') err(400, 'Key required');
            $value = file_get_contents('php://input');  // Works in FPM for PUT
            if ($value === false || strlen($value) > MAX_VAL) err(413, 'Too large');
            
            $stmt = $db->prepare("INSERT INTO kv(k,v) VALUES(:k,:v) 
                ON CONFLICT(k) DO UPDATE SET v=excluded.v,t=strftime('%s','now')");
            $stmt->bindValue(':k', $key, SQLITE3_TEXT);
            $stmt->bindValue(':v', $value, SQLITE3_TEXT);
            $stmt->execute();
            ok(['ok' => true, 'key' => $key], 200);  // 201 for new, but we don't check exists for speed
            break;
            
        case 'DELETE':
            if ($key === '') err(400, 'Key required');
            $stmt = $db->prepare("DELETE FROM kv WHERE k=:k");
            $stmt->bindValue(':k', $key, SQLITE3_TEXT);
            $stmt->execute();
            if ($db->changes() === 0) err(404, 'Not found');
            http_response_code(204);  // No Content
            exit;
            
        default:
            err(405, 'Bad method');
    }
} catch (Throwable $e) {
    err(500, $e->getMessage());
} finally {
    $db->close();  // Release FPM process quickly
}