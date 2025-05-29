document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const programNameSpan = document.getElementById('program-name');

    let isPlaying = false;
    const streamUrl = "https://streaming2.locucionar.com/proxy/estacionurbana?mp=/stream"; // URL del stream

    let currentRadioStreamElement = null; // Usamos un nombre diferente para evitar confusiones, y se inicializará aquí

    // Función para crear un nuevo elemento de audio y adjuntar sus listeners
    const createAndInitializeAudioElement = () => {
        // Si ya hay un elemento, lo limpiamos antes de crear uno nuevo
        if (currentRadioStreamElement) {
            currentRadioStreamElement.pause();
            currentRadioStreamElement.src = ''; // Limpiar src para liberar recursos
            currentRadioStreamElement.load();   // Forzar carga
            if (currentRadioStreamElement.parentNode) {
                currentRadioStreamElement.parentNode.removeChild(currentRadioStreamElement); // Eliminar del DOM
            }
            currentRadioStreamElement = null; // Limpiar la referencia
        }

        const newAudioElement = document.createElement('audio');
        newAudioElement.id = 'radio-stream';
        newAudioElement.preload = 'none';
        newAudioElement.src = streamUrl;
        newAudioElement.style.display = 'none'; // Ocultar el elemento visualmente
        document.body.appendChild(newAudioElement); // Añadirlo al cuerpo del documento

        // ADJUNTAR LISTENERS DIRECTAMENTE AQUÍ, DESPUÉS DE CREAR EL ELEMENTO
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

        return newAudioElement; // Retornar la referencia al elemento creado y configurado
    };

    // --- Lógica del Botón Play/Pausa ---
    playPauseBtn.addEventListener('click', () => {
        console.log("Clic en botón Play/Pausa. Estado actual isPlaying:", isPlaying);

        if (isPlaying) {
            // Si está reproduciendo, pausar el elemento actual
            if (currentRadioStreamElement) {
                currentRadioStreamElement.pause();
                console.log("Solicitud de pausa.");
            }
            // isPlaying y el icono se actualizarán por el event listener 'pause'
        } else {
            // Si no está reproduciendo, crear/recrear el elemento y reproducir
            console.log("Solicitud de reproducción.");
            currentRadioStreamElement = createAndInitializeAudioElement(); // Crea un nuevo elemento y lo asigna a la variable global
            
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

    // --- Lógica de la Programación Actual ---
    const updateProgram = () => {
        const now = new Date();
        const hour = now.getHours();
        // El context es Venado Tuerto, Santa Fe Province, Argentina (GMT-3)
        // new Date() por defecto usa la zona horaria local del cliente.
        // Si quieres que la programación sea estrictamente según la hora de Venado Tuerto,
        // sin importar dónde esté el usuario, necesitarías una librería de zona horaria
        // o un cálculo más complejo. Por ahora, asumimos la hora local es suficiente.

        let currentProgram = 'Música Continua';

        if (hour >= 7 && hour < 10) { // 7:00 AM - 9:59 AM
            currentProgram = 'El Despertador de la Mañana';
        } else if (hour >= 10 && hour < 13) { // 10:00 AM - 12:59 PM
            currentProgram = 'Magazine Radial del Día';
        } else if (hour >= 13 && hour < 16) { // 1:00 PM - 3:59 PM
            currentProgram = 'Noticias al Mediodía';
        } else if (hour >= 16 && hour < 19) { // 4:00 PM - 6:59 PM
            currentProgram = 'Conduciendo la Tarde';
        } else if (hour >= 19 && hour < 22) { // 7:00 PM - 9:59 PM
            currentProgram = 'Noches de Rock Nacional';
        } else if (hour >= 22 || hour < 7) { // 10:00 PM - 6:59 AM
            currentProgram = 'Selección Musical Nocturna';
        }

        programNameSpan.textContent = currentProgram;
    };

    // Inicializar la programación y el elemento de audio al cargar la página
    updateProgram();
    setInterval(updateProgram, 60 * 1000); // Actualiza la programación cada minuto

    // Al cargar la página, se crea el primer elemento de audio para que esté listo al primer clic
    currentRadioStreamElement = createAndInitializeAudioElement();
});