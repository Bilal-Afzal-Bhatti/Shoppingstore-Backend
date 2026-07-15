import express from "express";
import { createCheckoutSession, createCODOrder, paymentstatus,getOrderTracking, getUserOrderHistory} from "../controllers/orderController.js";

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/cod", createCODOrder);
router.put("/update-payment", paymentstatus);
router.get("/track/:id",getOrderTracking);
router.get("/user/:userId",getUserOrderHistory);
//.post("/", orderinfo);

export default router;
