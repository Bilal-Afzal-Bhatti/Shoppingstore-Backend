// controllers/chatbotController.js
import asyncHandler from '../utils/asyncHandler.js';
import AdminProduct from '../models/adminProductModel.js';
import Order        from '../models/order.js';

// ─── Intent detector ──────────────────────────────────────────────────────────
const detectIntent = (message) => {
  const msg = message.toLowerCase();
  if (msg.match(/hi|hello|hey|sup|greet/))                          return 'greeting';
  if (msg.match(/order|track|status|where.*order|my order/))        return 'order_status';
  if (msg.match(/product|show|find|search|looking|want|buy/))       return 'product_search';
  if (msg.match(/price|cost|how much|expensive|cheap/))             return 'price_query';
  if (msg.match(/cancel|cancellation/))                             return 'cancellation';
  if (msg.match(/return|refund|exchange/))                          return 'return_policy';
  if (msg.match(/shipping|delivery|deliver|how long|when/))         return 'shipping_info';
  if (msg.match(/payment|pay|stripe|card|cod|cash/))                return 'payment_info';
  if (msg.match(/discount|offer|sale|promo|coupon/))                return 'discount_info';
  if (msg.match(/contact|support|help|human|agent/))                return 'human_support';
  if (msg.match(/bye|goodbye|thanks|thank you|exit/))               return 'farewell';
  return 'unknown';
};

// ─── Extract order ID from message ────────────────────────────────────────────
const extractOrderId = (message) => {
  const match = message.match(/#?([A-Z0-9]{6,})/i);
  return match ? match[1].toUpperCase() : null;
};

// ─── POST /api/chatbot/message ────────────────────────────────────────────────
export const handleMessage = asyncHandler(async (req, res) => {
  const { message, userId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const intent  = detectIntent(message);
  let   reply   = '';
  let   options = [];
  let   data    = null;

  switch (intent) {

    case 'greeting':
      reply   = "👋 Hi there! Welcome to **EXCLUSIVE**. I'm your shopping assistant. How can I help you today?";
      options = ['🛍️ Browse Products', '📦 Track Order', '🚚 Shipping Info', '💳 Payment Options'];
      break;

    case 'order_status': {
      const orderId = extractOrderId(message);
      if (orderId && userId) {
        const order = await Order.findOne({
          $or: [
            { orderId: { $regex: orderId, $options: 'i' } },
            { userId },
          ],
        }).sort({ createdAt: -1 });

        if (order) {
          const statusEmoji = {
            processing: '⏳', shipped: '🚚', delivered: '✅', cancelled: '❌'
          };
          reply = `${statusEmoji[order.orderStatus]} Your order **${order.orderId}** is currently **${order.orderStatus.toUpperCase()}**.\n\n💰 Total: $${order.totalPrice.toFixed(2)}\n📅 Placed: ${new Date(order.createdAt).toLocaleDateString()}`;
          data  = { type: 'order', order };
        } else {
          reply   = "🔍 I couldn't find that order. Please check your Order ID and try again.";
          options = ['📦 Track Another Order', '📞 Contact Support'];
        }
      } else if (userId) {
        const recentOrder = await Order.findOne({ userId }).sort({ createdAt: -1 });
        if (recentOrder) {
          const statusEmoji = {
            processing: '⏳', shipped: '🚚', delivered: '✅', cancelled: '❌'
          };
          reply = `${statusEmoji[recentOrder.orderStatus]} Your latest order **${recentOrder.orderId}** is **${recentOrder.orderStatus.toUpperCase()}**.\n\n💰 Total: $${recentOrder.totalPrice.toFixed(2)}`;
          data  = { type: 'order', order: recentOrder };
        } else {
          reply   = "📭 You don't have any orders yet. Start shopping!";
          options = ['🛍️ Browse Products'];
        }
      } else {
        reply   = "🔐 Please log in to track your order, or provide your **Order ID** (e.g. #AB12CD).";
        options = ['📦 Track by Order ID'];
      }
      break;
    }

    case 'product_search': {
      const keyword = message.replace(/product|show|find|search|looking|want|buy/gi, '').trim();
      const products = await AdminProduct.find({
        isActive: true,
        $or: [
          { name:     { $regex: keyword, $options: 'i' } },
          { category: { $regex: keyword, $options: 'i' } },
        ],
      }).limit(4).select('name price image category discount');

      if (products.length > 0) {
        reply = `🛍️ I found **${products.length}** product(s) for you:`;
        data  = { type: 'products', products };
      } else {
        reply   = "😔 No products found for that search. Try a different keyword!";
        options = ['👗 Clothing', '👟 Footwear', '📱 Electronics', '🏠 Home & Kitchen'];
      }
      break;
    }

    case 'price_query': {
      const keyword = message.replace(/price|cost|how much|expensive|cheap/gi, '').trim();
      if (keyword) {
        const product = await AdminProduct.findOne({
          isActive: true,
          name: { $regex: keyword, $options: 'i' },
        }).select('name price originalPrice discount');

        if (product) {
          reply = `💰 **${product.name}** costs **$${product.price}**`;
          if (product.originalPrice) reply += ` ~~$${product.originalPrice}~~`;
          if (product.discount && product.discount !== 'No Discount') reply += ` (${product.discount} OFF!)`;
        } else {
          reply   = "🔍 I couldn't find that product. Try searching by name!";
          options = ['🛍️ Browse Products'];
        }
      } else {
        reply   = "💬 Which product's price would you like to know?";
      }
      break;
    }

    case 'shipping_info':
      reply   = "🚚 **Shipping Information:**\n\n✅ Free shipping on all orders\n📦 Processing time: 1-2 business days\n🕐 Delivery time: 3-7 business days\n🌍 We ship nationwide";
      options = ['📦 Track My Order', '💳 Payment Options'];
      break;

    case 'payment_info':
      reply   = "💳 **Payment Options:**\n\n💳 Online Payment via Stripe (Visa, Mastercard)\n💵 Cash on Delivery (COD)\n🔒 All transactions are 100% secure";
      options = ['🛍️ Start Shopping', '🚚 Shipping Info'];
      break;

    case 'return_policy':
      reply   = "↩️ **Return & Refund Policy:**\n\n✅ 30-day return window\n📦 Item must be unused & in original packaging\n💰 Refund processed within 5-7 business days\n📧 Contact support to initiate a return";
      options = ['📞 Contact Support', '📦 Track Order'];
      break;

    case 'cancellation':
      reply   = "❌ **Order Cancellation:**\n\nOrders can be cancelled before shipping begins.\n\n📱 Go to **Order Tracking** → Click **Cancel Order**\n⚠️ Once shipped, cancellation is not possible";
      options = ['📦 Track My Order', '📞 Contact Support'];
      break;

    case 'discount_info': {
      const flashSales = await AdminProduct.find({
        isActive: true,
        category: { $regex: 'flash sales', $options: 'i' },
      }).limit(3).select('name price discount image');

      reply = "🔥 **Current Offers & Discounts:**\n\nCheck out our Flash Sales for the best deals!";
      if (flashSales.length > 0) {
        data = { type: 'products', products: flashSales };
      }
      options = ['🛍️ Browse Flash Sales', '👗 All Products'];
      break;
    }

    case 'human_support':
      reply   = "👨‍💼 **Contact Support:**\n\n📧 Email: support@exclusive.com\n⏰ Available: Mon-Fri, 9AM-6PM\n\nFor urgent issues, email us directly and we'll respond within 24 hours.";
      options = ['📦 Track Order', '↩️ Return Policy'];
      break;

    case 'farewell':
      reply   = "👋 Thank you for shopping with **EXCLUSIVE**! Have a wonderful day! 😊";
      options = ['🛍️ Continue Shopping'];
      break;

    default:
      reply   = "🤔 I'm not sure I understand. Could you rephrase that? Here's what I can help with:";
      options = ['📦 Track Order', '🛍️ Find Products', '🚚 Shipping Info', '💳 Payment Options', '📞 Contact Support'];
  }

  res.json({
    success: true,
    reply,
    options,
    data,
    intent,
  });
});