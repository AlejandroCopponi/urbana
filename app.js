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
            isPlaying = false; 
            playPauseBtn.innerHTML = '▶'; 
            playPauseBtn.classList.remove('pause-button'); 
            playPauseBtn.classList.add('play-button'); 
            console.log("Radio PAUSADA. isPlaying:", isPlaying);
            console.log("radioStream.paused:", radioStream.paused); 
            console.log("radioStream.readyState:", radioStream.readyState);
        } else {
            console.log("Intentando REPRODUCIR stream..."); 
            radioStream.load(); 
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
    radioStream.addEventListener('pause', () => { console.log('El stream ha sido pausado (evento pause).'); }); 
    radioStream.addEventListener('ended', () => { console.log('El stream ha terminado (evento ended).'); });


    // --- Lógica del Menú Lateral ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('open');
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
    function openPanel(panelToOpen) {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('open');

        selectionPanel.classList.remove('open');
        alarmPanel.classList.remove('open');

        panelToOpen.classList.add('open');
    }

    // --- Lógica del Timer de Apagado por Hora ---
    timerOptionInMenu.addEventListener('click', () => {
        openPanel(selectionPanel); 
        
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
        openPanel(alarmPanel); 

        if (!isAlarmActive) { 
            cancelAlarmBtn.classList.add('hidden');
        } else {
            cancelAlarmBtn.classList.remove('hidden');
        }

        const now = new Date();
        const defaultAlarmHour = 7; 
        const defaultAlarmMinute = 0; 
        const defaultAlarmTime = `${String(defaultAlarmHour).padStart(2, '0')}:${String(defaultAlarmMinute).padStart(2, '0')}`;
        alarmSetTimeInput.value = defaultAlarmTime;
    });

    alarmPanelCloseBtn.addEventListener('click', () => {
        alarmPanel.classList.remove('open'); 
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
        targetDate.setHours(targetHour, targetMinute, 0, 0); 

        if (targetDate.getTime() <= now.getTime()) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const timeDiffMs = targetDate.getTime() - now.getTime();
        if (timeDiffMs <= 0) {
            alert('La hora seleccionada ya pasó. Intenta de nuevo.');
            return;
        }

        clearTimeout(alarmTimeout);

        alarmTimeout = setTimeout(() => {
            console.log('¡Alarma sonando! Intentando reproducir la radio.');
            if (radioStream.paused) {
                radioStream.load(); 
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
            isAlarmActive = false; 
            cancelAlarmBtn.classList.add('hidden'); 
        }, timeDiffMs);

        isAlarmActive = true; 
        cancelAlarmBtn.classList.remove('hidden'); 
        alert(`Alarma establecida para las ${timeValue}.`);
        console.log(`Alarma establecida para las ${timeValue}.`);
        alarmPanel.classList.remove('open'); 
    });

    cancelAlarmBtn.addEventListener('click', () => {
        clearTimeout(alarmTimeout); 
        isAlarmActive = false; 
        cancelAlarmBtn.classList.add('hidden'); 
        alert('Alarma cancelada.');
        console.log('Alarma cancelada.');
        alarmPanel.classList.remove('open'); 
    });

    // --- Lógica de la Programación Actual (MODIFICADA para días de la semana) ---

    // Programación de Lunes a Viernes (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
    const weekdaySchedule = [
        { startHour: 7, startMinute: 0, name: 'La Primera Mañana con Damián Copponi' }, // 07:00 - 09:59
        { startHour: 10, startMinute: 0, name: 'Mañana es Tarde con Ale Copponi' },   // 10:00 - 12:59
        { startHour: 13, startMinute: 0, name: 'Las tardes en Urbana' },     // 13:00 - 18:59
        { startHour: 19, startMinute: 0, name: 'Música Seleccionada' },     // 19:00 - 21:59
        { startHour: 22, startMinute: 0, name: 'Noches de Rock Nacional' },  // 12:00 - 06:59
    ];

    // Programación de Sábados
    const saturdaySchedule = [
        { startHour: 0, startMinute: 0, name: 'Findes en Urbana - Aspen Classic' },
    ];

    // Programación de Domingos
    const sundaySchedule = [
            { startHour: 0, startMinute: 0, name: 'Findes en Urbana - Aspen Classic' },
    ];


    const updateProgram = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

        let activeSchedule = [];
        let currentProgramName = 'Programación Desconocida';

        // Seleccionar la parrilla de programación correcta según el día de la semana
        if (currentDay >= 1 && currentDay <= 5) { // Lunes a Viernes
            activeSchedule = weekdaySchedule;
        } else if (currentDay === 6) { // Sábado
            activeSchedule = saturdaySchedule;
        } else if (currentDay === 0) { // Domingo
            activeSchedule = sundaySchedule;
        }

        // Si no se encontró ninguna parrilla (lo cual no debería pasar con los if/else if)
        if (activeSchedule.length === 0) {
            programNameSpan.textContent = currentProgramName;
            return;
        }

        // Iterar sobre la parrilla de programación activa para encontrar el programa actual
        for (let i = 0; i < activeSchedule.length; i++) {
            const program = activeSchedule[i];
            const nextProgram = activeSchedule[i + 1];

            // Compara la hora actual con el inicio del programa
            // Nota: Aquí se maneja el caso de que el último programa vaya hasta la medianoche
            if (currentHour > program.startHour || 
               (currentHour === program.startHour && currentMinute >= program.startMinute)) {
                
                // Si hay un siguiente programa, verifica que la hora actual sea antes del inicio del siguiente
                if (nextProgram) {
                    if (currentHour < nextProgram.startHour || 
                       (currentHour === nextProgram.startHour && currentMinute < nextProgram.startMinute)) {
                        currentProgramName = program.name;
                        break; 
                    }
                } else {
                    // Si es el último programa de la lista, dura hasta el final del día
                    currentProgramName = program.name;
                    break;
                }
            }
        }
        
        programNameSpan.textContent = currentProgramName;
    };

    // Actualiza el programa al cargar la página
    updateProgram();
    // Actualiza el programa cada minuto
    setInterval(updateProgram, 60 * 1000); 

});