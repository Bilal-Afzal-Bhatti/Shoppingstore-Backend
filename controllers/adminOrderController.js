// controllers/adminOrderController.js
import Order             from '../models/order.js';
import OrderCancellation from '../models/orderCancellation.js';
import asyncHandler      from '../utils/asyncHandler.js';
import {
  sendShippedEmail,
  sendDeliveredEmail,
} from '../utils/sendOrderEmail.js';

// ── GET ALL ORDERS ────────────────────────────────────────────────────────────
export const getAllOrders = asyncHandler(async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 10;
  const skip   = (page - 1) * limit;
  const search = req.query.search || '';
  const status = req.query.status || '';

  const filter = {};
  if (status) filter.orderStatus = status;
  if (search) filter.orderId = { $regex: search, $options: 'i' };

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
  ]);

  res.json({
    success: true,
    data:    orders,
    total,
    page,
    pages:   Math.ceil(total / limit),
  });
});

// ── UPDATE ORDER STATUS ───────────────────────────────────────────────────────
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus: status },
    { new: true }
  );

  if (!order) return res.status(404).json({ message: 'Order not found' });

  // ✅ trigger emails non-blocking
  if (status === 'shipped') {
    sendShippedEmail(order).catch(err =>
      console.error('Shipped email failed:', err)
    );
  }
  if (status === 'delivered') {
    sendDeliveredEmail(order).catch(err =>
      console.error('Delivered email failed:', err)
    );
  }

  res.json({ success: true, message: `Order marked as ${status}`, order });
});

// ── GET ALL CANCELLATIONS ─────────────────────────────────────────────────────
export const getAllCancellations = asyncHandler(async (req, res) => {
  const cancellations = await OrderCancellation.find()
    .populate('orderId')
    .populate('userId', 'name email authMethod')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: cancellations });
});

// ── PROCESS CANCELLATION ──────────────────────────────────────────────────────
export const processCancellation = asyncHandler(async (req, res) => {
  const { action, adminComment } = req.body;

  const cancellation = await OrderCancellation.findById(req.params.id)
    .populate('orderId');

  if (!cancellation) {
    return res.status(404).json({ message: 'Cancellation not found' });
  }

  if (action === 'approve') {
    cancellation.requestStatus = 'Approved';
    cancellation.adminComment  = adminComment || 'Approved by admin';
    await Order.findByIdAndUpdate(cancellation.orderId._id, {
      orderStatus:          'cancelled',
      cancellationRequested: false,
    });
  } else {
    cancellation.requestStatus = 'Rejected';
    cancellation.adminComment  = adminComment || 'Rejected by admin';
    await Order.findByIdAndUpdate(cancellation.orderId._id, {
      cancellationRequested: false,
    });
  }

  await cancellation.save();
  res.json({ success: true, message: `Cancellation ${action}d`, cancellation });
});