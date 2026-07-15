// controllers/adminProductController.js
import AdminProduct from '../models/adminProductModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── GET ALL ──────────────────────────────────────────────────────────────────
// GET /api/admin/products?page=1&limit=10&category=Electronics
export const getProducts = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const filter = { isActive: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const [total, products] = await Promise.all([
    AdminProduct.countDocuments(filter),
    AdminProduct.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({
    success: true,
    count:   products.length,
    total,
    page,
    pages:   Math.ceil(total / limit),
    data:    products,
  });
});

// ─── GET ONE ──────────────────────────────────────────────────────────────────
// GET /api/admin/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await AdminProduct.findById(req.params.id);

  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.status(200).json({ success: true, data: product });
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
// POST /api/admin/products
// Body: { name, price, originalPrice?, image, discount?, category, variants? }
// NOTE: stock is NOT accepted from body — it is auto-calculated from variants
export const createProduct = asyncHandler(async (req, res) => {
  const { name, price, originalPrice, image, discount, category, variants } = req.body;

  // ── Required field guard ───────────────────────────────────────────────────
  if (!name || price === undefined || !image || !category) {
    return res.status(400).json({
      success: false,
      message: 'name, price, image, and category are required',
    });
  }

  // ── Validate variants array if provided ────────────────────────────────────
  if (variants !== undefined && !Array.isArray(variants)) {
    return res.status(400).json({ success: false, message: 'variants must be an array' });
  }

  // ── Validate each variant shape ────────────────────────────────────────────
  if (Array.isArray(variants)) {
    for (const v of variants) {
      if (!v.color?.name || !v.color?.hex || !v.size) {
        return res.status(400).json({
          success: false,
          message: 'Each variant must have color.name, color.hex, and size',
        });
      }
    }
  }

  const product = new AdminProduct({
    name,
    price,
    originalPrice: originalPrice || null,
    image,
    discount: discount || 'No Discount',
    category,
    variants: variants || [],
    // stock is intentionally omitted — pre-save hook calculates it
  });

  // syncStock() + save() — pre-save hook will auto-sum variants into stock
  await product.save();

  res.status(201).json({ success: true, data: product });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// PUT /api/admin/products/:id
// Body: any subset of { name, price, originalPrice, image, discount, category, variants }
// NOTE: never send `stock` directly — it will be overwritten by the hook anyway
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await AdminProduct.findById(req.params.id);

  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const { name, price, originalPrice, image, discount, category, variants } = req.body;

  // ── Validate variants if being replaced wholesale ──────────────────────────
  if (variants !== undefined) {
    if (!Array.isArray(variants)) {
      return res.status(400).json({ success: false, message: 'variants must be an array' });
    }
    for (const v of variants) {
      if (!v.color?.name || !v.color?.hex || !v.size) {
        return res.status(400).json({
          success: false,
          message: 'Each variant must have color.name, color.hex, and size',
        });
      }
    }
  }

  product.name          = name          ?? product.name;
  product.price         = price         ?? product.price;
  product.originalPrice = originalPrice ?? product.originalPrice;
  product.image         = image         ?? product.image;
  product.discount      = discount      ?? product.discount;
  product.category      = category      ?? product.category;
  product.variants      = variants      ?? product.variants;
  // stock is NOT touched here — pre-save hook recalculates it automatically

  const updated = await product.save();
  res.status(200).json({ success: true, data: updated });
});

// ─── ADD VARIANT ──────────────────────────────────────────────────────────────
// POST /api/admin/products/:id/variants
// Body: { color: { name, hex }, size, stock? }
export const addVariant = asyncHandler(async (req, res) => {
  const { color, size, stock } = req.body;

  // ── Input guard ────────────────────────────────────────────────────────────
  if (!color?.name || !color?.hex || !size) {
    return res.status(400).json({
      success: false,
      message: 'color.name, color.hex, and size are required',
    });
  }

  const product = await AdminProduct.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // ── Duplicate guard — prevent same color+size combo ────────────────────────
  const duplicate = product.variants.find(
    (v) =>
      v.color.name.toLowerCase() === color.name.toLowerCase() &&
      v.size.toLowerCase() === size.toLowerCase()
  );
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: `Variant "${color.name} / ${size}" already exists. Use the update endpoint instead.`,
    });
  }

  product.variants.push({ color, size, stock: stock || 0 });
  // pre-save hook recalculates total stock automatically
  await product.save();

  res.status(200).json({ success: true, data: product });
});

// ─── UPDATE SINGLE VARIANT STOCK ─────────────────────────────────────────────
// PATCH /api/admin/products/:id/variants/:variantId
// Body: { stock } — update stock for one specific variant
export const updateVariantStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;

  if (stock === undefined || stock < 0) {
    return res.status(400).json({
      success: false,
      message: 'stock is required and must be >= 0',
    });
  }

  const product = await AdminProduct.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // ── Find the variant by its _id ────────────────────────────────────────────
  const variant = product.variants.id(req.params.variantId);
  if (!variant) {
    return res.status(404).json({ success: false, message: 'Variant not found' });
  }

  variant.stock = stock;
  // pre-save hook recalculates total stock automatically
  await product.save();

  res.status(200).json({
    success: true,
    message: `Stock updated for ${variant.color.name} / ${variant.size}`,
    totalStock: product.stock,
    data: product,
  });
});

// ─── REMOVE VARIANT ───────────────────────────────────────────────────────────
// DELETE /api/admin/products/:id/variants/:variantId
export const removeVariant = asyncHandler(async (req, res) => {
  const product = await AdminProduct.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const variantExists = product.variants.id(req.params.variantId);
  if (!variantExists) {
    return res.status(404).json({ success: false, message: 'Variant not found' });
  }

  product.variants = product.variants.filter(
    (v) => v._id.toString() !== req.params.variantId
  );
  // pre-save hook recalculates total stock automatically
  await product.save();

  res.status(200).json({ success: true, data: product });
});

// ─── DELETE (soft) ────────────────────────────────────────────────────────────
// DELETE /api/admin/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await AdminProduct.findById(req.params.id);

  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    id: req.params.id,
  });
});

// ─── GET LEADERBOARD (CMS ANALYTICS) ──────────────────────────────────────────
// GET /api/admin/products/leaderboard/:category
export const getProductLeaderboard = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const leaderboard = await AdminProduct.aggregate([
    { $match: { category: category, isActive: true } },
    { $sort: { 'ratings.average': -1, 'ratings.count': -1 } },
    {
      $project: {
        name: 1,
        image: 1,
        price: 1,
        stock: 1,
        'ratings.average': 1,
        'ratings.count': 1,
      },
    },
    { $limit: 10 },
  ]);

  res.status(200).json({ success: true, data: leaderboard });
});

// ─── SUBMIT REVIEW & UPDATE RATING ───────────────────────────────────────────
// POST /api/admin/products/:id/review
export const addProductReview = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5',
    });
  }

  const product = await AdminProduct.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const currentTotalPoints = product.ratings.average * product.ratings.count;
  product.ratings.count += 1;
  product.ratings.average = (currentTotalPoints + rating) / product.ratings.count;
  product.ratings.stars[rating] = (product.ratings.stars[rating] || 0) + 1;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Rating submitted',
    average: product.ratings.average,
  });
});