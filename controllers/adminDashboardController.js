// controllers/adminDashboardController.js
import Order    from '../models/order.js';
import Cart     from '../models/cart.js';
import User     from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── GET STATS ─────────────────────────────────────────────────────────────────
export const getDashboardStats = asyncHandler(async (req, res) => {
  const now       = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue,     lastMonthRevenue,
    totalOrders,      lastMonthOrders,
    totalCustomers,   lastMonthCustomers,
    pendingOrders,
  ] = await Promise.all([
    // This month revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    // Last month revenue
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: lastMonth, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    // This month orders
    Order.countDocuments({ createdAt: { $gte: thisMonth } }),
    // Last month orders
    Order.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),
    // Total customers
    User.countDocuments({ createdAt: { $gte: thisMonth } }),
    // Last month customers
    User.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),
    // Pending orders
    Order.countDocuments({ orderStatus: 'processing' }),
  ]);

  const calcTrend = (current, previous) => {
    if (!previous) return '+100%';
    const diff = ((current - previous) / previous) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const thisRevenue = totalRevenue[0]?.total     || 0;
  const lastRevenue = lastMonthRevenue[0]?.total  || 0;

  res.json({
    success: true,
    data: {
      totalRevenue:    { value: thisRevenue,      trend: calcTrend(thisRevenue, lastRevenue) },
      totalOrders:     { value: totalOrders,      trend: calcTrend(totalOrders, lastMonthOrders) },
      newCustomers:    { value: totalCustomers,   trend: calcTrend(totalCustomers, lastMonthCustomers) },
      pendingOrders:   { value: pendingOrders,    trend: null },
    },
  });
});

// ── GET CHART DATA ────────────────────────────────────────────────────────────
export const getDashboardChart = asyncHandler(async (req, res) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now    = new Date();

  const chartData = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const d     = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      ]).then(result => ({
        name:   months[d.getMonth()],
        sales:  result[0]?.total || 0,
        orders: result[0]?.count || 0,
      }));
    })
  );

  res.json({ success: true, data: chartData });
});

// ── GET RECENT ORDERS ─────────────────────────────────────────────────────────
export const getDashboardRecentOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .select('orderId billingInfo totalPrice orderStatus paymentStatus createdAt items');

  res.json({ success: true, data: orders });
});