/**
 * @desc    Middleware to restrict access to Admins only
 * @requirement Must be used AFTER requireLogin middleware
 */
export const isAdmin = (req, res, next) => {
    // Check if user exists (from requireLogin) and if they are an admin
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, proceed to the controller
    } else {
        res.status(403).json({ 
            success: false,
            message: "Access Denied: You do not have administrator privileges." 
        });
    }
};