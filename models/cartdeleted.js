import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  image: { type: String, required: true },
  discount: { type: String },
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
  totalPrice: { type: Number, default: 0 },
}, { timestamps: true });

cartSchema.pre("save", function(next) {
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  next();
});

// ✅ Check if model already exists
const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

export default Cart;
