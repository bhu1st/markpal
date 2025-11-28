<?php

// Define a constant for the project root for convenience
define('ROOT_PATH', __DIR__);

/*
 * ------------------------------------------------------
 *  Make the Active Theme Globally Available
 * ------------------------------------------------------
 */

$themeConfig = require_once ROOT_PATH . '/config/theme.php';
define('ACTIVE_THEME', $themeConfig['active_theme'] ?? null);

/*
 * ------------------------------------------------------
 *  MANUAL AUTOLOADING
 * ------------------------------------------------------
 */

// 1. Load the Autoloader Class
require_once ROOT_PATH . '/autoloader.php';

// 2. Instantiate the Autoloader
$loader = new Psr4AutoloaderClass();

// 3. Register the namespace prefixes.
// This tells the autoloader where to find the classes.
$loader->addNamespace('Simplo', 'simplo');
$loader->addNamespace('App', 'app');

// 4. Register the autoloader with PHP.
$loader->register();


/*
 * ------------------------------------------------------
 *  MANUAL HELPER FILE LOADING
 * ------------------------------------------------------
 */
require_once ROOT_PATH . '/helpers/common.php';
require_once ROOT_PATH . '/helpers/form.php';
require_once ROOT_PATH . '/helpers/url.php';


/*
 * ------------------------------------------------------
 *  RUN THE APPLICATION
 * ------------------------------------------------------
 */
$app = new Simplo\Application();
$app->run();