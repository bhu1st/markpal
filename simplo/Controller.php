<?php
namespace Simplo;

class Controller
{
    protected $container;
    protected $db;

    public function __construct(Container $container)
    {
        $this->container = $container;
        $this->db = $container->get('db'); // Convenience access to db
    }

     protected function view(string $view, array $data = [])
    {
        // 1. Get theme configuration
        $themeConfig = $this->container->get('config.theme');
        $activeTheme = $themeConfig['active_theme'] ?? null;
        
        $_view_path = null;

        // 2. If a theme is active, check for a view file in the theme's directory first.
        if ($activeTheme) {
            $themedViewPath = dirname(__DIR__, 1) . "/themes/{$activeTheme}/views/{$view}.php";
            if (file_exists($themedViewPath)) {
                $_view_path = $themedViewPath;
            }
        }

        // 3. If no theme view was found, fall back to the default path.
        if ($_view_path === null) {
            $_view_path = dirname(__DIR__, 1) . "/app/views/{$view}.php";
        }

        // 4. The rest of the function remains the same.
        if (!file_exists($_view_path)) {
            throw new \Exception("View file not found in theme or default views: {$_view_path}");
        }

        extract($data);
        require $_view_path;
    }
}