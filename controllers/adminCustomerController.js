// controllers/adminCustomerController.js

import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── GET ALL CUSTOMERS (with filters, pagination, auth breakdown) ──────────────
// GET /api/admin/customers?page=1&limit=10&authMethod=google&isVerified=true&search=john
export const getCustomers = asyncHandler(async (req, res) => {
  const page       = parseInt(req.query.page)  || 1;
  const limit      = parseInt(req.query.limit) || 10;
  const skip       = (page - 1) * limit;

  // ── Build filter ────────────────────────────────────────────────────────────
  const filter = { role: 'user' }; // admin panel only sees customers, not admins

  if (req.query.authMethod) {
    filter.authMethod = req.query.authMethod; // filter by 'local' or 'google'
  }

  if (req.query.isVerified !== undefined) {
    filter.isVerified = req.query.isVerified === 'true';
  }

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i'); // case-insensitive search
    filter.$or = [{ name: regex }, { email: regex }];
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  const [customers, total, authStats, verifiedStats] = await Promise.all([

    // Paginated customer list — never expose password
    User.find(filter)
      .select('-password -googleId -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    // Total count for pagination
    User.countDocuments(filter),

    // Auth method breakdown — how many Google vs Local
    User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$authMethod', count: { $sum: 1 } } },
    ]),

    // Verified vs unverified breakdown
    User.aggregate([
      { $match: { role: 'user' } },
      { $group: { _id: '$isVerified', count: { $sum: 1 } } },
    ]),
  ]);

  // ── Format auth stats ────────────────────────────────────────────────────────
  const authBreakdown = {
    google: 0,
    local:  0,
  };
  authStats.forEach(({ _id, count }) => {
    if (_id === 'google') authBreakdown.google = count;
    if (_id === 'local')  authBreakdown.local  = count;
  });

  // ── Format verified stats ────────────────────────────────────────────────────
  const verifiedBreakdown = {
    verified:   0,
    unverified: 0,
  };
  verifiedStats.forEach(({ _id, count }) => {
    if (_id === true)  verifiedBreakdown.verified   = count;
    if (_id === false) verifiedBreakdown.unverified = count;
  });

  res.status(200).json({
    success: true,
    // ── Summary card data for the admin dashboard ──
    summary: {
      total,
      googleAuth:  authBreakdown.google,
      localAuth:   authBreakdown.local,
      verified:    verifiedBreakdown.verified,
      unverified:  verifiedBreakdown.unverified,
    },
    // ── Pagination meta ──
    page,
    pages: Math.ceil(total / limit),
    count: customers.length,
    // ── Customer list ──
    data: customers,
  });
});

// ─── GET SINGLE CUSTOMER ──────────────────────────────────────────────────────
// GET /api/admin/customers/:id
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'user' })
    .select('-password -googleId -__v');

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  res.status(200).json({ success: true, data: customer });
});

// ─── DELETE CUSTOMER ──────────────────────────────────────────────────────────
// DELETE /api/admin/customers/:id
export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: 'user' });

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  await customer.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully',
    id: req.params.id,
  });
});