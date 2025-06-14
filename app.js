// app.js

// --- Código de registro de Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
            .then(registration => {
                console.log('Service Worker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.error('Fallo el registro del Service Worker:', error);
            });
    });
}
// --- Fin del código de Service Worker ---

// --- Lógica para el overlay de instalación de PWA ---
let deferredPrompt;
// Referencias a los elementos del DOM relacionados con la instalación (pueden ser globales)
const installPromptOverlay = document.getElementById('installPromptOverlay');
const customInstallButton = document.getElementById('customInstallButton');
const appWrapper = document.getElementById('app-wrapper'); // Contenedor principal de tu app

// Función para ocultar la UI principal y mostrar solo el overlay de instalación
function hideMainAppUI() {
    // Solo ocultamos el appWrapper si el overlay de instalación está realmente visible.
    // Esto evita que oculte la UI cuando no es necesario.
    if (installPromptOverlay && !installPromptOverlay.classList.contains('hidden')) {
         if (appWrapper) appWrapper.style.display = 'none';
    }

    // Se intentan cerrar los paneles por si ya estaban abiertos.
    // Es clave que el JS no falle si estos elementos aún no han sido cargados.
    document.getElementById('side-menu')?.classList.remove('open');
    document.getElementById('menu-overlay')?.classList.remove('open');
    document.getElementById('selection-panel')?.classList.remove('open');
    document.getElementById('alarm-panel')?.classList.remove('open');
    document.getElementById('contact-panel')?.classList.remove('open');

    // Opcional: pausar la radio si está sonando para enfocar en la instalación
    const radioStream = document.getElementById('radio-stream');
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (radioStream && !radioStream.paused) {
        radioStream.pause();
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; // Usar icono de Font Awesome
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
        }
    }
    console.log('UI principal oculta.');
}

// Función para mostrar la UI principal
function showMainAppUI() {
    if (appWrapper) appWrapper.style.display = ''; // Restaura el display por defecto
    console.log('UI principal restaurada.');
}

// Detecta si la PWA ya está instalada o se ejecuta en modo standalone
function isInStandaloneMode() {
    return (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://'));
}

// Función para verificar el estado de instalación de la PWA y ocultar/mostrar elementos
function checkPWAInstallState() {
    if (isInStandaloneMode()) {
        console.log('PWA ya instalada o en standalone. Ocultando elementos de instalación.');
        if (installPromptOverlay) {
            installPromptOverlay.classList.add('hidden');
        }
        showMainAppUI();
    } else {
        // Si NO está instalada, asegúrate de que el overlay de instalación esté oculto por defecto
        // hasta que el beforeinstallprompt se dispare.
        if (installPromptOverlay) {
            installPromptOverlay.classList.add('hidden');
        }
        showMainAppUI();
    }
}

// Llama a esta función al cargar la página para verificar el estado inicial
window.addEventListener('load', checkPWAInstallState);
// También puedes verificarla en cada cambio del modo de visualización
window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWAInstallState);
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Evita que el navegador muestre su propio mensaje automáticamente
    deferredPrompt = e; // Guarda el evento para poder dispararlo más tarde
    console.log('Evento beforeinstallprompt capturado.');

    // Muestra tu overlay de instalación personalizado
    if (installPromptOverlay) {
        installPromptOverlay.classList.remove('hidden'); // Hace visible el overlay grande
        hideMainAppUI(); // Oculta la UI principal para enfocar en la instalación
        console.log('Overlay de instalación visible.');
    }
});

// Listener para el clic en tu botón de instalación personalizado (el del overlay grande)
if (customInstallButton) {
    customInstallButton.addEventListener('click', async () => {
        console.log('Botón de instalación del overlay clicado. Intentando mostrar prompt nativo.');

        if (deferredPrompt) {
            deferredPrompt.prompt();

            const { outcome } = await deferredPrompt.userChoice;

            console.log(`El usuario respondió al prompt de instalación (desde overlay): ${outcome}`);

            deferredPrompt = null;

            if (outcome === 'accepted') {
                console.log('PWA instalada con éxito (desde overlay). Ocultando overlay y restaurando UI.');
                if (installPromptOverlay) {
                    installPromptOverlay.classList.add('hidden');
                }
                showMainAppUI();
            } else {
                console.log('Instalación de PWA rechazada o descartada (desde overlay). Manteniendo overlay visible.');
            }
        } else {
            console.log('El evento beforeinstallprompt no está disponible o ya se usó (desde overlay). Proporcionando instrucciones manuales.');
            const isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
            if (isIOS) {
                // Modified to use custom modal instead of alert
                showCustomAlert('Para instalar "Estación Urbana 104.7" en tu iPhone o iPad:\n\n1. Toca el icono de "Compartir" (un cuadrado con una flecha hacia arriba) en la barra inferior de Safari.\n\n2. Desliza hacia abajo y selecciona "Añadir a pantalla de inicio".');
            } else {
                // Modified to use custom modal instead of alert
                showCustomAlert('Tu navegador no permite la instalación directa en este momento. Por favor, busca la opción "Añadir a pantalla de inicio" o "Instalar aplicación" en el menú de tu navegador (generalmente los 3 puntos en la esquina).');
            }
        }
    });
}

// Evento que se dispara cuando la PWA se instala (útil para ocultar el overlay permanentemente)
window.addEventListener('appinstalled', () => {
    console.log('PWA instalada directamente. Ocultando elementos de instalación.');
    if (installPromptOverlay) {
        installPromptOverlay.classList.add('hidden'); // Asegura que el overlay se oculte
    }
    showMainAppUI(); // Asegura que la UI principal se muestre
});
// --- Fin de la lógica para el overlay de instalación de PWA ---

// Referencias a los elementos del modal de alerta personalizado
let customAlertDialog;
let customAlertMessage;
let customAlertCloseButton;

document.addEventListener('DOMContentLoaded', () => {
    // TODAS LAS REFERENCIAS A ELEMENTOS DEL DOM DEBEN IR DENTRO DE ESTE BLOQUE
    // para asegurar que el HTML ya se haya cargado.

    const playPauseBtn = document.getElementById('play-pause-btn');
    const radioStream = document.getElementById('radio-stream');
    const programNameSpan = document.getElementById('program-name');
    
    // Elementos del menú lateral
    const menuToggle = document.getElementById('menu-icon');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenuBtn = document.getElementById('close-menu');
    const shareIcon = document.getElementById('share-icon'); // NUEVA REFERENCIA: icono de compartir

    // Elementos de los Paneles
    const selectionPanel = document.getElementById('selection-panel'); // Panel del timer
    const alarmPanel = document.getElementById('alarm-panel');         // Panel de la alarma
    const contactPanel = document.getElementById('contact-panel');

    // Elementos del Panel del Timer
    const timerOptionInMenu = document.getElementById('menu-timer-option');
    const timerPanelCloseBtn = document.getElementById('timer-panel-close-btn');
    const timerSetTimeInput = document.getElementById('timer-set-time');
    const setTimerByTimeBtn = document.getElementById('set-timer-by-time-btn');
    const cancelTimerBtn = document.getElementById('cancel-timer-btn');
    const mainAppTimerCountdown = document.getElementById('main-app-timer-countdown');

    // --- Elementos del Panel de Alarma ---
    const alarmOptionInMenu = document.getElementById('menu-alarm');
    const alarmPanelCloseBtn = document.getElementById('alarm-panel-close-btn');
    const alarmSetTimeInput = document.getElementById('alarm-set-time');
    const setAlarmBtn = document.getElementById('set-alarm-btn');
    const cancelAlarmBtn = document.getElementById('cancel-alarm-btn');

    // --- Lógica del Panel de Contacto para Publicidad ---
    const menuPublicityOption = document.getElementById('menu-publicity');
    const mainPublicityButton = document.getElementById('main-publicity-button');
    const contactPanelCloseBtn = document.getElementById('contact-panel-close-btn');
    const contactForm = document.getElementById('contact-form');
    const contactFormStatus = document.getElementById('contact-form-status');
    const contactNameInput = document.getElementById('contact-name');
    const contactPhoneInput = document.getElementById('contact-phone');
    const contactMessageInput = document.getElementById('contact-message');

    // REFERENCIAS A ELEMENTOS PARA EL VOLUMEN Y EL ESPECTRO DE SONIDO
    const volumeIconBtn = document.getElementById('volume-icon-btn');
    const volumeSliderPanel = document.getElementById('volume-slider-panel');
    const customVolumeSlider = document.getElementById('custom-volume-slider');
    const customSliderThumb = document.getElementById('custom-slider-thumb');
    const audioSpectrum = document.getElementById('audio-spectrum'); // NUEVA REFERENCIA: espectro de sonido

    // Variables de estado del reproductor
    let isPlaying = false;
    let countdownInterval;
    let timerTimeout;
    let alarmTimeout;
    let isAlarmActive = false; // Estado local, no se persiste

    // Custom Alert Modal Elements (Se inicializan y adjuntan al DOM aquí, una vez)
    // Es crucial que customAlertDialog sea declarado como 'let' y no 'const' aquí si se va a reasignar
    // Si ya está declarada globalmente arriba, entonces solo se asigna el valor.
    if (!customAlertDialog) { // Previene la recreación si ya existe
        customAlertDialog = document.createElement('div');
        customAlertDialog.id = 'customAlertDialog';
        customAlertDialog.className = 'custom-alert-dialog hidden';
        customAlertDialog.innerHTML = `
            <div class="custom-alert-content">
                <p id="customAlertMessage"></p>
                <button id="customAlertCloseButton">OK</button>
            </div>
        `;
        document.body.appendChild(customAlertDialog);

        // Obtener referencias a los elementos internos del modal DESPUÉS de haberlo añadido al DOM
        customAlertMessage = document.getElementById('customAlertMessage');
        customAlertCloseButton = document.getElementById('customAlertCloseButton');

        if (customAlertCloseButton) {
            customAlertCloseButton.addEventListener('click', () => {
                customAlertDialog.classList.add('hidden');
            });
        }
    }


    // Función para mostrar el modal de alerta personalizado
    function showCustomAlert(message) {
        if (customAlertMessage && customAlertDialog) { // Se asegura que existan antes de usarlos
            customAlertMessage.textContent = message;
            customAlertDialog.classList.remove('hidden');
            // Se asegura de que el foco esté en el botón para accesibilidad
            customAlertCloseButton.focus();
        }
    }

    // NUEVO: Asegurarse de que el espectro esté oculto al cargar, hasta que se reproduzca
    if (audioSpectrum) {
        audioSpectrum.classList.add('hidden');
        audioSpectrum.classList.remove('active');
    }

    console.log("--- APP.JS INICIALIZADO (DOMContentLoaded) ---");
    console.log("Radio Stream Elemento:", radioStream);
    console.log("Espectro de Audio Elemento:", audioSpectrum); // <-- AÑADE ESTA LÍNEA AQUÍ

    // --- REPRODUCCIÓN AUTOMÁTICA AL ABRIR LA APP ---
    // Esta sección solo intentará reproducir si el overlay de instalación no está visible.
    // Esto previene que se intente reproducir el audio mientras se le pide al usuario instalar la PWA.
    if (!installPromptOverlay || installPromptOverlay.classList.contains('hidden')) {
        try {
            console.log("Intentando reproducción automática al inicio...");
            // Asegurarse de que el stream esté cargado antes de intentar reproducir
            if (radioStream) {
                radioStream.load();
                radioStream.play()
                    .then(() => {
                        isPlaying = true;
                        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        playPauseBtn.classList.remove('play-button');
                        playPauseBtn.classList.add('pause-button');
                        console.log("Reproducción automática iniciada con éxito. isPlaying:", isPlaying);
                        if (mainAppTimerCountdown) {
                            mainAppTimerCountdown.classList.add('hidden');
                        }
                        // MOSTRAR Y ACTIVAR ESPECTRO: Reproducción automática exitosa
                        if (audioSpectrum) {
                            audioSpectrum.classList.remove('hidden');
                            audioSpectrum.classList.add('active');
                        }
                    })
                    .catch(error => {
                        console.warn("Reproducción automática bloqueada/fallida al inicio:", error.name, error.message);
                        isPlaying = false;
                        if (playPauseBtn) {
                            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                            playPauseBtn.classList.remove('pause-button');
                            playPauseBtn.classList.add('play-button');
                        }
                        // OCULTAR Y DESACTIVAR ESPECTRO: Reproducción automática fallida
                        if (audioSpectrum) {
                            audioSpectrum.classList.add('hidden');
                            audioSpectrum.classList.remove('active');
                        }
                    });
            } else {
                console.warn("Elemento 'radio-stream' no encontrado.");
            }
        } catch (error) {
            console.error("Error inesperado en el bloque de reproducción automática:", error);
            isPlaying = false;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button');
            }
            // OCULTAR Y DESACTIVAR ESPECTRO: Error inesperado
            if (audioSpectrum) {
                audioSpectrum.classList.add('hidden');
                audioSpectrum.classList.remove('active');
            }
        }
    } else {
        console.log("Reproducción automática omitida porque el overlay de instalación está visible.");
        // OCULTAR Y DESACTIVAR ESPECTRO: Si la reproducción automática es omitida
        if (audioSpectrum) {
            audioSpectrum.classList.add('hidden');
            audioSpectrum.classList.remove('active');
        }
    }

    // --- Lógica del Botón Play/Pausa ---
    if (playPauseBtn && radioStream) {
        playPauseBtn.addEventListener('click', () => {
            console.log("Botón Play/Pause clicado. isPlaying actual:", isPlaying);
            if (isPlaying) {
                radioStream.pause();
                isPlaying = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button');
                // OCULTAR Y DESACTIVAR ESPECTRO: Al pausar
                if (audioSpectrum) {
                    audioSpectrum.classList.add('hidden');
                    audioSpectrum.classList.remove('active');
                }
                console.log("Radio PAUSADA. isPlaying:", isPlaying);
            } else {
                console.log("Intentando REPRODUCIR stream...");
                radioStream.load();
                radioStream.play()
                    .then(() => {
                        isPlaying = true;
                        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        playPauseBtn.classList.remove('play-button');
                        playPauseBtn.classList.add('pause-button');
                        // MOSTRAR Y ACTIVAR ESPECTRO: Al reproducir
                        if (audioSpectrum) {
                            audioSpectrum.classList.remove('hidden');
                            audioSpectrum.classList.add('active');
                        }
                        console.log("Reproducción iniciada con éxito por clic. isPlaying:", isPlaying);
                    })
                    .catch(error => {
                        console.error("Error al intentar reproducir la radio tras interacción:", error.name, error.message);
                        showCustomAlert("No se pudo iniciar la reproducción. Por favor, inténtalo de nuevo o revisa tu conexión.");
                        isPlaying = false;
                        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                        playPauseBtn.classList.remove('pause-button');
                        playPauseBtn.classList.add('play-button');
                        // OCULTAR Y DESACTIVAR ESPECTRO: Si falla la reproducción
                        if (audioSpectrum) {
                            audioSpectrum.classList.add('hidden');
                            audioSpectrum.classList.remove('active');
                        }
                    });
            }
        });
    }

    // --- Eventos de depuración del elemento de audio ---
    if (radioStream && playPauseBtn) {
        radioStream.addEventListener('error', (e) => {
            console.error("EVENTO DE ERROR DE AUDIO:", e);
            let errorMessage = 'Un error desconocido ocurrió.';
            switch (e.target.error.code) {
                case 1: errorMessage = 'MEDIA_ERR_ABORTED: La carga del audio fue abortada.'; break;
                case 2: errorMessage = 'MEDIA_ERR_NETWORK: Error de red al cargar el audio.'; break;
                case 3: errorMessage = 'MEDIA_ERR_DECODE: Error de decodificación de audio. Formato no soportado o corrupto.'; break;
                case 4: errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED: El formato del audio no es soportado o la URL es inaccesible/inválida (CORS).'; break;
                default: errorMessage = `Código de error: ${e.target.error.code}. Mensaje: ${e.target.error.message}`; break;
            }
            console.error("Mensaje de error detallado:", errorMessage);
            showCustomAlert("Hubo un error con el stream de radio: " + errorMessage + " Consulta la Consola (F12) para más detalles.");
            isPlaying = false;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
            // OCULTAR Y DESACTIVAR ESPECTRO: Si hay un error de audio
            if (audioSpectrum) {
                audioSpectrum.classList.add('hidden');
                audioSpectrum.classList.remove('active');
            }
        });
        radioStream.addEventListener('stalled', () => { console.warn('La descarga del stream se ha detenido inesperadamente (stalled).'); });
        radioStream.addEventListener('waiting', () => { console.log('Esperando que los datos del stream estén disponibles (waiting)...'); });
        radioStream.addEventListener('playing', () => { console.log('El stream está reproduciéndose (playing).'); });
        radioStream.addEventListener('pause', () => { console.log('El stream ha sido pausado (evento pause).'); });
        radioStream.addEventListener('ended', () => { console.log('El stream ha terminado (evento ended).'); });
    }

    // --- Lógica para el Control de Volumen ---
    console.log("--- DEBUG VOLUMEN INICIO ---");
    console.log("Referencias DOM:");
    console.log("  volumeIconBtn:", volumeIconBtn);
    console.log("  volumeSliderPanel:", volumeSliderPanel);
    console.log("  customVolumeSlider:", customVolumeSlider);
    console.log("  customSliderThumb:", customSliderThumb);
    console.log("  radioStream:", radioStream);

    if (volumeIconBtn && volumeSliderPanel && customVolumeSlider && customSliderThumb && radioStream) {
        console.log("Todos los elementos de volumen encontrados. Adjuntando listeners.");

        // Inicializar el volumen del stream (ej. 1.0 = 100%)
        radioStream.volume = 1.0;
        console.log("Volumen inicial radioStream:", radioStream.volume);

        // Actualizar el ícono del volumen al inicio (basado en el volumen inicial)
        if (radioStream.volume === 0) {
            volumeIconBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            volumeIconBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }

        let isDraggingThumb = false;

        // Función para actualizar la posición visual del thumb
        function updateThumbPosition() {
            const currentVolume = radioStream.volume;
            const updatedSliderHeight = customVolumeSlider.offsetHeight;
            const updatedThumbHeight = customSliderThumb.offsetHeight;

            if (updatedSliderHeight <= 0 || updatedThumbHeight <= 0) {
                console.warn("ADVERTENCIA: updateThumbPosition - Dimensiones del slider o thumb son cero o negativas. No se puede posicionar el thumb correctamente.");
                return; // Salir si las dimensiones no son válidas
            }

            const updatedMaxBottom = updatedSliderHeight - updatedThumbHeight;
            customSliderThumb.style.bottom = `${currentVolume * updatedMaxBottom}px`;
            console.log("updateThumbPosition: Nueva posición del thumb 'bottom':", customSliderThumb.style.bottom);
        }

        volumeIconBtn.addEventListener('click', () => {
            console.log("Clic en ícono de volumen. Alternando visibilidad del panel.");
            volumeSliderPanel.classList.toggle('hidden');

            if (!volumeSliderPanel.classList.contains('hidden')) {
                 console.log("Panel de volumen visible. Recalculando y aplicando posición del thumb.");
                 updateThumbPosition(); // Llama a la función para posicionar el thumb cuando el panel se hace visible.
            }
        });

        // --- FUNCION DE MANEJO DE ARRASTRE CENTRALIZADA ---
        function handleDrag(clientY) {
            const sliderRect = customVolumeSlider.getBoundingClientRect();
            const thumbHeight = customSliderThumb.offsetHeight;
            const sliderHeight = sliderRect.height;

            // **Validación crítica:** Asegurarse de que las dimensiones no sean cero
            if (sliderHeight === 0 || thumbHeight === 0) {
                console.error("ERROR: Dimensiones del slider o thumb son cero durante arrastre. No se puede calcular el volumen.");
                return;
            }

            // Calcular la distancia desde la parte inferior del slider hasta el cursor/toque
            let newBottom = sliderRect.bottom - clientY;
            newBottom -= thumbHeight / 2; // Ajustar para centrar la 'bolita'

            const maxBottom = sliderHeight - thumbHeight; // Rango máximo movible del thumb
            newBottom = Math.max(0, Math.min(maxBottom, newBottom));

            customSliderThumb.style.bottom = `${newBottom}px`;

            const volume = maxBottom > 0 ? newBottom / maxBottom : 0;
            radioStream.volume = volume;

            // Actualizar el ícono del volumen
            if (radioStream.volume === 0) {
                volumeIconBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                volumeIconBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }

        // --- EVENTOS DE MOUSE (para escritorio) ---
        customSliderThumb.addEventListener('mousedown', (e) => {
            isDraggingThumb = true;
            customSliderThumb.style.cursor = 'grabbing';
            console.log("mousedown en thumb. isDraggingThumb =", isDraggingThumb);
            e.preventDefault(); // Evitar la selección de texto en el escritorio
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDraggingThumb) return;
            handleDrag(e.clientY);
        });

        document.addEventListener('mouseup', () => {
            isDraggingThumb = false;
            customSliderThumb.style.cursor = 'grab';
            console.log("mouseup. isDraggingThumb =", isDraggingThumb);
        });

        // --- EVENTOS TÁCTILES (para móvil) ---
        customSliderThumb.addEventListener('touchstart', (e) => {
            isDraggingThumb = true;
            customSliderThumb.style.cursor = 'grabbing'; // No visible en móvil pero buena práctica
            console.log("touchstart en thumb. isDraggingThumb =", isDraggingThumb);
            e.preventDefault(); // CLAVE: Previene el scroll por defecto y el "click" simulado
            if (e.touches.length > 0) {
                handleDrag(e.touches[0].clientY);
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!isDraggingThumb) return;
            console.log("touchmove: clientY =", e.touches[0].clientY);
            e.preventDefault(); // CLAVE: Previene el scroll del body mientras se arrastra el slider
            if (e.touches.length > 0) {
                handleDrag(e.touches[0].clientY);
            }
        }, { passive: false }); // { passive: false } es CRÍTICO para que e.preventDefault() funcione en touchmove

        document.addEventListener('touchend', () => {
            isDraggingThumb = false;
            customSliderThumb.style.cursor = 'grab';
            console.log("touchend. isDraggingThumb =", isDraggingThumb);
        });
        document.addEventListener('touchcancel', () => {
            isDraggingThumb = false;
            customSliderThumb.style.cursor = 'grab';
            console.log("touchcancel. isDraggingThumb =", isDraggingThumb);
        });

        // --- Manejo de clic en la barra del slider (para mouse y toque simple) ---
        customVolumeSlider.addEventListener('click', (e) => {
            // Solo procesar el clic si no se estaba arrastrando
            if (isDraggingThumb) {
                console.log("Clic en slider, pero se estaba arrastrando. Ignorando.");
                return;
            }

            const sliderRect = customVolumeSlider.getBoundingClientRect();
            const thumbHeight = customSliderThumb.offsetHeight;
            const sliderHeight = sliderRect.height;

            // **Validación crítica:** Asegurarse de que las dimensiones no sean cero
            if (sliderHeight === 0 || thumbHeight === 0) {
                console.error("ERROR: Dimensiones del slider o thumb son cero durante click. No se puede calcular el volumen.");
                return;
            }

            // clientY para eventos de click
            let clientY = e.clientY;

            // Si es un evento de touch que se convirtió en click, usar touch.clientY
            if (e.touches && e.touches.length > 0) { // e.touches para touchstart que se convierte en click (raro)
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) { // e.changedTouches para touchend que dispara click
                clientY = e.changedTouches[0].clientY;
            }
            
            let newBottom = sliderRect.bottom - clientY;
            newBottom -= thumbHeight / 2;

            const maxBottom = sliderHeight - thumbHeight;
            newBottom = Math.max(0, Math.min(maxBottom, newBottom));
            
            customSliderThumb.style.bottom = `${newBottom}px`;

            const volume = maxBottom > 0 ? newBottom / maxBottom : 0;
            radioStream.volume = volume;

            console.log("Clic en barra: Volumen calculado =", volume, ", radioStream.volume =", radioStream.volume);

            if (radioStream.volume === 0) {
                volumeIconBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                volumeIconBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });

    } else {
        console.error("Faltan elementos de volumen para configurar la lógica.");
        console.log("Estado de elementos de volumen (debug):");
        console.log("  volumeIconBtn:", !!volumeIconBtn);
        console.log("  volumeSliderPanel:", !!volumeSliderPanel);
        console.log("  customVolumeSlider:", !!customVolumeSlider);
        console.log("  customSliderThumb:", !!customSliderThumb);
        console.log("  radioStream:", !!radioStream);
    }
    console.log("--- DEBUG VOLUMEN FIN ---"); // Fin del bloque de depuración del volumen

    // --- Lógica del Menú Lateral ---
    if (menuToggle && sideMenu && menuOverlay) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('open');
            // Cierra todos los paneles al abrir el menú principal
            if (selectionPanel) selectionPanel.classList.remove('open');
            if (alarmPanel) alarmPanel.classList.remove('open');
            if (contactPanel) contactPanel.classList.remove('open');
        });
    }
    if (closeMenuBtn && sideMenu && menuOverlay) {
        closeMenuBtn.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('open');
        });
    }
    if (menuOverlay && sideMenu) {
        menuOverlay.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('open');
        });
    }

    // --- Lógica para abrir/cerrar Paneles (Genérico) ---
    function openPanel(panelToOpen) {
        // Asegúrate de que los elementos del menú existan antes de manipularlos
        if (sideMenu) sideMenu.classList.remove('open');
        if (menuOverlay) menuOverlay.classList.remove('open');

        // Cierra todos los paneles antes de abrir el deseado
        // Asegúrate de que los paneles existan antes de manipularlos
        if (selectionPanel) selectionPanel.classList.remove('open');
        if (alarmPanel) alarmPanel.classList.remove('open');
        if (contactPanel) contactPanel.classList.remove('open');

        if (panelToOpen) panelToOpen.classList.add('open');
    }

    // --- Lógica del Timer de Apagado por Hora ---
    if (timerOptionInMenu && selectionPanel && timerSetTimeInput && setTimerByTimeBtn && cancelTimerBtn && mainAppTimerCountdown) {
        timerOptionInMenu.addEventListener('click', () => {
            openPanel(selectionPanel);

            // Muestra/oculta el botón de cancelar basado en si hay un timer activo
            if (!countdownInterval) {
                cancelTimerBtn.classList.add('hidden');
            } else {
                cancelTimerBtn.classList.remove('hidden');
            }

            // Establece la hora predeterminada para el input del timer (próximo múltiplo de 5 minutos)
            const now = new Date();
            let minutes = now.getMinutes();
            let hours = now.getHours();

            // Redondea al múltiplo de 5 minutos más cercano hacia arriba
            minutes = Math.ceil(minutes / 5) * 5;

            // Maneja el desbordamiento de la hora si los minutos se vuelven 60 o más
            if (minutes >= 60) {
                minutes = minutes % 60;
                hours = (hours + 1) % 24;
            }

            const defaultTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            timerSetTimeInput.value = defaultTime;
        });
    }

    if (timerPanelCloseBtn && selectionPanel) {
        timerPanelCloseBtn.addEventListener('click', () => {
            selectionPanel.classList.remove('open');
        });
    }

    if (setTimerByTimeBtn && timerSetTimeInput && radioStream && playPauseBtn && mainAppTimerCountdown && cancelTimerBtn && selectionPanel) {
        setTimerByTimeBtn.addEventListener('click', () => {
            const timeValue = timerSetTimeInput.value;
            if (!timeValue) { showCustomAlert('Por favor, selecciona una hora para el temporizador.'); return; }

            const [hoursStr, minutesStr] = timeValue.split(':');
            const targetHour = parseInt(hoursStr, 10);
            const targetMinute = parseInt(minutesStr, 10);

            const now = new Date();
            let targetDate = new Date();
            targetDate.setHours(targetHour, targetMinute, 0, 0);

            if (targetDate.getTime() <= now.getTime()) { targetDate.setDate(targetDate.getDate() + 1); }

            const timeDiffMs = targetDate.getTime() - now.getTime();
            if (timeDiffMs <= 0) { showCustomAlert('La hora seleccionada ya pasó. Intenta de nuevo.'); return; }

            clearInterval(countdownInterval);
            clearTimeout(timerTimeout);

            timerTimeout = setTimeout(() => {
                radioStream.pause();
                isPlaying = false;
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button');
                mainAppTimerCountdown.classList.add('hidden');
                // OCULTAR Y DESACTIVAR ESPECTRO: Al apagarse por temporizador
                if (audioSpectrum) {
                    audioSpectrum.classList.add('hidden');
                    audioSpectrum.classList.remove('active');
                }
                console.log('Radio apagada por temporizador.');
                showCustomAlert('El temporizador ha apagado la radio.');
                clearInterval(countdownInterval);
            }, timeDiffMs);
            let remainingTime = timeDiffMs;
            mainAppTimerCountdown.classList.remove('hidden');
            cancelTimerBtn.classList.remove('hidden');

            countdownInterval = setInterval(() => {
                remainingTime -= 1000;
                if (remainingTime <= 0) {
                    mainAppTimerCountdown.textContent = '00:00:00';
                    clearInterval(countdownInterval);
                } else {
                    const totalSeconds = Math.floor(remainingTime / 1000);
                    const hours = Math.floor((totalSeconds % 3600) / 60);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    const displayTime = [hours, minutes, seconds].map(t => String(t).padStart(2, '0')).join(':');
                    mainAppTimerCountdown.textContent = `Apagado en: ${displayTime}`;
                }
            }, 1000);
            selectionPanel.classList.remove('open');
            showCustomAlert(`Temporizador de apagado configurado para las ${timeValue}.`);
            console.log(`Temporizador de apagado configurado para las ${timeValue}.`);
        });
    }

    if (cancelTimerBtn && mainAppTimerCountdown && selectionPanel) {
        cancelTimerBtn.addEventListener('click', () => {
            clearInterval(countdownInterval);
            clearTimeout(timerTimeout);
            mainAppTimerCountdown.classList.add('hidden');
            cancelTimerBtn.classList.add('hidden');
            showCustomAlert('Temporizador de apagado cancelado.');
            console.log('Temporizador de apagado cancelado.');
            selectionPanel.classList.remove('open');
            // Si la radio estaba sonando, el espectro debería seguir activo
            if (isPlaying && audioSpectrum) {
                 audioSpectrum.classList.remove('hidden');
                 audioSpectrum.classList.add('active');
            }
        });
    }

    // --- Lógica del Panel de Alarma ---
    // NO se usa localStorage para la alarma
    
    // Función para verificar y ejecutar la alarma (solo si la app está abierta)
    // No es necesario llamar a checkAndTriggerAlarm() al cargar, ya que no hay persistencia.

    if (alarmOptionInMenu && alarmPanel && alarmSetTimeInput && setAlarmBtn && cancelAlarmBtn) {
        alarmOptionInMenu.addEventListener('click', () => {
            openPanel(alarmPanel);

            // Cargar la hora por defecto o la última establecida en la sesión actual
            const defaultAlarmHour = 7;
            const defaultAlarmMinute = 0;
            const defaultAlarmTime = `${String(defaultAlarmHour).padStart(2, '0')}:${String(defaultAlarmMinute).padStart(2, '0')}`;
            alarmSetTimeInput.value = defaultAlarmTime;
            
            // Actualizar visibilidad del botón cancelar basada en el estado de la sesión
            if (isAlarmActive) {
                cancelAlarmBtn.classList.remove('hidden');
            } else {
                cancelAlarmBtn.classList.add('hidden');
            }
        });
    }

    if (alarmPanelCloseBtn && alarmPanel) {
        alarmPanelCloseBtn.addEventListener('click', () => {
            alarmPanel.classList.remove('open');
        });
    }

    if (setAlarmBtn && alarmSetTimeInput && radioStream && playPauseBtn && cancelAlarmBtn && alarmPanel) {
        setAlarmBtn.addEventListener('click', () => {
            const timeValue = alarmSetTimeInput.value;
            if (!timeValue) {
                showCustomAlert('Por favor, selecciona una hora para la alarma.');
                return;
            }

            const [hoursStr, minutesStr] = timeValue.split(':');
            const targetHour = parseInt(hoursStr, 10);
            const targetMinute = parseInt(minutesStr, 10);

            const now = new Date();
            let targetDate = new Date();
            targetDate.setHours(targetHour, targetMinute, 0, 0);

            // Si la hora de la alarma es hoy pero ya pasó, programarla para mañana
            if (targetDate.getTime() <= now.getTime()) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const timeDiffMs = targetDate.getTime() - now.getTime();
            if (timeDiffMs <= 0) {
                showCustomAlert('La hora seleccionada ya pasó. Intenta de nuevo.');
                return;
            }

            clearTimeout(alarmTimeout); // Limpiar cualquier alarma previa

            alarmTimeout = setTimeout(() => {
                console.log('¡Alarma sonando! Intentando reproducir la radio.');
                if (radioStream.paused || radioStream.ended) {
                    radioStream.load();
                    radioStream.play()
                        .then(() => {
                            isPlaying = true;
                            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                            playPauseBtn.classList.remove('play-button');
                            playPauseBtn.classList.add('pause-button');
                            if (audioSpectrum) {
                                audioSpectrum.classList.remove('hidden');
                                audioSpectrum.classList.add('active');
                            }
                            showCustomAlert('¡Es hora! La radio se ha encendido.');
                        })
                        .catch(error => {
                            console.error('Error al reproducir la radio con la alarma:', error);
                            showCustomAlert('¡Es hora! Pero no se pudo encender la radio. Revisa la consola.');
                            if (audioSpectrum) {
                                audioSpectrum.classList.add('hidden');
                                audioSpectrum.classList.remove('active');
                            }
                        });
                } else {
                    showCustomAlert('¡Es hora! La radio ya estaba sonando.');
                }
                isAlarmActive = false; // Desactivar la alarma después de sonar
                cancelAlarmBtn.classList.add('hidden'); // Ocultar botón de cancelar
            }, timeDiffMs);

            isAlarmActive = true; // Activar la alarma para la sesión actual
            cancelAlarmBtn.classList.remove('hidden'); // Mostrar botón de cancelar
            showCustomAlert(`Alarma establecida para las ${timeValue}.`);
            console.log(`Alarma establecida para las ${timeValue}.`);
            alarmPanel.classList.remove('open');
        });
    }

    if (cancelAlarmBtn && alarmPanel) {
        cancelAlarmBtn.addEventListener('click', () => {
            clearTimeout(alarmTimeout);
            isAlarmActive = false; // Desactivar la alarma
            cancelAlarmBtn.classList.add('hidden');
            showCustomAlert('Alarma cancelada.');
            console.log('Alarma cancelada.');
            alarmPanel.classList.remove('open');
            // Si la alarma se cancela, el espectro debería seguir el estado actual de isPlaying
            if (!isPlaying && audioSpectrum) { // Si la radio NO está sonando, oculta el espectro
                audioSpectrum.classList.add('hidden');
                audioSpectrum.classList.remove('active');
            } else if (isPlaying && audioSpectrum) { // Si la radio SÍ está sonando, asegúrate de que esté visible
                audioSpectrum.classList.remove('hidden');
                audioSpectrum.classList.add('active');
            }
        });
    }

    // --- Lógica del Panel de Contacto para Publicidad ---
    if (menuPublicityOption && contactPanel && contactFormStatus && contactForm) {
        menuPublicityOption.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel(contactPanel);
            if (contactFormStatus) contactFormStatus.textContent = '';
            if (contactForm) contactForm.reset();
            if (contactFormStatus) contactFormStatus.style.color = '';
            contactFormStatus.classList.add('hidden');
        });
    }

    if (mainPublicityButton && contactPanel && contactFormStatus && contactForm) {
        mainPublicityButton.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel(contactPanel);
            if (contactFormStatus) contactFormStatus.textContent = '';
            if (contactForm) contactForm.reset();
            if (contactFormStatus) contactFormStatus.style.color = '';
            contactFormStatus.classList.add('hidden');
        });
    }

    if (contactPanelCloseBtn && contactPanel) {
        contactPanelCloseBtn.addEventListener('click', () => {
            if (contactPanel) contactPanel.classList.remove('open');
            if (contactForm) contactForm.reset();
            if (contactFormStatus) {
                contactFormStatus.textContent = '';
                contactFormStatus.classList.add('hidden');
            }
        });
    }

    if (contactForm && contactNameInput && contactPhoneInput && contactMessageInput && contactFormStatus) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = contactNameInput.value.trim();
            const phone = contactPhoneInput.value.trim();
            const message = contactMessageInput.value.trim();

            if (!name || !phone || !message) {
                if (contactFormStatus) {
                    contactFormStatus.style.color = 'var(--form-status-error)';
                    contactFormStatus.textContent = 'Por favor, completa todos los campos.';
                    contactFormStatus.classList.remove('hidden');
                }
                return;
            }

            if (contactFormStatus) {
                contactFormStatus.textContent = '';
                contactFormStatus.classList.add('hidden');
            }

            const recipient = 'copponialejandro@gmail.com';
            const subject = encodeURIComponent(`Consulta de Publicidad desde PWA: ${name}`);
            const body = encodeURIComponent(
                `Nombre: ${name}\n` +
                `Teléfono: ${phone}\n\n` +
                `Mensaje:\n${message}\n\n` +
                `--\nEnviado desde la PWA Estación Urbana`
            );
            const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;

            window.location.href = mailtoLink;
            if (contactPanel) {
                contactPanel.classList.remove('open');
            }
            if (contactForm) contactForm.reset();
        });
    }

    // --- Lógica de la Programación Actual (MODIFICADA para días de la semana) ---
    const weekdaySchedule = [
        { startHour: 7, startMinute: 0, name: 'La Primera Mañana con Damián Copponi' },
        { startHour: 10, startMinute: 0, name: 'Mañana es Tarde con Ale Copponi' },
        { startHour: 13, startMinute: 0, name: 'Tardes en Estación Urbana' },
        { startHour: 19, startMinute: 0, name: 'Música Seleccionada' },
        { startHour: 22, startMinute: 0, name: 'Conexión con Aspen' },
    ];
    const saturdaySchedule = [
        { startHour: 0, startMinute: 0, name: 'Finde en Urbana - Aspen Classic' },
    ];
    const sundaySchedule = [
        { startHour: 0, startMinute: 0, name: 'Finde en Urbana - Aspen Classic' },
    ];
    const updateProgram = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay();

        let activeSchedule = [];
        let currentProgramName = 'Lo mejor de Urbana';

        if (currentDay >= 1 && currentDay <= 5) {
            activeSchedule = weekdaySchedule;
        } else if (currentDay === 6) {
            activeSchedule = saturdaySchedule;
        } else if (currentDay === 0) {
            activeSchedule = sundaySchedule;
        }

        if (activeSchedule.length === 0) {
            if (programNameSpan) programNameSpan.textContent = currentProgramName;
            return;
        }

        for (let i = activeSchedule.length - 1; i >= 0; i--) {
            const program = activeSchedule[i];
            if (currentHour > program.startHour ||
                (currentHour === program.startHour && currentMinute >= program.startMinute)) {
                currentProgramName = program.name;
                break;
            }
        }

        if (programNameSpan) programNameSpan.textContent = currentProgramName;
    };

    updateProgram();
    setInterval(updateProgram, 60 * 1000);

    // --- Lógica de Notificaciones Push ---
    async function setupPushNotifications() {
        // 1. Verificar si el navegador soporta Service Workers y Push API
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Notificaciones Push no soportadas por este navegador.');
            // showCustomAlert('Las notificaciones push no son compatibles con este navegador.');
            return;
        }

        try {
            // 2. Obtener el registro del Service Worker
            const registration = await navigator.serviceWorker.ready;
            console.log('Service Worker listo para Push:', registration);

            // 3. Verificar el estado actual del permiso de notificaciones
            let permissionState = Notification.permission;
            console.log('Estado actual del permiso de notificación:', permissionState);

            if (permissionState === 'denied') {
                console.warn('Permiso de notificaciones denegado por el usuario.');
                showCustomAlert('No podemos enviarte notificaciones push porque las bloqueaste. Puedes cambiarlas en la configuración de tu navegador.');
                return;
            }

            // 4. Si el permiso no ha sido concedido (o es 'default'), solicitarlo
            if (permissionState === 'default') {
                const permission = await Notification.requestPermission();
                if (permission === 'denied') {
                    console.warn('Permiso de notificaciones denegado al solicitar.');
                    showCustomAlert('Has denegado el permiso para recibir notificaciones. No podremos enviarte alertas.');
                    return;
                }
            }

            // 5. Intentar obtener una suscripción existente
            const existingSubscription = await registration.pushManager.getSubscription();

            if (existingSubscription) {
                console.log('Suscripción Push existente encontrada:', existingSubscription);
                // Si ya existe una suscripción, puedes enviarla a tu servidor si aún no lo has hecho
                sendSubscriptionToServer(existingSubscription); // AHORA SÍ, SE ENVÍA LA SUSCRIPCIÓN
            } else {
                console.log('No se encontró suscripción Push existente. Creando una nueva...');
                // 6. Crear una nueva suscripción
                // Se necesita una 'applicationServerKey' para VAPID.
                // Esta clave pública es la que generaste en tu servidor.
                const applicationServerKey = 'BJEyQla7wjyWTmrB44rbYivG_j94zFWKK0ABAU3eWWbGXz6jQgvhnUjHPcX4smFQLqcXWdsptFm5LiHYOsg1xZI'; // CLAVE PÚBLICA VAPID REAL
                const convertedVapidKey = urlBase64ToUint8Array(applicationServerKey);

                const newSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
                console.log('Nueva suscripción Push creada:', newSubscription);
                showCustomAlert('¡Excelente! Recibirás notificaciones de Estación Urbana.');

                // 7. Enviar la nueva suscripción a tu servidor
                sendSubscriptionToServer(newSubscription); // AHORA SÍ, SE ENVÍA LA SUSCRIPCIÓN
            }
        } catch (error) {
            console.error('Error al configurar notificaciones Push:', error);
            showCustomAlert('Ocurrió un error al intentar configurar las notificaciones push.');
        }
    }

    // Función auxiliar para convertir VAPID public key (no modificable, es estándar)
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // --- Función para ENVIAR la Suscripción al Servidor (AHORA SE IMPLEMENTA) ---
    async function sendSubscriptionToServer(subscription) {
        // !IMPORTANTE: REEMPLAZA ESTA URL CON EL ENDPOINT REAL DE TU SERVIDOR
        // Por ejemplo: 'https://tu-dominio.com/api/save-subscription'
        // Si tu script se llama 'subscribe.php' y está en la raíz de public_html, sería 'https://appurbana.com.ar/subscribe.php'
        // Si lo pones en una carpeta 'api' dentro de public_html, sería 'https://appurbana.com.ar/api/subscribe.php'
        const SERVER_SUBSCRIPTION_URL = 'https://appurbana.com.ar/api/subscribe.php'; // <<< === REEMPLAZA ESTO CON TU RUTA REAL === >>>

        try {
            const response = await fetch(SERVER_SUBSCRIPTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });

            if (response.ok) {
                console.log('Suscripción enviada al servidor con éxito.');
            } else {
                const errorData = await response.json(); // Intentar leer el cuerpo del error
                console.error('Error al enviar la suscripción al servidor:', response.status, response.statusText, errorData);
                showCustomAlert(`Hubo un problema al guardar tu preferencia de notificaciones: ${errorData.message || response.statusText}.`);
            }
        } catch (error) {
            console.error('Error de red al enviar la suscripción al servidor:', error);
            showCustomAlert('No se pudo conectar con el servidor para guardar tu preferencia de notificaciones. Revisa tu conexión.');
        }
    }


    // Llama a la función para configurar las notificaciones push cuando la app esté lista
    setupPushNotifications();
    // También podrías adjuntarlo a un botón si prefieres que el usuario lo active manualmente:
    // if (enablePushNotificationsBtn) {
    //     enablePushNotificationsBtn.addEventListener('click', setupPushNotifications);
    // }

// --- Lógica del Botón Compartir ---
if (shareIcon) {
    shareIcon.addEventListener('click', async () => {
        // Verificar si la Web Share API está disponible en el navegador
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Estación Urbana 104.7',
                    text: '¡Descargá la App de Estación Urbana y escuchanos donde estés! 🎧',
                    url: 'https://appurbana.com.ar' // Reemplaza con la URL real de tu PWA
                });
                console.log('Contenido compartido con éxito.');
            } catch (error) {
                // El usuario canceló la acción o hubo un error
                console.error('Error al compartir:', error);
            }
        } else {
            // Fallback para navegadores que no soportan la Web Share API
            console.warn('Web Share API no soportada. Usando fallback.');
            // Intentar copiar al portapapeles y luego mostrar el mensaje
            const urlToCopy = 'https://appurbana.com.ar';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText('¡Descargá la App de Estación Urbana y escuchanos donde estés! 🎧 ' + urlToCopy)
                    .then(() => {
                        showCustomAlert('¡Enlace copiado al portapapeles! Descargá la App de Estación Urbana: ' + urlToCopy);
                    })
                    .catch(err => {
                        console.error('Error al copiar al portapapeles:', err);
                        showCustomAlert('Descargá la App de Estación Urbana: ' + urlToCopy);
                    });
            } else {
                // Fallback si navigator.clipboard no está disponible (menos común ahora)
                showCustomAlert('Descargá la App de Estación Urbana: ' + urlToCopy);
            }
        }
    });
}

});




