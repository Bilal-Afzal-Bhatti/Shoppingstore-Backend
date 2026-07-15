import mongoose from 'mongoose';

const orderCancellationSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order', // Links to your separate Order collection
    required: true,
    index: true 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: [true, "Please provide a reason for cancellation"],
    enum: [
      'Changed my mind',
      'Found a better price elsewhere',
      'Ordered by mistake',
      'Delivery time is too long',
      'Other'
    ]
  },
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [500, "Notes cannot exceed 500 characters"]
  },
  requestStatus: {
    type: String,
    required: true,
    enum: ['Pending Approval', 'Approved', 'Rejected', 'Resolved','cancelled'],
    default: 'Pending Approval'
  },
  refundStatus: {
    type: String,
    enum: ['N/A', 'Pending', 'Completed', 'Failed'],
    default: 'N/A' 
  },
  isRestocked: {
    type: Boolean,
    default: false 
  },
  adminComment: {
    type: String,
    trim: true
  },
  refundTransactionId: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Optimizing for Admin Dashboard performance
orderCancellationSchema.index({ requestStatus: 1 });
orderCancellationSchema.index({ createdAt: -1 });

const OrderCancellation = mongoose.model('OrderCancellation', orderCancellationSchema);
export default OrderCancellation;