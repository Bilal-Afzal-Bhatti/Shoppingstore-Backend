import user_email from "../models/useremail.js";

// ✅ Register (Create) a new user
export const createEmail = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await user_email.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = new user_email({ email, role });
    await newUser.save();

    res.status(201).json({
      message: "Email added successfully",
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
