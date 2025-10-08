document.addEventListener('DOMContentLoaded', async () => {

   const menuBtn = document.getElementById("menuBtn");
  const navbar = document.querySelector(".navbar");

  menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("active");
  });

  const form = document.getElementById('encuestaForm');
  const atendidoSelect = document.getElementById('atendido_por');

  // 1. Obtener usuario en sesión
  let user;
  try {
    const res = await fetch("/api/login/me", {
      credentials: "include"
    });
    if (!res.ok) throw new Error("No logueado");
    user = await res.json();
  } catch {
    alert("No ha iniciado sesión correctamente.");
    window.location.href = `../index.html`;
    return;
  }

  let rolfetch = user.rol;
  if (rolfetch === "evaluadorcolecturia") rolfetch = "colecturia";
  if (rolfetch === "evaluadorsecretaria") rolfetch = "secretaria";
  if (rolfetch === "evaluadordocente") rolfetch = "docente";

  // 2. Cargar usuarios por rol
  try {
    const res = await fetch(`/api/usuarios/${rolfetch}`);
    const usuarios = await res.json();

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'Seleccione una opción';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    atendidoSelect.appendChild(defaultOption);

    usuarios.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.cedula;
      opt.text = `${u.nombre} ${u.apellido}`;
      atendidoSelect.appendChild(opt);
    });
  } catch (error) {
    console.error("Error cargando usuarios:", error);
    alert("Error al cargar lista de personal que atiende.");
  }

  // 3. Cargar motivos de calificación
  const motivoSelect = document.getElementById('motivo');

  // Cargar motivos desde BD
  try {
    const res = await fetch('/api/encuestas/motivos');
    const motivos = await res.json();

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'Seleccione un motivo';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    motivoSelect.appendChild(defaultOption);

    motivos.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id_motivo;
      opt.text = m.nombre_motivo;
      motivoSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error cargando motivos:", err);
    alert("Error al cargar motivos de la base de datos.");
  }


  // 4. Enviar encuesta
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      atendido_por: atendidoSelect.value,
      fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' '),
      puntualidad: parseInt(document.querySelector('input[name="puntualidad"]:checked')?.value),
      trato: parseInt(document.querySelector('input[name="trato"]:checked')?.value),
      resolucion: parseInt(document.querySelector('input[name="resolucion"]:checked')?.value),
      // motivo: document.getElementById('motivo').value,
      id_motivo: parseInt(motivoSelect.value), 
      comentario: document.getElementById('comentario').value.trim() || "Sin comentarios"
    };

    if (!data.atendido_por || !data.puntualidad || !data.trato || !data.resolucion || !data.id_motivo) {
      alert("Por favor, complete todas las preguntas.");
      return;
    }

    try {
      const res = await fetch('/api/encuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (result.success) {
        let timerInterval;
        Swal.fire({
          title: "Encuesta enviada correctamente!",
          icon: "success",
          timer: 1500,               
          timerProgressBar: true,
        });
        form.reset();
        atendidoSelect.selectedIndex = 0;
      } else {
        Swal.fire({
          title: "Error al guardar la encuesta.",
          icon: "error",
          draggable: true
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Error al conectar con el servidor.",
        icon: "error",
        draggable: true
      });
    }
  });
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
        window.location.href = "/";
      } else {
        alert("No se pudo cerrar sesión: " + data.error);
      }
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      alert("Error al conectar con el servidor.");
    }
  });
}


// --- MODO "UNA PREGUNTA POR PANTALLA" EN MÓVILES ---
function activarModoPreguntaPorPantalla() {
  const preguntas = document.querySelectorAll('.preguntas-container, .preguntas-container-motivo, .comentario-container');
  const esMovil = window.innerWidth <= 768;

  // Evitar reejecución innecesaria
  if (activarModoPreguntaPorPantalla.modoActual === esMovil) return;
  activarModoPreguntaPorPantalla.modoActual = esMovil;

  // Restablecer visibilidad
  preguntas.forEach(p => {
    p.style.display = "flex";
    p.classList.remove("oculto");
  });

  if (esMovil) {
    let actual = 0;

    const mostrarPregunta = (i) => {
      preguntas.forEach((p, idx) => {
        if (idx === i) {
          p.classList.remove("oculto");
          p.style.display = "flex";
        } else {
          p.classList.add("oculto");
          setTimeout(() => p.style.display = "none", 300);
        }
      });
    };

    // Ocultar todas menos la primera
    mostrarPregunta(0);

    // Escuchar cambios una sola vez
    preguntas.forEach((pregunta, idx) => {
      const inputs = pregunta.querySelectorAll("input, select, textarea");
      inputs.forEach((input) => {
        if (!input.dataset.listenerAdded) { // evita duplicar
          input.dataset.listenerAdded = true;
          input.addEventListener("change", () => {
            if (idx < preguntas.length - 1) {
              actual++;
              mostrarPregunta(actual);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          });
        }
      });
    });
  }
}

// Ejecutar en carga y al cambiar tamaño
window.addEventListener("DOMContentLoaded", activarModoPreguntaPorPantalla);
window.addEventListener("load", activarModoPreguntaPorPantalla); // <-- nuevo
window.addEventListener("resize", activarModoPreguntaPorPantalla);

