<?php
// 1. Clean Output Buffer
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require 'db_connect.php';

ob_clean();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 2. GET CUSTOMERS
if ($method === 'GET' && $action === 'get_customers') {
    try {
        $stmt = $pdo->query("SELECT * FROM users WHERE role != 'admin' ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) { echo json_encode([]); }
}

// 3. GET MESSAGES (This is the part you need!)
elseif ($method === 'GET' && $action === 'get_messages') {
    try {
        $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC");
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) { echo json_encode([]); }
}

// 4. DELETE FUNCTIONS
elseif ($method === 'POST' && $action === 'delete_customer') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    echo json_encode(["status" => $stmt->execute([$data->id]) ? "success" : "error"]);
}
elseif ($method === 'POST' && $action === 'delete_message') {
    $data = json_decode(file_get_contents("php://input"));
    $stmt = $pdo->prepare("DELETE FROM contact_messages WHERE id = ?");
    echo json_encode(["status" => $stmt->execute([$data->id]) ? "success" : "error"]);
}
else {
    echo json_encode(["status" => "error", "message" => "Invalid Action"]);
}
?>