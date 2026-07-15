// models/cart.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true }, // ✅ String — MongoDB _id is string
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  image:     { type: String, required: true },
  discount:  { type: String, default: '' },
  quantity:  { type: Number, default: 1, min: 1 },
}, { _id: true });

const cartSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:      [cartItemSchema],
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate totalPrice on every save
cartSchema.pre('save', function (next) {
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );
  next();
});

export default mongoose.model('Cart', cartSchema);