import mongoose from "mongoose";
import RoomModel from "../models/room.model.js";
import {
  sendBadRequest,
  sendConflict,
  sendCreated,
  sendNotFound,
  sendServerError,
  sendSuccess,
} from "../utls/response.js";

const create = async (req, res) => {
  try {
    const { name, slug } = req.body;

    const room = await RoomModel.findOne({ name });
    if (room) {
      return sendConflict(res, "This room is already exist");
    }
    if (!req.file) {
      return sendBadRequest(res, "Please upload a room image");
    }
    const imageUrl = req.file.path;

    await RoomModel.create({
      name,
      slug,
      image: imageUrl,
    });
    sendCreated(res);
  } catch (error) {
    console.error("room image upload failed:", error);
    sendServerError(res, error.message);
  }
};

const Read = async (req, res) => {
  try {
     const query = req.query;
        const queryFilter = {};
        const limit = query.limit ? Number(query.limit) : 0
        if (query.status) {
          queryFilter.status = query.status == "true";
        }
    const room = await RoomModel.find(queryFilter).limit(limit);
    sendSuccess(res, "room data find success", room);
  } catch (error) {
    sendServerError(res);
  }
};

const ReadById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomModel.findById(id);
    if (!room) {
      return sendNotFound(res);
    }
    sendSuccess(res, "room Find Success", room);
  } catch (error) {
    sendServerError(res);
  }
};

const status = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomModel.findById(id);
    if (!room) return sendNotFound(res);
    await RoomModel.updateOne(
      { _id: id },
      {
        $set: {
          status: !room.status,
        },
      },
    );
    sendSuccess(res, "Room Status Update", room);
  } catch (error) {
    sendServerError(res);
  }
};

const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomModel.findByIdAndDelete(id);
    if (!room) {
      return sendNotFound(res);
    }
    sendSuccess(res, "deleted successfully");
  } catch (error) {
    sendServerError(res);
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name = "", slug = "" } = req.body;
    const imageUrl = req.file.path ?? null;
    console.log(imageUrl);

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid room ID");
    }

    // Validate fields
    if (!name || !slug) {
      return sendBadRequest(res, "Name and slug are required");
    }

    // Check room exists
    const room = await RoomModel.findById(id);

    if (!room) {
      return sendNotFound(res, "room not found");
    }

    // Check duplicate name or slug
    const duplicateroom = await RoomModel.findOne({
      $or: [{ name }, { slug }],
      _id: { $ne: id },
    });

    if (duplicateroom) {
      return sendConflict(res, "room name or slug already exists");
    }
    if (name) room.name = name;
    if (slug) room.slug = slug;
    if (imageUrl) room.image = imageUrl;
    console.log(room.image);

    await room.save();

    return sendSuccess(res, "room updated successfully");
  } catch (error) {
    console.error("Update room Error:", error);
    return sendServerError(res);
  }
};

export { create, Read, ReadById, status, deleteById, update };
