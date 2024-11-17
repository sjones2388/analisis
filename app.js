const apiKey = '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';

let audioFile = null;
let clienteTiempo = 0;
let asesorTiempo = 0;
let pieChart = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('audioInput').addEventListener('change', () => {
        const input = document.getElementById('audioInput');
        if (input.files.length > 0) {
            audioFile = input.files[0];
            document.getElementById('resultado').textContent = `Archivo cargado: ${audioFile.name}`;
        }
    });

    document.getElementById('transcribeButton').addEventListener('click', () => {
        if (audioFile) {
            iniciarProgreso("Iniciando transcripción...");
            transcribirAudio();
        } else {
            alert('Por favor, selecciona un archivo de audio.');
        }
    });

    document.getElementById('clearButton').addEventListener('click', limpiarAudio);
});

function limpiarAudio() {
    audioFile = null;
    clienteTiempo = 0;
    asesorTiempo = 0;
    document.getElementById('audioInput').value = "";
    document.getElementById('resultado').textContent = "Esperando transcripción...";
    document.getElementById('chatBox').innerHTML = "";
    document.getElementById('recomendaciones').textContent = "Recomendaciones: ";
    if (pieChart) pieChart.destroy();
    updateKPIs(0, 0, 0);
    actualizarProgreso(0);
}

function iniciarProgreso(mensaje) {
    document.getElementById('resultado').textContent = mensaje;
    actualizarProgreso(25);
}

function actualizarProgreso(porcentaje) {
    const progressBar = document.getElementById('progress');
    progressBar.style.width = `${porcentaje}%`;
}

function mostrarTranscripcionComoChat(transcripcion) {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = '';

    const lines = transcripcion.split('\n');
    lines.forEach(line => {
        const message = document.createElement('div');
        if (line.startsWith('Asesor:')) {
            message.className = 'operator';
        } else if (line.startsWith('Cliente:')) {
            message.className = 'client';
        }
        message.textContent = line;
        chatBox.appendChild(message);
    });
}

async function transcribirAudio() {
    try {
        iniciarProgreso("Transcribiendo el audio...");
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');
        formData.append('language', 'es');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData
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

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        console.log('Respuesta de la API (clasificación):', data);

        if (data && data.choices && data.choices.length > 0) {
            const resultadoClasificado = data.choices[0].message.content;
            mostrarTranscripcionComoChat(resultadoClasificado);
            calcularTiempos(resultadoClasificado);
            generarGrafico();
            generarRecomendaciones(resultadoClasificado);
        } else if (data.error) {
            throw new Error(`Error de la API: ${data.error.message}`);
        } else {
            throw new Error('La respuesta de la API no contiene "choices" o es inválida.');
        }
    } catch (error) {
        document.getElementById('resultado').textContent = `Error en el análisis: ${error.message}`;
    }
}

function calcularTiempos(transcripcion) {
    const lines = transcripcion.split('\n');
    clienteTiempo = 0;
    asesorTiempo = 0;
    const caracteresPorSegundo = 2.5;

    lines.forEach(line => {
        if (line.startsWith('Asesor:')) {
            asesorTiempo += (line.length - 'Asesor:'.length) / caracteresPorSegundo;
        } else if (line.startsWith('Cliente:')) {
            clienteTiempo += (line.length - 'Cliente:'.length) / caracteresPorSegundo;
        }
    });

    const totalTime = clienteTiempo + asesorTiempo;
    updateKPIs(clienteTiempo, asesorTiempo, totalTime);
}

function updateKPIs(clienteTime, asesorTime, totalTime) {
    document.getElementById('totalTimeKPI').textContent = `⏳ Tiempo Total: ${formatTime(totalTime)}`;
    document.getElementById('asesorTimeKPI').textContent = `💼 Tiempo Asesor: ${formatTime(asesorTime)}`;
    document.getElementById('clienteTimeKPI').textContent = `👤 Tiempo Cliente: ${formatTime(clienteTime)}`;
}

function formatTime(timeInSeconds) {
    const minutes = String(Math.floor(timeInSeconds / 60)).padStart(2, '0');
    const seconds = String(Math.floor(timeInSeconds % 60)).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function generarGrafico() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const total = clienteTiempo + asesorTiempo;

    if (pieChart) pieChart.destroy();

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Cliente', 'Asesor'],
            datasets: [{
                data: [(clienteTiempo / total) * 100, (asesorTiempo / total) * 100],
                backgroundColor: ['#4caf50', '#2196f3']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

async function generarRecomendaciones(transcripcion) {
    try {
        iniciarProgreso("Generando recomendaciones...");
        actualizarProgreso(90);
        const prompt = `Genera 3  breves recomendaciones de las fallas mas grabes  para que el asesor mejore la interacción basada en esta conversación:\n${transcripcion}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const data = await response.json();
        console.log('Respuesta de la API (recomendaciones):', data);

        if (data && data.choices && data.choices.length > 0) {
            const recomendaciones = data.choices[0].message.content;
            document.getElementById('recomendaciones').textContent = "Recomendaciones: " + recomendaciones;
            actualizarProgreso(100);
            document.getElementById('resultado').textContent = "Proceso completado con éxito.";
        } else if (data.error) {
            throw new Error(`Error de la API: ${data.error.message}`);
        } else {
            throw new Error('La respuesta de la API no contiene "choices" o es inválida.');
        }
    } catch (error) {
        document.getElementById('resultado').textContent = `Error al generar recomendaciones: ${error.message}`;
    }
}
