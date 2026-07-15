// utils/sendOrderEmail.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

export const sendOrderConfirmationEmail = async (order) => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
        <img src="${item.image}" width="60" height="60" 
             style="object-fit:contain;border-radius:8px;background:#f9f9f9;" />
      </td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;font-family:sans-serif;">
        <strong>${item.name}</strong><br/>
        <span style="color:#888;font-size:12px;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding:12px;border-bottom:1px solid #f0f0f0;font-family:sans-serif;text-align:right;">
        <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" 
                   style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#000;padding:32px 40px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;">EXCLUSIVE</h1>
                  <p style="color:#888;margin:8px 0 0;font-size:13px;letter-spacing:1px;">ORDER CONFIRMED</p>
                </td>
              </tr>

              <!-- Thank you message -->
              <tr>
                <td style="padding:32px 40px;border-bottom:1px solid #f0f0f0;">
                  <h2 style="margin:0 0 8px;font-size:20px;">
                    Thank you, ${order.billingInfo.name}! 🎉
                  </h2>
                  <p style="color:#666;margin:0;font-size:14px;line-height:1.6;">
                    Your order has been confirmed and is now being processed. 
                    We'll notify you when it ships.
                  </p>
                </td>
              </tr>

              <!-- Order ID + Status -->
              <tr>
                <td style="padding:24px 40px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
                  <table width="100%">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                          Order ID
                        </p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:900;letter-spacing:2px;color:#000;">
                          ${order.orderId}
                        </p>
                      </td>
                      <td style="text-align:right;">
                        <p style="margin:0;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                          Status
                        </p>
                        <span style="display:inline-block;margin-top:4px;background:#000;color:#fff;
                                     padding:4px 14px;border-radius:20px;font-size:11px;
                                     font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                          ${order.orderStatus}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:16px;">
                        <p style="margin:0;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                          Payment Method
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#000;text-transform:uppercase;">
                          ${order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                        </p>
                      </td>
                      <td style="text-align:right;padding-top:16px;">
                        <p style="margin:0;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                          Order Date
                        </p>
                        <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#000;">
                          ${new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items -->
              <tr>
                <td style="padding:24px 40px;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 16px;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                    Items Ordered
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${itemsHTML}
                  </table>
                </td>
              </tr>

              <!-- Order Total -->
              <tr>
                <td style="padding:24px 40px;border-bottom:1px solid #f0f0f0;">
                  <table width="100%">
                    <tr>
                      <td style="font-size:13px;color:#666;">Subtotal</td>
                      <td style="text-align:right;font-size:13px;color:#666;">
                        $${order.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#22c55e;padding-top:8px;">Shipping</td>
                      <td style="text-align:right;font-size:13px;color:#22c55e;padding-top:8px;">
                        Free
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:20px;font-weight:900;padding-top:16px;">Total</td>
                      <td style="text-align:right;font-size:20px;font-weight:900;padding-top:16px;">
                        $${order.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Shipping Address -->
              <tr>
                <td style="padding:24px 40px;border-bottom:1px solid #f0f0f0;background:#fafafa;">
                  <p style="margin:0 0 12px;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                    Shipping To
                  </p>
                  <p style="margin:0;font-size:14px;font-weight:700;color:#000;">
                    ${order.billingInfo.name}
                  </p>
                  <p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.6;">
                    ${order.billingInfo.address}
                    ${order.billingInfo.apartment ? `, ${order.billingInfo.apartment}` : ''}<br/>
                    ${order.billingInfo.city}, ${order.billingInfo.zipcode}<br/>
                    📞 ${order.billingInfo.phone}
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:32px 40px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#999;line-height:1.8;">
                    Questions? Contact us at 
                    <a href="mailto:${process.env.EMAIL_USER}" 
                       style="color:#000;font-weight:700;">
                      ${process.env.EMAIL_USER}
                    </a>
                  </p>
                  <p style="margin:16px 0 0;font-size:11px;color:#ccc;">
                    © ${new Date().getFullYear()} EXCLUSIVE. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"EXCLUSIVE" <${process.env.EMAIL_USER}>`,
    to:      order.billingInfo.email,
    subject: `Order Confirmed — ${order.orderId} 🎉`,
    html,
  });
};
// utils/sendOrderEmail.js — add these two functions

export const sendShippedEmail = async (order) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#000;padding:32px 40px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;">EXCLUSIVE</h1>
                  <p style="color:#888;margin:8px 0 0;font-size:13px;letter-spacing:1px;">
                    YOUR ORDER IS ON THE WAY
                  </p>
                </td>
              </tr>

              <!-- Truck animation row -->
              <tr>
                <td style="padding:40px;text-align:center;border-bottom:1px solid #f0f0f0;">
                  <div style="font-size:64px;">🚚</div>
                  <h2 style="margin:16px 0 8px;font-size:24px;font-weight:900;">
                    Your order has shipped!
                  </h2>
                  <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
                    Great news, ${order.billingInfo.name}! Your order is on its way.
                  </p>
                </td>
              </tr>

              <!-- Order ID -->
              <tr>
                <td style="padding:24px 40px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
                  <table width="100%">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                          Order ID
                        </p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:900;letter-spacing:2px;">
                          ${order.orderId}
                        </p>
                      </td>
                      <td style="text-align:right;">
                        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;
                                     padding:6px 16px;border-radius:20px;font-size:12px;
                                     font-weight:700;letter-spacing:1px;border:1px solid #bbf7d0;">
                          🚚 SHIPPED
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items -->
              <tr>
                <td style="padding:24px 40px;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 16px;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                    Items in Shipment
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${order.items.map(item => `
                      <tr>
                        <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
                          <img src="${item.image}" width="60" height="60"
                               style="object-fit:contain;border-radius:8px;background:#f9f9f9;" />
                        </td>
                        <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
                          <strong>${item.name}</strong><br/>
                          <span style="color:#888;font-size:12px;">Qty: ${item.quantity}</span>
                        </td>
                        <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">
                          <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                </td>
              </tr>

              <!-- Delivery Address -->
              <tr>
                <td style="padding:24px 40px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 12px;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                    Delivering To
                  </p>
                  <p style="margin:0;font-size:14px;font-weight:700;">${order.billingInfo.name}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#666;line-height:1.6;">
                    ${order.billingInfo.address}
                    ${order.billingInfo.apartment ? `, ${order.billingInfo.apartment}` : ''}<br/>
                    ${order.billingInfo.city}, ${order.billingInfo.zipcode}<br/>
                    📞 ${order.billingInfo.phone}
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:32px 40px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#999;line-height:1.8;">
                    Questions? Contact us at
                    <a href="mailto:${process.env.EMAIL_USER}"
                       style="color:#000;font-weight:700;">${process.env.EMAIL_USER}</a>
                  </p>
                  <p style="margin:16px 0 0;font-size:11px;color:#ccc;">
                    © ${new Date().getFullYear()} EXCLUSIVE. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"EXCLUSIVE" <${process.env.EMAIL_USER}>`,
    to:      order.billingInfo.email,
    subject: `Your order ${order.orderId} has shipped! 🚚`,
    html,
  });
};

export const sendDeliveredEmail = async (order) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:#000;padding:32px 40px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px;">EXCLUSIVE</h1>
                  <p style="color:#888;margin:8px 0 0;font-size:13px;letter-spacing:1px;">
                    ORDER DELIVERED
                  </p>
                </td>
              </tr>

              <!-- Delivered banner -->
              <tr>
                <td style="padding:40px;text-align:center;border-bottom:1px solid #f0f0f0;background:#f0fdf4;">
                  <div style="font-size:64px;">✅</div>
                  <h2 style="margin:16px 0 8px;font-size:24px;font-weight:900;color:#15803d;">
                    Delivered Successfully!
                  </h2>
                  <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
                    Hey ${order.billingInfo.name}, your order has been delivered.<br/>
                    We hope you love your purchase!
                  </p>
                </td>
              </tr>

              <!-- Order ID + Date -->
              <tr>
                <td style="padding:24px 40px;background:#fafafa;border-bottom:1px solid #f0f0f0;">
                  <table width="100%">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                          Order ID
                        </p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:900;letter-spacing:2px;">
                          ${order.orderId}
                        </p>
                      </td>
                      <td style="text-align:right;">
                        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;
                                     padding:6px 16px;border-radius:20px;font-size:12px;
                                     font-weight:700;letter-spacing:1px;border:1px solid #bbf7d0;">
                          ✅ DELIVERED
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items -->
              <tr>
                <td style="padding:24px 40px;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 16px;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;">
                    Items Delivered
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${order.items.map(item => `
                      <tr>
                        <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
                          <img src="${item.image}" width="60" height="60"
                               style="object-fit:contain;border-radius:8px;background:#f9f9f9;" />
                        </td>
                        <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
                          <strong>${item.name}</strong><br/>
                          <span style="color:#888;font-size:12px;">Qty: ${item.quantity}</span>
                        </td>
                        <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;">
                          <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                        </td>
                      </tr>
                    `).join('')}
                  </table>
                </td>
              </tr>

              <!-- Total -->
              <tr>
                <td style="padding:24px 40px;border-bottom:1px solid #f0f0f0;">
                  <table width="100%">
                    <tr>
                      <td style="font-size:20px;font-weight:900;">Total Paid</td>
                      <td style="text-align:right;font-size:20px;font-weight:900;">
                        $${order.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Rate us CTA -->
              <tr>
                <td style="padding:32px 40px;text-align:center;border-bottom:1px solid #f0f0f0;">
                  <p style="margin:0 0 16px;font-size:14px;color:#666;">
                    Enjoying your purchase? Leave us a review!
                  </p>
                  <a href="${process.env.FRONTEND_URL}"
                     style="display:inline-block;background:#000;color:#fff;
                            padding:14px 32px;border-radius:12px;font-weight:900;
                            font-size:13px;letter-spacing:1px;text-decoration:none;">
                    SHOP AGAIN
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:32px 40px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#999;line-height:1.8;">
                    Questions? Contact us at
                    <a href="mailto:${process.env.EMAIL_USER}"
                       style="color:#000;font-weight:700;">${process.env.EMAIL_USER}</a>
                  </p>
                  <p style="margin:16px 0 0;font-size:11px;color:#ccc;">
                    © ${new Date().getFullYear()} EXCLUSIVE. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"EXCLUSIVE" <${process.env.EMAIL_USER}>`,
    to:      order.billingInfo.email,
    subject: `Your order ${order.orderId} has been delivered! ✅`,
    html,
  });
};