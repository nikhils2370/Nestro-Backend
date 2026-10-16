import mongoose from "mongoose";
import {
  sendBadRequest,
  sendConflict,
  sendCreated,
  sendNotFound,
  sendServerError,
  sendSuccess,
} from "../utls/response.js";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import RoomModel from "../models/room.model.js";

// CREATE CATEGORY
// GET ALL CATEGORIES
export const read = async (req, res) => {
  try {
    const query = req.query;
    const queryFilter = {};
    const sortFilter = {};
    const limit = query.limit ? Number(query.limit) : 3;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    if (query.stock) {
      queryFilter.stock = query.stock == "true";
    }
    if (query.status) {
      queryFilter.status = query.status == "true";
    }
    if (query.bestSeller) {
      queryFilter.bestSeller = query.bestSeller == "true";
    }
    if (query.featured) {
      queryFilter.featured = query.featured == "true";
    }
    if (query.newArrival) {
      queryFilter.newArrival = query.newArrival == "true";
    }
    if (query.category) {
      
      // "chair,sofa" -> ["chair", "sofa"]
      const categoryArray = query.category.split(",");


      // slug -> MongoDB _id
      const categories = await CategoryModel.find({
        slug: { $in: categoryArray },
      }).select("_id");
      console.log(categories);


      // Product filter
      queryFilter.categoryId = {
        $in: categories.map((category) => category._id),
      };
    }
// console.log(query.categoryId);

///////////////////////////////
if (query.categoryId) {
  if (!mongoose.Types.ObjectId.isValid(query.categoryId)) {
    return sendBadRequest(res, "Invalid category ID");
  }

  queryFilter.categoryId = query.categoryId;
}
/////////////////////////////////

    if (query.room_type) {
      // "chair,sofa" -> ["chair", "sofa"]
      const roomArray = query.room_type.split(",");

      // slug -> MongoDB _id
      const rooms = await RoomModel.find({
        slug: { $in: roomArray },
      }).select("_id");

      // Product filter
      queryFilter.roomId = {
        $in: rooms.map((r) => r._id),
      };
    }

    if (query.min_price && query.max_price) {
      queryFilter.salePrice = {
        $gte: Number(query.min_price),
        $lte: Number(query.max_price),
      };
    }

    if (query.sort) {
      if (query.sort === "asc") {
        sortFilter.salePrice = 1;
      } else if (query.sort == "desc") {
        sortFilter.salePrice = -1;
      } else {
        sortFilter.createdAt = -1;
      }
    }

    const product = await ProductModel.find(queryFilter)
      .sort(sortFilter)
      .skip(skip)
      .limit(limit);
    // const countProduct = await ProductModel.countDocuments(queryFilter);
    // IMPORTANT:
    // Filtered products ka count
    const countProduct = await ProductModel.countDocuments(queryFilter);

    const pages = Math.ceil(countProduct / limit);
    return res.status(200).json({
      message: "Product data found",
      success: true,
      product,
      // pages: Math.ceil(countProduct / limit),
      // total: countProduct,

      // Pagination data
      page,
      limit,
      total: countProduct,
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    return sendServerError(res);
  }
};

export const readById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Product not found");
    }

    return res.status(200).json({
      message: "Product data found",
      success: true,
      product,
    });
  } catch (error) {
    return sendServerError(res);
  }
};

export const deleteById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid Product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Product not found");
    }

    await ProductModel.findByIdAndDelete(id);

    return sendSuccess(res, "Product deleted successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

export const status = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Proudtc not found");
    }

    await ProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: !product.status,
        },
      },
      {
        new: true,
      },
    );

    return sendSuccess(res, "Product status updated successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

////////////////////////////////////////////////////////////////////////

export const bestSeller = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Proudtc not found");
    }

    await ProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          bestSeller: !product.bestSeller,
        },
      },
      {
        new: true,
      },
    );

    return sendSuccess(res, "Product bestSeller updated successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

export const stock = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res, "Invalid product ID");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Proudtc not found");
    }

    await ProductModel.findByIdAndUpdate(
      id,
      {
        $set: {
          stock: !product.stock,
        },
      },
      {
        new: true,
      },
    );

    return sendSuccess(res, "Product stock updated successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

////////////////////////////////////////////////////////////////////////////////

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name = "", slug = "" } = req.body;
    const imageUrl = req.file.path ?? null;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res);
    }

    // Validate fields
    if (!name || !slug) {
      return sendBadRequest(res);
    }

    // Check category exists
    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Product not found");
    }

    // Check duplicate name or slug
    const duplicateProduct = await ProductModel.findOne({
      $or: [{ name }, { slug }],
      _id: { $ne: id },
    });

    if (duplicateProduct) {
      return sendConflict(res);
    }
    if (name) product.name = name;
    if (slug) product.slug = slug;
    if (imageUrl) product.image = imageUrl;
    await product.save();

    return sendSuccess(res, "product updated successfully");
  } catch (error) {
    return sendServerError(res);
  }
};

export const create = async (req, res) => {
  try {
    console.log(req.body);

    const imageUrl = req.file?.path || "";

    const {
      name,
      slug,
      shortDescription,
      description,
      categoryId,
      roomId,
      price,
      salePrice,
      discount,
      stock,
      material,
      color,
    } = req.body;

    if (!name || !slug || !description || !categoryId || !roomId || !price) {
      return sendBadRequest(res);
    }
    console.log(req.body);

    const product = await ProductModel.findOne({ slug });

    if (product) return sendConflict(res);

    await ProductModel.create({
      name,
      slug,
      shortDescription,
      description,
      categoryId,
      roomId,
      price,
      salePrice,
      discount,
      stock,
      material,
      color,
      thumbnail: imageUrl,
    });

    sendCreated(res);
  } catch (error) {
    console.log(error);
    sendServerError(res);
  }
};

export const updateFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { field } = req.body;
    console.log(id, field);
    const allowedFields = ["stock", "featured", "bestSeller", "newArrival"];

    if (!allowedFields.includes(field)) {
      return sendBadRequest(res, "Invalid field");
    }

    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res);
    }

    product[field] = !product[field];

    await product.save();

    return sendSuccess(res, `${field} updated successfully`);
  } catch (error) {
    sendServerError(res);
  }
};

export const addImages = async (req, res) => {
  try {
    const { id } = req.params;
    const images = Array.isArray(req.files)
      ? req.files.map((img) => img.path)
      : [];
    console.log(images);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendBadRequest(res);
    }
    const product = await ProductModel.findById(id);

    if (!product) {
      return sendNotFound(res, "Product not found");
    }
    product.images.push(...images);
    await product.save();
    return sendSuccess(res);
  } catch (error) {
    sendServerError(res);
  }
};
