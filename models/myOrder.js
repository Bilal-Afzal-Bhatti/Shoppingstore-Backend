import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, required: true },
    discount: { type: String, default: "" }
  }],
  billingInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    zipcode: { type: String }
  },
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod', 'stripe'], required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  // 🚀 The Status Logic for your Tracking Line
  orderStatus: { 
    type: String, 
    enum: ['processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'processing' 
  },
  stripeSessionId: { type: String }, // For tracking Stripe payments
  trackingNumber: { type: String, default: () => `TRK-${Math.random().toString(36).toUpperCase().slice(2, 10)}` }
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);