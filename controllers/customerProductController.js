// controllers/customerProductController.js
import AdminProduct from '../models/adminProductModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// Sort map — no fake categories needed
const SORT_MAP = {
  bestselling: { 'ratings.count':   -1 },
  toprated:    { 'ratings.average': -1 },
  newest:      { createdAt:         -1 },
  priceasc:    { price:              1 },
  pricedesc:   { price:             -1 },
};

export const getProducts = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip  = (page - 1) * limit;

  const filter = { isActive: true };

  // ✅ case-insensitive category match
  if (req.query.category) {
    filter.category = { $regex: new RegExp(`^${req.query.category}$`, 'i') };
  }

  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  // ✅ sort — defaults to newest
  const sortBy = SORT_MAP[req.query.sort] || SORT_MAP.newest;

  const [total, products] = await Promise.all([
    AdminProduct.countDocuments(filter),
    AdminProduct.find(filter)
      .select('-__v')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
  ]);

  res.json({
    success: true,
    data:    products,
    total,
    page,
    pages:   Math.ceil(total / limit),
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await AdminProduct.findOne({
    _id:      req.params.id,
    isActive: true,
  }).select('-__v');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.json({ success: true, data: product });
});

export const rateProduct = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const product = await AdminProduct.findOne({ _id: req.params.id, isActive: true });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const currentTotalPoints      = product.ratings.average * product.ratings.count;
  product.ratings.count        += 1;
  product.ratings.average       = (currentTotalPoints + rating) / product.ratings.count;
  product.ratings.stars[rating] = (product.ratings.stars[rating] || 0) + 1;

  await product.save();

  res.json({ success: true, message: 'Rating submitted', average: product.ratings.average, count: product.ratings.count });
});