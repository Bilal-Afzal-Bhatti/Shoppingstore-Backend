// models/adminModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
  },
  avatar: {
    type: String,
    default: 'https://placehold.co/400x400?text=Admin',
  },
  role: {
    type: String,
    default: 'admin',
    enum: ['admin', 'superadmin'],
  },

  // ── Store Settings ──────────────────────────────────────────────────────────
  storeSettings: {
    storeName:     { type: String,  default: 'My Store' },
    storeEmail:    { type: String,  default: ''         },
    currency:      { type: String,  default: 'USD'      },
    storeLogo:     { type: String,  default: ''         },
    lowStockAlert: { type: Number,  default: 10         },
  },

  // ── Notification Settings ───────────────────────────────────────────────────
  notificationSettings: {
    newOrder:       { type: Boolean, default: true  },
    lowStock:       { type: Boolean, default: true  },
    newCustomer:    { type: Boolean, default: false },
    orderDelivered: { type: Boolean, default: true  },
  },

}, { timestamps: true });

// Auto-hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export default mongoose.model('Admin', adminSchema);