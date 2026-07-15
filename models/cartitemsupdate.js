const cartItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    price: { type: Number, required: true }, // 👈 Add this
    quantity: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);
