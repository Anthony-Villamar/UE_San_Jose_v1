
import express from 'express';
import db from './db.js';

const estadisticasRouter = express.Router();

// Estadísticas detalladas por usuario logueado
estadisticasRouter.get('/detalle', async (req, res) => {
  const cedula = req.session.user?.cedula;
  if (!cedula) return res.status(401).json({ message: 'Usuario no autenticado' });

  try {
    const sql = `
      SELECT 
        ROUND(AVG(puntualidad), 2) AS promedio_puntualidad,
        ROUND(AVG(trato), 2) AS promedio_trato,
        ROUND(AVG(resolucion), 2) AS promedio_resolucion
      FROM calificaciones
      WHERE atendido_por = ?
        AND TIME(fecha) BETWEEN '07:00:00' AND '14:30:00'
    `;
    const [rows] = await db.query(sql, [cedula]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener estadísticas detalladas' });
  }
});

// Estadísticas generales TOP 3
estadisticasRouter.get('/top3', async (req, res) => {
  try {
    const sql = `
      SELECT 
        p.nombre, p.apellido,
        ROUND(AVG(c.puntualidad), 2) AS promedio_puntualidad,
        ROUND(AVG(c.trato), 2) AS promedio_trato,
        ROUND(AVG(c.resolucion), 2) AS promedio_resolucion,
        ROUND(AVG((IFNULL(c.puntualidad, 0) + IFNULL(c.trato, 0) + IFNULL(c.resolucion, 0)) / 3), 2) AS promedio
      FROM calificaciones c
      JOIN personas p ON c.atendido_por = p.cedula
      WHERE TIME(c.fecha) BETWEEN '07:00:00' AND '14:30:00'
      GROUP BY c.atendido_por
      ORDER BY promedio DESC
      LIMIT 3
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// Estadísticas por día del usuario logueado
estadisticasRouter.get('/detalle/diario', async (req, res) => {
  const cedula = req.session.user?.cedula;
  if (!cedula) return res.status(401).json({ message: 'Usuario no autenticado' });

  try {
    const sql = `
      SELECT 
        DATE(fecha) AS fecha,
        ROUND(AVG(puntualidad), 2) AS promedio_puntualidad,
        ROUND(AVG(trato), 2) AS promedio_trato,
        ROUND(AVG(resolucion), 2) AS promedio_resolucion
      FROM calificaciones
      WHERE atendido_por = ?
        AND TIME(fecha) BETWEEN '07:00:00' AND '14:30:00'
      GROUP BY DATE(fecha)
      ORDER BY fecha DESC
    `;
    const [rows] = await db.query(sql, [cedula]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener estadísticas por día' });
  }
});

// 📌 Promedio de estadísticas en un rango de fechas
estadisticasRouter.get('/detalle/promedio', async (req, res) => {
  const cedula = req.session.user?.cedula;
  if (!cedula) return res.status(401).json({ message: 'Usuario no autenticado' });

  const { desde, hasta } = req.query;
  if (!desde || !hasta) {
    return res.status(400).json({ message: 'Faltan parámetros de fecha' });
  }

  try {
    const sql = `
      SELECT 
        ROUND(AVG(puntualidad), 2) AS promedio_puntualidad,
        ROUND(AVG(trato), 2) AS promedio_trato,
        ROUND(AVG(resolucion), 2) AS promedio_resolucion
      FROM calificaciones
      WHERE atendido_por = ?
        AND fecha BETWEEN ? AND ?
        AND TIME(fecha) BETWEEN '07:00:00' AND '14:30:00'
    `;
    const [rows] = await db.query(sql, [cedula, desde + " 00:00:00", hasta + " 23:59:59"]);

    res.json(rows[0] || {});
  } catch (err) {
    console.error("Error en /detalle/promedio:", err);
    res.status(500).json({ message: 'Error al obtener promedio en rango' });
  }
});



// 📌 Estadísticas para radar calendario en un rango de fechas y área
estadisticasRouter.get("/calendario", async (req, res) => {
  try {
    const { inicio, fin, area } = req.query;

    // Roles permitidos (secretaria, docente, colecturia)
    const rolesValidos = ["secretaria", "docente", "colecturia"];

    // Validar área
    let filtroRol = "";
    let params = [inicio, fin];
    if (area && area !== "todas" && rolesValidos.includes(area)) {
      filtroRol = "AND r.nombre_rol = ?";
      params.push(area);
    } else {
      // todas: solo esas 3
      filtroRol = "AND r.nombre_rol IN (?, ?, ?)";
      params.push(...rolesValidos);
    }

    const [rows] = await db.query(
      `
      SELECT DATE(c.fecha) as dia,
             r.nombre_rol,
             AVG(c.puntualidad) as puntualidad,
             AVG(c.trato) as trato,
             AVG(c.resolucion) as resolucion
      FROM calificaciones c
      JOIN personas p ON c.atendido_por = p.cedula
      JOIN usuarios u ON p.cedula = u.cedula
      JOIN roles r ON u.id_rol = r.id_rol
      WHERE DATE(c.fecha) BETWEEN ? AND ?
      AND TIME(fecha) BETWEEN '07:00:00' AND '14:30:00'
      ${filtroRol}
      GROUP BY dia, r.nombre_rol
      ORDER BY dia;
      `,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
});

export default estadisticasRouter;