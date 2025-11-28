<?php
namespace Simplo;

use Closure;

class Container
{
    protected $bindings = [];

    public function set($key, Closure $resolver)
    {
        $this->bindings[$key] = $resolver;
    }

    public function get($key)
    {
        if (!isset($this->bindings[$key])) {
            throw new \Exception("No binding found for {$key}");
        }

        $resolver = $this->bindings[$key];
        return $resolver($this);
    }
}