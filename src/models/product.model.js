import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Category
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "room",
      required: true,
    },

    // Pricing
    price: {
      type: Number,
      required: true,
      min: 200,
    },

    salePrice: {
      type: Number,
      default: 200,
    },

    discount: {
      type: Number,
      default: 0,
    },

    // Inventory
    stock: {
      type: Boolean,
      default: true,
      required: true,
    },

    // Images
    thumbnail: {
      type: String,
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    // Furniture Details
    material: {
      type: String,
      enum: [
        "Wood",
        "Sheesham",
        "Engineered Wood",
        "Metal",
        "Steel",
        "Plastic",
        "Glass",
        "Marble",
        "Fabric",
        "Leather",
      ],
      default: "Wood",
    },

    color: {
      type: String,
    },

    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        default: "cm",
      },
    },

    weight: {
      value: Number,
      unit: {
        type: String,
        default: "kg",
      },
    },

    // Flags
    featured: {
      type: Boolean,
      default: false,
    },

    bestSeller: {
      type: Boolean,
      default: false,
    },

    newArrival: {
      type: Boolean,
      default: false,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;
