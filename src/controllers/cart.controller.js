import CartModel from "../models/cart.model.js";

import {
  sendBadRequest,
  sendServerError,
  sendSuccess,
} from "../utls/response.js";
import ProductModel from "../models/product.model.js";

import mongoose from "mongoose";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { productId, qty = 1 } = req.body;

    // Validate authenticated user
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to add products to cart",
      });
    }

    // Validate product ID
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Validate quantity
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    // Find product
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock
    const availableStock = Number(product.stock || 0);

    if (availableStock < 1) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    // Find user's cart
    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      // Create cart for first-time user
      cart = new CartModel({
        userId,
        items: [
          {
            productId: product._id,
            qty,
          },
        ],
      });

      await cart.save();

      return res.status(201).json({
        success: true,
        message: "Product added to cart",
        cart,
      });
    }

    // Find existing product in cart
    const existingItem = cart.items.find(
      (item) => String(item.productId) === String(product._id),
    );

    if (existingItem) {
      // Increase quantity if product already exists
      const newQty = Number(existingItem.qty) + qty;

      if (newQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`,
        });
      }

      existingItem.qty = newQty;
    } else {
      // Add new product to existing cart
      if (qty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableStock} items available in stock`,
        });
      }

      cart.items.push({
        productId: product._id,
        qty,
      });
    }

    // Save changes to MongoDB
    await cart.save();

    return res.status(200).json({
      success: true,
      message: existingItem
        ? "Cart quantity increased successfully"
        : "Product added to cart",
      cart,
    });
  } catch (error) {
    console.error("ADD TO CART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart",
    });
  }
};


export const sync = async (req, res) => {
  try {
    const userId = req.user._id;
    let items = req.body.items;

    // 1. Validate and parse items
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        return sendBadRequest(res, "Invalid cart items format");
      }
    }

    if (!Array.isArray(items)) {
      return sendBadRequest(res, "Items must be an array");
    }

    // 2. Validate each item
    const validItems = [];

    for (const item of items) {
      if (
        !item.id ||
        !Number.isInteger(Number(item.qty)) ||
        Number(item.qty) < 1
      ) {
        return sendBadRequest(res, "Invalid product ID or quantity");
      }

      validItems.push({
        productId: item.id,
        qty: Number(item.qty),
      });
    }

    // 3. Find user's existing cart
    const cart = await CartModel.findOne({ userId });

    // CASE 1: No items and no cart
    if (validItems.length === 0 && !cart) {
      return sendSuccess(res, "Cart is already empty", {
        items: [],
      });
    }

    // CASE 2: No items but cart exists
    if (validItems.length === 0 && cart) {
      cart.items = [];
      await cart.save();

      return sendSuccess(res, "Cart cleared successfully", {
        items: cart.items,
      });
    }

    // CASE 3: Items exist but no cart in database
    if (validItems.length > 0 && !cart) {
      const newCart = await CartModel.create({
        userId,
        items: validItems,
      });

      return sendSuccess(res, "Cart synced successfully", {
        items: newCart.items,
      });
    }

    // CASE 4: Items and existing cart both exist
    // Merge quantities for matching products
    const mergedItems = [...cart.items];

    for (const newItem of validItems) {
      const existingItem = mergedItems.find(
        (item) => String(item.productId) === String(newItem.productId),
      );

      if (existingItem) {
        existingItem.qty += newItem.qty;
      } else {
        mergedItems.push(newItem);
      }
    }

    cart.items = mergedItems;
    await cart.save();

    return sendSuccess(res, "Cart synced successfully", {
      items: cart.items,
    });
  } catch (error) {
    console.error("Cart Sync Error:", error);
    return sendServerError(res);
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await CartModel.findOne({ userId }).populate(
      "items.productId",
      "name price salePrice thumbnail",
    );

    if (!cart) {
      return sendSuccess(res, "Cart fetched successfully", {
        items: [],
      });
    }

    const items = cart.items
      .filter((item) => item.productId)
      .map((item) => ({
        id: item.productId._id.toString(),
        name: item.productId.name,
        price: item.productId.price,
        salePrice: item.productId.salePrice,
        thumbnail: item.productId.thumbnail,
        qty: item.qty,
      }));

    return sendSuccess(res, "Cart fetched successfully", {
      items,
    });
  } catch (error) {
    console.error("Get Cart Error:", error);
    return sendServerError(res);
  }
};

export const updateCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, qty } = req.body;

    if (!productId || qty === undefined) {
      return sendBadRequest(res, "Product ID and quantity are required");
    }

    const cart = await CartModel.findOne({ userId });
    if (!cart) {
      return sendNotFound(res, "Cart not found");
    }

    if (qty <= 0) {
      cart.items = cart.items.filter(
        (item) => String(item.productId) !== String(productId),
      );
    } else {
      const item = cart.items.find(
        (i) => String(i.productId) === String(productId),
      );
      if (item) {
        item.qty = Number(qty);
      } else {
        cart.items.push({ productId, qty: Number(qty) });
      }
    }

    await cart.save();
    return sendSuccess(res, "Cart updated successfully", { items: cart.items });
  } catch (error) {
    console.error("Update Cart Error:", error);
    return sendServerError(res);
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await CartModel.findOne({ userId });
    if (!cart) {
      return sendSuccess(res, "Item removed", { items: [] });
    }

    cart.items = cart.items.filter(
      (item) => String(item.productId) !== String(productId),
    );
    await cart.save();

    return sendSuccess(res, "Item removed from cart", { items: cart.items });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return sendServerError(res);
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    await CartModel.findOneAndUpdate({ userId }, { $set: { items: [] } });
    return sendSuccess(res, "Cart cleared successfully", { items: [] });
  } catch (error) {
    console.error("Clear cart error:", error);
    return sendServerError(res);
  }
};