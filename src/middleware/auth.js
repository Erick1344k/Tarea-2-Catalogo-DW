const jwt = require("jsonwebtoken");
const db = require("../config/db");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "administrador") {
    return res.status(403).json({ error: "Se requiere rol administrador" });
  }
  next();
}

async function requireFavoriteOwner(req, res, next) {
  try {
    const result = await db.query(
      "SELECT usuario_id FROM favoritos WHERE producto_id = $1",
      [req.params.productoId]
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: "Favorito no encontrado" });
    }
    if (!result.rows.some((row) => row.usuario_id === req.user.id)) {
      return res.status(403).json({ error: "No puedes modificar este favorito" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "No fue posible validar el favorito" });
  }
}

module.exports = { authenticate, requireAdmin, requireFavoriteOwner };
