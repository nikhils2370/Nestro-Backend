import express from "express";
import {
  create,
  deleteById,
  Read,
  ReadById,
  status,
  update,
} from "../controllers/room.controller.js";
import upload from "../middleware/upload.js";
const RoomRouter = express.Router();

RoomRouter.post("/create", upload.single("image"), create);
RoomRouter.get("/", Read);
RoomRouter.get("/:id", ReadById);
RoomRouter.patch("/status/:id", status);
RoomRouter.put("/update/:id", upload.single("image"), update);
RoomRouter.delete("/delete/:id", deleteById);

export default RoomRouter;
