<?php
header('Content-Type: application/json'); // Indica que la respuesta será JSON
header('Access-Control-Allow-Origin: *'); // Permite solicitudes desde cualquier origen. Para producción, cambia '*' a tu dominio (ej. 'https://appurbana.com.ar')
header('Access-Control-Allow-Methods: POST'); // Solo permite el método POST
header('Access-Control-Allow-Headers: Content-Type'); // Solo permite el encabezado Content-Type

// Manejo de la solicitud OPTIONS (preflight request de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Incluir las clases de PHPMailer
    // Asegúrate de que esta ruta sea correcta a donde subiste PHPMailer
    require 'PHPMailer/src/PHPMailer.php';
    require 'PHPMailer/src/SMTP.php';
    require 'PHPMailer/src/Exception.php';

    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use PHPMailer\PHPMailer\Exception;

    // Lee el cuerpo de la solicitud JSON
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Error JSON inválido: " . json_last_error_msg());
        echo json_encode(['success' => false, 'message' => 'Error: Datos JSON inválidos.']);
        exit();
    }

    // Recoge los datos del formulario
    $name = isset($data['name']) ? htmlspecialchars(strip_tags($data['name'])) : '';
    $phone = isset($data['phone']) ? htmlspecialchars(strip_tags($data['phone'])) : '';
    $message = isset($data['message']) ? htmlspecialchars(strip_tags($data['message'])) : '';

    // Valida los datos (simple validación)
    if (empty($name) || empty($phone) || empty($message)) {
        echo json_encode(['success' => false, 'message' => 'Error: Todos los campos son obligatorios.']);
        exit();
    }

    $mail = new PHPMailer(true); // Pasar 'true' habilita las excepciones para depuración

    try {
        // Configuración del servidor SMTP (¡con tus datos de Ferozo!)
        $mail->isSMTP();                                            // Usar SMTP
        $mail->Host       = 'c2761433.ferozo.com';                  // Servidor SMTP de Ferozo
        $mail->SMTPAuth   = true;                                   // Habilitar autenticación SMTP
        $mail->Username   = 'publicidad@appurbana.com.ar';          // <--- ¡TU EMAIL DE PUBLICIDAD!
        $mail->Password   = 'Planta21013*';             // <--- ¡LA CONTRASEÑA DE ESE EMAIL!
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;            // Habilitar cifrado SSL (por el puerto 465)
        $mail->Port       = 465;                                    // Puerto TCP para conectar (465 para SMTPS)
        $mail->CharSet    = 'UTF-8';                                // Soporte de caracteres para tildes y ñ

        // Remitente (De dónde se envía el correo)
        // Esta debe ser la misma cuenta que usas en $mail->Username
        $mail->setFrom('publicidad@appurbana.com.ar', 'AppUrbana Publicidad'); 
        $mail->addReplyTo('publicidad@appurbana.com.ar', $name); // Para que respondan al email de publicidad

        // Destinatario (A dónde llega el correo - tu cuenta de Live/Outlook)
        $mail->addAddress('tu_cuenta_live@outlook.com'); // <--- ¡TU DIRECCIÓN DE LIVE/OUTLOOK AQUÍ!

        // Contenido del correo
        $mail->isHTML(false); // No es HTML, es texto plano
        $mail->Subject = "Consulta de Publicidad desde la PWA: {$name}";
        $mail->Body    = "Apellido y Nombre: {$name}\n";
        $mail->Body   .= "Teléfono: {$phone}\n\n";
        $mail->Body   .= "Mensaje:\n{$message}\n\n";
        $mail->Body   .= "--\nEnviado desde la PWA Estación Urbana";

        $mail->send();
        echo json_encode(['success' => true, 'message' => '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.']);
    } catch (Exception $e) {
        // Error detallado si PHPMailer falla
        // Esto registrará el error en los logs de PHP de tu servidor (si están configurados)
        error_log("PHPMailer Error al enviar correo: {$mail->ErrorInfo} | Exception: {$e->getMessage()}"); 
        echo json_encode(['success' => false, 'message' => "Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde. Detalles: {$mail->ErrorInfo}"]);
    }
} else {
    // Si no es una solicitud POST, responde con un error
    http_response_code(405); // Método no permitido
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
?>