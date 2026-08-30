export const downloadOrderPdf = async (order, store) => {
  // 1. Dynamically load html2pdf.js library if not present
  if (!window.html2pdf) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  // 2. Build off-screen HTML receipt
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.width = '550px';

  element.innerHTML = `
    <div style="border: 2px solid #16a34a; padding: 20px; border-radius: 12px; background: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
        <div>
          <h1 style="color: #15803d; margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase;">${store?.name || 'Kirana Store'}</h1>
          <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 11px;">${store?.address?.street || ''}, ${store?.address?.city || ''}</p>
          <p style="margin: 2px 0 0 0; color: #4b5563; font-size: 11px;">Ph: ${store?.phone || ''}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #111827; font-size: 15px; font-weight: 900;">${order.orderNumber}</h2>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 10px;">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <span style="display: inline-block; margin-top: 4px; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">${order.orderStatus}</span>
        </div>
      </div>

      <div style="margin-top: 12px; background: #f9fafb; padding: 10px; border-radius: 8px; font-size: 11px;">
        <p style="margin: 0; font-weight: bold; color: #1f2937;">Customer: ${order.customerDetails?.name || ''} (${order.customerDetails?.phone || ''})</p>
        <p style="margin: 4px 0 0 0; color: #4b5563;">Fulfillment: <strong>${order.orderType}</strong> ${order.customerDetails?.deliveryAddress ? '• ' + order.customerDetails.deliveryAddress : ''}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">
        <thead>
          <tr style="background: #f3f4f6; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 8px;">Item Name</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
            .map(
              (item) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 8px; font-weight: bold;">${item.nameSnapshot}<br/><span style="font-size: 9px; color: #9ca3af; font-weight: normal;">${item.unitSnapshot}</span></td>
              <td style="padding: 8px; text-align: center; font-weight: bold;">${item.quantity}</td>
              <td style="padding: 8px; text-align: right; color: #6b7280;">₹${item.sellingPriceSnapshot}</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; color: #111827;">₹${item.lineGrandTotal}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div style="margin-top: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #4b5563;">
          <span>Subtotal:</span> <span>₹${order.subTotal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #15803d; margin-top: 4px; border-top: 1px solid #bbf7d0; padding-top: 4px;">
          <span>Grand Total Payable:</span> <span>₹${order.grandTotal}</span>
        </div>
      </div>

      <div style="margin-top: 15px; text-align: center; color: #9ca3af; font-size: 9px; border-top: 1px dashed #e5e7eb; padding-top: 8px;">
        <p style="margin: 0; font-weight: bold; color: #4b5563;">Thank you for ordering with us!</p>
        <p style="margin: 2px 0 0 0;">Official Digital Bill powered by KiranaFlow SaaS</p>
      </div>
    </div>
  `;

  const options = {
    margin: 8,
    filename: `${order.orderNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // 3. Generate and download PDF directly to user's device
  await window.html2pdf().set(options).from(element).save();
};