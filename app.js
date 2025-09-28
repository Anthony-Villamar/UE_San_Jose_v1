// importación de librerías
import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// importaciones de rutas
import loginRoutes from './routes/login.js';
import encuestasRouter from './routes/encuestas.js';
import estadisticasRouter from './routes/estadisticas.js';
import usuariosRouter from './routes/usuarios.js';

// Config
dotenv.config();
const app = express();

// Para poder usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// configuración de sesiones
app.set("trust proxy", 1);
app.use(session({
  secret: process.env.SESSION_SECRET || "clave1234",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true, // cámbialo a true si usas HTTPS
    // sameSite: "lax", // "none" si usas frontend en otro dominio con HTTPS y lax si es el mismo dominio
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 7 // 7 horas
  }
}));

// Evitar cache
// app.use((req, res, next) => {
//   res.set("Cache-Control", "no-store");
//   next();
// });

// Servir frontend (tu carpeta public con index.html y demás)
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use('/api/login', loginRoutes);
app.use('/api/encuestas', encuestasRouter);
app.use('/api/estadisticas', estadisticasRouter);
app.use('/api/usuarios', usuariosRouter);

// Redirigir al index.html para rutas del frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Middleware para rutas no encontradas en API
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "public", "pages", "404.html"));
});

// servidor
const puerto = process.env.PORT;
app.listen(puerto, () => {
  console.log(`Servidor corriendo en http://localhost:${puerto}`);
});
