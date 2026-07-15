import express from "express";
import userAuth from "../middlewares/userAuth.js";
import {
    register,
    login,
    googleAuth,    // 1. Add the new controller import
    getProfile,
    updateUser,
   
} from "../controllers/authController.js";

const router = express.Router();

// --- PUBLIC ROUTES ---

// Standard Email/Password Register
router.post("/register", register);

// Standard Email/Password Login
router.post("/login", login);

// 🚀 GOOGLE OAUTH (Handles both Signup and Login)
router.post("/google", googleAuth);

// --- PROTECTED ROUTES (Requires userAuth Middleware) ---

// Get User Profile
router.get("/profile", userAuth, getProfile);

// Update User Details
router.put("/update", userAuth, updateUser);

export default router;