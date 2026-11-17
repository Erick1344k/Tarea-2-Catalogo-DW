const express = require("express");
const controller = require("../controllers/favorite.controller");
const { authenticate, requireFavoriteOwner } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);
router.get("/", controller.list);
router.post("/", controller.add);
router.delete("/:productoId", requireFavoriteOwner, controller.remove);

module.exports = router;
