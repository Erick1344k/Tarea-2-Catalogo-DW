const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const favoriteRoutes = require("./routes/favorite.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "API Catálogo de Productos" }));
app.use("/auth", authRoutes);
app.use("/productos", productRoutes);
app.use("/favoritos", favoriteRoutes);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

module.exports = app;
