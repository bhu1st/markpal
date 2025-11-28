<?php
// helpers/url.php

if (!function_exists('base_url')) {
    /**
     * Generates the base URL for the application.
     * This path points to the application's root from a web perspective.
     *
     * @param string $path
     * @return string
     */
    function base_url(string $path = ''): string
    {
        $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];

        // This calculates the path to the directory *containing* the public folder.
        $script_path = dirname($_SERVER['SCRIPT_NAME']);
        $base_path = rtrim(str_replace('/public', '', $script_path), '/');

        // Handle root directory case where script path might be just "/"
        if ($script_path === '/public') {
            $base_path = '';
        }
        
        $base_url = "{$scheme}://{$host}{$base_path}";
        
        if (!empty($path)) {
            return $base_url . '/' . ltrim($path, '/');
        }

        return $base_url;
    }
}

if (!function_exists('asset')) {
    /**
     * Generates a URL for an asset.
     * Checks for the asset in the active theme's public directory first,
     * then falls back to the main public directory.
     *
     * @param string $path
     * @return string
     */
    function asset(string $path): string
    {
        $path = ltrim($path, '/');

        // 1. Check if a theme is active and the asset exists in its public directory
        if (ACTIVE_THEME) {
            // The URL path will be like 'public/themes/dark-mode/css/theme.css'
            $themedAssetPath = 'themes/' . ACTIVE_THEME . '/' . $path;
           
            // Check against the physical file path from the project root
            if (file_exists(ROOT_PATH . '/' . $themedAssetPath)) {
                // Use base_url to generate the correct public link
                return base_url($themedAssetPath);
            }
        }

        // 2. Fallback: Path relative to the main public directory
        $publicAssetPath = 'assets/' . $path;
        return base_url($publicAssetPath);
    }
}