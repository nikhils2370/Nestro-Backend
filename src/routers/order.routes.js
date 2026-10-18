import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboardStats,
} from "../controllers/order.controller.js";
import { verifyToken, authorized } from "../middleware/auth.js";

const OrderRouter = express.Router();

// User endpoints
OrderRouter.post("/create", verifyToken, createOrder);
OrderRouter.get("/my-orders", verifyToken, getMyOrders);
OrderRouter.get("/detail/:id", verifyToken, getOrderById);

// Admin / Superadmin endpoints
OrderRouter.get("/stats", verifyToken, authorized("admin", "superadmin"), getDashboardStats);
OrderRouter.get("/all", verifyToken, authorized("admin", "superadmin"), getAllOrders);
OrderRouter.patch("/status/:id", verifyToken, authorized("admin", "superadmin"), updateOrderStatus);

export default OrderRouter;
