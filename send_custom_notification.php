<?php

// Incluir el autocargador de Composer para cargar todas las librerías necesarias.
// Asegúrate de que la carpeta 'vendor' esté en la raíz de public_html.
require __DIR__ . '/../vendor/autoload.php';

// Ahora que el autocargador está configurado, podemos usar las clases directamente
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// Configuración de la base de datos MySQL (DEBE SER LA MISMA QUE EN subscribe.php y send_notification.php)
// ¡IMPORTANTE! Reemplaza estos valores con los detalles REALES de tu base de datos
$servername = "localhost"; // O la IP/host de tu servidor de base de datos
$username = "c2761433_ale"; // Tu usuario de MySQL
$password = "Planta21013"; // Tu contraseña de MySQL
$dbname = "c2761433_noti"; // El nombre de tu base de datos

// CLAVES VAPID (Voluntary Application Server Identification)
// ¡IMPORTANTE! REEMPLAZA ESTO CON TUS CLAVES REALES GENERADAS
// La 'publicKey' es la misma que pusiste en app.js
// La 'privateKey' es la que DEBES MANTENER SECRETA en tu servidor
$VAPID_publicKey = 'BJEyQla7wjyWTmrB44rbYivG_j94zFWKK0ABAU3eWWbGXz6jQgvhnUjHPcX4smFQLqcXWdsptFm5LiHYOsg1xZI'; // TU CLAVE PÚBLICA VAPID REAL
$VAPID_privateKey = 'FTU8F0h0V0uTq9VDncaRZ8zlRK8nB3SlqPftNCAVWpc'; // TU CLAVE PRIVADA VAPID REAL Y SECRETA

// Contacto para VAPID (puede ser tu email o una URL)
$VAPID_subject = 'mailto:copponialejandro@gmail.com'; // <<< REEMPLAZA CON TU EMAIL REAL

// Configuración de CORS para permitir solicitudes desde tu propio dominio (si el formulario está en un subdominio o diferente)
header("Access-Control-Allow-Origin: https://appurbana.com.ar"); // Reemplaza con el dominio EXACTO de tu PWA o el dominio del formulario
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

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

// --- Obtener datos del formulario ---
$notification_title = isset($_POST['title']) ? htmlspecialchars($_POST['title']) : "Nueva Notificación";
$notification_body = isset($_POST['body']) ? htmlspecialchars($_POST['body']) : "Contenido de la notificación.";

// --- CONFIGURACIÓN DE LA NOTIFICACIÓN A ENVIAR (Iconos y URL Fijos) ---
// Estos valores son fijos y puedes personalizarlos aquí si quieres que todas tus notificaciones
// desde este panel usen los mismos iconos y URL de destino.
$notification_icon = 'https://appurbana.com.ar/assets/icons/icon-192x192.png'; // Ruta completa a tu icono
$notification_url = 'https://appurbana.com.ar/'; // URL a abrir al hacer clic en la notificación
$notification_image = 'https://appurbana.com.ar/assets/images/logo.png'; // Opcional: Imagen grande para la notificación

// Crear el payload (contenido) de la notificación
$notification_payload = json_encode([
    'title' => $notification_title,
    'body' => $notification_body,
    'icon' => $notification_icon,
    'image' => $notification_image,
    'data' => [
        'url' => $notification_url
    ]
]);

// Conexión a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar la conexión
if ($conn->connect_error) {
    error_log("Error de conexión a la base de datos al enviar notif: " . $conn->connect_error);
    http_response_code(500);
    echo "Error interno del servidor al conectar con DB.";
    exit();
}

// --- ENVIAR NOTIFICACIONES A TODAS LAS SUSCRIPCIONES ---

// 1. Recuperar todas las suscripciones de la base de datos
$subscriptions = [];
$sql = "SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        try {
            $subscriptions[] = Subscription::create([
                'endpoint' => $row['endpoint'],
                'publicKey' => $row['p256dh_key'],
                'authToken' => $row['auth_key'],
                'contentEncoding' => 'aesgcm' // Este es el estándar
            ]);
        } catch (Exception $e) {
            error_log("Error creando objeto Subscription desde DB: " . $e->getMessage());
            // Opcional: eliminar suscripción si el formato es inválido o corrupto
        }
    }
} else {
    echo "No hay suscripciones guardadas en la base de datos.";
    exit();
}

// 2. Configurar WebPush
$auth = [
    'VAPID' => [
        'subject' => $VAPID_subject,
        'publicKey' => $VAPID_publicKey,
        'privateKey' => $VAPID_privateKey,
    ],
];

$webPush = new WebPush($auth);

$success_count = 0;
$failure_count = 0;
$messages = []; // Para almacenar los mensajes de resultado

// 3. Enviar la notificación a cada suscripción usando queueNotification
foreach ($subscriptions as $index => $subscription) {
    if (!($subscription instanceof Subscription)) {
        error_log("Suscripción inválida en el índice " . $index . ". Saltando.");
        $messages[] = "[ERROR] Suscripción inválida en el índice " . $index . ".";
        $failure_count++;
        continue;
    }

    $webPush->queueNotification(
        $subscription,
        $notification_payload
    );
}

// 4. Procesar las respuestas de los servicios de push con flush()
foreach ($webPush->flush() as $report) {
    $endpoint = $report->getRequest()->getUri()->__toString();

    if ($report->isSuccess()) {
        $messages[] = "[OK] Notificación enviada con éxito a: {$endpoint}";
        $success_count++;
    } else {
        $reason = $report->getReason();
        $messages[] = "[ERROR] Falló el envío de la notificación a: {$endpoint}. Error: {$reason}";
        $failure_count++;
        
        // Manejar suscripciones caducadas o no válidas
        if ($report->isSubscriptionExpired() || strpos($reason, '404 Not Found') !== false || strpos($reason, '410 Gone') !== false || strpos($reason, '400 Bad Request') !== false) {
            $messages[] = "[ELIMINADO] Suscripción eliminada debido a error: {$reason} para {$endpoint}";
            $delete_stmt = $conn->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?");
            $delete_stmt->bind_param("s", $endpoint);
            $delete_stmt->execute();
            $delete_stmt->close();
        }
    }
}

$conn->close();

// Enviar una respuesta consolidada al cliente
echo "Proceso de envío de notificaciones completado.\n";
echo "Enviadas con éxito: {$success_count}\n";
echo "Fallidas: {$failure_count}\n\n";
echo implode("\n", $messages); // Mostrar todos los mensajes individuales

?>
