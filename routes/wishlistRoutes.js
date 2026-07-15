import { toggleWishlist,
    getWishlist,
    clearWishlist } from "../controllers/authController.js";
import express from "express";
import userAuth from "../middlewares/userAuth.js";  
const router = express.Router();

router.use(userAuth);

router.post("/add", toggleWishlist);
router.get("/show", getWishlist);
router.delete("/clear", clearWishlist);

export default router;