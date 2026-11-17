const db = require("../config/db");

async function list(req, res) {
  try {
    const result = await db.query(
      `SELECT p.* FROM favoritos f
       JOIN productos p ON p.id = f.producto_id
       WHERE f.usuario_id = $1
       ORDER BY p.id`,
      [req.user.id]
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: "No fue posible listar los favoritos" });
  }
}

async function add(req, res) {
  const productoId = Number(req.body.productoId);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    return res.status(400).json({ error: "productoId inválido" });
  }
  try {
    const product = await db.query("SELECT id FROM productos WHERE id = $1", [productoId]);
    if (!product.rowCount) return res.status(404).json({ error: "Producto no encontrado" });
    const result = await db.query(
      `INSERT INTO favoritos (usuario_id, producto_id) VALUES ($1, $2)
       ON CONFLICT (usuario_id, producto_id) DO NOTHING RETURNING *`,
      [req.user.id, productoId]
    );
    if (!result.rowCount) return res.status(409).json({ error: "El producto ya está en favoritos" });
    return res.status(201).json({ message: "Favorito agregado", productoId });
  } catch (error) {
    return res.status(500).json({ error: "No fue posible agregar el favorito" });
  }
}

async function remove(req, res) {
  const productoId = Number(req.params.productoId);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    return res.status(400).json({ error: "Identificador inválido" });
  }
  try {
    const result = await db.query(
      "DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2 RETURNING *",
      [req.user.id, productoId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Favorito no encontrado" });
    return res.status(200).json({ message: "Favorito eliminado" });
  } catch (error) {
    return res.status(500).json({ error: "No fue posible eliminar el favorito" });
  }
}

module.exports = { list, add, remove };
