import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/adminModel.js"; // ← add this

export const requireLogin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check Admin collection first, then User collection
    let account = await Admin.findById(decoded.id).select("-password");
    if (!account) {
      account = await User.findById(decoded.id).select("-password");
    }

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    req.user = account;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized access" });
  }
};