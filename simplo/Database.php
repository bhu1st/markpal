<?php
namespace Simplo;

use PDO;
use PDOException;

class Database
{
    public $pdo;

    public function __construct(string $dsn, string $username, string $password, array $options = [])
    {
        try {
            $default_options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $this->pdo = new PDO($dsn, $username, $password, array_replace($default_options, $options));
        } catch (PDOException $e) {
            // In a real app, you'd log this error, not echo it.
            throw new PDOException($e->getMessage(), (int)$e->getCode());
        }
    }

    public function query(string $sql, array $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function lastInsertId()
    {
        return $this->pdo->lastInsertId();
    }
}