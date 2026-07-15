// utils/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // ── Mongoose: Invalid ObjectId (e.g. /products/abc123bad) ──────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${err.value}`,
    });
  }

  // ── Mongoose: Duplicate key (e.g. unique field violated) ───────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // ── Mongoose: Validation errors (required fields, min, enum, etc.) ─────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // ── Stripe: missing key ────────────────────────────────────────────────────
  if (err.message.includes('STRIPE_KEY')) {
    return res.status(500).json({
      success: false,
      message: 'Stripe API key is not set! Please configure STRIPE_KEY in environment variables.',
    });
  }

  // ── Stripe: invalid request ────────────────────────────────────────────────
  if (err.type === 'StripeInvalidRequestError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // ── Default fallback ───────────────────────────────────────────────────────
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
  });
};

export default errorHandler;