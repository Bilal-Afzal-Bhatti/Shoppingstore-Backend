import mongoose from "mongoose";

// Sub-schema for items in user wishlist
const wishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true }, // String to support temp IDs or custom SKUs
    name: { type: String, required: true },
    price: { type: String }, // e.g. "$120"
    image: { type: String },
    discount: { type: String },
    rating: { type: Number, default: 0 },
  },
  { _id: true }
);

// Main User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    // Password is only required for local signups
    password: {
      type: String,
      trim: true,
      required: function () {
        return this.authMethod === "local" || !this.googleId;
      },
      validate: {
        validator: function (v) {
          if (this.authMethod === "local" && (!v || v.length < 6)) return false;
          return true;
        },
        message: "Password is required for local signup and must be at least 6 characters.",
      },
    },

    // --- AUTHENTICATION & OAUTH ---
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authMethod: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // --- EMAIL VERIFICATION OTP ---
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },

    // --- FORGOT PASSWORD & RATE LIMITING ---
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpiresAt: {
      type: Date,
      default: null,
    },
    otpRequestCount: {
      type: Number,
      default: 0, // Tries in current window
    },
    otpRequestWindowStart: {
      type: Date,
      default: null, // Start time of window
    },
    failedOtpAttempts: {
      type: Number,
      default: 0, // Wrong guesses
    },

    // --- PROFILE & E-COMMERCE ---
    avatar: {
      type: String,
      default: "https://placehold.co/400x400?text=User",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    wishlist: [wishlistItemSchema],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;