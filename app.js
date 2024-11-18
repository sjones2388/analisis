async function transcribirAudio() {
    try {
        iniciarProgreso("Transcribiendo el audio...");
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');
        formData.append('language', 'es');

        const response = await fetch('http://localhost:3000/transcribe', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log('Respuesta de la transcripción:', data);
        const transcripcion = data.text || 'No se pudo transcribir el audio.';
        document.getElementById('resultado').textContent = "Transcripción completada.";
        actualizarProgreso(50);
        analizarInterlocutores(transcripcion);
    } catch (error) {
        document.getElementById('resultado').textContent = `Error: ${error.message}`;
    }
}

async function analizarInterlocutores(transcripcion) {
    try {
        iniciarProgreso("Clasificando interlocutores...");
        actualizarProgreso(75);
        const prompt = `Clasifica cada línea como "Asesor:" o "Cliente:". Transcripción:\n${transcripcion}`;

        const response = await fetch('http://localhost:3000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();
        console.log('Respuesta de la API (clasificación):', data);

        if (data && data.choices && data.choices.length > 0) {
            const resultadoClasificado = data.choices[0].message.content;
            mostrarTranscripcionComoChat(resultadoClasificado);
            calcularTiempos(resultadoClasificado);
            generarGrafico();
            generarRecomendaciones(resultadoClasificado);
        } else {
            throw new Error('La respuesta de la API no contiene "choices" o es inválida.');
        }
    } catch (error) {
        document.getElementById('resultado').textContent = `Error en el análisis: ${error.message}`;
    }
}
