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
    let timerTimeoutId = null; 
    let timerIntervalId = null; 
    let endTime = null; 

    // --- Funciones de Utilidad para el Audio ---
    const createAndInitializeAudioElement = () => {
        if (currentRadioStreamElement) {
            currentRadioStreamElement.pause(); 
            currentRadioStreamElement.src = ''; 
            currentRadioStreamElement.load();   
            if (currentRadioStreamElement.parentNode) {
                currentRadioStreamElement.parentNode.removeChild(currentRadioStreamElement);
            }
            currentRadioStreamElement = null;
        }

        const newAudioElement = document.createElement('audio');
        newAudioElement.id = 'radio-stream'; 
        newAudioElement.preload = 'none'; 
        newAudioElement.src = streamUrl; 
        newAudioElement.style.display = 'none'; 
        document.body.appendChild(newAudioElement);

        newAudioElement.addEventListener('loadstart', () => { console.log('Evento Audio: loadstart'); });
        newAudioElement.addEventListener('loadedmetadata', () => { console.log('Evento Audio: loadedmetadata'); });
        newAudioElement.addEventListener('loadeddata', () => { console.log('Evento Audio: loadeddata'); });
        newAudioElement.addEventListener('canplay', () => { console.log('Evento Audio: canplay'); });
        newAudioElement.addEventListener('canplaythrough', () => { console.log('Evento Audio: canplaythrough'); });
        
        newAudioElement.addEventListener('playing', () => {
            console.log('Evento Audio: playing (Stream reproduciéndose activamente).');
            isPlaying = true;
            playPauseBtn.innerHTML = '❚❚';
            playPauseBtn.classList.remove('play-button');
            playPauseBtn.classList.add('pause-button');
        });
        
        newAudioElement.addEventListener('pause', () => {
            console.log('Evento Audio: pause (Stream pausado).');
            isPlaying = false;
            playPauseBtn.innerHTML = '▶';
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

        return newAudioElement;
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
    };

    const closeMenu = () => {
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('open');
        // Asegurarse de ocultar la interfaz del timer cuando se cierra el menú principal
        timerOptionsDiv.classList.remove('active'); 
    };

    menuIcon.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);

    // --- Lógica del Timer de Apagado ---
    const startTimer = (minutes) => {
        cancelTimer(); 
        endTime = new Date().getTime() + (minutes * 60 * 1000);

        updateTimerDisplay(); 
        timerIntervalId = setInterval(updateTimerDisplay, 1000); 

        timerTimeoutId = setTimeout(() => {
            if (currentRadioStreamElement && isPlaying) {
                currentRadioStreamElement.pause();
                console.log("Radio pausada por Timer de Apagado.");
                alert("La radio se ha apagado automáticamente por el Timer.");
            }
            cancelTimer(); 
            closeMenu(); // Cierra el menú después de que el timer se active
        }, minutes * 60 * 1000);

        console.log(`Timer de apagado programado para ${minutes} minutos.`);
        alert(`La radio se apagará en ${minutes} minutos.`);
        closeMenu(); // Cierra el menú DESPUÉS de programar el timer y mostrar el alert
        
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
        endTime = null;
        timerCountdownDisplay.textContent = 'Timer cancelado.';
        timerCountdownDisplay.classList.add('hidden');
        cancelTimerBtn.classList.add('hidden');
        console.log("Timer de apagado cancelado.");
    };

    timerButtonsContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.dataset.minutes) {
            const minutes = parseInt(event.target.dataset.minutes);
            startTimer(minutes);
        }
    });
    cancelTimerBtn.addEventListener('click', cancelTimer);

    // --- Control de la Interfaz del Timer al hacer clic en la opción del menú ---
    // Esta es la parte CLAVE para mostrar la interfaz del Timer
    menuTimerOption.addEventListener('click', (e) => {
        e.preventDefault(); 
        console.log("Clic en 'Timer de Apagado'. Mostrando interfaz del timer.");
        // Ocultar otras secciones del menú si existieran aquí
        // ...
        timerOptionsDiv.classList.add('active'); // Mostrar la interfaz de los botones del timer
        // Puedes optar por no cerrar el menú principal aquí si quieres que el usuario vea los botones del timer y otras opciones del menú
        // closeMenu(); // Descomenta esta línea si quieres que el menú principal se cierre inmediatamente al seleccionar "Timer de Apagado"
    });

    // --- Placeholder para la Alarma (funcionalidad pendiente) ---
    const setupAlarm = () => {
        alert("Configurar Alarma de Encendido (funcionalidad pendiente)");
        closeMenu();
    };
    menuAlarmOption.addEventListener('click', (e) => {
        e.preventDefault();
        // Ocultar la interfaz del timer si estuviera activa
        timerOptionsDiv.classList.remove('active'); 
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
