import Admin from '../models/adminModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // 🚩 Add this line at the top


/**
 * @desc    Register a new Admin
 * @route   POST /api/admin/register
 * @access  Public
 */
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validation Check
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields." });
        }

        // 2. Check for Existing Admin (The "Unique" Requirement)
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            // Industry Standard: Use 400 Bad Request for duplicate data
            return res.status(400).json({ message: "Admin with this email already exists." });
        }

        // 3. Create New Admin
        // Password hashing is handled automatically by the pre-save hook in adminModel.js
        const admin = await Admin.create({
            name,
            email,
            password
        });

        if (admin) {
            // 4. Generate JWT Token
            const token = jwt.sign(
                { id: admin._id, role: admin.role },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.status(201).json({
                success: true,
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                token: token,
                message: "Registration successful"
            });
        } else {
            res.status(400).json({ message: "Invalid admin data" });
        }

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
};
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if Admin exists
        // We use .select('+password') if you set 'select: false' in your model
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 2. Compare Passwords
        // bcrypt.compare checks the plain text password against the hashed one in DB
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Token valid for 7 days
        );

        // 4. Send Response
        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};
export const getAdminProfile = async (req, res) => {
  try {
    // req.user was already populated in your requireLogin middleware:
    // const user = await User.findById(decoded.id).select("-password");
    
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return the user data stored in the request
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};