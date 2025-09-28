
document.addEventListener('DOMContentLoaded', async () => {
  // Obtener datos del usuario logueado
  let usuario;
  try {
    const res = await fetch('/api/login/me', { credentials: 'include' });
    if (!res.ok) throw new Error('No logueado');
    usuario = await res.json();
  } catch {
    alert('No ha iniciado sesión correctamente.');
    window.location.href = "../index.html";
    return;
  }

  document.getElementById('nombreUsuario').textContent = usuario.usuario;
  // 🔽 Mostrar u ocultar filtros según el tipo
  const tipoFiltro = document.getElementById('tipoFiltro');
  const filtroUnico = document.getElementById('filtroFechaUnica');
  const filtroRango = document.getElementById('filtroRangoFechas');

  tipoFiltro.addEventListener('change', () => {
    if (tipoFiltro.value === 'fecha') {
      filtroUnico.style.display = 'block';
      filtroRango.style.display = 'none';
    } else {
      filtroUnico.style.display = 'none';
      filtroRango.style.display = 'block';
    }
  });

  // 🔽 Mostrar TOP 3 de atención
  try {
    const res = await fetch('/api/estadisticas/top3', { credentials: 'include' });
    const top = await res.json();
    // const contenedor = document.getElementById('topAtenciones1');
    // contenedor.innerHTML = '';
    // top.forEach((entry, index) => {
    //   const p = document.createElement('p');
    //   p.innerHTML = `<strong>${index + 1}. ${entry.nombre} ${entry.apellido}</strong> - Promedio: ${entry.promedio}`;
    //   contenedor.appendChild(p);
    // });

    const radarContainer = document.getElementById('topAtenciones');
    radarContainer.innerHTML = ''; // limpiar contenedor padre
    radarContainer.classList.add('cards-container');

    top.forEach((entry, index) => {
      const div = document.createElement('div');
      div.classList.add('card');

      div.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <h5>#${index + 1} ${entry.nombre}</h5>
        <p>Promedio: ${entry.promedio}</p>
      </div>
      <div class="card-back">
        <canvas id="graficoTopRadar${index + 1}"></canvas>
      </div>
    </div>
  `;
  

      radarContainer.appendChild(div);
      

      // Radar chart dentro del reverso
      const ctx = div.querySelector(`#graficoTopRadar${index + 1}`).getContext('2d');
      const color = [
        { fondo: 'rgba(255, 99, 132, 0.2)', borde: 'rgb(255, 99, 132)' },
        { fondo: 'rgba(54, 162, 235, 0.2)', borde: 'rgb(54, 162, 235)' },
        { fondo: 'rgba(255, 206, 86, 0.2)', borde: 'rgb(255, 206, 86)' }
      ][index];

      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Puntualidad', 'Trato', 'Resolución'],
          datasets: [{
            label: `${entry.nombre} ${entry.apellido}`,
            data: [
              entry.promedio_puntualidad || 0,
              entry.promedio_trato || 0,
              entry.promedio_resolucion || 0
            ],
            fill: true,
            backgroundColor: color.fondo,
            borderColor: color.borde,
            pointBackgroundColor: color.borde,
            pointBorderColor: '#fff'
          }]
        },
        options: {
          elements: { line: { borderWidth: 1 } },
          plugins: { legend: { display: false } },
          responsive: true,           // se adapta al contenedor
          scales: {
            r: {
              min: 0, max: 5, stepSize: 1,
              pointLabels: { color: '#000', font: { size: 13, weight: 'bold' } }
            }
          }
        }
      });
    });

    // const radarContainer = document.getElementById('topAtenciones');
    // radarContainer.innerHTML = ''; // Limpiar contenedor padre

    // top.forEach((entry, index) => {
    //   // Crear un contenedor individual para cada TOP
    //   const div = document.createElement('div');
    //   div.id = `topRadar${index + 1}`;
    //   div.classList.add('top-radar-item'); // opcional para estilos
    //   div.innerHTML = `
    //     <!--<canvas id="graficoTopRadar${index + 1}"></canvas>-->
    //     <div class="card">
    //       <h5 class="title">#${index + 1} ${entry.nombre}</h5>
    //       <canvas id="graficoTopRadar${index + 1}" style="max-height:280px;"></canvas>
    //     </div>
    //   `;

    //   radarContainer.appendChild(div);

    //   // Crear gráfico radar dentro de este div
    //   const ctx = document.getElementById(`graficoTopRadar${index + 1}`).getContext('2d');

    //   const color = [
    //     { fondo: 'rgba(255, 99, 132, 0.2)', borde: 'rgb(255, 99, 132)' },
    //     { fondo: 'rgba(54, 162, 235, 0.2)', borde: 'rgb(54, 162, 235)' },
    //     { fondo: 'rgba(255, 206, 86, 0.2)', borde: 'rgb(255, 206, 86)' }
    //   ][index];

    //   new Chart(ctx, {
    //     type: 'radar',
    //     data: {
    //       labels: ['Puntualidad', 'Trato', 'Resolución'],
    //       datasets: [{
    //         label: `${entry.nombre} ${entry.apellido}`,
    //         data: [entry.promedio_puntualidad || 0, entry.promedio_trato || 0, entry.promedio_resolucion || 0],
    //         fill: true,
    //         backgroundColor: color.fondo,
    //         borderColor: color.borde,
    //         pointBackgroundColor: color.borde,
    //         pointBorderColor: '#fff',
    //         pointHoverBackgroundColor: '#fff',
    //         pointHoverBorderColor: color.borde
    //       }]
    //     },
    //     options: {
    //       elements: { line: { borderWidth: 1 } },
    //       plugins: { title: { display: true, text: `Calificación de ${entry.nombre}` }, legend: { display: false } },
    //       scales: {
    //         r: {
    //           min: 0, max: 5, stepSize: 1,
    //           angleLines: { color: 'rgba(0,0,0,0.6)', lineWidth: 1.5 },
    //           grid: { color: 'rgba(0,0,0,0.3)', lineWidth: 1.2 },
    //           pointLabels: { color: '#000', font: { size: 14, weight: 'bold' } },
    //           ticks: { color: '#000', backdropColor: 'transparent', font: { size: 12 } }
    //         }
    //       }
    //     }
    //   });
  // });
  } catch (err) {
  console.error(err);
  alert("Error al obtener estadísticas TOP.");
}

// 🔽 Estadísticas generales
try {
  const res = await fetch('/api/estadisticas/detalle', { credentials: 'include' });
  const detalle = await res.json();

  document.getElementById('detalleUsuario').innerHTML = `
      <p><strong>Promedio de Puntualidad:</strong> ${detalle.promedio_puntualidad ?? 'N/A'}</p>
      <p><strong>Promedio de Trato:</strong> ${detalle.promedio_trato ?? 'N/A'}</p>
      <p><strong>Promedio de Resolución:</strong> ${detalle.promedio_resolucion ?? 'N/A'}</p>
    `;

  const ctx = document.getElementById('graficoGeneral').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Puntualidad', 'Trato', 'Resolución'],
      datasets: [{
        label: 'Promedio',
        data: [detalle.promedio_puntualidad || 0, detalle.promedio_trato || 0, detalle.promedio_resolucion || 0],
        backgroundColor: ['blue', 'green', 'orange']
      }]
    }
  });
} catch (err) {
  console.error(err);
  alert("Error al obtener estadísticas generales.");
}

let graficoPastel = null;

function mostrarDatosYGrafico(filtrado, titulo = 'Promedios') {
  const container = document.getElementById('estadisticasDiarias');
  container.innerHTML = `
      <strong>${titulo}:</strong>
      Puntualidad: ${filtrado.promedio_puntualidad} |
      Trato: ${filtrado.promedio_trato} |
      Resolución: ${filtrado.promedio_resolucion}
    `;

  const canvas = document.getElementById('graficoPastel');
  canvas.style.display = 'block';

  if (graficoPastel) graficoPastel.destroy();

  const ctx = canvas.getContext('2d');
  graficoPastel = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: ['Puntualidad', 'Trato', 'Resolución'],
      datasets: [{
        label: 'Promedio',
        data: [
          filtrado.promedio_puntualidad || 0,
          filtrado.promedio_trato || 0,
          filtrado.promedio_resolucion || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: { r: { suggestedMin: 0, suggestedMax: 5 } }
    }
  });
}

async function mostrarEstadisticaPorFecha(fecha) {
  try {
    const res = await fetch('/api/estadisticas/detalle/diario', { credentials: 'include' });
    const dias = await res.json();

    const fechaFormateada = new Date(fecha).toISOString().slice(0, 10);
    const dato = dias.find(d => new Date(d.fecha).toISOString().slice(0, 10) === fechaFormateada);

    if (dato) {
      mostrarDatosYGrafico(dato, fechaFormateada);
    } else {
      document.getElementById('estadisticasDiarias').innerHTML = '<p>No hay datos para esta fecha.</p>';
      document.getElementById('graficoPastel').style.display = 'none';
      if (graficoPastel) graficoPastel.destroy();
    }
  } catch (err) {
    console.error(err);
    alert('Error al filtrar por fecha.');
  }
}

// 🔽 Botón FILTRAR
document.getElementById('filtrarBtn').addEventListener('click', async () => {
  const tipoFiltro = document.getElementById('tipoFiltro').value;

  if (tipoFiltro === 'fecha') {
    const fecha = document.getElementById('fechaFiltro').value;
    if (!fecha) return alert('Selecciona una fecha');
    mostrarEstadisticaPorFecha(fecha);
  } else {
    const desde = document.getElementById('fechaInicoo').value;
    const hasta = document.getElementById('fechaFin').value;
    if (!desde || !hasta) return alert('Selecciona ambas fechas');

    try {
      const res = await fetch(`/api/estadisticas/detalle/promedio?desde=${desde}&hasta=${hasta}`, { credentials: 'include' });
      const data = await res.json();

      if (!data || (!data.promedio_puntualidad && !data.promedio_trato && !data.promedio_resolucion)) {
        document.getElementById('estadisticasDiarias').innerHTML = '<p>No hay datos para este rango.</p>';
        document.getElementById('graficoPastel').style.display = 'none';
        if (graficoPastel) graficoPastel.destroy();
      } else {
        mostrarDatosYGrafico(data, `Promedio del ${desde} al ${hasta}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al filtrar por rango de fechas.');
    }
  }
});

// Valor por defecto (hoy)
document.getElementById('fechaFiltro').value = new Date().toISOString().slice(0, 10);
});

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/login/logout", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.ok) {
        alert("Sesión cerrada correctamente.");
        window.location.href = "../index.html";
      } else {
        alert("No se pudo cerrar sesión: " + data.error);
      }
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      alert("Error al conectar con el servidor.");
    }
  });
}