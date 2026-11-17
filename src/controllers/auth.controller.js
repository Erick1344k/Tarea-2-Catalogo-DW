const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(resultRow) {
  const { id, nombre, email, rol } = resultRow;
  return { id, nombre, email, rol };
}

async function register(req, res) {
  const { nombre, email, password } = req.body;
  if (!nombre?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "nombre, email y password son obligatorios" });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Correo inválido" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  try {
    const existing = await db.query("SELECT id FROM usuarios WHERE email = $1", [email.trim().toLowerCase()]);
    if (existing.rowCount) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'usuario') RETURNING id, nombre, email, rol",
      [nombre.trim(), email.trim().toLowerCase(), hash]
    );
    return res.status(201).json({ message: "Usuario registrado", usuario: publicUser(result.rows[0]) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "No fue posible registrar el usuario" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "email y password son obligatorios" });
  }

  try {
    const result = await db.query(
      "SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    if (!result.rowCount) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const user = result.rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    const token = jwt.sign(
      { role: user.rol },
      process.env.JWT_SECRET,
      { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
    );
    return res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      usuario: publicUser(user),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "No fue posible iniciar sesión" });
  }
}

module.exports = { register, login };
