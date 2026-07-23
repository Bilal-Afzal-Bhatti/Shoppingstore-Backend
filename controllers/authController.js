import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from 'google-auth-library';
import { validate } from "deep-email-validator";

import crypto from "crypto";



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
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // If they are already verified, they cannot register again
      if (existingUser.isVerified) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      
      // If they exist but are NOT verified, we will let them retry registration.
      // We'll delete their unverified record to avoid duplication issues.
      await User.deleteOne({ email });
    }

    // 1. Generate unique OTP and expiration (10 minutes from now)
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // 2. Try sending the OTP email first
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    try {
      await transporter.sendMail({
        from: `"ECOMMERCE SHOP" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Verification Code - ECOMMERCE SHOP",
        html: `
          <h2>Welcome ${name}!</h2>
          <p>Thank you for signing up. Please use the verification code below to complete your registration:</p>
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
          <p>This code is valid for 10 minutes.</p>
        `,
      });
    } catch (mailError) {
      console.error("Mail Error:", mailError.message);
      return res.status(400).json({ message: "Invalid email address or delivery failed." });
    }

    // 3. Hash password and save the UNVERIFIED user to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      authMethod: "local",
      isVerified: false, // Explicitly false until verified
      otp,
      otpExpires
    });

    return res.status(200).json({
      message: "Verification OTP sent to your email. Please verify to complete registration.",
      email
    });

  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
};
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find the unverified user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This email is already verified. Please log in." });
    }

   //  NEW WAY (Coerces both sides to strings so they match exactly)
if (String(user.otp).trim() !== String(otp).trim()) {
  return res.status(400).json({ message: "Invalid verification code." });
}

    // 2. Check if OTP has expired
    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Verification code has expired. Please register again." });
    }

    // 3. Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // 4. Generate login token
    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Account verified and created successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token,
    });

  } catch (error) {
    console.error("Verification Error:", error.message);
    return res.status(500).json({ message: "Something went wrong during verification." });
  }
};
// --- LOCAL REGISTER ---
// export const register = async (req, res) => {
//   const { name, email, password } = req.body; // Using 'email' to match updated model

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       authMethod: "local"
//     });

//     const token = generateToken(newUser._id);

//     // Nodemailer Logic
//     if (email.includes("@")) {
//       try {
//         const transporter = nodemailer.createTransport({
//           host: "smtp.gmail.com",
//           port: 465,
//           secure: true,
//           auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
//         });

//         await transporter.sendMail({
//           from: `"ECOMMERCE SHOP" <${process.env.EMAIL_USER}>`,
//           to: email,
//           subject: "Welcome to ECOMMERCE SHOP",
//           html: `<h2>Hello ${name}!</h2><p>Welcome to the vault.</p>`,
//         });
//       } catch (e) { console.error("Mail Error:", e); }
//     }

//     res.status(201).json({ message: "User registered", user: newUser, token });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// --- LOCAL LOGIN ---
// --- LOCAL LOGIN ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // 1. Check if user exists FIRST
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // 2. Check if user is verified SECOND
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // 3. Handle Google accounts attempting local login
    if (user.authMethod === "google") {
      return res.status(400).json({
        success: false,
        message: "Account linked to Google. Please use 'Continue with Google'.",
      });
    }

    // 4. Compare Passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // 5. Generate Token and respond
    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
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

// controllers/authController.ts
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return 200/generic message to prevent email enumeration attacks
      return res.status(200).json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    const NOW = new Date();
    const WINDOW_DURATION = 15 * 60 * 1000; // 15 minutes window
    const MAX_ATTEMPTS = 3;

    // Check if window expired; if so, reset the window counter
    if (!user.otpRequestWindowStart || (NOW.getTime() - user.otpRequestWindowStart.getTime()) > WINDOW_DURATION) {
      user.otpRequestWindowStart = NOW;
      user.otpRequestCount = 0;
    }

    // Enforce Rate Limit
    if (user.otpRequestCount >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset attempts. Please try again after 15 minutes.',
      });
    }

    // Increment request count & generate OTP
    user.otpRequestCount += 1;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiresAt = new Date(NOW.getTime() + 10 * 60 * 1000); // Valid 10 mins
    user.failedOtpAttempts = 0; // Reset failed verification counter

    await user.save();

    // Send email using Nodemailer...

    return res.status(200).json({ success: true, message: 'OTP sent to email successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
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