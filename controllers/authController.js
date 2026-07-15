import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- HELPER: GENERATE TOKEN ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// --- GOOGLE OAUTH (Sign Up / Login) ---
export const googleAuth = async (req, res) => {
  const { token } = req.body; // This is the credential from Google

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture, sub } = ticket.getPayload();

    // 🚀 INDUSTRIAL UPSERT: Find by email, update with Google info
    let user = await User.findOneAndUpdate(
      { email: email },
      { 
        name, 
        avatar: picture, 
        googleId: sub,
        authMethod: "google",
        isVerified: true 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const appToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Google Auth Successful",
      token: appToken,
      user
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ message: "Invalid Google Token" });
  }
};

// --- LOCAL REGISTER ---
export const register = async (req, res) => {
  const { name, email, password } = req.body; // Using 'email' to match updated model

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      authMethod: "local"
    });

    const token = generateToken(newUser._id);

    // Nodemailer Logic
    if (email.includes("@")) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: `"ECOMMERCE SHOP" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Welcome to ECOMMERCE SHOP",
          html: `<h2>Hello ${name}!</h2><p>Welcome to the vault.</p>`,
        });
      } catch (e) { console.error("Mail Error:", e); }
    }

    res.status(201).json({ message: "User registered", user: newUser, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- LOCAL LOGIN ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" }); // Vague for security

    if (user.authMethod === "google") {
      return res.status(400).json({ 
        message: "Account linked to Google. Please use 'Continue with Google'." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    // Convert to object and delete password before sending to frontend
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ 
      success: true,
      message: "Login successful", 
      user: userResponse, 
      token 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// --- UPDATE PROFILE ---
export const updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (password && user.authMethod === "local") {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.status(200).json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- GET PROFILE ---
export const getProfile = async (req, res) => {
  res.json({ message: "Success", user: req.user });
};
// controllers/wishlistController.js





export const toggleWishlist = async (req, res) => {
  try {
    const { productId, name, price, image, discount, rating } = req.body;
    const userId = req.user.id; // This comes from your auth middleware
     console.log("Toggle Wishlist:", { userId, productId, name, price, image, discount, rating });
    const user = await User.findById(userId);

    // 1. Check if it already exists
    const itemIndex = user.wishlist.findIndex(item => item.productId === String(productId));

    if (itemIndex > -1) {
      // Remove it
      user.wishlist.splice(itemIndex, 1);
    } else {
      // 2. Add it - MUST include userId here to pass validation
      user.wishlist.push({ 
        userId,        // <--- CRITICAL: This fixes the validation error
        productId: String(productId), 
        name, 
        price, 
        image, 
        discount, 
        rating 
      });
    }

    await user.save();
    res.status(200).json({ success: true, wishlist: user.wishlist });
    
  } catch (error) {
    // This catch block is where you are seeing "User validation failed"
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};
// ✅ GET WISHLIST
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ 
      success: true, 
      wishlist: user?.wishlist || [] 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ CLEAR ALL WISHLIST
export const clearWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.wishlist = [];
    await user.save();
    res.status(200).json({ success: true, message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};