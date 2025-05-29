document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const playPauseBtn = document.getElementById('play-pause-btn');
    const programNameSpan = document.getElementById('program-name');

    // Referencias para el menú lateral
    const menuIcon = document.querySelector('.menu-icon');
    const sideMenu = document.getElementById('side-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    
    // Referencias para las opciones del menú principal (el ID cambió en HTML)
    const menuTimerOption = document.getElementById('menu-timer-option'); // ID actualizado
    const menuAlarmOption = document.getElementById('menu-alarm');
    
    // Referencias para el NUEVO PANEL FLOTANTE del Timer de Apagado
    const timerSelectionPanel = document.getElementById('timer-selection-panel');
    const closeTimerPanelBtn = document.getElementById('close-timer-panel');
    const timerButtonsContainer = timerSelectionPanel.querySelector('.timer-buttons');
    const cancelTimerBtn = document.getElementById('cancel-timer-button'); // ID actualizado
    
    // Referencia para el contador del Timer en el cuerpo principal de la app
    const mainAppTimerCountdown = document.getElementById('main-app-timer-countdown');

    // --- Variables de Estado Globales ---
    let isPlaying = false;
    const streamUrl = "http://nodo10.arcast.live:8500/enlace.mp3"; // URL de tu streaming
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
        newAudioElement.preload = 'none'; 
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
            if (currentRadioStreamElement) { 
                currentRadioStreamElement.pause();
                console.log("Solicitud de pausa.");
            }
        } else {
            console.log("Solicitud de reproducción. Creando/Reinicializando elemento de audio.");
            currentRadioStreamElement = createAndInitializeAudioElement();
            
            currentRadioStreamElement.play()
                .then(() => {
                    console.log("Promesa de play resuelta con éxito.");
                })
                .catch(error => {
                    console.error("Error al intentar reproducir la radio (promesa rechazada):", error);
                    alert("No se pudo iniciar/reanudar la reproducción. Revisa la Consola (F12) para más detalles.");
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
        // Asegurarse de que el panel de selección del timer esté oculto al abrir el menú principal
        timerSelectionPanel.classList.remove('open'); 
    };

    const closeMenu = () => {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('open');
        // Asegurarse de ocultar el panel de selección del timer cuando se cierra el menú principal
        timerSelectionPanel.classList.remove('open'); 
    };

    menuIcon.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu); // Cierra el menú al hacer clic fuera de él

    // --- Lógica del Timer de Apagado ---
    const startTimer = (minutes) => {
        cancelTimer(); // Cancelar cualquier timer existente
        endTime = new Date().getTime() + (minutes * 60 * 1000);

        updateTimerDisplay(); // Actualiza inmediatamente el contador visible
        mainAppTimerCountdown.classList.remove('hidden'); // Muestra el contador en el cuerpo principal
        timerIntervalId = setInterval(updateTimerDisplay, 1000); // Actualiza cada segundo

        // Programa el apagado de la radio
        timerTimeoutId = setTimeout(() => {
            if (currentRadioStreamElement && isPlaying) {
                currentRadioStreamElement.pause();
                console.log("Radio pausada por Timer de Apagado.");
                alert("La radio se ha apagado automáticamente por el Timer.");
            }
            cancelTimer(); // Limpia el timer una vez que se activa
        }, minutes * 60 * 1000); // El tiempo en milisegundos para el setTimeout

        console.log(`Timer de apagado programado para ${minutes} minutos.`);
        alert(`La radio se apagará en ${minutes} minutos.`);
        closeMenu(); // Cierra el menú principal
        timerSelectionPanel.classList.remove('open'); // Oculta el panel de selección del timer
        // El botón Cancelar Timer en el panel flotante
        cancelTimerBtn.classList.remove('hidden'); 
    };

    const updateTimerDisplay = () => {
        const now = new Date().getTime();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            mainAppTimerCountdown.textContent = 'Timer finalizado.';
            cancelTimer();
            return;
        }

        const totalSeconds = Math.floor(timeLeft / 1000);
        const displayMinutes = Math.floor(totalSeconds / 60);
        const displaySeconds = totalSeconds % 60;

        const formattedTime = 
            `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        mainAppTimerCountdown.textContent = `Tiempo restante: ${formattedTime}`;
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
        mainAppTimerCountdown.textContent = 'Timer cancelado.'; // Mensaje de cancelado
        mainAppTimerCountdown.classList.add('hidden'); // Oculta el contador en el cuerpo principal
        cancelTimerBtn.classList.add('hidden'); // Oculta el botón de cancelar en el panel
        console.log("Timer de apagado cancelado.");
    };

    // --- Event Listeners para los botones del Panel de Selección del Timer ---
    timerButtonsContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.dataset.minutes) {
            const minutes = parseInt(event.target.dataset.minutes);
            startTimer(minutes);
        }
    });
    // Event Listener para el botón "Cancelar Timer" en el panel flotante
    cancelTimerBtn.addEventListener('click', cancelTimer);

    // Event Listener para cerrar el panel de selección del timer
    closeTimerPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        timerSelectionPanel.classList.remove('open'); // Cierra el panel
    });


    // --- Control de la Interfaz del Timer al hacer clic en la opción del menú ---
    menuTimerOption.addEventListener('click', (e) => {
        e.preventDefault(); 
        console.log("Clic en 'Timer de Apagado'. Mostrando interfaz del timer.");
        closeMenu(); // Cierra el menú principal inmediatamente
        timerSelectionPanel.classList.add('open'); // Abre el panel de selección del timer
    });

    // --- Placeholder para la Alarma (funcionalidad pendiente) ---
    const setupAlarm = () => {
        alert("Configurar Alarma de Encendido (funcionalidad pendiente)");
        closeMenu();
    };
    menuAlarmOption.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu(); // Cierra el menú principal
        // Ocultar la interfaz del timer si estuviera activa
        timerSelectionPanel.classList.remove('open'); 
        setupAlarm();
    });
    
    // --- Lógica de la Programación Actual ---
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

    // --- Inicialización al Cargar la Página ---
    updateProgram();
    setInterval(updateProgram, 60 * 1000);

    currentRadioStreamElement = createAndInitializeAudioElement();
});
