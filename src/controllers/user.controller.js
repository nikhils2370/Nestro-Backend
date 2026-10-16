import UserModel from "../models/user.model.js";
import { sendOTPEmail } from "../utls/sendOTPEmail.js";
import {
  sendBadRequest,
  sendConflict,
  sendCreated,
  sendNotFound,
  sendServerError,
  sendSuccess,
} from "../utls/response.js";
import { generateToken } from "../utls/helper.js";




export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging out.",
    });
  }
};


export const getMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (error) {
    return sendServerError(res);
  }
};



export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to update your profile",
      });
    }

    const { name, email, addresses } = req.body;

    const updateData = {};

    // Update name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      updateData.name = name.trim();
    }

    // Update email
    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Valid email is required",
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email",
        });
      }

      const existingUser = await UserModel.findOne({
        email: cleanEmail,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This email is already registered",
        });
      }

      updateData.email = cleanEmail;
    }

    // Update addresses
    if (addresses !== undefined) {
      if (!Array.isArray(addresses)) {
        return res.status(400).json({
          success: false,
          message: "Addresses must be an array",
        });
      }

      const requiredFields = [
        "fullName",
        "mobile",
        "pincode",
        "addressLine",
        "city",
        "state",
      ];

      for (const address of addresses) {
        if (!address || typeof address !== "object") {
          return res.status(400).json({
            success: false,
            message: "Invalid address data",
          });
        }

        for (const field of requiredFields) {
          if (typeof address[field] !== "string" || !address[field].trim()) {
            return res.status(400).json({
              success: false,
              message: `${field} is required in every address`,
            });
          }
        }
      }

      // Only accept permitted address fields.
      const cleanAddresses = addresses.map((address) => ({
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
      }));

      // Keep only one default address.
      const defaultIndex = cleanAddresses.findIndex(
        (address) => address.isDefault,
      );

      cleanAddresses.forEach((address, index) => {
        address.isDefault = index === defaultIndex;
      });

      updateData.addresses = cleanAddresses;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



// ==========================================
// Register User
// ==========================================
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ==========================================
    // Validation
    // ==========================================
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ==========================================
    // Clean Data
    // ==========================================
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // ==========================================
    // Check Existing User
    // ==========================================
    const existingUser = await UserModel.findOne({
      email: cleanEmail,
    });

    // ==========================================
    // Existing User
    // ==========================================
    if (existingUser) {
      // ------------------------------------------
      // Already Verified
      // ------------------------------------------
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }

      // ------------------------------------------
      // Existing but Not Verified
      // Generate New OTP
      // ------------------------------------------
      const otp = Math.floor(100000 + Math.random() * 900000);

      const otpEcpire = new Date(Date.now() + 5 * 60 * 1000);

      existingUser.name = cleanName;
      existingUser.password = password;
      existingUser.otp = otp;
      existingUser.otpEcpire = otpEcpire;

      await existingUser.save();

      // ------------------------------------------
      // Send New OTP Email
      // ------------------------------------------
      const emailResponse = await sendOTPEmail({
        email: existingUser.email,
        name: existingUser.name,
        otp,
      });

      if (!emailResponse?.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
        });
      }

      //   console.log(
      //     `Register OTP sent to ${existingUser.email}:`,
      //     otp
      //   );

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        userId: existingUser._id,
      });
    }

    // ==========================================
    // Generate OTP
    // ==========================================
    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpEcpire = new Date(Date.now() + 5 * 60 * 1000);

    // ==========================================
    // Create User
    // ==========================================
    const user = await UserModel.create({
      name: cleanName,
      email: cleanEmail,
      password,

      role: "user",

      isVerified: false,

      otp,
      otpEcpire,

      status: true,
    });

    // ==========================================
    // Send OTP Email
    // ==========================================
    const emailResponse = await sendOTPEmail({
      email: user.email,
      name: user.name,
      otp,
    });

    // ==========================================
    // Email Failed
    // ==========================================
    if (!emailResponse?.success) {
      // Remove incomplete registration
      await UserModel.findByIdAndDelete(user._id);

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    // ==========================================
    // Testing OTP
    // ==========================================
    // console.log(
    //   `Register OTP sent to ${user.email}:`,
    //   otp
    // );

    // ==========================================
    // Response
    // ==========================================
    return res.status(201).json({
      success: true,
      message: "Registration successful. OTP has been sent to your email.",
      userId: user._id,
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Duplicate email protection
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// Verify Register OTP
// ==========================================
export const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // ==========================================
    // Validation
    // ==========================================
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const enteredOTP = Number(otp);

    // ==========================================
    // Validate OTP Format
    // ==========================================
    if (
      !Number.isInteger(enteredOTP) ||
      enteredOTP < 100000 ||
      enteredOTP > 999999
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit OTP",
      });
    }

    // ==========================================
    // Find User
    // ==========================================
    const user = await UserModel.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ==========================================
    // Already Verified
    // ==========================================
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // ==========================================
    // Check OTP Exists
    // ==========================================
    if (!user.otp || !user.otpEcpire) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // ==========================================
    // Check OTP Expiry
    // ==========================================
    if (user.otpEcpire.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // ==========================================
    // Check OTP
    // ==========================================
    if (enteredOTP !== Number(user.otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // ==========================================
    // Verify User
    // ==========================================
    user.isVerified = true;

    // Remove OTP
    user.otp = undefined;
    user.otpEcpire = undefined;

    await user.save();

    // ==========================================
    // Response
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify Register OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// User login
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(email);
    // console.log(password);

    // Validation
    if (!email || !password)
      return sendBadRequest(res, "Email and password are required");
    // Check existing user
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    // Already verified user
    if (!user) return sendConflict(res, "Please create your accound");
    if (!user.isVerified)
      return sendConflict(res, "Please verify your accound");

    if (user.password !== password)
      return sendBadRequest(res, "Incorect password");
    const token = generateToken(user._id);

    res.cookie("token", token, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // Cookie lifespan in milliseconds (e.g., 900,000ms = 15 minutes)
      httpOnly: true, // Prevents client-side scripts from reading the cookie (protects against XSS)
      secure: true, // Ensures the cookie is only transmitted over HTTPS
      sameSite: "strict", // Helps mitigate Cross-Site Request Forgery (CSRF) attacks
    });
    return sendSuccess(res);
  } catch (error) {
    console.log(error);

    return sendServerError(res);
  }
};
