<?php
// helpers/common.php

if (!function_exists('dd')) {
    /**
     * Dump the given variables and end the script.
     *
     * @param  mixed  ...$args
     * @return void
     */
    function dd(...$args)
    {
        echo '<pre>';
        var_dump(...$args);
        echo '</pre>';
        die();
    }
}

if (!function_exists('redirect')) {
    /**
     * Redirect to a given path.
     *
     * @param string $path
     * @return void
     */
    function redirect(string $path)
    {
        header("Location: {$path}");
        exit();
    }
}