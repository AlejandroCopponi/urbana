document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const radioStream = document.getElementById('radio-stream');
    const programNameSpan = document.getElementById('program-name');

    // Elementos del menú lateral
    const menuToggle = document.getElementById('menu-icon'); // Asumo que este es el botón para abrir el menú
    const sideMenu = document.getElementById('side-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const closeMenuBtn = document.getElementById('close-menu');

    // Elementos del Panel del Timer
    const timerOptionInMenu = document.getElementById('menu-timer-option');
    const selectionPanel = document.getElementById('selection-panel');
    const timerPanelCloseBtn = document.getElementById('timer-panel-close-btn');
    const timerSetTimeInput = document.getElementById('timer-set-time'); // El input de tiempo
    const setTimerByTimeBtn = document.getElementById('set-timer-by-time-btn'); // Botón para establecer timer
    const cancelTimerBtn = document.getElementById('cancel-timer-btn'); // Botón para cancelar timer
    const mainAppTimerCountdown = document.getElementById('main-app-timer-countdown'); // El texto del contador en la app principal

    let isPlaying = false; // Variable para controlar el estado del reproductor
    let countdownInterval; // Variable para el intervalo del timer de apagado

    // --- Lógica del Botón Play/Pausa ---
    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            radioStream.pause(); // Pausa la reproducción
            playPauseBtn.innerHTML = '▶'; // Cambia el icono a Play
            playPauseBtn.classList.remove('pause-button'); // Quita la clase de pausa
            playPauseBtn.classList.add('play-button'); // Añade la clase de play
        } else {
            console.log("Intentando reproducir el stream..."); // Mensaje de depuración
            radioStream.load(); // Intenta recargar el stream (útil para algunos casos)
            radioStream.play()
                .then(() => {
                    isPlaying = true; // Solo si la reproducción es exitosa
                    playPauseBtn.innerHTML = '❚❚'; // Cambia el icono a Pausa
                    playPauseBtn.classList.remove('play-button'); // Quita la clase de play
                    playPauseBtn.classList.add('pause-button'); // Añade la clase de pausa
                    console.log("Reproducción iniciada con éxito.");
                })
                .catch(error => {
                    // Manejo de errores si la reproducción falla (ej. por auto-play policy o CORS)
                    console.error("Error al intentar reproducir la radio:", error);
                    alert("No se pudo iniciar la reproducción. Razones comunes: el navegador bloquea el auto-play (haz clic en la página primero), o la URL del stream es incorrecta/inaccesible (CORS). Revisa la Consola (F12) para más detalles.");
                    isPlaying = false; // Asegurarse de que el estado es "pausado"
                    playPauseBtn.innerHTML = '▶'; // Mantener icono de Play
                    playPauseBtn.classList.remove('pause-button');
                    playPauseBtn.classList.add('play-button');
                });
        }
    });

    // --- Eventos de depuración del elemento de audio ---
    radioStream.addEventListener('error', (e) => {
        console.error("Error en el elemento de audio:", e);
        let errorMessage = 'Un error desconocido ocurrió.';
        switch (e.target.error.code) {
            case e.target.error.MEDIA_ERR_ABORTED:
                errorMessage = 'La carga del audio fue abortada.';
                break;
            case e.target.error.MEDIA_ERR_NETWORK:
                errorMessage = 'Error de red al cargar el audio.';
                break;
            case e.target.error.MEDIA_ERR_DECODE:
                errorMessage = 'Error de decodificación de audio. Formato no soportado o corrupto.';
                break;
            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'El formato del audio no es soportado o la URL es inaccesible/inválida (CORS).';
                break;
        }
        console.error(errorMessage);
        alert("Hubo un error con el stream de radio: " + errorMessage + " Consulta la Consola (F12) para más detalles.");
        isPlaying = false;
        playPauseBtn.innerHTML = '▶';
        playPauseBtn.classList.remove('pause-button');
        playPauseBtn.classList.add('play-button');
    });

    radioStream.addEventListener('stalled', () => {
        console.warn('La descarga del stream se ha detenido inesperadamente.');
    });

    radioStream.addEventListener('waiting', () => {
        console.log('Esperando que los datos del stream estén disponibles...');
    });

    radioStream.addEventListener('playing', () => {
        console.log('El stream está reproduciéndose.');
    });

    // --- Lógica del Menú Lateral ---
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('open');
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

    // --- Lógica del Timer de Apagado por Hora ---
    let timerTimeout; // Variable para almacenar el timeout del timer

    timerOptionInMenu.addEventListener('click', () => {
        sideMenu.classList.remove('open'); // Cierra el menú al abrir el panel del timer
        menuOverlay.classList.remove('open'); // Oculta el overlay
        selectionPanel.classList.add('open'); // Muestra el panel de selección del timer

        // Oculta el botón de cancelar si no hay un timer activo
        if (!countdownInterval) { // Si no hay intervalo activo
            cancelTimerBtn.classList.add('hidden');
        } else {
            cancelTimerBtn.classList.remove('hidden'); // Si hay, lo muestra
        }
        
        // Establecer hora por defecto en el input (hora actual + 1 hora, o una hora redondeada)
        const now = new Date();
        const defaultHour = now.getHours();
        const defaultMinutes = now.getMinutes();
        const defaultTime = `${String(defaultHour).padStart(2, '0')}:${String(defaultMinutes).padStart(2, '0')}`;
        timerSetTimeInput.value = defaultTime;
    });

    timerPanelCloseBtn.addEventListener('click', () => {
        selectionPanel.classList.remove('open'); // Cierra el panel del timer
    });

    setTimerByTimeBtn.addEventListener('click', () => {
        const timeValue = timerSetTimeInput.value; // Ej. "23:00"
        if (!timeValue) {
            alert('Por favor, selecciona una hora para el temporizador.');
            return;
        }

        const [hoursStr, minutesStr] = timeValue.split(':');
        const targetHour = parseInt(hoursStr, 10);
        const targetMinute = parseInt(minutesStr, 10);

        const now = new Date();
        let targetDate = new Date();
        targetDate.setHours(targetHour, targetMinute, 0, 0); // Establece la hora y minutos del target

        // Si la hora objetivo ya pasó hoy, programarla para mañana
        if (targetDate.getTime() <= now.getTime()) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const timeDiffMs = targetDate.getTime() - now.getTime();
        if (timeDiffMs <= 0) {
            // Esto no debería pasar con la lógica anterior, pero es una seguridad
            alert('La hora seleccionada ya pasó. Intenta de nuevo.');
            return;
        }

        // Limpiar cualquier timer existente
        clearInterval(countdownInterval);
        clearTimeout(timerTimeout);

        // Iniciar el timeout principal para apagar la radio
        timerTimeout = setTimeout(() => {
            radioStream.pause();
            isPlaying = false;
            playPauseBtn.innerHTML = '▶';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
            mainAppTimerCountdown.classList.add('hidden'); // Ocultar contador
            console.log('Radio apagada por temporizador.');
            alert('El temporizador ha apagado la radio.');
            clearInterval(countdownInterval); // Asegurar que el intervalo del contador también se limpia
        }, timeDiffMs);

        // Actualizar el contador cada segundo
        let remainingTime = timeDiffMs;
        mainAppTimerCountdown.classList.remove('hidden'); // Mostrar el contador en la app principal
        cancelTimerBtn.classList.remove('hidden'); // Mostrar botón de cancelar

        countdownInterval = setInterval(() => {
            remainingTime -= 1000;
            if (remainingTime <= 0) {
                mainAppTimerCountdown.textContent = '00:00:00';
                clearInterval(countdownInterval);
                // El timeout principal se encarga de apagar la radio
            } else {
                const totalSeconds = Math.floor(remainingTime / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                const displayTime = [hours, minutes, seconds]
                    .map(t => String(t).padStart(2, '0'))
                    .join(':');
                mainAppTimerCountdown.textContent = `Apagado en: ${displayTime}`;
            }
        }, 1000);

        selectionPanel.classList.remove('open'); // Cierra el panel de selección después de configurar
    });

    cancelTimerBtn.addEventListener('click', () => {
        clearInterval(countdownInterval); // Detiene el contador visual
        clearTimeout(timerTimeout); // Detiene el apagado de la radio
        mainAppTimerCountdown.classList.add('hidden'); // Oculta el contador
        cancelTimerBtn.classList.add('hidden'); // Oculta el botón de cancelar
        alert('Temporizador de apagado cancelado.');
        console.log('Temporizador de apagado cancelado.');
        selectionPanel.classList.remove('open'); // Cierra el panel
    });


    // --- Lógica de la Programación Actual ---
    const updateProgram = () => {
        const now = new Date();
        const hour = now.getHours(); // Obtiene la hora actual (0-23)

        let currentProgram = 'Música Continua'; // Programa por defecto

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
