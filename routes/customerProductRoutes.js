// routes/customerProductRoutes.js
import express from 'express';
import {
  getProducts,
  getProductById,
  rateProduct,
} from '../controllers/customerProductController.js';

const router = express.Router();

// GET  /api/customer/products
router.get(  '/products',          getProducts);

// GET  /api/customer/products/:id
router.get(  '/products/:id',      getProductById);

// POST /api/customer/products/:id/rate
router.post( '/products/:id/rate', rateProduct);

export default router;