import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true, // removes leading/trailing spaces
      required: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true, // allows null
    },

    phone: {
      type: Number, // ✅ Capital N
      required: true,
    },

    message: {
      type: String, // ✅ Capital S
      required: true,
    },

    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },
  },
  { timestamps: true }
);

const userfeedback = mongoose.model("UserFeedback", userSchema);

export default userfeedback;
