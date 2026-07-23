import express from "express";
import userAuth from "../middlewares/userAuth.js";
import {
    register,
    login,
    googleAuth,    // 1. Add the new controller import
    getProfile,
    updateUser,
    verifyOTP,   // 2. Add the new controller import
    forgotPassword, // 3. Add the new controller import
    verifyResetOtp,
    resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// --- PUBLIC ROUTES ---

// Standard Email/Password Register
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);  
// Standard Email/Password Login
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

// 🚀 GOOGLE OAUTH (Handles both Signup and Login)
router.post("/google", googleAuth);

// --- PROTECTED ROUTES (Requires userAuth Middleware) ---

// Get User Profile
router.get("/profile", userAuth, getProfile);

// Update User Details
router.put("/update", userAuth, updateUser);

export default router;