document.addEventListener('DOMContentLoaded', async () => {
  // Obtener datos del usuario logueado
  let usuario;
  try {
    const res = await fetch('/api/login/me', { credentials: 'include' });
    if (!res.ok) throw new Error('No logueado');
    usuario = await res.json();
  } catch {
    alert('No ha iniciado sesión correctamente.');
    window.location.href = "/";
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
  container.innerHTML = "";

  // Obtener lista de meses en el rango
  const startDate = new Date(inicio);
  const endDate = new Date(fin);

  // Asegurarse de que startDate sea el primer día del mes
  startDate.setDate(1);
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1); // Primer día del mes de inicio

  // Iterar por cada mes en el rango
  while (current <= endDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    // Filtrar datos para este mes
    const monthData = data.filter(d => {
      const day = new Date(d.dia);
      return day >= monthStart && day <= monthEnd;
    });

    // Crear un div para este mes
    const monthDiv = document.createElement("div");
    monthDiv.style.width = "100%";
    monthDiv.style.height = "1000px";
    monthDiv.style.maxWidth = "1200px"; // opcional, límite para que no se estire demasiado
    monthDiv.style.margin = "0 auto"; 
    monthDiv.style.marginBottom = "20px";
    container.appendChild(monthDiv);

    // Renderizar el calendario de este mes
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
  // Configuraciones
  const cellSize = 140;
  const pieRadius = 50;

  // Datos de las series de pies
  // Mapea los datos para crear una serie de pie por cada día con datos
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

  // Configuración del gráfico
  myChart.setOption({
    tooltip: {
      formatter: params => params.seriesType === "pie" ? `${params.name}: ${params.value}` : params.value[0]
    },
    legend: { data: ["Puntualidad", "Trato", "Resolución"], bottom: 5 },
    calendar: {
      top: "middle",
      left: "center",
      orient: "vertical",
      cellSize: [cellSize, cellSize],
      yearLabel: { show: true, fontSize: 14, color: "#000", margin: 10 },
      monthLabel: {show: true, nameMap: "en", margin: 10, top: "middle", left: "center", fontSize: 14, color: "#000"},
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
          align: 'left',
          verticalAlign: 'top',
          formatter: params => params.value[0].split("-")[2],
          offset: [-cellSize / 2, -cellSize / 2],
          fontSize: 15
        },
        data: scatterData
      },
      ...pieSeries
    ]
  });

  window.addEventListener("resize", () => myChart.resize());
}