import mongoose from "mongoose";
import CategoryModel from "../models/category.model.js";
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

    const category = await CategoryModel.findOne({ name });
    if (category) {
      return sendConflict(res, "This Category is already exist");
    }
    if (!req.file) {
      return sendBadRequest(res, "Please upload a category image");
    }
    const imageUrl = req.file.path;

    await CategoryModel.create({
      name,
      slug,
      image: imageUrl,
    });
    sendCreated(res);
  } catch (error) {
    console.error("Category image upload failed:", error);
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
    const category = await CategoryModel.find(queryFilter).limit(limit);
    sendSuccess(res, "Category data find success", category);
  } catch (error) {
    sendServerError(res);
  }
};

const ReadById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findById(id);
    if (!category) {
      return sendNotFound(res);
    }
    sendSuccess(res, "Category Find Success", category);
  } catch (error) {
    sendServerError(res);
  }
};

const status = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findById(id);
    if (!category) return sendNotFound(res);
    await CategoryModel.updateOne(
      { _id: id },
      {
        $set: {
          status: !category.status,
        },
      },
    );
    sendSuccess(res, "Category Update", category);
  } catch (error) {
    sendServerError(res);
  }
};

const deleteById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findByIdAndDelete(id);
    if (!category) {
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
      return sendBadRequest(res, "Invalid category ID");
    }

    // Validate fields
    if (!name || !slug) {
      return sendBadRequest(res, "Name and slug are required");
    }

    // Check category exists
    const category = await CategoryModel.findById(id);

    if (!category) {
      return sendNotFound(res, "Category not found");
    }

    // Check duplicate name or slug
    const duplicateCategory = await CategoryModel.findOne({
      $or: [{ name }, { slug }],
      _id: { $ne: id },
    });

    if (duplicateCategory) {
      return sendConflict(res, "Category name or slug already exists");
    }
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (imageUrl) category.image = imageUrl;
    console.log(category.image);

    await category.save();

    return sendSuccess(res, "Category updated successfully");
  } catch (error) {
    console.error("Update Category Error:", error);
    return sendServerError(res);
  }
};

export { create, Read, ReadById, status, deleteById, update };
