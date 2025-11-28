<?php
namespace Simplo;

class Application
{
    public $container;

    public function __construct()
    {
        $this->container = new Container();
        $this->bootstrap();
    }

    protected function bootstrap()
    {
        // Bind database configuration
        $this->container->set('config.db', function() {
            return require dirname(__DIR__, 1) . '/config/database.php';
        });

        // Bind a single, shared database connection
        $this->container->set('db', function($c) {
            $config = $c->get('config.db');
            $dsn = "{$config['driver']}:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
            return new Database($dsn, $config['username'], $config['password']);
        });

        //Bind the theme configuration
        $this->container->set('config.theme', function() {
            return require dirname(__DIR__, 1) . '/config/theme.php';
        });
    }

    public function run()
    {
        $router = new Router($this->container);
        
        // Load the routes
        $routes = require dirname(__DIR__, 1) . '/config/routes.php';
        $routes($router);
        
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $method = $_SERVER['REQUEST_METHOD'];

        // A simple way to handle sub-directory installs
        $script_name = str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']);
        $uri = str_replace($script_name, '', $uri);
        $uri = empty($uri) ? '/' : $uri;
        
        try {
            $router->dispatch($uri, $method);
        } catch (\Exception $e) {
            // Add proper error handling/logging here
            echo "Error: " . $e->getMessage();
        }
    }
}