import Stripe from "stripe";
import Order from "../models/order.js";
import Cart from "../models/cart.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// 🧾 CREATE STRIPE CHECKOUT SESSION
export const createCheckoutSession = async (req, res) => {
  try {
    const { items, billingInfo, totalPrice, userId } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }
   const frontendUrl = process.env.FRONTEND_URL || 'https://shopping-store-blond-one.vercel.app';
    // Convert cart to Stripe format
    const line_items = items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      locale: 'en', // ✅ add this line
      customer_email: billingInfo.email,
    success_url:    `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:     `${frontendUrl}/cart`,
      metadata: { userId },
    });

    // Save order to DB
    const newOrder = new Order({
      userId,
      items,
      billingInfo,
      totalPrice,
      paymentMethod: "stripe",
      paymentStatus: "pending",
      stripeSessionId: session.id,
    });

    await newOrder.save();

    res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ message: "Stripe session creation failed" });
  }
};

// 💵 CASH ON DELIVERY ORDER
// export const createCODOrder = async (req, res) => {
//   try {
//     const { items, billingInfo, totalPrice, userId } = req.body;

//     const order = new Order({
//       userId,
//       items,
//       billingInfo,
//       totalPrice,
//       paymentMethod: "cod",
//       paymentStatus: "pending",
//     });

//     await order.save();
//     res.status(200).json({ message: "COD order placed successfully", order });
//   } catch (err) {
//     res.status(500).json({ message: "COD order failed" });
//   }
// };

// export const paymentstatus = async (req, res) => {
//   try {
//     const { session_id, userId } = req.body;
//     if (!session_id || !userId) {
//       return res.status(400).json({ message: "Missing session_id or userId" });
//     }

//     // ✅ verify with Stripe first — don't trust client
//     const session = await stripe.checkout.sessions.retrieve(session_id);
//     if (session.payment_status !== 'paid') {
//       return res.status(400).json({ success: false, message: 'Payment not confirmed by Stripe' });
//     }

//     const order = await Order.findOne({ stripeSessionId: session_id });
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     order.paymentStatus = "paid";
//     await order.save();

//     // ✅ clear cart in DB after confirmed payment
//     await Cart.findOneAndDelete({ userId });

//     res.status(200).json({ success: true, message: "Payment updated", order });

//   } catch (err) {
//     console.error("Error updating payment:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };
// controllers/orderController.js
import { sendOrderConfirmationEmail } from '../utils/sendOrderEmail.js';

// ── COD ───────────────────────────────────────────────────────────────────────
export const createCODOrder = async (req, res) => {
  try {
    const { items, billingInfo, totalPrice, userId } = req.body;

    const order = new Order({
      userId, items, billingInfo, totalPrice,
      paymentMethod: "cod",
      paymentStatus: "pending",
    });

    await order.save();

    // ✅ send confirmation email
    await sendOrderConfirmationEmail(order).catch(err =>
      console.error('Email failed (non-blocking):', err)
    );

    res.status(200).json({ message: "COD order placed successfully", order });
  } catch (err) {
    res.status(500).json({ message: "COD order failed" });
  }
};

// ── Stripe payment confirmed ──────────────────────────────────────────────────
export const paymentstatus = async (req, res) => {
  try {
    const { session_id, userId } = req.body;
    if (!session_id || !userId) {
      return res.status(400).json({ message: "Missing session_id or userId" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not confirmed by Stripe' });
    }

    const order = await Order.findOne({ stripeSessionId: session_id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentStatus = "paid";
    await order.save();

    await Cart.findOneAndDelete({ userId });

    // ✅ send confirmation email after Stripe confirms
    await sendOrderConfirmationEmail(order).catch(err =>
      console.error('Email failed (non-blocking):', err)
    );

    res.status(200).json({ success: true, message: "Payment updated", order });

  } catch (err) {
    console.error("Error updating payment:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Mapping for Frontend Stepper
    const statusSteps = ["processing", "shipped", "delivered"];
    const currentStepIndex = statusSteps.indexOf(order.orderStatus);

    res.status(200).json({
      order,
      currentStepIndex, // Frontend uses this for the bar width
      isCancelled: order.orderStatus === "cancelled"
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


// GET ALL ORDERS FOR A SPECIFIC USER
export const getUserOrderHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Industry Standard: Sort by 'createdAt' descending (-1)
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 }) 
      .lean(); // .lean() makes queries faster for read-only history

    if (!orders || orders.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: "No orders found for this user", 
        orders: [] 
      });
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("History API Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching history" });
  }
};
