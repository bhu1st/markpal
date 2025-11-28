<?php
// config/routes.php

use App\Controllers\EditorController;
use Simplo\Router;

return function(Router $router) {
    // Editor UI
    $router->get('/', [EditorController::class, 'index']);
    
    // API Endpoints
    $router->post('/api/set-vault', [EditorController::class, 'setVault']);
    $router->get('/api/tree', [EditorController::class, 'getTree']);
    $router->get('/api/read', [EditorController::class, 'readFile']);
    $router->post('/api/save', [EditorController::class, 'saveFile']);
    $router->post('/api/create', [EditorController::class, 'createFile']); // New Route
};