// Builds a wa.me deep link to notify the STORE OWNER about a new customer order.
// No WhatsApp Business API / credentials required — this simply opens WhatsApp
// (app or web) with a pre-filled message; the customer just needs to tap Send.

const cleanPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // Indian 10-digit numbers need the country code prefixed
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const buildOwnerNewOrderWhatsAppLink = (ownerPhone, order, customerDetails) => {
  const waPhone = cleanPhoneForWhatsApp(ownerPhone);
  if (!waPhone) return null;

  const itemsText = (order.items || [])
    .map((item) => `- ${item.quantity} x ${item.nameSnapshot} (${item.unitSnapshot})`)
    .join('\n');

  const text =
    `🛒 *New Order Received!*\n\n` +
    `Order No: *${order.orderNumber}*\n` +
    `Customer: *${customerDetails.name}*\n` +
    `Mobile: *${customerDetails.phone}*\n` +
    `Fulfillment: *${order.orderType}*\n\n` +
    `Items:\n${itemsText}\n\n` +
    `Grand Total: *₹${order.grandTotal}*`;

  return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
};
