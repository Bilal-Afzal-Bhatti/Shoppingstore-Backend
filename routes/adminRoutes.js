// routes/adminRoutes.js
import express from 'express';
import { registerAdmin, loginAdmin, getAdminProfile } from '../controllers/adminController.js';
import { requireLogin } from '../middlewares/authMiddleware.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductLeaderboard,
  addProductReview,
  addVariant,
  updateVariantStock,
  removeVariant,
} from '../controllers/adminProductController.js';
import {
  getCustomers,
  getCustomerById,
  deleteCustomer,
} from '../controllers/adminCustomerController.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  getStoreSettings,
  updateStoreSettings,
  getNotificationSettings,
  updateNotificationSettings,
} from '../controllers/adminSettingsController.js';

import {
  getAllOrders,
  updateOrderStatus,
  getAllCancellations,
  processCancellation,
} from '../controllers/adminOrderController.js';
import {
  getDashboardStats,
  getDashboardChart,
  getDashboardRecentOrders,
} from '../controllers/adminDashboardController.js';
const router = express.Router();

// ─── Public routes (no auth) ──────────────────────────────────────────────────
router.post('/register', registerAdmin);
router.post('/login',    loginAdmin);
router.get( '/profile',  requireLogin, getAdminProfile);

// ─── Protected routes (auth required for everything below) ───────────────────
router.use(requireLogin);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get(   '/products',                         getProducts);
router.post(  '/products',                         createProduct);
router.get(   '/products/leaderboard/:category',   getProductLeaderboard); // ← before /:id
router.get(   '/products/:id',                     getProductById);
router.put(   '/products/:id',                     updateProduct);
router.delete('/products/:id',                     deleteProduct);

// ─── Variants ─────────────────────────────────────────────────────────────────
router.post(  '/products/:id/variants',                    addVariant);
router.patch( '/products/:id/variants/:variantId',         updateVariantStock);
router.delete('/products/:id/variants/:variantId',         removeVariant);

// ─── Reviews ──────────────────────────────────────────────────────────────────
router.post(  '/products/:id/review',              addProductReview);

// ─── Customers ────────────────────────────────────────────────────────────────
router.get(   '/customers',     getCustomers);
router.get(   '/customers/:id', getCustomerById);
router.delete('/customers/:id', deleteCustomer);

// ─── Settings ─────────────────────────────────────────────────────────────────
router.get('/settings/profile',         getProfile);
router.put('/settings/profile',         updateProfile);
router.put('/settings/password',        changePassword);
router.get('/settings/store',           getStoreSettings);
router.put('/settings/store',           updateStoreSettings);
router.get('/settings/notifications',   getNotificationSettings);
router.put('/settings/notifications',   updateNotificationSettings);




router.get(   '/orders',                        getAllOrders);
router.patch( '/orders/:id/status',             updateOrderStatus);
router.get(   '/orders/cancellations',          getAllCancellations);
router.patch( '/orders/cancellations/:id',      processCancellation);




router.get('/dashboard/stats',         getDashboardStats);
router.get('/dashboard/chart',         getDashboardChart);
router.get('/dashboard/recent-orders', getDashboardRecentOrders);

export default router;