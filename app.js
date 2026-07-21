// app.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import useremail from "./routes/useremailRoutes.js";
import userfeedback from "./routes/feedbackRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import os from 'os';
import orderCancelRoutes from "./routes/orderCancelRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
import customerProductRoutes from './routes/customerProductRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
// This tells you exactly how many "workers" you can hire
const totalCores = os.cpus().length; 

console.log(`Your server has ${totalCores} CPU cores.`);
dotenv.config();

const app = express();

// ===== Middleware =====

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const allowedOrigins = [
  "http://localhost:5174",    
     "http://localhost:5173",  
     "http://localhost:5731",  
     'http://nexcuscart.com',
    'https://nexcuscart.com',        // Local Vite Dev
  "https://shopping-store-blond-one.vercel.app", // Production Vercel
  "https://admin-panel-cms-psi.vercel.app",    // Production Backend  
  "http://192.168.18.40:5173",                 // Local IP Vite Dev
  "http://192.168.18.40:5174",                 // Local IP Vite Dev (Admin)
  "http://192.168.18.40:3000",                 // Docker Frontend
  "http://192.168.18.40:3001",                 // Docker Admin
  "http://localhost:3000",                     // Docker Frontend (Localhost access)
  "http://localhost:3001",                     // Docker Admin (Localhost access)
];

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // 2. Check if origin is in our whitelist OR is a Vercel preview branch
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("CORS Policy: Access Denied"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true, // Required for cookies/sessions/Google Auth
  maxAge: 86400, // Cache the preflight response for 24 hours (Performance)
};

app.use(cors(corsOptions));
// ===== MongoDB Connection (Serverless Safe) =====
let cached = globalThis.mongoose;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      connectTimeoutMS: 30000, // optional, increases timeout
    }).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Middleware to connect DB per request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/useremail", useremail);
app.use("/api/userfeedback", userfeedback);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ordercancel",orderCancelRoutes);
app.use("/api/wishlist",wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerProductRoutes); // Customer routes (Protected by JWT)
app.use('/api/chatbot', chatbotRoutes);



// ... other imports



app.get("/", (req, res) => {
  res.status(200).send("API is running...");
});

export default app;