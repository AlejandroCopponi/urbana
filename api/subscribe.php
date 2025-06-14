<?php

// Configuración de la base de datos MySQL
// ¡IMPORTANTE! Reemplaza estos valores con los detalles REALES de tu base de datos
$servername = "localhost"; // O la IP/host de tu servidor de base de datos. Anota el que te dio tu hosting.
$username = "c2761433_ale"; // <<< === REEMPLAZA ESTO CON EL NOMBRE DE USUARIO REAL DE TU BASE DE DATOS === >>>
$password = "Planta21013"; // <<< === REEMPLAZA ESTO CON LA CONTRASEÑA REAL DE TU USUARIO DE BASE DE DATOS === >>>
$dbname = "c2761433_noti"; // <<< === REEMPLAZA ESTO CON EL NOMBRE REAL DE TU BASE DE DATOS === >>>

// Configuración de CORS para permitir solicitudes desde tu PWA
// Esto es CRÍTICO para que tu JavaScript pueda comunicarse con este endpoint
header("Access-Control-Allow-Origin: https://appurbaba.com.ar"); // Reemplaza con el dominio EXACTO de tu PWA (ya lo hicimos pero verifícalo)
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Si es una solicitud OPTIONS (preflight CORS), respondemos y salimos
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Asegurarse de que la solicitud sea POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Método no permitido
    echo json_encode(["success" => false, "message" => "Método no permitido."]);
    exit();
}

// Obtener el cuerpo de la solicitud JSON
$input = file_get_contents("php://input");
$subscription = json_decode($input, true);

// Validar que los datos de la suscripción estén presentes
if (!isset($subscription['endpoint']) || !isset($subscription['keys']['p256dh']) || !isset($subscription['keys']['auth'])) {
    http_response_code(400); // Solicitud incorrecta
    echo json_encode(["success" => false, "message" => "Datos de suscripción incompletos."]);
    exit();
}

$endpoint = $subscription['endpoint'];
$p256dh_key = $subscription['keys']['p256dh'];
$auth_key = $subscription['keys']['auth'];

// Conexión a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar la conexión
if ($conn->connect_error) {
    error_log("Error de conexión a la base de datos: " . $conn->connect_error); // Loguear el error en el servidor
    http_response_code(500); // Error interno del servidor
    echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos."]);
    exit();
}

// Preparar y ejecutar la consulta para insertar (o actualizar si ya existe) la suscripción
// Usamos INSERT ... ON DUPLICATE KEY UPDATE para manejar casos donde el endpoint ya existe.
// Esto es útil si el usuario se suscribe de nuevo y el endpoint no ha cambiado.
$stmt = $conn->prepare("INSERT INTO push_subscriptions (endpoint, p256dh_key, auth_key) VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE p256dh_key = VALUES(p256dh_key), auth_key = VALUES(auth_key)");
$stmt->bind_param("sss", $endpoint, $p256dh_key, $auth_key);

if ($stmt->execute()) {
    http_response_code(200); // OK
    echo json_encode(["success" => true, "message" => "Suscripción guardada con éxito."]);
} else {
    error_log("Error al guardar la suscripción: " . $stmt->error); // Loguear el error
    http_response_code(500); // Error interno del servidor
    echo json_encode(["success" => false, "message" => "Error al guardar la suscripción."]);
}

$stmt->close();
$conn->close();

?>
