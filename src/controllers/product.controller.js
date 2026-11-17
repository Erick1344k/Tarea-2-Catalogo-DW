const db = require("../config/db");

function validateProduct(body, partial = false) {
  const allowed = ["nombre", "descripcion", "categoria", "precio"];
  const clean = {};
  for (const key of allowed) {
    if (body[key] !== undefined) clean[key] = body[key];
  }
  if (!partial) {
    if (!clean.nombre?.trim() || !clean.descripcion?.trim() || !clean.categoria?.trim() || clean.precio === undefined) {
      return { error: "nombre, descripcion, categoria y precio son obligatorios" };
    }
  }
  if (clean.nombre !== undefined && !String(clean.nombre).trim()) return { error: "El nombre no puede estar vacío" };
  if (clean.descripcion !== undefined && !String(clean.descripcion).trim()) return { error: "La descripción no puede estar vacía" };
  if (clean.categoria !== undefined && !String(clean.categoria).trim()) return { error: "La categoría no puede estar vacía" };
  if (clean.precio !== undefined) {
    const price = Number(clean.precio);
    if (!Number.isFinite(price) || price <= 0) return { error: "El precio debe ser mayor que cero" };
    clean.precio = price;
  }
  return { clean };
}

async function list(req, res) {
  try {
    const categoria = req.query.categoria?.trim();
    const result = categoria
      ? await db.query("SELECT * FROM productos WHERE LOWER(categoria) = LOWER($1) ORDER BY id", [categoria])
      : await db.query("SELECT * FROM productos ORDER BY id");
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "No fue posible listar los productos" });
  }
}

async function getById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Identificador inválido" });
  try {
    const result = await db.query("SELECT * FROM productos WHERE id = $1", [id]);
    if (!result.rowCount) return res.status(404).json({ error: "Producto no encontrado" });
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "No fue posible consultar el producto" });
  }
}

async function create(req, res) {
  const checked = validateProduct(req.body);
  if (checked.error) return res.status(400).json({ error: checked.error });
  const { nombre, descripcion, categoria, precio } = checked.clean;
  try {
    const result = await db.query(
      "INSERT INTO productos (nombre, descripcion, categoria, precio) VALUES ($1, $2, $3, $4) RETURNING *",
      [nombre.trim(), descripcion.trim(), categoria.trim(), precio]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "No fue posible crear el producto" });
  }
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Identificador inválido" });
  const checked = validateProduct(req.body, true);
  if (checked.error) return res.status(400).json({ error: checked.error });
  if (!Object.keys(checked.clean).length) return res.status(400).json({ error: "No hay campos para actualizar" });

  const entries = Object.entries(checked.clean).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]);
  const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ");
  const values = entries.map(([, value]) => value);
  try {
    const result = await db.query(
      `UPDATE productos SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Producto no encontrado" });
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "No fue posible actualizar el producto" });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Identificador inválido" });
  try {
    const result = await db.query("DELETE FROM productos WHERE id = $1 RETURNING id", [id]);
    if (!result.rowCount) return res.status(404).json({ error: "Producto no encontrado" });
    return res.status(200).json({ message: "Producto eliminado" });
  } catch (error) {
    return res.status(500).json({ error: "No fue posible eliminar el producto" });
  }
}

module.exports = { list, getById, create, update, remove };
