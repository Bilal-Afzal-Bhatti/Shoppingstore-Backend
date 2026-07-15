import express from "express";
import { createEmail } from "../controllers/emailController.js";

const router = express.Router();

// ✅ Only POST route for email submission
router.post("/emailsender", createEmail);

export default router;
