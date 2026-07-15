// models/order.js
import mongoose from "mongoose";

// ─── Custom Order ID Generator ────────────────────────────────────────────────
// Format: ORD-2026-XXXXX (e.g. ORD-2026-A3K9P)
// ─── Custom Order ID Generator ────────────────────────────────────────────────
// Format: #EX4K9P (e.g. #AB12CD)
const generateOrderId = () => {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `#${random}`;
};

const orderSchema = new mongoose.Schema(
  {
    // ✅ Industry standard custom order ID
    orderId: {
      type:    String,
      unique:  true,
      index:   true,
      default: generateOrderId,
    },

    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    items: [
      {
        productId: { type: String,  required: true },
        name:      { type: String,  required: true },
        price:     { type: Number,  required: true },
        quantity:  { type: Number,  required: true },
        image:     { type: String,  required: true },
        discount:  { type: String },
      },
    ],
    billingInfo: {
      name:      { type: String, required: true },
      company:   { type: String },
      address:   { type: String, required: true },
      apartment: { type: String },
      city:      { type: String, required: true },
      phone:     { type: String, required: true },
      email:     { type: String, required: true },
      zipcode:   { type: String, required: true },
    },
    totalPrice:    { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "stripe"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    stripeSessionId: { type: String, default: null },
    orderStatus: {
      type:    String,
      enum:    ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
      index:   true,
    },
    cancellationRequested: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Collision guard — retry if orderId already exists ────────────────────────
orderSchema.pre('save', async function (next) {
  if (this.isNew && this.orderId) {
    const exists = await mongoose.model('Order').findOne({ orderId: this.orderId });
    if (exists) this.orderId = generateOrderId(); // regenerate on collision
  }
  next();
});

// ─── Virtual: progress percentage ─────────────────────────────────────────────
orderSchema.virtual('progressPercentage').get(function () {
  return { processing: 33, shipped: 66, delivered: 100, cancelled: 0 }[this.orderStatus] || 0;
});

const Order = mongoose.model("Order", orderSchema);
export default Order;