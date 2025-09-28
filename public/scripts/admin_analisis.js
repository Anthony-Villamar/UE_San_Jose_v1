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
});

document.getElementById("btn-filtrar").addEventListener("click", async () => {
  const inicio = document.getElementById("fecha-inicio").value;
  const fin = document.getElementById("fecha-fin").value;
  const area = document.getElementById("area").value;

  if (!inicio || !fin) {
    alert("Selecciona fechas de inicio y fin");
    return;
  }

  try {
    const res = await fetch(`/api/estadisticas/calendario?inicio=${inicio}&fin=${fin}&area=${area}`);
    if (!res.ok) throw new Error("Error al obtener datos");
    const data = await res.json();

    renderRadarCalendar(data, inicio, fin);
  } catch (err) {
    console.error(err);
    alert("No se pudieron cargar los datos");
  }
});



function renderRadarCalendar(data, inicio, fin) {
  const container = document.getElementById("radar-calendar");
  container.innerHTML = ""; // limpiar antes de renderizar

  // Obtener lista de meses en el rango
  const startDate = new Date(inicio);
  const endDate = new Date(fin);

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    const monthData = data.filter(d => {
      const day = new Date(d.dia);
      return day >= monthStart && day <= monthEnd;
    });

    // Crear un div para este mes
    const monthDiv = document.createElement("div");
    monthDiv.style.width = "100%";
    monthDiv.style.height = "400px"; // altura razonable por mes
    monthDiv.style.marginBottom = "10px";
    container.appendChild(monthDiv);

    renderSingleMonth(monthDiv, monthData, monthStart, monthEnd);

    // Avanzar al siguiente mes
    current.setMonth(current.getMonth() + 1);
  }
}

// Función que renderiza un calendario vertical por mes
function renderSingleMonth(dom, data, inicio, fin) {
  const myChart = echarts.init(dom);
  myChart.clear();

  const scatterData = data.map(d => [d.dia.split("T")[0], 1]);
  const cellSize = 50;
  const pieRadius = 20;

  const pieSeries = data.map((d, idx) => ({
    type: "pie",
    id: "pie-" + idx,
    center: [d.dia.split("T")[0], 1],
    radius: pieRadius,
    coordinateSystem: "calendar",
    label: { formatter: "{c}", position: "inside", fontSize: 10 },
    data: [
      { name: "Puntualidad", value: parseFloat(d.puntualidad) },
      { name: "Trato", value: parseFloat(d.trato) },
      { name: "Resolución", value: parseFloat(d.resolucion) }
    ]
  }));

  myChart.setOption({
    tooltip: {
      formatter: params => params.seriesType === "pie" ? `${params.name}: ${params.value}` : params.value[0]
    },
    legend: { data: ["Puntualidad", "Trato", "Resolución"], bottom: 10 },
    calendar: {
      top: "middle",
      left: "center",
      orient: "vertical",
      cellSize: [cellSize, cellSize],
      yearLabel: { show: false },
      monthLabel: { show: true, nameMap: "en" },
      range: [inicio, fin]
    },
    series: [
      {
        id: "label",
        type: "scatter",
        coordinateSystem: "calendar",
        symbolSize: 0,
        label: {
          show: true,
          formatter: params => params.value[0].split("-")[2],
          offset: [-cellSize / 2, -cellSize / 2],
          fontSize: 10
        },
        data: scatterData
      },
      ...pieSeries
    ]
  });

  window.addEventListener("resize", () => myChart.resize());
}


function renderRadarCalendar(data, inicio, fin) {
  const container = document.getElementById("radar-calendar");
  container.innerHTML = ""; // limpiar antes de renderizar

  // Obtener lista de meses en el rango
  const startDate = new Date(inicio);
  const endDate = new Date(fin);

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const monthData = data.filter(d => {
      const day = new Date(d.dia);
      return day >= monthStart && day <= monthEnd;
    });
    // Crear un div para este mes
    const monthDiv = document.createElement("div");
    monthDiv.style.width = "100%";
    monthDiv.style.height = "400px"; // altura razonable por mes
    monthDiv.style.marginBottom = "10px";
    container.appendChild(monthDiv);

    renderSingleMonth(monthDiv, monthData, monthStart, monthEnd);

    // Avanzar al siguiente mes
    current.setMonth(current.getMonth() + 1);
  }
}
