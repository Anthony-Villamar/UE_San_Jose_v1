import express from 'express';
import db from './db.js';
import bcrypt from 'bcrypt';

const usuariosRouter = express.Router();

// Obtener todos los usuarios (nombre y cédula)
usuariosRouter.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT cedula, nombre FROM personas');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Registrar usuario nuevo (inserta en personas y usuarios)
usuariosRouter.post('/registrar', async (req, res) => {
  const {
    cedula_usuario, nombre, apellido, usuario,
    contrasena, rol, correo, telefono
  } = req.body;

  if (!cedula_usuario || !nombre || !apellido || !usuario || !contrasena || !rol || !correo || !telefono) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insertar en personas (ignora si ya existe)
    await conn.query(`
      INSERT INTO personas (cedula, nombre, apellido, correo, telefono)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE nombre = VALUES(nombre),
                              apellido = VALUES(apellido),
                              correo = VALUES(correo),
                              telefono = VALUES(telefono)
    `, [cedula_usuario, nombre, apellido, correo || null, telefono || null]);

    // Obtener id del rol
    const [[rolRow]] = await conn.query(`SELECT id_rol FROM roles WHERE nombre_rol = ?`, [rol]);
    if (!rolRow) {
      await conn.rollback();
      return res.status(400).json({ error: "Rol no válido." });
    }

    // Insertar en usuarios
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    await conn.query(`
      INSERT INTO usuarios (cedula, usuario, contrasena, id_rol)
      VALUES (?, ?, ?, ?)
    `, [cedula_usuario, usuario, hashedPassword, rolRow.id_rol]);

    await conn.commit();
    res.status(201).json({ success: true, message: "Usuario registrado correctamente." });

  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: "Usuario ya existe." });
    } else {
      console.error(err);
      res.status(500).json({ error: "Error al registrar usuario." });
    }
  } finally {
    conn.release();
  }
});

// Actualizar datos de usuario (personas y usuarios)
usuariosRouter.patch('/:cedula', async (req, res) => {
  const { cedula } = req.params;
  const {
    nombre, apellido, correo, telefono,
    usuario, contrasena, rol
  } = req.body;

  if (!cedula) {
    return res.status(400).json({ error: "Cédula faltante." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Actualizar personas
    if (nombre || apellido || correo || telefono) {
      const camposPersona = [];
      const valoresPersona = [];

      if (nombre) { camposPersona.push("nombre = ?"); valoresPersona.push(nombre); }
      if (apellido) { camposPersona.push("apellido = ?"); valoresPersona.push(apellido); }
      if (correo) { camposPersona.push("correo = ?"); valoresPersona.push(correo); }
      if (telefono) { camposPersona.push("telefono = ?"); valoresPersona.push(telefono); }

      if (camposPersona.length > 0) {
        await conn.query(
          `UPDATE personas SET ${camposPersona.join(', ')} WHERE cedula = ?`,
          [...valoresPersona, cedula]
        );
      }
    }

    // Actualizar usuarios
    const camposUsuario = [];
    const valoresUsuario = [];

    if (usuario) {
      camposUsuario.push("usuario = ?");
      valoresUsuario.push(usuario);
    }

    if (contrasena && contrasena.trim() !== "") {
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      camposUsuario.push("contrasena = ?");
      valoresUsuario.push(hashedPassword);
    }

    if (rol) {
      const [[rolRow]] = await conn.query(`SELECT id_rol FROM roles WHERE nombre_rol = ?`, [rol]);
      if (!rolRow) {
        await conn.rollback();
        return res.status(400).json({ error: "Rol no válido." });
      }
      camposUsuario.push("id_rol = ?");
      valoresUsuario.push(rolRow.id_rol);
    }


    if (camposUsuario.length > 0) {
      await conn.query(
        `UPDATE usuarios SET ${camposUsuario.join(', ')} WHERE cedula = ?`,
        [...valoresUsuario, cedula]
      );
    }

    await conn.commit();
    res.json({ success: true, message: "Usuario actualizado correctamente." });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario." });
  } finally {
    conn.release();
  }
});


// Buscar usuario por cédula
usuariosRouter.get('/buscar/:cedula', async (req, res) => {
  const cedula = req.params.cedula;
  try {
    const [[row]] = await db.query(`
      SELECT p.nombre, p.apellido, p.correo, p.telefono,
             u.usuario, r.nombre_rol AS rol
      FROM personas p
      JOIN usuarios u ON p.cedula = u.cedula
      JOIN roles r ON u.id_rol = r.id_rol
      WHERE p.cedula = ?
    `, [cedula]);

    if (!row) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error al buscar usuario' });
  }
});

usuariosRouter.get('/buscar-con-roles/:cedula', async (req, res) => {
  const cedula = req.params.cedula;
  try {
    const [[usuario]] = await db.query(
      `SELECT u.usuario, p.nombre, p.apellido, p.correo, p.telefono, r.nombre_rol AS rol
       FROM usuarios u
       JOIN personas p ON u.cedula = p.cedula
       JOIN roles r ON u.id_rol = r.id_rol
       WHERE u.cedula = ?`,
      [cedula]
    );

    const [roles] = await db.query(`SELECT nombre_rol FROM roles`);

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, usuario, roles: roles.map(r => r.nombre_rol) });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error interno al obtener datos' });
  }
});


// Obtener todos los roles
usuariosRouter.get('/roles', async (req, res) => {
  try {
    const [roles] = await db.query('SELECT nombre_rol FROM roles');
    const rolesNombres = roles.map(r => r.nombre_rol);
    res.json(rolesNombres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener roles" });
  }
});


//obtener usuario por rol para encuestas
usuariosRouter.get("/:rolfetch", async (req, res) => {
  const rol = req.params.rolfetch;
  try {
   const [usuarios] = await db.query(`
      SELECT p.cedula, p.nombre, p.apellido
      FROM personas p
      JOIN usuarios u ON p.cedula = u.cedula
      JOIN roles r ON u.id_rol = r.id_rol
      WHERE r.nombre_rol = ?
      AND u.cedula NOT IN ('0000000001', '0000000002', '0000000003')
    `, [rol]);
      
  
  res.json(usuarios);
    
  }
  catch (error) {
    console.error("Error al obtener usuarios por rol:", error);
    res.status(500).json({ error: "Error al obtener usuarios por rol" });
  }
});




export default usuariosRouter;
