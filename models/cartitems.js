import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    discount: { type: String }, // optional
    quantity: { type: Number, default: 1 }, // 🆕 optional stock quantity
  },
  { timestamps: true }
);



const Product = mongoose.model("Product", productSchema);
export default Product;
