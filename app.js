document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const programNameSpan = document.getElementById('program-name');

    // --- NUEVAS REFERENCIAS PARA EL MENÚ ---
    const menuIcon = document.querySelector('.menu-icon');
    const sideMenu = document.getElementById('side-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const menuTimerOption = document.getElementById('menu-timer');
    const menuAlarmOption = document.getElementById('menu-alarm');
    // --- FIN NUEVAS REFERENCIAS ---

    let isPlaying = false;
    const streamUrl = "https://streaming2.locucionar.com/proxy/estacionurbana?mp=/stream"; // URL del stream

    let currentRadioStreamElement = null; // Variable para almacenar la referencia al elemento de audio activo

    // Función para crear un nuevo elemento de audio y adjuntar sus listeners
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
            let errorMessage = "Hubo un error con el stream de radio. Consulta la Consola (F12).";
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

    // --- Lógica del Botón Play/Pausa (sin cambios relevantes) ---
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
    };

    menuIcon.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu); // Cierra el menú al hacer clic fuera de él

    // --- Funciones de Timer y Alarma (implementación básica) ---
    const setupTimer = () => {
        alert("Configurar Timer de Apagado (funcionalidad pendiente)");
        // Aquí iría la lógica para pedir al usuario el tiempo y apagar la radio
        closeMenu(); // Cierra el menú después de la acción
    };

    const setupAlarm = () => {
        alert("Configurar Alarma de Encendido (funcionalidad pendiente)");
        // Aquí iría la lógica para pedir al usuario la hora y encender la radio
        closeMenu(); // Cierra el menú después de la acción
    };

    menuTimerOption.addEventListener('click', setupTimer);
    menuAlarmOption.addEventListener('click', setupAlarm);

    // --- Lógica de la Programación Actual (sin cambios relevantes) ---
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

    currentRadioStreamElement = createAndInitializeAudioElement();
});
