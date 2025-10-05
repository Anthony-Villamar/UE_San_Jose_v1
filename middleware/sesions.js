export function verificarSesion(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next(); // pasa al siguiente middleware o ruta
}