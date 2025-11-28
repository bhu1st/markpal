<?php
namespace App\Controllers;

use Simplo\Controller;

class EditorController extends Controller
{
    public function index()
    {
        // Safe: Reading from internal session storage
        session_start();
        $vault = $_SESSION['vault_path'] ?? null;
        
        $this->view('editor', ['vault' => $vault]);
    }

    public function setVault()
    {
        session_start();
        
        // Sanitize: Remove null bytes, trim whitespace
        $rawPath = (string) ($_POST['path'] ?? '');
        $path = $this->sanitizePath($rawPath);
        
        if (is_dir($path)) {
            $_SESSION['vault_path'] = realpath($path);
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid directory path']);
        }
    }

    public function getTree()
    {
        session_start();
        $vault = $_SESSION['vault_path'] ?? null;

        if (!$vault || !is_dir($vault)) {
            echo json_encode([]);
            return;
        }

        $tree = $this->scanDirectory($vault);
        echo json_encode($tree);
    }

    public function readFile()
    {
        session_start();
        
        // Sanitize: Remove null bytes, trim
        $rawFile = (string) ($_GET['file'] ?? '');
        $file = $this->sanitizePath($rawFile);
        
        $vault = $_SESSION['vault_path'] ?? '';

        if (empty($vault) || empty($file)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
            return;
        }

        // SECURITY: Directory Traversal Prevention
        $realBase = realpath($vault);
        // We construct the path and check if it resolves to a location inside the vault
        $realUserPath = realpath($vault . DIRECTORY_SEPARATOR . $file);

        if ($realUserPath && strpos($realUserPath, $realBase) === 0 && file_exists($realUserPath)) {
            echo json_encode([
                'status' => 'success',
                'content' => file_get_contents($realUserPath)
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'File not found or access denied']);
        }
    }

    public function saveFile()
    {
        session_start();
        
        // Sanitize File Path: Remove null bytes, trim
        $rawFile = (string) ($_POST['file'] ?? '');
        $file = $this->sanitizePath($rawFile);
        
        // Content: Keep RAW. Do not strip tags or add slashes, 
        // as this corrupts Markdown/Code.
        // We only cast to string to prevent array injection.
        $content = (string) ($_POST['content'] ?? '');
        
        $vault = $_SESSION['vault_path'] ?? '';

        if (empty($vault) || empty($file)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
            return;
        }

        $realBase = realpath($vault);
        $targetPath = $vault . DIRECTORY_SEPARATOR . $file;
        
        // We check the PARENT directory because the file itself might be overwritten
        // This ensures the target file resides within the allowed folder structure
        $realDir = realpath(dirname($targetPath));

        // SECURITY: Check if directory is valid and within vault
        if ($realDir && strpos($realDir, $realBase) === 0) {
            
            // Extra check: prevent writing .php files if only markdown/txt is intended
            // (Optional, but good practice for an editor)
            $ext = pathinfo($targetPath, PATHINFO_EXTENSION);
            if (!in_array(strtolower($ext), ['md', 'txt'])) {
                 echo json_encode(['status' => 'error', 'message' => 'Only .md and .txt files are allowed']);
                 return;
            }

            file_put_contents($targetPath, $content);
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Access denied']);
        }
    }

    public function createFile()
    {
        session_start();
        
        $rawName = (string) ($_POST['name'] ?? '');
        $vault = $_SESSION['vault_path'] ?? '';

        if (empty($vault) || empty($rawName)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
            return;
        }

        // Sanitize Filename: STRICT mode
        // Only allow alphanumerics, spaces, dots, dashes, underscores.
        // This strips slashes entirely, preventing traversal at the name level.
        $filename = preg_replace('/[^a-zA-Z0-9\.\-_\s]/', '', $rawName);
        
        // Force extension
        if (!str_ends_with($filename, '.md')) {
            $filename .= '.md';
        }

        $targetPath = $vault . DIRECTORY_SEPARATOR . $filename;

        // Security: Ensure we aren't overwriting existing files
        if (file_exists($targetPath)) {
            echo json_encode(['status' => 'error', 'message' => 'File already exists']);
            return;
        }

        if (file_put_contents($targetPath, "# " . $filename) !== false) {
            echo json_encode(['status' => 'success']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Permission denied']);
        }
    }

    /**
     * Helper to clean paths without destroying content
     */
    private function sanitizePath($path)
    {
        // Remove null bytes (poison null byte attack)
        $path = str_replace(chr(0), '', $path);
        // Trim whitespace
        return trim($path);
    }

    /**
     * Recursive directory scan
     */
    private function scanDirectory($dir, $relativePath = '')
    {
        $result = [];
        
        // Suppress warnings if dir is not readable
        $files = @scandir($dir);
        
        if ($files === false) return [];

        foreach ($files as $f) {
            if ($f === '.' || $f === '..') continue;

            $path = $dir . DIRECTORY_SEPARATOR . $f;
            $rel = $relativePath ? $relativePath . '/' . $f : $f;

            if (is_dir($path)) {
                $result[] = [
                    'text' => $f,
                    'type' => 'folder',
                    'path' => $rel,
                    'children' => $this->scanDirectory($path, $rel)
                ];
            } else {
                // Only show markdown files or text files
                if (preg_match('/\.(md|txt)$/i', $f)) {
                    $result[] = [
                        'text' => $f,
                        'type' => 'file',
                        'path' => $rel
                    ];
                }
            }
        }
        return $result;
    }
}