<?php
// booking_api.php

// 1. Disable Error Reporting to Browser (Prevents JSON breaking)
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require 'db_connect.php';

// 2. Clear Buffer & Set Header
ob_clean();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// --- HELPER: PAYMONGO SESSION ---
function createPayMongoSession($amount, $description, $bookingId) {
    // ⚠️ REPLACE WITH YOUR ACTUAL PAYMONGO SECRET KEY
    $apiKey = 'sk_test_8Ns3ZWM1ucEPrvuGtZBUmQ2B'; 

    $cleanAmount = preg_replace('/[^0-9.]/', '', $amount);
    $amountInCentavos = (int)(floatval($cleanAmount) * 100);

    if ($amountInCentavos < 10000) return null;

    $url = 'https://api.paymongo.com/v1/checkout_sessions';
    
    // URLs
    $successUrl = 'http://localhost/wonderpet/booking.html?upload_proof_for=' . $bookingId;
    $cancelUrl = 'http://localhost/wonderpet/booking.html?error=cancelled';

    $data = [
        'data' => [
            'attributes' => [
                'line_items' => [[
                    'currency' => 'PHP',
                    'amount' => $amountInCentavos,
                    'description' => $description,
                    'name' => 'Pawfect Grooming Service',
                    'quantity' => 1
                ]],
                'payment_method_types' => ['gcash', 'grab_pay', 'paymaya', 'card'],
                'description' => $description,
                'redirect' => ['success' => $successUrl, 'failed' => $cancelUrl]
            ]
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Basic ' . base64_encode($apiKey)]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// ---------------------------------------------------------
// 1. CREATE BOOKING
// ---------------------------------------------------------
if ($method === 'POST' && $action === '') {
    $owner_name = $_POST['owner_name'] ?? '';
    $owner_email = $_POST['owner_email'] ?? '';
    $owner_phone = $_POST['owner_phone'] ?? '';
    $pet_name = $_POST['pet_name'] ?? '';
    $pet_type = $_POST['pet_type'] ?? '';
    $service_input = $_POST['service_type'] ?? '';
    $service_type = is_array($service_input) ? implode(", ", $service_input) : $service_input;
    $price = $_POST['price'] ?? 0;
    $appointment_date = $_POST['appointment_date'] ?? '';
    $appointment_time = $_POST['appointment_time'] ?? '';
    $payment_method = $_POST['payment_method'] ?? '';

    $sql = "INSERT INTO bookings (owner_name, owner_email, owner_phone, pet_name, pet_type, service_type, price, appointment_date, appointment_time, payment_method, payment_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'pending')";
    $stmt = $pdo->prepare($sql);
    
    try {
        $stmt->execute([$owner_name, $owner_email, $owner_phone, $pet_name, $pet_type, $service_type, $price, $appointment_date, $appointment_time, $payment_method]);
        $bookingId = $pdo->lastInsertId();

        $checkoutUrl = null;
        if ($payment_method === 'GCash_PayMongo' && $price > 0) {
            $payMongoResponse = createPayMongoSession($price, "Service for " . $pet_name, $bookingId);
            if (isset($payMongoResponse['data']['attributes']['checkout_url'])) {
                $checkoutUrl = $payMongoResponse['data']['attributes']['checkout_url'];
            }
        }

        echo json_encode([
            "status" => "success", 
            "message" => "Booking initialized!", 
            "checkout_url" => $checkoutUrl,
            "booking_id" => $bookingId
        ]);

    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "DB Error: " . $e->getMessage()]);
    }
}

// ---------------------------------------------------------
// 2. UPLOAD PROOF (UPDATED)
// ---------------------------------------------------------
elseif ($method === 'POST' && $action === 'upload_proof') {
    $bookingId = $_POST['booking_id'] ?? null;
    $refNumber = $_POST['payment_reference'] ?? null; // Capture Reference Number

    if (!$bookingId || empty($_FILES['proof_image'])) {
        echo json_encode(["status" => "error", "message" => "Missing booking ID or file."]);
        exit;
    }

    $uploadDir = 'uploads/proofs/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

    $fileTmpPath = $_FILES['proof_image']['tmp_name'];
    $fileName = $_FILES['proof_image']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    $newFileName = 'proof_' . $bookingId . '_' . time() . '.' . $fileExtension;
    $dest_path = $uploadDir . $newFileName;

    if (move_uploaded_file($fileTmpPath, $dest_path)) {
        // Updated Query to include payment_reference
        $stmt = $pdo->prepare("UPDATE bookings SET payment_proof = ?, payment_status = 'Paid', payment_reference = ? WHERE id = ?");
        if ($stmt->execute([$dest_path, $refNumber, $bookingId])) {
            echo json_encode(["status" => "success", "message" => "Proof uploaded!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "DB Update Failed"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "File upload failed."]);
    }
}

// ---------------------------------------------------------
// 3. GET FUNCTIONS
// ---------------------------------------------------------
elseif ($method === 'GET' && $action === 'get_user_bookings') {
    $email = $_GET['email'] ?? '';
    if($email) {
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE owner_email = ? ORDER BY appointment_date DESC");
        $stmt->execute([$email]);
        echo json_encode($stmt->fetchAll());
    } else { echo json_encode([]); }
}
elseif ($method === 'GET' && $action === 'get_all') {
    $stmt = $pdo->query("SELECT * FROM bookings ORDER BY appointment_date DESC");
    echo json_encode($stmt->fetchAll());
}

// ---------------------------------------------------------
// 4. UPDATE BOOKING
// ---------------------------------------------------------
elseif ($method === 'POST' && $action === 'update') {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!$data) {
            throw new Exception("Invalid JSON data received.");
        }

        $stmt = $pdo->prepare("UPDATE bookings SET service_type=?, status=?, payment_status=?, appointment_date=?, appointment_time=? WHERE id=?");
        
        $result = $stmt->execute([
            $data->service_type, 
            $data->status, 
            $data->payment_status, 
            $data->appointment_date, 
            $data->appointment_time, 
            $data->id
        ]);
        
        if ($result) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update database record."]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// ---------------------------------------------------------
// 5. DELETE BOOKING
// ---------------------------------------------------------
elseif ($method === 'POST' && $action === 'delete') {
    try {
        $data = json_decode(file_get_contents("php://input"));
        $stmt = $pdo->prepare("DELETE FROM bookings WHERE id=?");
        if ($stmt->execute([$data->id])) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Delete failed"]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
else {
    echo json_encode(["status" => "error", "message" => "Invalid Action"]);
}
?>