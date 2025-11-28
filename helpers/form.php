<?php
// helpers/form.php

if (!function_exists('old')) {
    /**
     * Retrieve an old input value from a POST request.
     * Useful for repopulating forms after validation errors.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    function old(string $key, $default = '')
    {
        return $_POST[$key] ?? $default;
    }
}