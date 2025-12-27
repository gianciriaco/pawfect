<?php
// Database configuration
$host = 'localhost:3307'; // Added :3307
$dbname = 'wonderpet_db';
$username = 'root'; // Default XAMPP username
$password = '';     // Default XAMPP password is empty

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Create a PDO instance (Secure connection)
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    
    // Set PDO attributes for error handling
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    // If connection fails, stop execution and show error
    die("Database Connection Failed: " . $e->getMessage());
}
?>