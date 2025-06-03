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
         if (appWrapper) appWrapper.style.display = 'none'; // [cite: 178]
    }

    // Se intentan cerrar los paneles por si ya estaban abiertos.
    // Es clave que el JS no falle si estos elementos aún no han sido cargados.
    document.getElementById('side-menu')?.classList.remove('open');
    document.getElementById('menu-overlay')?.classList.remove('open');
    document.getElementById('selection-panel')?.classList.remove('open');
    document.getElementById('alarm-panel')?.classList.remove('open');
    document.getElementById('contact-panel')?.classList.remove('open'); // [cite: 181]

    // Opcional: pausar la radio si está sonando para enfocar en la instalación
    const radioStream = document.getElementById('radio-stream');
    const playPauseBtn = document.getElementById('play-pause-btn'); // [cite: 182]
    if (radioStream && !radioStream.paused) {
        radioStream.pause(); // [cite: 183]
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '▶';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button'); // [cite: 184]
        }
    }
    console.log('UI principal oculta.'); // [cite: 185]
}

// Función para mostrar la UI principal
function showMainAppUI() {
    if (appWrapper) appWrapper.style.display = ''; // Restaura el display por defecto [cite: 186]
    console.log('UI principal restaurada.'); // [cite: 187]
}

// Detecta si la PWA ya está instalada o se ejecuta en modo standalone
function isInStandaloneMode() {
    return (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://')); // [cite: 188]
}

// Función para verificar el estado de instalación de la PWA y ocultar/mostrar elementos
function checkPWAInstallState() {
    if (isInStandaloneMode()) {
        console.log('PWA ya instalada o en standalone. Ocultando elementos de instalación.'); // [cite: 189]
        if (installPromptOverlay) {
            installPromptOverlay.classList.add('hidden'); // Oculta el overlay de instalación [cite: 190]
        }
        showMainAppUI(); // Asegura que la UI principal esté visible [cite: 191]
    } else {
        // Si NO está instalada, asegúrate de que el overlay de instalación esté oculto por defecto
        // hasta que el beforeinstallprompt se dispare.
        if (installPromptOverlay) {
            installPromptOverlay.classList.add('hidden'); // [cite: 192]
        }
        showMainAppUI(); // Asegura que la UI principal esté visible por defecto si no hay overlay activo
    }
}

// Llama a esta función al cargar la página para verificar el estado inicial
window.addEventListener('load', checkPWAInstallState); // [cite: 194]
// También puedes verificarla en cada cambio del modo de visualización
window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWAInstallState); // [cite: 195]
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Evita que el navegador muestre su propio mensaje automáticamente
    deferredPrompt = e; // Guarda el evento para poder dispararlo más tarde
    console.log('Evento beforeinstallprompt capturado.');

    // Muestra tu overlay de instalación personalizado
    if (installPromptOverlay) {
        installPromptOverlay.classList.remove('hidden'); // Hace visible el overlay grande // [cite: 196]
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

            console.log(`El usuario respondió al prompt de instalación (desde overlay): ${outcome}`); // [cite: 197]

            deferredPrompt = null;

            if (outcome === 'accepted') {
                console.log('PWA instalada con éxito (desde overlay). Ocultando overlay y restaurando UI.');
                if (installPromptOverlay) {
                    installPromptOverlay.classList.add('hidden'); // [cite: 198]
                }
                showMainAppUI();
            } else {
                console.log('Instalación de PWA rechazada o descartada (desde overlay). Manteniendo overlay visible.'); // [cite: 199]
            }
        } else {
            console.log('El evento beforeinstallprompt no está disponible o ya se usó (desde overlay). Proporcionando instrucciones manuales.'); // [cite: 200]
            const isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);

            if (isIOS) {
                alert('Para instalar "Estación Urbana 104.7" en tu iPhone o iPad:\n\n1. Toca el icono de "Compartir" (un cuadrado con una flecha hacia arriba) en la barra inferior de Safari.\n\n2. Desliza hacia abajo y selecciona "Añadir a pantalla de inicio".'); // [cite: 201]
            } else {
                alert('Tu navegador no permite la instalación directa en este momento. Por favor, busca la opción "Añadir a pantalla de inicio" o "Instalar aplicación" en el menú de tu navegador (generalmente los 3 puntos en la esquina).'); // [cite: 202]
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
}); // [cite: 204]
// --- Fin de la lógica para el overlay de instalación de PWA ---

document.addEventListener('DOMContentLoaded', () => {
    // TODAS LAS REFERENCIAS A ELEMENTOS DEL DOM DEBEN IR DENTRO DE ESTE BLOQUE
    // para asegurar que el HTML ya se haya cargado.

    const playPauseBtn = document.getElementById('play-pause-btn');
    const radioStream = document.getElementById('radio-stream');
    const programNameSpan = document.getElementById('program-name');

    // Elementos del menú lateral
    const menuToggle = document.getElementById('menu-icon'); // [cite: 205]
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenuBtn = document.getElementById('close-menu');

    // Elementos de los Paneles
    const selectionPanel = document.getElementById('selection-panel'); // Panel del timer
    const alarmPanel = document.getElementById('alarm-panel');         // Panel de la alarma
    const contactPanel = document.getElementById('contact-panel'); // Panel de Contacto para Publicidad [cite: 206]

    // Elementos del Panel del Timer
    const timerOptionInMenu = document.getElementById('menu-timer-option'); // [cite: 207]
    const timerPanelCloseBtn = document.getElementById('timer-panel-close-btn');
    const timerSetTimeInput = document.getElementById('timer-set-time');
    const setTimerByTimeBtn = document.getElementById('set-timer-by-time-btn');
    const cancelTimerBtn = document.getElementById('cancel-timer-btn');
    const mainAppTimerCountdown = document.getElementById('main-app-timer-countdown');

    // --- Elementos del Panel de Alarma ---
    const alarmOptionInMenu = document.getElementById('menu-alarm'); // [cite: 208]
    const alarmPanelCloseBtn = document.getElementById('alarm-panel-close-btn'); // [cite: 209]
    const alarmSetTimeInput = document.getElementById('alarm-set-time');
    const setAlarmBtn = document.getElementById('set-alarm-btn');
    const cancelAlarmBtn = document.getElementById('cancel-alarm-btn');

    // --- Lógica del Panel de Contacto para Publicidad ---
    const menuPublicityOption = document.getElementById('menu-publicity'); // [cite: 211]
    const mainPublicityButton = document.getElementById('main-publicity-button');
    const contactPanelCloseBtn = document.getElementById('contact-panel-close-btn');
    const contactForm = document.getElementById('contact-form');
    const contactFormStatus = document.getElementById('contact-form-status');
    const contactNameInput = document.getElementById('contact-name'); // [cite: 212]
    const contactPhoneInput = document.getElementById('contact-phone');
    const contactMessageInput = document.getElementById('contact-message');


    // Variables de estado del reproductor
    let isPlaying = false; // [cite: 213]
    let countdownInterval;
    let timerTimeout;
    let alarmTimeout;
    let isAlarmActive = false;

    console.log("--- APP.JS INICIALIZADO (DOMContentLoaded) ---");
    console.log("Radio Stream Elemento:", radioStream); // [cite: 214]
    // --- REPRODUCCIÓN AUTOMÁTICA AL ABRIR LA APP ---
    // Esta sección solo intentará reproducir si el overlay de instalación no está visible. [cite: 215]
    // Esto previene que se intente reproducir el audio mientras se le pide al usuario instalar la PWA. [cite: 216]
    if (!installPromptOverlay || installPromptOverlay.classList.contains('hidden')) {
        try {
            console.log("Intentando reproducción automática al inicio..."); // [cite: 217]
            // Asegurarse de que el stream esté cargado antes de intentar reproducir
            if (radioStream) { // Añadir un check por si radioStream es null (poco probable aquí)
                radioStream.load(); // [cite: 218]
                radioStream.play()
                    .then(() => {
                        isPlaying = true;
                        playPauseBtn.innerHTML = '❚❚';
                        playPauseBtn.classList.remove('play-button');
                        playPauseBtn.classList.add('pause-button'); // [cite: 219]
                        console.log("Reproducción automática iniciada con éxito. isPlaying:", isPlaying);
                        if (mainAppTimerCountdown) {
                            mainAppTimerCountdown.classList.add('hidden'); // Ocultar si ya no hay timer activo // [cite: 220]
                        }
                    })
                    .catch(error => {
                        // La mayoría de los navegadores bloquean la reproducción automática sin interacción del usuario. [cite: 221]
                        console.warn("Reproducción automática bloqueada/fallida al inicio:", error.name, error.message);
                        isPlaying = false;
                        if (playPauseBtn) {
                            playPauseBtn.innerHTML = '▶'; // [cite: 222]
                            playPauseBtn.classList.remove('pause-button');
                            playPauseBtn.classList.add('play-button'); // [cite: 223]
                        }
                    });
            } else {
                console.warn("Elemento 'radio-stream' no encontrado."); // [cite: 224]
            }
        } catch (error) {
            console.error("Error inesperado en el bloque de reproducción automática:", error); // [cite: 226]
            isPlaying = false; // [cite: 226]
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '▶'; // [cite: 227]
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button');
            }
        }
    } else {
        console.log("Reproducción automática omitida porque el overlay de instalación está visible."); // [cite: 228]
    }

    // --- Lógica del Botón Play/Pausa ---
    if (playPauseBtn && radioStream) { // Asegura que los elementos existan
        playPauseBtn.addEventListener('click', () => {
            console.log("Botón Play/Pause clicado. isPlaying actual:", isPlaying);
            if (isPlaying) {
                radioStream.pause();
                isPlaying = false; // [cite: 229]
                playPauseBtn.innerHTML = '▶';
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button');
                console.log("Radio PAUSADA. isPlaying:", isPlaying);
            } else {
                console.log("Intentando REPRODUCIR stream..."); // [cite: 230]
                radioStream.load(); // Vuelve a cargar el stream por si hubo un error o stall
                radioStream.play()
                    .then(() => {
                        isPlaying = true;
                        playPauseBtn.innerHTML = '❚❚'; // [cite: 231]
                        playPauseBtn.classList.remove('play-button'); // [cite: 232]
                        playPauseBtn.classList.add('pause-button');
                        console.log("Reproducción iniciada con éxito por clic. isPlaying:", isPlaying);
                    })
                    .catch(error => {
                        console.error("Error al intentar reproducir la radio tras interacción:", error.name, error.message);
                        alert("No se pudo iniciar la reproducción. Por favor, inténtalo de nuevo o revisa tu conexión."); // [cite: 233]
                        isPlaying = false;
                        playPauseBtn.innerHTML = '▶';
                        playPauseBtn.classList.remove('pause-button');
                        playPauseBtn.classList.add('play-button'); // [cite: 234]
                    });
            }
        });
    } // [cite: 235]

    // --- Eventos de depuración del elemento de audio ---
    if (radioStream && playPauseBtn) { // Asegura que los elementos existan
        radioStream.addEventListener('error', (e) => {
            console.error("EVENTO DE ERROR DE AUDIO:", e);
            let errorMessage = 'Un error desconocido ocurrió.';
            switch (e.target.error.code) {
                case 1: errorMessage = 'MEDIA_ERR_ABORTED: La carga del audio fue abortada.'; break; // [cite: 236]
                case 2: errorMessage = 'MEDIA_ERR_NETWORK: Error de red al cargar el audio.'; break;
                case 3: errorMessage = 'MEDIA_ERR_DECODE: Error de decodificación de audio. Formato no soportado o corrupto.'; break;
                case 4: errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED: El formato del audio no es soportado o la URL es inaccesible/inválida (CORS).'; break; // [cite: 237]
                default: errorMessage = `Código de error: ${e.target.error.code}. Mensaje: ${e.target.error.message}`; break;
            }
            console.error("Mensaje de error detallado:", errorMessage); // [cite: 238]
            alert("Hubo un error con el stream de radio: " + errorMessage + " Consulta la Consola (F12) para más detalles."); // [cite: 239]
            isPlaying = false; // [cite: 239]
            playPauseBtn.innerHTML = '▶';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
        });

        radioStream.addEventListener('stalled', () => { console.warn('La descarga del stream se ha detenido inesperadamente (stalled).'); }); // [cite: 240]
        radioStream.addEventListener('waiting', () => { console.log('Esperando que los datos del stream estén disponibles (waiting)...'); }); // [cite: 241]
        radioStream.addEventListener('playing', () => { console.log('El stream está reproduciéndose (playing).'); }); // [cite: 242]
        radioStream.addEventListener('pause', () => { console.log('El stream ha sido pausado (evento pause).'); }); // [cite: 243]
        radioStream.addEventListener('ended', () => { console.log('El stream ha terminado (evento ended).'); }); // [cite: 244]
    }

    // --- Lógica del Menú Lateral ---
    if (menuToggle && sideMenu && menuOverlay) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('open');
            // Cierra todos los paneles al abrir el menú principal
            if (selectionPanel) selectionPanel.classList.remove('open');
            if (alarmPanel) alarmPanel.classList.remove('open'); // [cite: 245]
            if (contactPanel) contactPanel.classList.remove('open'); // Asegúrate de cerrar el panel de contacto
        }); // [cite: 246]
    }
    if (closeMenuBtn && sideMenu && menuOverlay) {
        closeMenuBtn.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('open');
        }); // [cite: 247]
    }
    if (menuOverlay && sideMenu) {
        menuOverlay.addEventListener('click', () => {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('open');
        }); // [cite: 248]
    }

    // --- Lógica para abrir/cerrar Paneles (Genérico) ---
    function openPanel(panelToOpen) {
        // Asegúrate de que los elementos del menú existan antes de manipularlos
        if (sideMenu) sideMenu.classList.remove('open'); // [cite: 249]
        if (menuOverlay) menuOverlay.classList.remove('open');

        // Cierra todos los paneles antes de abrir el deseado
        // Asegúrate de que los paneles existan antes de manipularlos
        if (selectionPanel) selectionPanel.classList.remove('open'); // [cite: 250]
        if (alarmPanel) alarmPanel.classList.remove('open');
        if (contactPanel) contactPanel.classList.remove('open');

        if (panelToOpen) panelToOpen.classList.add('open');
    }

    // --- Lógica del Timer de Apagado por Hora ---
    if (timerOptionInMenu && selectionPanel && timerSetTimeInput && setTimerByTimeBtn && cancelTimerBtn && mainAppTimerCountdown) {
        timerOptionInMenu.addEventListener('click', () => {
            openPanel(selectionPanel);

            // Muestra/oculta el botón de cancelar basado en si hay un timer activo
            if (!countdownInterval) { // Si countdownInterval es null, no hay timer activo [cite: 251]
                cancelTimerBtn.classList.add('hidden');
            } else {
                cancelTimerBtn.classList.remove('hidden');
            }

            // Establece la hora predeterminada para el input del timer (próximo múltiplo de 5 minutos)
            const now = new Date(); // [cite: 252]
            let minutes = now.getMinutes();
            let hours = now.getHours();

            // Redondea al múltiplo de 5 minutos más cercano hacia arriba
            minutes = Math.ceil(minutes / 5) * 5;

            // Maneja el desbordamiento de la hora si los minutos se vuelven 60 o más
            if (minutes >= 60) {
                minutes = minutes % 60;
                hours = (hours + 1) % 24; // Incrementa la hora y maneja el desbordamiento del día
            }

            const defaultTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`; // [cite: 255]
            timerSetTimeInput.value = defaultTime;
        });
    }

    if (timerPanelCloseBtn && selectionPanel) {
        timerPanelCloseBtn.addEventListener('click', () => {
            selectionPanel.classList.remove('open'); // [cite: 256]
        });
    }

    if (setTimerByTimeBtn && timerSetTimeInput && radioStream && playPauseBtn && mainAppTimerCountdown && cancelTimerBtn && selectionPanel) {
        setTimerByTimeBtn.addEventListener('click', () => {
            const timeValue = timerSetTimeInput.value;
            if (!timeValue) { alert('Por favor, selecciona una hora para el temporizador.'); return; }

            const [hoursStr, minutesStr] = timeValue.split(':');
            const targetHour = parseInt(hoursStr, 10); // [cite: 257]
            const targetMinute = parseInt(minutesStr, 10);

            const now = new Date();
            let targetDate = new Date();
            targetDate.setHours(targetHour, targetMinute, 0, 0);

            // Si la hora objetivo ya pasó hoy, establece la alarma para mañana
            if (targetDate.getTime() <= now.getTime()) { targetDate.setDate(targetDate.getDate() + 1); } // [cite: 258]

            const timeDiffMs = targetDate.getTime() - now.getTime();
            if (timeDiffMs <= 0) { alert('La hora seleccionada ya pasó. Intenta de nuevo.'); return; } // [cite: 259]

            clearInterval(countdownInterval); // Limpia cualquier countdown anterior // [cite: 260]
            clearTimeout(timerTimeout); // Limpia cualquier timer de apagado anterior // [cite: 261]

            timerTimeout = setTimeout(() => {
                radioStream.pause();
                isPlaying = false;
                playPauseBtn.innerHTML = '▶';
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button'); // [cite: 262]
                mainAppTimerCountdown.classList.add('hidden');
                console.log('Radio apagada por temporizador.');
                alert('El temporizador ha apagado la radio.');
                clearInterval(countdownInterval); // Asegurarse de limpiar el intervalo también
            }, timeDiffMs); // [cite: 263]
            let remainingTime = timeDiffMs;
            mainAppTimerCountdown.classList.remove('hidden');
            cancelTimerBtn.classList.remove('hidden');

            countdownInterval = setInterval(() => {
                remainingTime -= 1000;
                if (remainingTime <= 0) {
                    mainAppTimerCountdown.textContent = '00:00:00';
                    clearInterval(countdownInterval);
                } else { // [cite: 264]
                    const totalSeconds = Math.floor(remainingTime / 1000);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60; // [cite: 265]
                    const displayTime = [hours, minutes, seconds].map(t => String(t).padStart(2, '0')).join(':');
                    mainAppTimerCountdown.textContent = `Apagado en: ${displayTime}`;
                }
            }, 1000); // [cite: 266]
            selectionPanel.classList.remove('open'); // Cierra el panel después de configurar
            alert(`Temporizador de apagado configurado para las ${timeValue}.`); // [cite: 267]
            console.log(`Temporizador de apagado configurado para las ${timeValue}.`);
        });
    }

    if (cancelTimerBtn && mainAppTimerCountdown && selectionPanel) {
        cancelTimerBtn.addEventListener('click', () => {
            clearInterval(countdownInterval);
            clearTimeout(timerTimeout);
            mainAppTimerCountdown.classList.add('hidden');
            cancelTimerBtn.classList.add('hidden');
            alert('Temporizador de apagado cancelado.');
            console.log('Temporizador de apagado cancelado.'); // [cite: 268]
            selectionPanel.classList.remove('open');
        }); // [cite: 269]
    }

    // --- Lógica del Panel de Alarma ---
    if (alarmOptionInMenu && alarmPanel && alarmSetTimeInput && setAlarmBtn && cancelAlarmBtn) {
        alarmOptionInMenu.addEventListener('click', () => {
            openPanel(alarmPanel);

            if (!isAlarmActive) {
                cancelAlarmBtn.classList.add('hidden');
            } else {
                cancelAlarmBtn.classList.remove('hidden'); // [cite: 270]
            }

            // Establece la hora predeterminada para la alarma (Ej: 7:00 AM)
            const defaultAlarmHour = 7;
            const defaultAlarmMinute = 0;
            const defaultAlarmTime = `${String(defaultAlarmHour).padStart(2, '0')}:${String(defaultAlarmMinute).padStart(2, '0')}`;
            alarmSetTimeInput.value = defaultAlarmTime; // [cite: 271]
        }); // [cite: 272]
    }

    if (alarmPanelCloseBtn && alarmPanel) {
        alarmPanelCloseBtn.addEventListener('click', () => {
            alarmPanel.classList.remove('open'); // [cite: 273]
        });
    }

    if (setAlarmBtn && alarmSetTimeInput && radioStream && playPauseBtn && cancelAlarmBtn && alarmPanel) {
        setAlarmBtn.addEventListener('click', () => {
            const timeValue = alarmSetTimeInput.value;
            if (!timeValue) {
                alert('Por favor, selecciona una hora para la alarma.');
                return;
            } // [cite: 274]

            const [hoursStr, minutesStr] = timeValue.split(':');
            const targetHour = parseInt(hoursStr, 10);
            const targetMinute = parseInt(minutesStr, 10); // [cite: 275]

            const now = new Date();
            let targetDate = new Date();
            targetDate.setHours(targetHour, targetMinute, 0, 0);

            // Si la hora objetivo ya pasó hoy, establece la alarma para mañana
            if (targetDate.getTime() <= now.getTime()) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const timeDiffMs = targetDate.getTime() - now.getTime(); // [cite: 276]
            if (timeDiffMs <= 0) {
                alert('La hora seleccionada ya pasó. Intenta de nuevo.'); // [cite: 277]
                return;
            }

            clearTimeout(alarmTimeout); // Limpia cualquier alarma anterior // [cite: 278]

            alarmTimeout = setTimeout(() => {
                console.log('¡Alarma sonando! Intentando reproducir la radio.');
                if (radioStream.paused || radioStream.ended) { // Solo si la radio está pausada o terminó
                    radioStream.load(); // Vuelve a cargar el stream para asegurar la reproducción // [cite: 279]
                    radioStream.play()
                        .then(() => {
                            isPlaying = true;
                            playPauseBtn.innerHTML = '❚❚'; // [cite: 280]
                            playPauseBtn.classList.remove('play-button');
                            playPauseBtn.classList.add('pause-button');
                            alert('¡Es hora! La radio se ha encendido.'); // [cite: 281]
                        })
                        .catch(error => {
                            console.error('Error al reproducir la radio con la alarma:', error);
                            alert('¡Es hora! Pero no se pudo encender la radio. Revisa la consola.'); // [cite: 282, 283]
                        });
                } else {
                    alert('¡Es hora! La radio ya estaba sonando.'); // [cite: 284]
                }
                isAlarmActive = false; // La alarma se desactiva una vez que suena // [cite: 285]
                cancelAlarmBtn.classList.add('hidden'); // [cite: 286]
            }, timeDiffMs);

            isAlarmActive = true;
            cancelAlarmBtn.classList.remove('hidden');
            alert(`Alarma establecida para las ${timeValue}.`);
            console.log(`Alarma establecida para las ${timeValue}.`);
            alarmPanel.classList.remove('open'); // Cierra el panel después de configurar // [cite: 287]
        }); // [cite: 288]
    }

    if (cancelAlarmBtn && alarmPanel) {
        cancelAlarmBtn.addEventListener('click', () => {
            clearTimeout(alarmTimeout);
            isAlarmActive = false;
            cancelAlarmBtn.classList.add('hidden');
            alert('Alarma cancelada.');
            console.log('Alarma cancelada.');
            alarmPanel.classList.remove('open'); // [cite: 289]
        });
    }

    // --- Lógica del Panel de Contacto para Publicidad (MODIFICADA) ---
    // Asegurarse de que todos los elementos existan antes de añadir listeners
    if (menuPublicityOption && contactPanel && contactFormStatus && contactForm) {
        menuPublicityOption.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel(contactPanel);
            // Limpia el estado del formulario al abrir
            if (contactFormStatus) contactFormStatus.textContent = ''; // [cite: 290]
            if (contactForm) contactForm.reset();
            if (contactFormStatus) contactFormStatus.style.color = '';
            // Aseguramos que el status esté oculto al abrir el panel, se mostrará solo si hay un error de validación
            contactFormStatus.classList.add('hidden');
        }); // [cite: 291]
    }

    if (mainPublicityButton && contactPanel && contactFormStatus && contactForm) {
        mainPublicityButton.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel(contactPanel);
            // Limpia el estado del formulario al abrir
            if (contactFormStatus) contactFormStatus.textContent = '';
            if (contactForm) contactForm.reset(); // [cite: 292]
            if (contactFormStatus) contactFormStatus.style.color = '';
            // Aseguramos que el status esté oculto al abrir el panel, se mostrará solo si hay un error de validación
            contactFormStatus.classList.add('hidden');
        }); // [cite: 293]
    }

    if (contactPanelCloseBtn && contactPanel) {
        contactPanelCloseBtn.addEventListener('click', () => {
            if (contactPanel) contactPanel.classList.remove('open');
            // Al cerrar manualmente, también limpiar el formulario y el estado
            if (contactForm) contactForm.reset();
            if (contactFormStatus) {
                contactFormStatus.textContent = ''; // [cite: 294]
                contactFormStatus.classList.add('hidden');
            }
        }); // [cite: 295]
    }

    if (contactForm && contactNameInput && contactPhoneInput && contactMessageInput && contactFormStatus) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = contactNameInput.value.trim();
            const phone = contactPhoneInput.value.trim();
            const message = contactMessageInput.value.trim();

            if (!name || !phone || !message) { // [cite: 296]
                if (contactFormStatus) {
                    contactFormStatus.style.color = 'var(--form-status-error)';
                    contactFormStatus.textContent = 'Por favor, completa todos los campos.';
                    contactFormStatus.classList.remove('hidden'); // Mostrar el mensaje de error // [cite: 297]
                }
                return;
            }

            // Ocultar cualquier mensaje de estado anterior si la validación pasa
            if (contactFormStatus) {
                contactFormStatus.textContent = '';
                contactFormStatus.classList.add('hidden'); // [cite: 298]
            }

            const recipient = 'copponialejandro@gmail.com'; // Dirección de correo a la que se enviará el mensaje // [cite: 299]
            const subject = encodeURIComponent(`Consulta de Publicidad desde PWA: ${name}`); // [cite: 300]
            const body = encodeURIComponent(
                `Nombre: ${name}\n` +
                `Teléfono: ${phone}\n\n` +
                `Mensaje:\n${message}\n\n` +
                `--\nEnviado desde la PWA Estación Urbana`
            );
            const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`; // [cite: 301]

            // Abre el enlace mailto, lo que intentará abrir el cliente de correo predeterminado del usuario
            window.location.href = mailtoLink; // [cite: 302]
            // Inmediatamente después de intentar abrir el gestor de correo, cierra el panel
            // y limpia el formulario, eliminando el mensaje de "Por favor, envía el correo..."
            if (contactPanel) {
                contactPanel.classList.remove('open'); // Cierra el panel de contacto // [cite: 303]
            }
            if (contactForm) contactForm.reset(); // Limpia el formulario // [cite: 304]
            // No se muestra ningún mensaje de éxito aquí, ya que el usuario interactuará con su cliente de correo. [cite: 305]
            // Si el cliente de correo no se abre, el usuario simplemente verá la PWA nuevamente.
        }); // [cite: 306]
    }

    // --- Lógica de la Programación Actual (MODIFICADA para días de la semana) ---
    const weekdaySchedule = [
        { startHour: 7, startMinute: 0, name: 'La Primera Mañana con Damián Copponi' },
        { startHour: 10, startMinute: 0, name: 'Mañana es Tarde con Ale Copponi' },
        { startHour: 13, startMinute: 0, name: 'Tardes en Estación Urbana' },
        { startHour: 19, startMinute: 0, name: 'Música Seleccionada' },
        { startHour: 22, startMinute: 0, name: 'Conexión con Aspen' }, // [cite: 307]
    ];
    const saturdaySchedule = [
        { startHour: 0, startMinute: 0, name: 'Finde en Urbana - Aspen Classic' }, // [cite: 308]
    ];
    const sundaySchedule = [
        { startHour: 0, startMinute: 0, name: 'Finde en Urbana - Aspen Classic' }, // [cite: 309]
    ];
    const updateProgram = () => { // [cite: 310]
        const now = new Date(); // [cite: 311]
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado // [cite: 312]

        let activeSchedule = []; // [cite: 313]
        let currentProgramName = 'Programación Desconocida';

        if (currentDay >= 1 && currentDay <= 5) { // Lunes a Viernes
            activeSchedule = weekdaySchedule; // [cite: 314]
        } else if (currentDay === 6) { // Sábado
            activeSchedule = saturdaySchedule; // [cite: 315]
        } else if (currentDay === 0) { // Domingo
            activeSchedule = sundaySchedule; // [cite: 316]
        }

        if (activeSchedule.length === 0) {
            if (programNameSpan) programNameSpan.textContent = currentProgramName; // [cite: 317]
            return;
        }

        // Encuentra el programa actual
        for (let i = activeSchedule.length - 1; i >= 0; i--) { // Recorre hacia atrás para encontrar el programa más reciente
            const program = activeSchedule[i]; // [cite: 318]
            if (currentHour > program.startHour ||
                (currentHour === program.startHour && currentMinute >= program.startMinute)) {
                currentProgramName = program.name; // [cite: 319]
                break; // Se encontró el programa, sal del bucle
            }
        }

        if (programNameSpan) programNameSpan.textContent = currentProgramName; // [cite: 320]
    };

    // Actualiza el programa al cargar la página
    updateProgram(); // [cite: 321]
    // Actualiza el programa cada minuto
    setInterval(updateProgram, 60 * 1000);

});