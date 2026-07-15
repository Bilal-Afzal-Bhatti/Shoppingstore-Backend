// routes/cartRoutes.js
import express        from 'express';
import { requireLogin } from '../middlewares/authMiddleware.js';
import userAuth       from '../middlewares/userAuth.js';
import {
  addToCart,
  getCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from '../controllers/cartController.js';

const router = express.Router();

router.post(  '/add',                requireLogin, addToCart);      // POST   /api/cart/add
router.get(   '/showcart',           getCart);                      // GET    /api/cart/showcart?userId=
router.put(   '/update/:userId/:id', userAuth,     updateCartItem); // PUT    /api/cart/update/:userId/:id
router.delete('/delete/:userId/:id', userAuth,     deleteCartItem); // DELETE /api/cart/delete/:userId/:id
router.delete('/clear/:userId',      userAuth,     clearCart);      // DELETE /api/cart/clear/:userId

export default router;