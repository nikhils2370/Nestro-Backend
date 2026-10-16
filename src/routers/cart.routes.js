import express from "express";
const Cartrouter = express.Router();
import { sync, getCart, addToCart } from "../controllers/cart.controller.js";
import { verifyToken } from "../middleware/auth.js";

Cartrouter.get("/", verifyToken, getCart);
Cartrouter.post("/sync", verifyToken, sync);
Cartrouter.post("/add", verifyToken, addToCart);

export default Cartrouter;
