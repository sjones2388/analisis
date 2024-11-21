let allPosts = [];
let filteredPosts = [];  // Variable para almacenar las publicaciones filtradas

// Cargar los datos al inicio
async function cargarDatos() {
    const response = await fetch('november_posts_with_details_updated.json');
    const data = await response.json();
    allPosts = data;  // Guardar los datos globalmente

    // Mostrar las publicaciones sin filtros al inicio
    mostrarPublicaciones(allPosts);
}

// Mostrar publicaciones en cuadraditos
function mostrarPublicaciones(publicaciones) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = ''; // Limpiar contenedor antes de mostrar nuevos

    publicaciones.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        const edadPublicacion = calcularEdadPublicacion(post.timestamp);
        const formattedDate = formatFecha(post.timestamp); // Formatear la fecha
        const porcentajes = calcularSentimientosPorcentajes(post.comments);

        // Lógica para agregar un halo de color (contorno) según el sentimiento
        let boxShadow = '0 0 10px 2px rgba(0, 0, 0, 0.1)';  // Contorno negro por defecto

        // Asignar contorno dependiendo del sentimiento o si es "sin clasificar"
        if (porcentajes.positivo > porcentajes.negativo && porcentajes.positivo > porcentajes.neutro) {
            boxShadow = '0 0 10px 5px rgba(0, 255, 0, 0.7)';  // Halo verde para Positivo
        } else if (porcentajes.neutro > porcentajes.positivo && porcentajes.neutro > porcentajes.negativo) {
            boxShadow = '0 0 10px 5px rgba(255, 255, 0, 0.7)';  // Halo amarillo para Neutro
        } else if (porcentajes.negativo > porcentajes.positivo && porcentajes.negativo > porcentajes.neutro) {
            boxShadow = '0 0 10px 5px rgba(255, 0, 0, 0.7)';  // Halo rojo para Negativo
        } else {
            boxShadow = '0 0 10px 2px rgba(0, 0, 0, 0.3)';  // Contorno negro para "Sin Clasificar" o sin clasificación
        }

        // Verificar si es un video
        let mediaElement;
        if (post.media_url.includes('.mp4')) {
            // Usamos la primera imagen como miniatura
            const thumbnail = post.thumbnail_url || 'https://via.placeholder.com/400x300.png?text=Video'; // URL de imagen predeterminada
            mediaElement = `
                <div class="video-thumbnail">
                    <img src="${thumbnail}" alt="Miniatura del video" class="post-image">
                    <button class="play-button" onclick="reproducirVideo('${post.media_url}')">▶</button>
                </div>
            `;
        } else {
            mediaElement = `<img src="${post.media_url}" alt="Imagen de la publicación" class="post-image">`;
        }

        postElement.innerHTML = `
            ${mediaElement}
            <p class="post-date">Fecha de publicación: ${formattedDate}</p>
            <p class="post-age">Hace ${edadPublicacion} días</p>
            <p class="post-comments">${post.comments_count} comentarios</p>
            <p class="sentiment-stats">Positivo: ${porcentajes.positivo}% | Negativo: ${porcentajes.negativo}% | Neutro: ${porcentajes.neutro}%</p>
        `;
        postElement.style.boxShadow = boxShadow;  // Aplicar el halo de color como contorno
        postsContainer.appendChild(postElement);
    });
}

// Función para reproducir el video al hacer clic
function reproducirVideo(videoUrl) {
    const modal = document.createElement('div');
    modal.classList.add('video-modal');
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" onclick="cerrarModal()">×</span>
            <video width="100%" controls>
                <source src="${videoUrl}" type="video/mp4">Tu navegador no soporta el video.
            </video>
        </div>
    `;
    document.body.appendChild(modal);
}

// Cerrar el modal
function cerrarModal() {
    const modal = document.querySelector('.video-modal');
    if (modal) {
        modal.remove();
    }
}

// Calcular antigüedad de la publicación en días
function calcularEdadPublicacion(timestamp) {
    const fechaPublicacion = new Date(timestamp);
    const diferencia = new Date() - fechaPublicacion;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24)); // Convertir a días
}

// Formatear la fecha en el formato DD/MM/AA
function formatFecha(timestamp) {
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = String(fecha.getFullYear()).slice(-2);
    return `${dia}/${mes}/${año}`;
}

// Calcular el porcentaje de sentimientos en los comentarios de una publicación
function calcularSentimientosPorcentajes(comments) {
    if (!comments || comments.length === 0) {
        return { positivo: '0.0', negativo: '0.0', neutro: '0.0' };  // No comentarios, devolver 0%
    }

    const totalComments = comments.length;
    const sentimientosCount = { positivo: 0, negativo: 0, neutro: 0 };

    comments.forEach(comentario => {
        if (comentario.clasificacion === 'positivo') {
            sentimientosCount.positivo++;
        } else if (comentario.clasificacion === 'negativo') {
            sentimientosCount.negativo++;
        } else if (comentario.clasificacion === 'neutro') {
            sentimientosCount.neutro++;
        }
    });

    const porcentajePositivo = ((sentimientosCount.positivo / totalComments) * 100).toFixed(1);
    const porcentajeNegativo = ((sentimientosCount.negativo / totalComments) * 100).toFixed(1);
    const porcentajeNeutro = ((sentimientosCount.neutro / totalComments) * 100).toFixed(1);

    return { 
        positivo: porcentajePositivo, 
        negativo: porcentajeNegativo, 
        neutro: porcentajeNeutro
    };
}

// Filtrar datos al aplicar filtros
document.getElementById('applyFilters').addEventListener('click', () => {
    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo = new Date(document.getElementById('dateTo').value);
    const sentiment = document.getElementById('sentiment').value;

    // Filtrar las publicaciones según el sentimiento y las fechas
    let publicacionesFiltradas = allPosts;

    if (sentiment !== 'all') {
        publicacionesFiltradas = publicacionesFiltradas.filter(post => {
            const porcentajes = calcularSentimientosPorcentajes(post.comments);
            if (sentiment === 'positivo' && porcentajes.positivo > porcentajes.negativo && porcentajes.positivo > porcentajes.neutro) {
                return true;
            } else if (sentiment === 'negativo' && porcentajes.negativo > porcentajes.positivo && porcentajes.negativo > porcentajes.neutro) {
                return true;
            } else if (sentiment === 'neutro' && porcentajes.neutro > porcentajes.positivo && porcentajes.neutro > porcentajes.negativo) {
                return true;
            } else if (sentiment === 'sinClasificar' && porcentajes.positivo === '0.0' && porcentajes.negativo === '0.0' && porcentajes.neutro === '0.0') {
                return true;  // Sin métricas de sentimiento
            }
            return false;
        });
    }

    // Filtrar por rango de fechas
    if (!isNaN(dateFrom) && dateFrom !== "") {
        publicacionesFiltradas = publicacionesFiltradas.filter(post => {
            const fechaPublicacion = new Date(post.timestamp);
            return fechaPublicacion >= dateFrom;
        });
    }

    if (!isNaN(dateTo) && dateTo !== "") {
        publicacionesFiltradas = publicacionesFiltradas.filter(post => {
            const fechaPublicacion = new Date(post.timestamp);
            return fechaPublicacion <= dateTo;
        });
    }

    filteredPosts = publicacionesFiltradas; // Guardar las publicaciones filtradas
    mostrarPublicaciones(filteredPosts);
});

// Ordenar por comentarios (popularidad)
document.getElementById('sortByPopularity').addEventListener('click', () => {
    let publicacionesFiltradas = filteredPosts.length ? filteredPosts : allPosts;

    publicacionesFiltradas = publicacionesFiltradas.sort((a, b) => b.comments_count - a.comments_count);  // De mayor a menor
    mostrarPublicaciones(publicacionesFiltradas);
});

// Ordenar por fecha (más reciente primero)
document.getElementById('sortByDate').addEventListener('click', () => {
    let publicacionesFiltradas = filteredPosts.length ? filteredPosts : allPosts;

    publicacionesFiltradas = publicacionesFiltradas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));  // Más reciente primero
    mostrarPublicaciones(publicacionesFiltradas);
});

// Limpiar los filtros
document.getElementById('clearFilters').addEventListener('click', () => {
    // Restablecer los valores de los filtros
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    document.getElementById('sentiment').value = 'all';

    // Mostrar todas las publicaciones
    mostrarPublicaciones(allPosts);
});

// Cargar los datos al inicio
cargarDatos();
