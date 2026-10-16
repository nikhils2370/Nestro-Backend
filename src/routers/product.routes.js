import express from "express";
const Productrouter = express.Router();
import {
  create,
  deleteById,
  read,
  readById,
  status,
  bestSeller,
  stock,
  update,
  addImages,
} from "../controllers/product.controller.js";
import upload from "../middleware/upload.js";

Productrouter.post("/create", upload.single("image"), create);
Productrouter.get("/", read);
Productrouter.get("/:id", readById);
Productrouter.patch("/status/:id", status);
Productrouter.patch("/bestSeller/:id", bestSeller);
Productrouter.patch("/stock/:id", stock);
Productrouter.delete("/delete/:id", deleteById);
Productrouter.put("/update/:id", upload.single("image"), update);
Productrouter.post("/add-images/:id", upload.array("image"), addImages);

export default Productrouter;
