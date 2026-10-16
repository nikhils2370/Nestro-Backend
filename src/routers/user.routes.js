import express from "express";

import {
  login,
  register,
  verifyRegisterOTP,
  getMe,
  logout,
  updateProfile,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/auth.js";
const Userrouter = express.Router();
Userrouter.post("/register", register);
Userrouter.post("/verify-register-otp", verifyRegisterOTP);
Userrouter.post("/login", login);
Userrouter.get("/get-me", verifyToken, getMe);
Userrouter.patch("/update-profile", verifyToken, updateProfile);
Userrouter.post("/logout", verifyToken, logout);
export default Userrouter;
