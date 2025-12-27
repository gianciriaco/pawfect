<?php
// 1. Clean Output Buffer (Prevents JSON errors)
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require 'db_connect.php';

ob_clean();
header('Content-Type: application/json');

// 2. Handle POST Request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data
    $data = json_decode(file_get_contents("php://input"));

    // Validation
    if (empty($data->name) || empty($data->email) || empty($data->subject) || empty($data->message)) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }

    try {
        // Insert into Database
        $sql = "INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            trim($data->name),
            trim($data->email),
            trim($data->subject),
            trim($data->message)
        ]);

        echo json_encode(["status" => "success", "message" => "Message sent successfully!"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid Request Method"]);
}
?>