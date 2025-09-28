import express from 'express';
import db from './db.js';

const encuestasRouter = express.Router();

encuestasRouter.get('/', async (req, res) => {
  res.send('Ruta de encuestas');
});

encuestasRouter.post('/', async (req, res) => {

  const cedula_usuario = req.session.user?.cedula;  if (!cedula_usuario) {
    return res.status(401).json({ success: false, message: "Usuario no autenticado." });
  }
  const {
    atendido_por,
    fecha,
    puntualidad,
    trato,
    resolucion,
    comentario,
    id_motivo
  } = req.body;

  try {
    const sql = `
      INSERT INTO calificaciones 
      (cedula_usuario, atendido_por, fecha, puntualidad, trato, resolucion, comentario, id_motivo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [
      cedula_usuario,
      atendido_por,
      fecha,
      puntualidad,
      trato,
      resolucion,
      comentario,
      id_motivo
    ]);

    res.json({ success: true, message: "Encuesta registrada con éxito." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al registrar la encuesta." });
  }
});


encuestasRouter.get('/motivos', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id_motivo, nombre_motivo FROM motivos_calificacion ORDER BY id_motivo ASC");
    res.json(rows);
  } catch (err) {
    console.error("Error cargando motivos:", err);
    res.status(500).json({ error: "Error al obtener motivos" });
  }
});


export default encuestasRouter;