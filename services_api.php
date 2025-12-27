<?php
// services_api.php

// 1. Clean Output Buffer
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require 'db_connect.php';

ob_clean();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// 1. GET ALL SERVICES
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM services ORDER BY id ASC");
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) { echo json_encode([]); }
}

// 2. ADD or UPDATE SERVICE (Handles File Uploads)
elseif ($method === 'POST' && ($action === 'add' || $action === 'update')) {
    
    // For Multipart forms, use $_POST and $_FILES, not php://input
    $id = $_POST['id'] ?? null;
    $name = $_POST['name'] ?? '';
    $description = $_POST['description'] ?? '';
    $price = $_POST['price'] ?? 0;
    
    // Default to current image (hidden input) or default logo
    $imagePath = $_POST['current_image'] ?? 'homepage_picture/logo.png';

    // CHECK FOR NEW FILE UPLOAD
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = 'uploads/services/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileTmpPath = $_FILES['image']['tmp_name'];
        $fileName = $_FILES['image']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        if (in_array($fileExtension, $allowedExtensions)) {
            // Generate unique filename
            $newFileName = 'service_' . time() . '_' . rand(1000, 9999) . '.' . $fileExtension;
            $dest_path = $uploadDir . $newFileName;

            if(move_uploaded_file($fileTmpPath, $dest_path)) {
                $imagePath = $dest_path;
            }
        }
    }

    try {
        if ($action === 'add') {
            $sql = "INSERT INTO services (name, description, price, image) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([$name, $description, $price, $imagePath]);
        } else {
            // Update existing
            $sql = "UPDATE services SET name=?, description=?, price=?, image=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute([$name, $description, $price, $imagePath, $id]);
        }

        if ($result) {
            echo json_encode(["status" => "success", "message" => "Service saved successfully!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Database operation failed"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// 3. DELETE SERVICE
elseif ($method === 'POST' && $action === 'delete') {
    // Keeps JSON input for simple deletes
    $data = json_decode(file_get_contents("php://input"));
    try {
        $stmt = $pdo->prepare("DELETE FROM services WHERE id = ?");
        echo json_encode(["status" => $stmt->execute([$data->id]) ? "success" : "error"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>