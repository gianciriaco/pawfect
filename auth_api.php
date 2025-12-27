<?php
// 1. Hide Errors & Start Buffering
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require 'db_connect.php';

// 2. Clear Buffer & Set Header
ob_clean();
header('Content-Type: application/json');

// Get JSON input
$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : '';

// --- LOGIN LOGIC ---
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $userInput = $data->username; 
    $passInput = $data->password;

    // 1. Hardcoded Admin Check
    if ($userInput === 'admin' && $passInput === 'wonderpet123') {
        echo json_encode(["status" => "success", "role" => "admin", "message" => "Welcome Admin", "user_id" => 0, "name" => "Admin"]);
        exit;
    }

    // 2. Hardcoded Employee Check
    if ($userInput === 'employee' && $passInput === 'employee123') {
        echo json_encode(["status" => "success", "role" => "employee", "message" => "Welcome Staff", "user_id" => 0, "name" => "Employee"]);
        exit;
    }

    // 3. Database Check (Regular Users)
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$userInput]);
        $user = $stmt->fetch();

        if ($user && password_verify($passInput, $user['password_hash'])) {
            echo json_encode([
                "status" => "success", 
                "role" => $user['role'] ?? 'user', 
                "user_id" => $user['id'],
                "name" => $user['full_name']
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "System error"]);
    }
}

// --- SIGNUP LOGIC ---
elseif ($action === 'signup' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = $data->fullname;
    $email = $data->email;
    $password = password_hash($data->password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(["status" => "error", "message" => "Email already exists"]);
            exit;
        }

        $sql = "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'user')";
        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute([$fullName, $email, $password])) {
            echo json_encode(["status" => "success", "message" => "Account created!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Registration failed"]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Database error"]);
    }
}
?>