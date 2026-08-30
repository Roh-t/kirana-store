import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadOrderPdf = (order, store) => {
  const doc = new jsPDF();

  // Header Green Banner
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(store?.name || 'Kirana Store', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ph: ${store?.phone || ''} | GSTIN: ${store?.taxConfig?.gstin || 'N/A'}`, 14, 24);

  // Order Details
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Order #: ${order.orderNumber}`, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 38);
  doc.text(`Status: ${order.orderStatus}`, 140, 44);

  // Customer Details Box
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 50, 182, 20, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.text(`Customer: ${order.customerDetails?.name || ''} (${order.customerDetails?.phone || ''})`, 18, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fulfillment: ${order.orderType} ${order.customerDetails?.deliveryAddress ? '• ' + order.customerDetails.deliveryAddress : ''}`, 18, 64);

  // Items Table
  const tableRows = order.items.map((item, index) => [
    index + 1,
    item.nameSnapshot,
    item.unitSnapshot,
    `Rs. ${item.sellingPriceSnapshot}`,
    item.quantity,
    `Rs. ${item.lineGrandTotal}`
  ]);

  autoTable(doc, {
    startY: 76,
    head: [['#', 'Item Name', 'Unit', 'Price', 'Qty', 'Total']],
    body: tableRows,
    headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3.5 }
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Grand Total Summary Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(120, finalY, 76, 16, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text(`Grand Total: Rs. ${order.grandTotal}`, 125, finalY + 11);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for ordering with us!', 105, finalY + 28, { align: 'center' });
  doc.text('Official Digital Bill powered by KiranaFlow SaaS', 105, finalY + 33, { align: 'center' });

  // Native Direct PDF Download
  doc.save(`${order.orderNumber}.pdf`);
};