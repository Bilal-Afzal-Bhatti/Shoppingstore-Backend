import userfeedback from "../models/userfeedback.js";

// ✅ Create feedback
// Create feedback
//✅ Submit Feedback
export const createFeedback = async (req, res) => {
  try {
    const { name, email, phone, message, role } = req.body;

   
    // Convert phone to number
    const numericPhone = Number(phone);
    if (isNaN(numericPhone)) {
      return res.status(400).json({ message: "Phone must be a number" });
    }

    // Check if email already submitted feedback
    const existingFeedback = await userfeedback.findOne({ email });
    if (existingFeedback) {
      return res
        .status(400)
        .json({ message: "Feedback already submitted with this email" });
    }

    // Save feedback
    const feedback = new userfeedback({
      name,
      email,
      phone: numericPhone,
      message,
      role, // optional, defaults to "user" in your model
    });

    await feedback.save();

    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// ✅ Get all feedback (admin)
export const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await user_feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get feedback by ID
export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await user_feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete feedback
export const deleteFeedback = async (req, res) => {
  try {
    const deleted = await user_feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Feedback not found" });
    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
