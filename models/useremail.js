// models/User.js
// backend/models/User.js
import mongoose from "mongoose"; // <-- use import instead of require



const userSchema = new mongoose.Schema({
 

email: 
{
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  sparse: true, // allows null   

},


  role: {
    type: String,
    enum: ["user"],
    default: "user",
  }
}, { timestamps: true });
const  useremail = mongoose.model("useremail", userSchema);

export default useremail; // ✅ ES Module export