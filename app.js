document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const playPauseBtn = document.getElementById('play-pause-btn');
    const programNameSpan = document.getElementById('program-name');

    // Referencias para el menú lateral
    const menuIcon = document.querySelector('.menu-icon');
    const sideMenu = document.getElementById('side-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    // Referencias para las opciones del menú
    const menuTimerOption = document.getElementById('menu-timer');
    const menuAlarmOption = document.getElementById('menu-alarm');
    
    // Referencias para la interfaz del Timer de Apagado
    const timerOptionsDiv = document.getElementById('timer-options');
    const timerButtonsContainer = timerOptionsDiv.querySelector('.timer-buttons');
    const cancelTimerBtn = document.getElementById('cancel-timer');
    const timerCountdownDisplay = document.getElementById('timer-countdown');

    // --- Variables de Estado Globales ---
    let isPlaying = false;
    const streamUrl = "https://streaming2.locucionar.com/proxy/estacionurbana?mp=/stream"; // URL de tu streaming
    let currentRadioStreamElement = null; // Referencia al elemento de audio activo

    // Variables para el Timer
    let timerTimeoutId = null; // Guarda el ID de setTimeout para el apagado
    let timerIntervalId = null; // Guarda el ID de setInterval para la cuenta regresiva
    let endTime = null; // Guarda la marca de tiempo cuando el timer debe finalizar

    // --- Funciones de Utilidad para el Audio ---

    // Función para crear un nuevo elemento de audio y adjuntar sus listeners
    const createAndInitializeAudioElement = () => {
        // Si ya hay un elemento de audio existente, lo limpiamos y removemos para evitar conflictos
        if (currentRadioStreamElement) {
            currentRadioStreamElement.pause(); 
            currentRadioStreamElement.src = ''; 
            currentRadioStreamElement.load();   
            if (currentRadioStreamElement.parentNode) {
                currentRadioStreamElement.parentNode.removeChild(currentRadioStreamElement);
            }
            currentRadioStreamElement = null;
        }

        // Crear un NUEVO elemento <audio>
        const newAudioElement = document.createElement('audio');
        newAudioElement.id = 'radio-stream'; 
        newAudioElement.preload = 'none'; // No precargar para evitar consumo de datos al inicio
        newAudioElement.src = streamUrl; 
        newAudioElement.style.display = 'none'; // Ocultar el elemento visualmente
        document.body.appendChild(newAudioElement); // Añadir el nuevo elemento al cuerpo del documento

        // --- Adjuntar todos los Event Listeners al Nuevo Elemento de Audio ---
        newAudioElement.addEventListener('loadstart', () => { console.log('Evento Audio: loadstart'); });
        newAudioElement.addEventListener('loadedmetadata', () => { console.log('Evento Audio: loadedmetadata'); });
        newAudioElement.addEventListener('loadeddata', () => { console.log('Evento Audio: loadeddata'); });
        newAudioElement.addEventListener('canplay', () => { console.log('Evento Audio: canplay'); });
        newAudioElement.addEventListener('canplaythrough', () => { console.log('Evento Audio: canplaythrough'); });
        
        newAudioElement.addEventListener('playing', () => {
            console.log('Evento Audio: playing (Stream reproduciéndose activamente).');
            isPlaying = true;
            playPauseBtn.innerHTML = '❚❚'; // Cambiar icono a Pausa
            playPauseBtn.classList.remove('play-button');
            playPauseBtn.classList.add('pause-button');
        });
        
        newAudioElement.addEventListener('pause', () => {
            console.log('Evento Audio: pause (Stream pausado).');
            isPlaying = false;
            playPauseBtn.innerHTML = '▶'; // Cambiar icono a Play
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
        });
        
        newAudioElement.addEventListener('ended', () => {
            console.log('Evento Audio: ended (Stream terminó).');
            isPlaying = false;
            playPauseBtn.innerHTML = '▶';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
        });
        
        newAudioElement.addEventListener('error', (e) => {
            console.error("Evento Audio: error (Ocurrió un error en el elemento de audio).", e);
            let errorMessage = "Hubo un error con el stream de radio. Revisa la Consola (F12).";
            if (e.target && e.target.error) {
                switch (e.target.error.code) {
                    case e.target.error.MEDIA_ERR_ABORTED: errorMessage = 'Carga abortada.'; break;
                    case e.target.error.MEDIA_ERR_NETWORK: errorMessage = 'Error de red.'; break;
                    case e.target.error.MEDIA_ERR_DECODE: errorMessage = 'Error de decodificación.'; break;
                    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMessage = 'Fuente no soportada o inaccesible (CORS).'; break;
                    default: errorMessage = 'Error desconocido.'; break;
                }
            }
            alert(errorMessage);
            isPlaying = false;
            playPauseBtn.innerHTML = '▶';
            playPauseBtn.classList.remove('pause-button');
            playPauseBtn.classList.add('play-button');
        });
        
        newAudioElement.addEventListener('stalled', () => { console.warn('Evento Audio: stalled'); });
        newAudioElement.addEventListener('waiting', () => { console.log('Evento Audio: waiting'); });

        return newAudioElement; // Retorna la referencia al elemento recién creado
    };

    // --- Lógica del Botón Play/Pausa ---
    playPauseBtn.addEventListener('click', () => {
        console.log("Clic en botón Play/Pausa. Estado actual isPlaying:", isPlaying);

        if (isPlaying) {
            // Si está reproduciendo, simplemente pausar el elemento actual
            if (currentRadioStreamElement) { 
                currentRadioStreamElement.pause();
                console.log("Solicitud de pausa.");
            }
            // El estado 'isPlaying' y el icono se actualizarán por el event listener 'pause' del propio audio.
        } else {
            // Si no está reproduciendo, crear/recrear el elemento y reproducir
            console.log("Solicitud de reproducción. Creando/Reinicializando elemento de audio.");
            currentRadioStreamElement = createAndInitializeAudioElement(); // Crea un nuevo elemento y lo asigna a la variable global
            
            currentRadioStreamElement.play()
                .then(() => {
                    console.log("Promesa de play resuelta con éxito.");
                    // El estado 'isPlaying' y el icono se actualizarán por el event listener 'playing' del propio audio.
                })
                .catch(error => {
                    console.error("Error al intentar reproducir la radio (promesa rechazada):", error);
                    alert("No se pudo iniciar/reanudar la reproducción. Revisa la Consola (F12) para más detalles.");
                    // En caso de error, aseguramos que el estado y el icono reflejen que no se está reproduciendo
                    isPlaying = false;
                    playPauseBtn.innerHTML = '▶';
                    playPauseBtn.classList.remove('pause-button');
                    playPauseBtn.classList.add('play-button');
                });
        }
    });

    // --- Lógica del Menú Desplegable ---
    const openMenu = () => {
        sideMenu.classList.add('open');
        menuOverlay.classList.add('open');
    };

    const closeMenu = () => {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('open');
    };

    menuIcon.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu); // Cierra el menú al hacer clic fuera de él

    // --- Lógica del Timer de Apagado ---
    const startTimer = (minutes) => {
        // Cancelar cualquier timer existente antes de iniciar uno nuevo
        cancelTimer(); 

        // Calcular el tiempo final
        endTime = new Date().getTime() + (minutes * 60 * 1000);

        // Iniciar la cuenta regresiva visible
        updateTimerDisplay(); // Actualiza inmediatamente el contador
        timerIntervalId = setInterval(updateTimerDisplay, 1000); // Actualiza cada segundo

        // Programar el apagado de la radio
        timerTimeoutId = setTimeout(() => {
            if (currentRadioStreamElement && isPlaying) {
                currentRadioStreamElement.pause();
                console.log("Radio pausada por Timer de Apagado.");
                alert("La radio se ha apagado automáticamente por el Timer.");
            }
            cancelTimer(); // Limpiar el timer una vez que se activa
            closeMenu(); // Cerrar el menú
        }, minutes * 60 * 1000); // El tiempo en milisegundos para el setTimeout

        console.log(`Timer de apagado programado para ${minutes} minutos.`);
        alert(`La radio se apagará en ${minutes} minutos.`);
        closeMenu(); // Cerrar el menú después de programar
        
        // Mostrar el contador y el botón de cancelar
        timerCountdownDisplay.classList.remove('hidden');
        cancelTimerBtn.classList.remove('hidden');
    };

    const updateTimerDisplay = () => {
        const now = new Date().getTime();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            timerCountdownDisplay.textContent = 'Timer finalizado.';
            cancelTimer();
            return;
        }

        const totalSeconds = Math.floor(timeLeft / 1000);
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;

        // Formato MM:SS
        const formattedTime = 
            `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        timerCountdownDisplay.textContent = `Tiempo restante: ${formattedTime}`;
    };

    const cancelTimer = () => {
        if (timerTimeoutId) {
            clearTimeout(timerTimeoutId);
            timerTimeoutId = null;
        }
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        endTime = null; // Resetea el tiempo final
        timerCountdownDisplay.textContent = 'Timer cancelado.'; // Mensaje de cancelado
        timerCountdownDisplay.classList.add('hidden'); // Oculta el contador
        cancelTimerBtn.classList.add('hidden'); // Oculta el botón de cancelar
        console.log("Timer de apagado cancelado.");
    };

    // --- Event Listeners para los botones del Timer ---
    timerButtonsContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.dataset.minutes) {
            const minutes = parseInt(event.target.dataset.minutes);
            startTimer(minutes);
        }
    });
    cancelTimerBtn.addEventListener('click', cancelTimer);

    // --- Placeholder para la Alarma (funcionalidad pendiente) ---
    const setupAlarm = () => {
        alert("Configurar Alarma de Encendido (funcionalidad pendiente)");
        closeMenu();
    };
    menuAlarmOption.addEventListener('click', (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del enlace #
        setupAlarm();
    });
    
    // --- Lógica de la Programación Actual ---
    const updateProgram = () => {
        const now = new Date();
        const hour = now.getHours(); 

        let currentProgram = 'Música Continua'; // Programa por defecto

        // Personaliza esta programación a tu gusto según la hora local de Venado Tuerto (GMT-3)
        // La hora actual es: Thursday, May 29, 2025 at 12:18:40 AM -03.
        // A las 00:18 (media noche), debería mostrar "Selección Musical Nocturna".
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

    // --- Inicialización al Cargar la Página ---
    updateProgram(); // Muestra la programación inicial
    setInterval(updateProgram, 60 * 1000); // Actualiza la programación cada minuto

    // Crea el primer elemento de audio al cargar la página para que esté listo al primer clic
    currentRadioStreamElement = createAndInitializeAudioElement();
});
