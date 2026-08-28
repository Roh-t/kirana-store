export class WhatsAppUtil {
  static cleanPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `91${cleaned}`;
    return cleaned;
  }

  static buildOrderMessageLink(phone, storeName, orderNumber, status, grandTotal) {
    const waPhone = this.cleanPhoneForWhatsApp(phone);

    let text = `Namaste! Update regarding your order *${orderNumber}* at *${storeName}*:\n\n`;

    if (status === 'ACCEPTED') {
      text += `✅ Your order has been *ACCEPTED* and is being processed!\nTotal: *₹${grandTotal}*`;
    } else if (status === 'READY') {
      text += `🎉 Your order is *READY FOR PICKUP*!\nTotal Payable: *₹${grandTotal}*\nKindly collect at your convenience.`;
    } else if (status === 'COMPLETED') {
      text += `🙏 Thank you for shopping with us! Your order is *COMPLETED*. Total: *₹${grandTotal}*`;
    } else {
      text += `Order Status: *${status}*\nTotal: *₹${grandTotal}*`;
    }

    return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  }

  static buildUdharReminderLink(phone, customerName, storeName, udharBalance, upiId) {
    const waPhone = this.cleanPhoneForWhatsApp(phone);

    let text = `Namaste *${customerName}*,\n\nThis is a friendly reminder from *${storeName}* regarding your store credit balance: *₹${udharBalance}*.\n\n`;

    if (upiId) {
      text += `You can pay online via UPI to: *${upiId}*\n\n`;
    }

    text += `Thank you for your business! 🙏`;

    return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
  }
}