// controllers/cartController.js
import Cart    from '../models/cart.js';
import mongoose from 'mongoose';

// ─── POST /api/cart/add ───────────────────────────────────────────────────────
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, name, price, image, quantity = 1, discount } = req.body;

    if (!productId || !name || !price || !image) {
      return res.status(400).json({ success: false, message: 'productId, name, price, image are required' });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, name, price, image, quantity, discount }],
      });
    } else {
      // ✅ increment quantity if item already exists
      const existing = cart.items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({ productId, name, price, image, quantity, discount });
      }
    }

    await cart.save();
    res.status(200).json({ success: true, message: 'Item added to cart', items: cart.items, totalPrice: cart.totalPrice });
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET /api/cart/showcart?userId=xxx ────────────────────────────────────────
export const getCart = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!cart) return res.status(200).json({ success: true, items: [], totalPrice: 0 });

    res.status(200).json({ success: true, items: cart.items, totalPrice: cart.totalPrice });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── PUT /api/cart/update/:userId/:id ────────────────────────────────────────
export const updateCartItem = async (req, res) => {
  const { userId, id } = req.params;
  const { quantity }   = req.body;

  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
  if (!id)     return res.status(400).json({ success: false, message: 'itemId is required' });
  if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'quantity must be >= 1' });

  try {
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.id(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.quantity   = quantity;
    item.totalPrice = (item.price || 0) * quantity;

    await cart.save();

    res.status(200).json({
      success:    true,
      message:    'Cart updated successfully',
      item,
      cartTotal:  cart.totalPrice,
      items:      cart.items,
    });
  } catch (error) {
    console.error('updateCartItem error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── DELETE /api/cart/delete/:userId/:id ─────────────────────────────────────
export const deleteCartItem = async (req, res) => {
  const { userId, id } = req.params;

  if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
  if (!id)     return res.status(400).json({ success: false, message: 'itemId is required' });

  try {
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === id);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not found in cart' });

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.status(200).json({ success: true, message: 'Item deleted successfully', items: cart.items, totalPrice: cart.totalPrice });
  } catch (error) {
    console.error('deleteCartItem error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── DELETE /api/cart/clear/:userId ──────────────────────────────────────────
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });

    await Cart.deleteMany({ userId });

    res.status(200).json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('clearCart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};