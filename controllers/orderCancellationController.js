import Order from "../models/order.js";

import OrderCancellation from '../models/orderCancellation.js';

export const requestOrderCancellation = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { reason, additionalNotes } = req.body;
    
    // 1. AUTH GUARD
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // 2. EXISTENCE GUARD
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 3. OWNERSHIP GUARD
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized request" });
    }

    // 4. DUPLICATE GUARD
    const existingRequest = await OrderCancellation.findOne({ orderId });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: "A request is already in our system" });
    }

    // --- 🚀 THE FIX: UPDATE THE ORDER MODEL ---
    // We update this so the Frontend 'order.cancellationRequested' becomes true
    // This will trigger the "Under Review" message and hide the button immediately.
    order.cancellationRequested = true; 
    await order.save(); 

    // 5. RECORD CREATION (Your separate collection for Admin logs)
    const cancellationEntry = await OrderCancellation.create({
      orderId,
      userId,
      reason: reason || 'Other',
      additionalNotes: additionalNotes || "",
      requestStatus: "Pending Approval" 
    });

    res.status(201).json({ 
      success: true, 
      message: "Request sent. Admin will review this manually.",
      data: cancellationEntry 
    });

  } catch (error) {
    console.error("CANCELLATION_API_ERROR:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// PUT /api/admin/order-cancel/:orderId/approve
// PUT /api/admin/order-cancel/:orderId/approve
export const approveCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Update the Main Order (Image 1)
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: 'cancelled' }, // Changes "processing" to "cancelled"
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    // 2. Update the Request Status (Image 2)
    await OrderCancellation.findOneAndUpdate(
      { orderId: orderId },
      { requestStatus: 'cancelled' } 
    );

    res.status(200).json({ 
      success: true, 
      message: "Order cancelled and request approved." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/order-cancel/:orderId/reject
export const rejectCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Reset the flag on the order so the user can see the button again
    await Order.findByIdAndUpdate(orderId, { cancellationRequested: false });

    // 2. Mark the request as Rejected
    await OrderCancellation.findOneAndUpdate(
      { orderId },
      { requestStatus: 'Rejected' }
    );

    res.status(200).json({ success: true, message: "Cancellation request rejected" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};