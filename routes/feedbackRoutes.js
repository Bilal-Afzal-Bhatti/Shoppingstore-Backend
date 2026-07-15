import express from "express";
import {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  deleteFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

// POST → Create feedback
router.post("/submit", createFeedback);

// GET → Get all feedback
router.get("/", getAllFeedback);

// GET → Get one feedback by ID
router.get("/:id", getFeedbackById);

// DELETE → Remove feedback
router.delete("/:id", deleteFeedback);

export default router;
