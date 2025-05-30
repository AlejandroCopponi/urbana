document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const radioStream = document.getElementById('radio-stream');
    const programNameSpan = document.getElementById('program-name');

    // Elementos del menú lateral
    const menuToggle = document.getElementById('menu-icon');
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenuBtn = document.getElementById('close-menu');

    // Elementos del Panel del Timer
    const timerOptionInMenu = document.getElementById('menu-timer-option');
    const selectionPanel = document.getElementById('selection-panel'); // Panel para Timer de Apagado
    const timerPanelCloseBtn = document.getElementById('timer-panel-close-btn');
    const timerSetTimeInput = document.getElementById('timer-set-time');
    const setTimerByTimeBtn = document.getElementById('set-timer-by-time-btn');
    const cancelTimerBtn = document.getElementById('cancel-timer-btn');
    const mainAppTimerCountdown = document.getElementById('main-app-timer-countdown');

    // --- NUEVOS ELEMENTOS DEL PANEL DE ALARMA ---
    const alarmOptionInMenu = document.getElementById('menu-alarm'); // Opción "Alarma" en el menú lateral
    const alarmPanel = document.getElementById('alarm-panel'); // El nuevo panel de alarma
    const alarmPanelCloseBtn = document.getElementById('alarm-panel-close-btn');
    const alarmSetTimeInput = document.getElementById('alarm-set-time'); // Input para la hora de la alarma
    const setAlarmBtn = document.getElementById('set-alarm-btn'); // Botón para establecer alarma
    const cancelAlarmBtn = document.getElementById('cancel-alarm-btn'); // Botón para cancelar alarma

    let isPlaying = false; 
    let countdownInterval; // Para el Timer de Apagado
    let timerTimeout;      // Para el Timer de Apagado

    let alarmTimeout;      // Variable para el timeout de la alarma
    let isAlarmActive = false; // Estado para saber si hay una alarma activa

    console.log("--- APP.JS INICIALIZADO ---");
    console.log("Radio Stream Elemento:", radioStream);

    // --- REPRODUCCIÓN AUTOMÁTICA AL ABRIR LA APP ---
    // Intentar reproducir la radio automáticamente al cargar la PWA.
    // Los navegadores modernos pueden bloquear el autoplay si no hay interacción previa del usuario.
    try {
        console.log("Intentando reproducción automática al inicio...");
        radioStream.load(); // Cargar el stream
        console.log("radioStream.readyState (inicial):", radioStream.readyState);
        console.log("radioStream.paused (inicial):", radioStream.paused);

        radioStream.play()
            .then(() => {
                isPlaying = true;
                playPauseBtn.innerHTML = '❚❚'; 
                playPauseBtn.classList.remove('play-button');
                playPauseBtn.classList.add('pause-button');
                console.log("Reproducción automática iniciada con éxito. isPlaying:", isPlaying);
                if (mainAppTimerCountdown) {
                    mainAppTimerCountdown.classList.add('hidden'); // Asegura que el contador de timer esté oculto al inicio si no hay un timer programado
                }
            })
            .catch(error => {
                // Si la reproducción automática es bloqueada (lo más probable)
                console.warn("Reproducción automática bloqueada/fallida al inicio:", error.name, error.message);
                isPlaying = false;
                playPauseBtn.innerHTML = '▶';
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button');
            });
    } catch (error) {
        console.error("Error inesperado en el bloque de reproducción automática:", error);
        isPlaying = false;
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.classList.remove('pause-button');
        playPauseBtn.classList.add('play-button');
    }

    // --- Lógica del Botón Play/Pausa ---
    playPauseBtn.addEventListener('click', () => {
        console.log("Botón Play/Pause clicado. isPlaying actual:", isPlaying);
        if (isPlaying) {
            radioStream.pause(); 
            isPlaying = false; // ¡CRÍTICO! Actualizar el estado a false al pausar.
            playPauseBtn.innerHTML = '▶'; 
            playPauseBtn.classList.remove('pause-button'); 
            playPauseBtn.classList.add('play-button'); 
            console.log("Radio PAUSADA. isPlaying:", isPlaying);
            console.log("radioStream.paused:", radioStream.paused); 
            console.log("radioStream.readyState:", radioStream.readyState);
        } else {
            console.log("Intentando REPRODUCIR stream..."); 
            radioStream.load(); // Vuelve a cargar el stream ANTES de intentar reproducir
            console.log("Después de radioStream.load() al hacer clic.");
            console.log("radioStream.readyState (antes de play):", radioStream.readyState);
            console.log("radioStream.paused (antes de play):", radioStream.paused);

            radioStream.play()
                .then(() => {
                    isPlaying = true;
                    playPauseBtn.innerHTML = '❚❚';
                    playPauseBtn.classList.remove('play-button');
                    playPauseBtn.classList.add('pause-button');
                    console.log("Reproducción iniciada con éxito por clic. isPlaying:", isPlaying);
                    console.log("radioStream.readyState (después de play):", radioStream.readyState);
                })
                .catch(error => {
                    console.error("Error al intentar reproducir la radio tras interacción:", error.name, error.message);
                    alert("No se pudo iniciar la reproducción. Revisa la Consola (F12) para más detalles.");
                    isPlaying = false; 
                    playPauseBtn.innerHTML = '▶'; 
                    playPauseBtn.classList.remove('pause-button');
                    playPauseBtn.classList.add('play-button');
                });
        }
    });

    // --- Eventos de depuración del elemento de audio ---
    radioStream.addEventListener('error', (e) => {
        console.error("EVENTO DE ERROR DE AUDIO:", e);
        console.error("e.target.error.code:", e.target.error.code);
        console.error("e.target.error.message:", e.target.error.message);
        let errorMessage = 'Un error desconocido ocurrió.';
        switch (e.target.error.code) {
            case 1: errorMessage = 'MEDIA_ERR_ABORTED: La carga del audio fue abortada.'; break;
            case 2: errorMessage = 'MEDIA_ERR_NETWORK: Error de red al cargar el audio.'; break;
            case 3: errorMessage = 'MEDIA_ERR_DECODE: Error de decodificación de audio. Formato no soportado o corrupto.'; break;
            case 4: errorMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED: El formato del audio no es soportado o la URL es inaccesible/inválida (CORS).'; break;
        }
        console.error("Mensaje de error detallado:", errorMessage);
        alert("Hubo un error con el stream de radio: " + errorMessage + " Consulta la Consola (F12) para más detalles.");
        isPlaying = false;
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.classList.remove('pause-button');
        playPauseBtn.classList.add('play-button');
    });

    radioStream.addEventListener('stalled', () => { console.warn('La descarga del stream se ha detenido inesperadamente (stalled).'); });
    radioStream.addEventListener('waiting', () => { console.log('Esperando que los datos del stream estén disponibles (waiting)...'); });
    radioStream.addEventListener('playing', () => { console.log('El stream está reproduciéndose (playing).'); });
    radioStream.addEventListener('pause', () => { console.log('El stream ha sido pausado (evento pause).'); }); // Nuevo log
    radioStream.addEventListener('ended', () => { console.log('El stream ha terminado (evento ended).'); }); // Nuevo log


    // --- Lógica del Menú Lateral ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('open');
            // Asegúrate de que los paneles de alarma y timer estén cerrados al abrir el menú
            selectionPanel.classList.remove('open'); 
            alarmPanel.classList.remove('open');
        });
    }
    closeMenuBtn.addEventListener('click', () => { 
        sideMenu.classList.remove('open'); 
        menuOverlay.classList.remove('open'); 
    });
    menuOverlay.addEventListener('click', () => { 
        sideMenu.classList.remove('open'); 
        menuOverlay.classList.remove('open'); 
    });

    // --- Lógica para abrir/cerrar Paneles (Genérico) ---
    // Esta función nos ayudará a abrir un panel y cerrar otros si están abiertos.
    function openPanel(panelToOpen) {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('open');

        // Cerrar todos los paneles antes de abrir el deseado
        selectionPanel.classList.remove('open');
        alarmPanel.classList.remove('open');

        panelToOpen.classList.add('open');
    }

    // --- Lógica del Timer de Apagado por Hora ---
    timerOptionInMenu.addEventListener('click', () => {
        openPanel(selectionPanel); // Usa la función genérica
        
        // Lógica específica del Timer de Apagado
        if (!countdownInterval) { 
            cancelTimerBtn.classList.add('hidden'); 
        } else { 
            cancelTimerBtn.classList.remove('hidden'); 
        }
        
        const now = new Date();
        const minutes = Math.round(now.getMinutes() / 5) * 5; 
        now.setMinutes(minutes, 0, 0); 
        const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        timerSetTimeInput.value = defaultTime;
    });

    timerPanelCloseBtn.addEventListener('click', () => { 
        selectionPanel.classList.remove('open'); 
    });

    setTimerByTimeBtn.addEventListener('click', () => {
        const timeValue = timerSetTimeInput.value;
        if (!timeValue) { alert('Por favor, selecciona una hora para el temporizador.'); return; }

        const [hoursStr, minutesStr] = timeValue.split(':');
        const targetHour = parseInt(hoursStr, 10);
        const targetMinute = parseInt(minutesStr, 10);

        const now = new Date();
        let targetDate = new Date();
        targetDate.setHours(targetHour, targetMinute, 0, 0);

        if (targetDate.getTime() <= now.getTime()) { targetDate.setDate(targetDate.getDate() + 1); }

        const timeDiffMs = targetDate.getTime() - now.getTime();
        if (timeDiffMs <= 0) { alert('La hora seleccionada ya pasó. Intenta de nuevo.'); return; }

        clearInterval(countdownInterval);
        clearTimeout(timerTimeout);

        timerTimeout = setTimeout(() => {
            radioStream.pause();
            isPlaying = false;
            playPauseBtn.innerHTML = '▶';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
            mainAppTimerCountdown.classList.add('hidden');
            console.log('Radio apagada por temporizador.');
            alert('El temporizador ha apagado la radio.');
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
                // Asegurarse de que el timerTimeout ya ha apagado la radio o lo hará
            } else {
                const totalSeconds = Math.floor(remainingTime / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                const displayTime = [hours, minutes, seconds].map(t => String(t).padStart(2, '0')).join(':');
                mainAppTimerCountdown.textContent = `Apagado en: ${displayTime}`;
            }
        }, 1000);
        selectionPanel.classList.remove('open');
    });

    cancelTimerBtn.addEventListener('click', () => {
        clearInterval(countdownInterval);
        clearTimeout(timerTimeout);
        mainAppTimerCountdown.classList.add('hidden');
        cancelTimerBtn.classList.add('hidden');
        alert('Temporizador de apagado cancelado.');
        console.log('Temporizador de apagado cancelado.');
        selectionPanel.classList.remove('open');
    });

    // --- Lógica del Panel de Alarma ---
    alarmOptionInMenu.addEventListener('click', () => {
        openPanel(alarmPanel); // Usa la función genérica para abrir el panel de alarma

        // Lógica específica del Panel de Alarma
        if (!isAlarmActive) { // Si no hay una alarma activa
            cancelAlarmBtn.classList.add('hidden');
        } else {
            cancelAlarmBtn.classList.remove('hidden');
        }

        // Establecer hora por defecto en el input de la alarma (ej. 07:00 AM)
        // Puedes ajustar esto a la hora actual + X minutos o una hora predefinida
        const now = new Date();
        const defaultAlarmHour = 7; // Por ejemplo, 7 AM
        const defaultAlarmMinute = 0; // 00 minutos
        const defaultAlarmTime = `${String(defaultAlarmHour).padStart(2, '0')}:${String(defaultAlarmMinute).padStart(2, '0')}`;
        alarmSetTimeInput.value = defaultAlarmTime;
    });

    alarmPanelCloseBtn.addEventListener('click', () => {
        alarmPanel.classList.remove('open'); // Cierra el panel de alarma
    });

    setAlarmBtn.addEventListener('click', () => {
        const timeValue = alarmSetTimeInput.value;
        if (!timeValue) {
            alert('Por favor, selecciona una hora para la alarma.');
            return;
        }

        const [hoursStr, minutesStr] = timeValue.split(':');
        const targetHour = parseInt(hoursStr, 10);
        const targetMinute = parseInt(minutesStr, 10);

        const now = new Date();
        let targetDate = new Date();
        targetDate.setHours(targetHour, targetMinute, 0, 0); // Establece la hora y minutos de la alarma

        // Si la hora de la alarma ya pasó hoy, programarla para mañana
        if (targetDate.getTime() <= now.getTime()) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const timeDiffMs = targetDate.getTime() - now.getTime();
        if (timeDiffMs <= 0) {
            alert('La hora seleccionada ya pasó. Intenta de nuevo.');
            return;
        }

        // Limpiar cualquier alarma existente
        clearTimeout(alarmTimeout);

        // Iniciar el timeout principal para la alarma
        alarmTimeout = setTimeout(() => {
            // Lógica para cuando suene la alarma:
            console.log('¡Alarma sonando! Intentando reproducir la radio.');
            if (radioStream.paused) {
                radioStream.load(); // Cargar el stream antes de reproducir
                radioStream.play()
                    .then(() => {
                        isPlaying = true;
                        playPauseBtn.innerHTML = '❚❚';
                        playPauseBtn.classList.remove('play-button');
                        playPauseBtn.classList.add('pause-button');
                        alert('¡Es hora! La radio se ha encendido.');
                    })
                    .catch(error => {
                        console.error('Error al reproducir la radio con la alarma:', error);
                        alert('¡Es hora! Pero no se pudo encender la radio. Revisa la consola.');
                    });
            } else {
                alert('¡Es hora! La radio ya estaba sonando.');
            }
            isAlarmActive = false; // La alarma ha sonado, ya no está activa
            cancelAlarmBtn.classList.add('hidden'); // Ocultar botón de cancelar
        }, timeDiffMs);

        isAlarmActive = true; // Marcar la alarma como activa
        cancelAlarmBtn.classList.remove('hidden'); // Mostrar botón de cancelar
        alert(`Alarma establecida para las ${timeValue}.`);
        console.log(`Alarma establecida para las ${timeValue}.`);
        alarmPanel.classList.remove('open'); // Cierra el panel de alarma después de configurar
    });

    cancelAlarmBtn.addEventListener('click', () => {
        clearTimeout(alarmTimeout); // Detiene la alarma
        isAlarmActive = false; // Marcar la alarma como inactiva
        cancelAlarmBtn.classList.add('hidden'); // Ocultar el botón de cancelar
        alert('Alarma cancelada.');
        console.log('Alarma cancelada.');
        alarmPanel.classList.remove('open'); // Cierra el panel
    });


    // --- Lógica de la Programación Actual ---
    const updateProgram = () => {
        const now = new Date();
        const hour = now.getHours(); 
        let currentProgram = 'Música Continua'; 

        // Puedes personalizar esta programación a tu gusto
        if (hour >= 7 && hour < 10) {
            currentProgram = 'El Despertador de la Mañana';
        } else if (hour >= 10 && hour < 13) {
            currentProgram = 'Magazine Radial del Día';
        } else if (hour >= 13 && hour < 16) {
            currentProgram = 'Noticias al Mediodía';
        } else if (hour >= 16 && hour < 19) {
            currentProgram = 'Conduciendo la Tarde';
        } else if (hour >= 19 && hour < 22) {
            currentProgram = 'Noches de Rock Nacional';
        } else if (hour >= 22 || hour < 7) { // De 22:00 a 06:59
            currentProgram = 'Selección Musical Nocturna';
        }
        programNameSpan.textContent = currentProgram;
    };

    // Actualiza el programa al cargar la página
    updateProgram();
    // Actualiza el programa cada minuto (puedes ajustar el intervalo)
    setInterval(updateProgram, 60 * 1000); // 60 segundos * 1000 milisegundos

});