import express from "express";
import {
  create,
  deleteById,
  Read,
  ReadById,
  status,
  update,
} from "../controllers/category.controller.js";
import upload from "../middleware/upload.js";
import { authorized, verifyToken } from "../middleware/auth.js";
const CategoryRouter = express.Router();

CategoryRouter.post("/create", upload.single("image"), create);
CategoryRouter.get("/", Read);
CategoryRouter.get("/:id", ReadById);
CategoryRouter.patch(
  "/status/:id",
  verifyToken,
  authorized("admin", "superAdmin"),
  status,
);
CategoryRouter.put("/update/:id", upload.single("image"), update);
CategoryRouter.delete("/delete/:id", deleteById);

export default CategoryRouter;
