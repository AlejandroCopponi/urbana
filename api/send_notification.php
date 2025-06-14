<?php

// Incluir el autocargador de Composer para cargar todas las librerías necesarias.
// Asegúrate de que la carpeta 'vendor' esté en la raíz de public_html.
require __DIR__ . '/../vendor/autoload.php';

// Ahora que el autocargador está configurado, podemos usar las clases directamente
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// Configuración de la base de datos MySQL (DEBE SER LA MISMA QUE EN subscribe.php)
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

// Conexión a la base de datos
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar la conexión
if ($conn->connect_error) {
    error_log("Error de conexión a la base de datos al enviar notif: " . $conn->connect_error);
    http_response_code(500);
    echo "Error interno del servidor al conectar con DB.";
    exit();
}

// --- CONFIGURACIÓN DE LA NOTIFICACIÓN A ENVIAR ---
$notification_title = "¡Estación Urbana en Vivo!";
$notification_body = "Sintoniza ahora para disfrutar de la mejor música y programación.";
$notification_icon = 'https://appurbana.com.ar/assets/icons/icon-192x192.png'; // Ruta completa a tu icono
$notification_url = 'https://appurbana.com.ar/'; // URL a abrir al hacer clic en la notificación
$notification_image = 'https://appurbana.com.ar/assets/images/logo.png'; // Opcional: Imagen grande para la notificación

// Crear el payload (contenido) de la notificación
$notification_payload = json_encode([
    'title' => $notification_title,
    'body' => $notification_body,
    'icon' => $notification_icon,
    'image' => $notification_image, // Si la usas
    'data' => [
        'url' => $notification_url
    ]
]);

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

// 3. Enviar la notificación a cada suscripción usando queueNotification
// Se utiliza queueNotification para agrupar las notificaciones y luego flush() las envía.
foreach ($subscriptions as $index => $subscription) {
    if (!($subscription instanceof Subscription)) { // Asegurarse de que sea un objeto Subscription válido
        error_log("Suscripción inválida en el índice " . $index . ". Saltando.");
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
        echo "[OK] Notificación enviada con éxito a: {$endpoint}\n";
        $success_count++;
    } else {
        echo "[ERROR] Falló el envío de la notificación a: {$endpoint}\n";
        echo "Error: {$report->getReason()}\n";
        $failure_count++;
        
        // Manejar suscripciones caducadas o no válidas
        if ($report->isSubscriptionExpired()) {
            echo "[ELIMINADO] Suscripción caducada, eliminando de la base de datos.\n";
            $delete_stmt = $conn->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?");
            $delete_stmt->bind_param("s", $endpoint);
            $delete_stmt->execute();
            $delete_stmt->close();
        } elseif (strpos($report->getReason(), '404 Not Found') !== false || strpos($report->getReason(), '410 Gone') !== false || strpos($report->getReason(), '400 Bad Request') !== false) {
            // También eliminar si es un error irrecuperable como Not Found o Bad Request
            echo "[ELIMINADO] Suscripción eliminada debido a error: " . $report->getReason() . " para {$endpoint}\n";
            $delete_stmt = $conn->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?");
            $delete_stmt->bind_param("s", $endpoint);
            $delete_stmt->execute();
            $delete_stmt->close();
        }
    }
}

$conn->close();

echo "Proceso de envío de notificaciones completado.\n";
echo "Enviadas con éxito: {$success_count}\n";
echo "Fallidas: {$failure_count}\n";

?>



