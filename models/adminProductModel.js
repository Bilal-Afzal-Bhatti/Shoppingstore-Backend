// models/adminProductModel.js
import mongoose from 'mongoose';

// ─── Variant Sub-Schema ───────────────────────────────────────────────────────
// Each variant = one unique Color + Size combination with its own stock
const variantSchema = new mongoose.Schema({
  color: {
    name: { type: String, required: true, trim: true }, // e.g. "Red", "Navy Blue"
    hex:  { type: String, required: true, trim: true }, // e.g. "#FF0000"
  },
  size:  { type: String, required: true, trim: true },  // e.g. "S", "M", "L", "XL", "42"
  stock: { type: Number, default: 0, min: 0 },          // stock for THIS color+size combo
}, { _id: true });


const adminProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      default: null,
    },

    // ── Total Stock (auto-synced from variants) ───────────────────────────────
    // Do NOT set this manually — always use syncStock() or the pre-save hook
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },

    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    discount: {
      type: String,
      default: 'No Discount',
      trim: true,
    },

    // ── Category ──────────────────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: [
        'Flash Sales',
        'New Arrival',
        'Our Products',
        'Electronics',
        'Clothing',
        'Footwear',
        'Accessories',
        'Home & Kitchen',
        'Beauty & Health',
        'Sports & Outdoors',
        'Toys & Games',
        'Books',
        'Other',
      ],
      default: 'Other',
    },

    // ── Variants ──────────────────────────────────────────────────────────────
    // Replaces the old flat `colors` array
    // Each entry = { color: { name, hex }, size, stock }
    variants: {
      type: [variantSchema],
      default: [],
    },

    // ── Ratings ───────────────────────────────────────────────────────────────
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        set: v => Math.round(v * 10) / 10,
      },
      count: { type: Number, default: 0 },
      stars: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


// ─── Helper Method: Sync total stock from variants ────────────────────────────
// Call this on the document before saving whenever variants change:
//   product.syncStock();
//   await product.save();
adminProductSchema.methods.syncStock = function () {
  this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
};


// ─── Pre-Save Hook ────────────────────────────────────────────────────────────
adminProductSchema.pre('save', function (next) {

  // 1. Auto-sync total stock from variants (if variants exist)
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  // 2. Clamp ratings to valid range
  if (this.ratings) {
    if (this.ratings.average > 5) this.ratings.average = 5;
    if (this.ratings.average < 0) this.ratings.average = 0;
  }

  next();
});


export default mongoose.model('AdminProduct', adminProductSchema);