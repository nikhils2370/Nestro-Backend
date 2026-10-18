import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import CategoryRouter from "./routers/category.routes.js";
import RoomRouter from "./routers/room.routes.js";
import Productrouter from "./routers/product.routes.js";
import Userrouter from "./routers/user.routes.js";
import cartRouter from "./routers/cart.routes.js";
import OrderRouter from "./routers/order.routes.js";
import cookieParser from "cookie-parser";
const server = express();
server.use(express.json());
server.use(cookieParser());
server.use(
  cors({
    origin: "https://nestro-frontend-seven.vercel.app",
    credentials: true,
  }),
);
server.use("/api/category", CategoryRouter);
server.use("/api/room", RoomRouter);
server.use("/api/product", Productrouter);
server.use("/api/user", Userrouter);
server.use("/api/cart", cartRouter);
server.use("/api/order", OrderRouter);

server.use((error, req, res, next) => {
  console.error("Request failed:", error);
  res.status(500).json({
    success: false,
    message: error.message || "Image upload failed",
  });
});

// server.get("/api", (req, res) => {
//     console.log(req);
//     res.send("hello")

// })

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("database connected successfully.........");
    server.listen(process.env.PORT, () => {
      console.log(`server is running on port ${process.env.PORT}`);
    });
  })
  .catch(() => {
    console.log("database not connected");
  });
