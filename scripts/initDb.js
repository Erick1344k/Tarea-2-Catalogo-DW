require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

async function main() {
  const databaseUrl = new URL(process.env.DATABASE_URL);
  const databaseName = databaseUrl.pathname.slice(1);

  const adminUrl = new URL(databaseUrl.toString());
  adminUrl.pathname = "/postgres";
  const adminPool = new Pool({ connectionString: adminUrl.toString() });
  await adminPool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [databaseName]
  ).then(async (result) => {
    if (!result.rowCount) {
      await adminPool.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
    }
  });
  await adminPool.end();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schema = fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8");
  await pool.query(schema);

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@catalogo.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminSeguro123!";
  const existing = await pool.query("SELECT id FROM usuarios WHERE email = $1", [adminEmail]);
  if (!existing.rowCount) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'administrador')",
      [process.env.ADMIN_NAME || "Administrador", adminEmail, hash]
    );
  }

  await pool.query(
    `INSERT INTO productos (nombre, descripcion, categoria, precio)
     VALUES
       ('Laptop Lenovo', 'Laptop para trabajo y estudio', 'Tecnología', 2800000),
       ('Teléfono Android', 'Smartphone con cámara HD', 'Tecnología', 950000),
       ('Audífonos Bluetooth', 'Audífonos inalámbricos con micrófono', 'Audio', 180000),
       ('Mochila Urbana', 'Mochila resistente de uso diario', 'Accesorios', 120000),
       ('Teclado Mecánico', 'Teclado con iluminación RGB', 'Tecnología', 240000)
     ON CONFLICT (nombre) DO NOTHING`
  );
  await pool.end();
  console.log("Base de datos, administrador y productos inicializados.");
}

main().catch((error) => {
  console.error("Error al inicializar:", error.message);
  process.exit(1);
});
