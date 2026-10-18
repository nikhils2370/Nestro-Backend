import express from "express";
const Cartrouter = express.Router();
import {
  sync,
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";
import { verifyToken } from "../middleware/auth.js";

Cartrouter.get("/", verifyToken, getCart);
Cartrouter.post("/sync", verifyToken, sync);
Cartrouter.post("/add", verifyToken, addToCart);
Cartrouter.post("/update", verifyToken, updateCart);
Cartrouter.delete("/remove/:productId", verifyToken, removeFromCart);
Cartrouter.delete("/clear", verifyToken, clearCart);

export default Cartrouter;
