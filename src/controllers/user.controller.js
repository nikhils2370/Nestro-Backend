import UserModel from "../models/user.model.js";
import { sendOTPEmail } from "../utls/sendOTPEmail.js";
import Cryptr from "cryptr";
import { randomInt } from "node:crypto";
import { generateToken } from "../utls/helper.js";

const secretKey = process.env.SECRET_KEY;

if (!secretKey) {
  throw new Error("SECRET_KEY is missing from environment variables");
}

const cryptr = new Cryptr(secretKey);

const OTP_TTL_MS = 5 * 60 * 1000;
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const createOtp = () => String(randomInt(100000, 1000000));

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  addresses: user.addresses ?? [],
  isVerified: user.isVerified,
});

async function deliverOtp({ user, otp }) {
  try {
    const result = await sendOTPEmail({
      email: user.email,
      name: user.name,
      otp,
    });

    if (result?.success) return true;

    if (!isProduction) {
      console.warn(
        `[AUTH] Email delivery failed for ${user.email}. Development OTP: ${otp}`,
      );
    }

    return false;
  } catch (error) {
    console.error("OTP email error:", error.message);

    if (!isProduction) {
      console.warn(`[AUTH] Development OTP for ${user.email}: ${otp}`);
    }

    return false;
  }
}

// ==================== LOGOUT ====================

export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
};

// ==================== GET PROFILE ====================

export const getMe = async (req, res) => {
  if (!req.user) {
    return sendError(res, 401, "Please login first");
  }

  return res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    user: publicUser(req.user),
  });
};

// ==================== UPDATE PROFILE ====================

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return sendError(res, 401, "Please login to update your profile");
    }

    const { name, email, addresses } = req.body ?? {};
    const updateData = {};

    // Update name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return sendError(res, 400, "Name is required");
      }

      updateData.name = name.trim();
    }

    // Update email
    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !EMAIL_REGEX.test(email.trim().toLowerCase())
      ) {
        return sendError(res, 400, "Please enter a valid email");
      }

      const cleanEmail = email.trim().toLowerCase();

      const existingUser = await UserModel.exists({
        email: cleanEmail,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return sendError(res, 409, "This email is already registered");
      }

      updateData.email = cleanEmail;
    }

    // Update addresses
    if (addresses !== undefined) {
      if (!Array.isArray(addresses)) {
        return sendError(res, 400, "Addresses must be an array");
      }

      const requiredFields = [
        "fullName",
        "mobile",
        "pincode",
        "addressLine",
        "city",
        "state",
      ];

      const cleanAddresses = [];

      for (const address of addresses) {
        if (!address || typeof address !== "object" || Array.isArray(address)) {
          return sendError(res, 400, "Invalid address data");
        }

        for (const field of requiredFields) {
          if (typeof address[field] !== "string" || !address[field].trim()) {
            return sendError(res, 400, `${field} is required in every address`);
          }
        }

        cleanAddresses.push({
          fullName: address.fullName.trim(),
          mobile: address.mobile.trim(),
          pincode: address.pincode.trim(),
          addressLine: address.addressLine.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          country:
            typeof address.country === "string" && address.country.trim()
              ? address.country.trim()
              : "India",
          isDefault: address.isDefault === true,
        });
      }

      // Allow only one default address
      const defaultIndex = cleanAddresses.findIndex(
        (address) => address.isDefault,
      );

      cleanAddresses.forEach((address, index) => {
        address.isDefault = defaultIndex !== -1 && index === defaultIndex;
      });

      updateData.addresses = cleanAddresses;
    }

    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, "No valid profile fields provided");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -otp -otpEcpire");

    if (!updatedUser) {
      return sendError(res, 404, "User not found");
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: publicUser(updatedUser),
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    if (error.code === 11000) {
      return sendError(res, 409, "This email is already registered");
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, error.message);
    }

    return sendError(res, 500, "Internal server error");
  }
};

// ==================== REGISTER ====================

export const register = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body?.password;

    if (!name || !email || typeof password !== "string") {
      return sendError(res, 400, "Name, email and password are required");
    }

    if (!EMAIL_REGEX.test(email)) {
      return sendError(res, 400, "Please enter a valid email");
    }

    if (password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters");
    }

    let user = await UserModel.findOne({ email });
    const isNewUser = !user;

    if (user?.isVerified) {
      return sendError(res, 409, "Email is already registered");
    }

    const otp = createOtp();
    const otpEcpire = new Date(Date.now() + OTP_TTL_MS);

    if (user) {
      user.name = name;
      user.password = cryptr.encrypt(password);
      user.otp = otp;
      user.otpEcpire = otpEcpire;

      await user.save();
    } else {
      user = await UserModel.create({
        name,
        email,
        password: cryptr.encrypt(password),
        role: "user",
        isVerified: false,
        otp,
        otpEcpire,
        status: true,
      });
    }

    const emailSent = await deliverOtp({ user, otp });

    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: emailSent
        ? "OTP sent successfully"
        : "OTP generated. If email is unavailable, check the server console in development.",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register Error:", error);

    if (error.code === 11000) {
      return sendError(res, 409, "Email is already registered");
    }

    return sendError(res, 500, "Internal server error");
  }
};

// ==================== VERIFY REGISTER OTP ====================

export const verifyRegisterOTP = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const enteredOTP = String(req.body?.otp ?? "").trim();

    if (!email || !enteredOTP) {
      return sendError(res, 400, "Email and OTP are required");
    }

    if (!EMAIL_REGEX.test(email) || !/^\d{6}$/.test(enteredOTP)) {
      return sendError(res, 400, "Please enter a valid email and 6-digit OTP");
    }

    const user = await UserModel.findOne({ email }).select("+otp +otpEcpire");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (user.isVerified) {
      return sendError(res, 400, "Email is already verified");
    }

    if (!user.otp || !user.otpEcpire) {
      return sendError(res, 400, "OTP not found. Please request a new OTP.");
    }

    if (new Date(user.otpEcpire).getTime() < Date.now()) {
      return sendError(res, 400, "OTP has expired. Please request a new OTP.");
    }

    if (enteredOTP !== String(user.otp)) {
      return sendError(res, 400, "Invalid OTP");
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpEcpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify Register OTP Error:", error);

    return sendError(res, 500, "Internal server error");
  }
};

// ==================== LOGIN ====================

export const login = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password = req.body?.password;

    if (!email || typeof password !== "string" || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    if (!EMAIL_REGEX.test(email)) {
      return sendError(res, 400, "Please enter a valid email");
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    if (!user.isVerified) {
      return sendError(res, 403, "Please verify your account");
    }

    let passwordMatches = false;

    try {
      passwordMatches = password === cryptr.decrypt(user.password);
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      return sendError(res, 401, "Invalid email or password");
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);

    return sendError(res, 500, "Internal server error");
  }
};
