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
    const selectionPanel = document.getElementById('selection-panel');
    const timerPanelCloseBtn = document.getElementById('timer-panel-close-btn');
    const timerSetTimeInput = document.getElementById('timer-set-time');
    const setTimerByTimeBtn = document.getElementById('set-timer-by-time-btn');
    const cancelTimerBtn = document.getElementById('cancel-timer-btn');
    const mainAppTimerCountdown = document.getElementById('main-app-timer-countdown');

    let isPlaying = false; 
    let countdownInterval; 
    let timerTimeout; 

    // --- REPRODUCCIÓN AUTOMÁTICA AL ABRIR LA APP (Manejo mejorado de bloqueo) ---
    try {
        radioStream.load(); 
        radioStream.play()
            .then(() => {
                // Si la reproducción automática es exitosa
                isPlaying = true;
                playPauseBtn.innerHTML = '❚❚'; 
                playPauseBtn.classList.remove('play-button');
                playPauseBtn.classList.add('pause-button');
                console.log("Reproducción automática iniciada con éxito.");
            })
            .catch(error => {
                // Si la reproducción automática es bloqueada (lo más probable)
                console.warn("La reproducción automática fue bloqueada por el navegador. El usuario debe hacer clic en Play.", error);
                isPlaying = false; // Asegurar que el estado es false
                playPauseBtn.innerHTML = '▶'; // Asegurar que el botón muestre Play
                playPauseBtn.classList.remove('pause-button');
                playPauseBtn.classList.add('play-button');
                // Aquí podrías mostrar un mensaje sutil en la UI si lo deseas, en lugar de un alert.
                // Por ejemplo: mainAppTimerCountdown.textContent = "Haz clic en ▶ para escuchar";
            });
    } catch (error) {
        console.error("Error inesperado al intentar la reproducción automática:", error);
        isPlaying = false;
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.classList.remove('pause-button');
        playPauseBtn.classList.add('play-button');
    }


    // --- Lógica del Botón Play/Pausa ---
    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            radioStream.pause();
            playPauseBtn.innerHTML = '▶';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
            isPlaying = false; // ¡IMPORTANTE! Asegurar que el estado se actualiza a false al pausar.
        } else {
            console.log("Intentando reproducir el stream..."); 
            radioStream.load(); // Vuelve a cargar el stream ANTES de intentar reproducir

            radioStream.play()
                .then(() => {
                    isPlaying = true;
                    playPauseBtn.innerHTML = '❚❚';
                    playPauseBtn.classList.remove('play-button');
                    playPauseBtn.classList.add('pause-button');
                    console.log("Reproducción iniciada con éxito.");
                })
                .catch(error => {
                    console.error("Error al intentar reproducir la radio tras interacción:", error);
                    alert("No se pudo iniciar la reproducción. Razones comunes: el navegador bloquea el auto-play (haz clic en la página primero), o la URL del stream es incorrecta/inaccesible (CORS). Revisa la Consola (F12) para más detalles.");
                    isPlaying = false; 
                    playPauseBtn.innerHTML = '▶'; 
                    playPauseBtn.classList.remove('pause-button');
                    playPauseBtn.classList.add('play-button');
                });
        }
    });

    // --- Resto de los Eventos de depuración del elemento de audio (sin cambios) ---
    radioStream.addEventListener('error', (e) => {
        console.error("Error en el elemento de audio:", e);
        let errorMessage = 'Un error desconocido ocurrió.';
        switch (e.target.error.code) {
            case e.target.error.MEDIA_ERR_ABORTED: errorMessage = 'La carga del audio fue abortada.'; break;
            case e.target.error.MEDIA_ERR_NETWORK: errorMessage = 'Error de red al cargar el audio.'; break;
            case e.target.error.MEDIA_ERR_DECODE: errorMessage = 'Error de decodificación de audio. Formato no soportado o corrupto.'; break;
            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = 'El formato del audio no es soportado o la URL es inaccesible/inválida (CORS).'; break;
        }
        console.error(errorMessage);
        alert("Hubo un error con el stream de radio: " + errorMessage + " Consulta la Consola (F12) para más detalles.");
        isPlaying = false;
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.classList.remove('pause-button');
        playPauseBtn.classList.add('play-button');
    });

    radioStream.addEventListener('stalled', () => { console.warn('La descarga del stream se ha detenido inesperadamente.'); });
    radioStream.addEventListener('waiting', () => { console.log('Esperando que los datos del stream estén disponibles...'); });
    radioStream.addEventListener('playing', () => { console.log('El stream está reproduciéndose.'); });

    // --- Lógica del Menú Lateral (sin cambios) ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('open');
        });
    }
    closeMenuBtn.addEventListener('click', () => { sideMenu.classList.remove('open'); menuOverlay.classList.remove('open'); });
    menuOverlay.addEventListener('click', () => { sideMenu.classList.remove('open'); menuOverlay.classList.remove('open'); });

    // --- Lógica del Timer de Apagado por Hora (sin cambios) ---
    timerOptionInMenu.addEventListener('click', () => {
        sideMenu.classList.remove('open'); 
        menuOverlay.classList.remove('open'); 
        selectionPanel.classList.add('open'); 

        if (!countdownInterval) { cancelTimerBtn.classList.add('hidden'); } else { cancelTimerBtn.classList.remove('hidden'); }
        
        const now = new Date();
        const minutes = Math.round(now.getMinutes() / 5) * 5; 
        now.setMinutes(minutes, 0, 0); 
        const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        timerSetTimeInput.value = defaultTime;
    });

    timerPanelCloseBtn.addEventListener('click', () => { selectionPanel.classList.remove('open'); });

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


    // --- Lógica de la Programación Actual (sin cambios) ---
    const updateProgram = () => {
        const now = new Date();
        const hour = now.getHours(); 
        let currentProgram = 'Música Continua'; 

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
        } else if (hour >= 22 || hour < 7) { 
            currentProgram = 'Selección Musical Nocturna';
        }
        programNameSpan.textContent = currentProgram;
    };
    updateProgram();
    setInterval(updateProgram, 60 * 1000); 

});