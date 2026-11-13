import PDFDocument from 'pdfkit';

const inr = (n) => `Rs ${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/**
 * Streams a one-page A4 invoice straight to the response. Both the admin's
 * billing screen and the rider's own booking share this renderer so the two
 * documents can never drift apart.
 */
export const streamInvoicePdf = (invoice, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${(invoice.invoiceId || 'invoice').replace(/[^\w.-]/g, '_')}.pdf"`
  );
  doc.pipe(res);

  doc.fontSize(22).text('INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#555')
    .text(invoice.invoiceId || '', { align: 'right' })
    .text(fmtDate(invoice.date), { align: 'right' });

  doc.moveDown(2).fillColor('#000').fontSize(16).text(invoice.brandName || 'Vegah EV Rentals');
  doc.fontSize(10).fillColor('#555').text('Battery swapping & EV rentals');

  doc.moveDown(1.5).fillColor('#000').fontSize(11).text('Billed to');
  doc.fontSize(10).fillColor('#333').text(invoice.customerName || 'Customer');
  if (invoice.customerPhone) doc.text(invoice.customerPhone);
  if (invoice.customerEmail) doc.text(invoice.customerEmail);

  doc.moveDown(1);
  if (invoice.bookingId) doc.fillColor('#555').text(`Booking: ${invoice.bookingId}`);
  if (invoice.vehicleName) doc.text(`Vehicle: ${invoice.vehicleName}${invoice.plateNumber ? ` (${invoice.plateNumber})` : ''}`);
  // Moves with the rental: an extension pushes the "to" date out.
  if (invoice.rentalFrom && invoice.rentalTo) {
    doc.text(
      `Rental period: ${fmtDate(invoice.rentalFrom)} to ${fmtDate(invoice.rentalTo)}`
      + (invoice.rentalDays ? ` (${invoice.rentalDays} ${invoice.rentalDays === 1 ? 'day' : 'days'})` : '')
    );
  }
  doc.text(`Payment: ${invoice.paymentMethod || '-'}`);
  doc.text(`Status: ${invoice.status || '-'}`);

  doc.moveDown(1.5);
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const row = (label, value, bold = false) => {
    const y = doc.y;
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor('#000');
    doc.text(label, left, y);
    doc.text(value, left, y, { width: right - left, align: 'right' });
    doc.moveDown(0.6);
  };

  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(0.8);

  // An extended rental bills as several lines (the original plan plus every
  // extension); anything without a breakdown still prints as one rental row.
  const lineItems = Array.isArray(invoice.lineItems) && invoice.lineItems.length
    ? invoice.lineItems
    : [{ label: 'Rental charges', amount: invoice.baseAmount }];
  lineItems.forEach((item) => row(item.label || 'Rental charges', inr(item.amount)));
  if (invoice.serviceFee) row('Service fee', inr(invoice.serviceFee));
  if (invoice.platformFee) row('Platform fee', inr(invoice.platformFee));
  row(`GST ${invoice.gstRate || ''}`.trim(), inr(invoice.taxAmount));

  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(0.8);
  row('Total', inr(invoice.totalAmount), true);

  doc.moveDown(3).font('Helvetica').fontSize(9).fillColor('#888')
    .text('This is a computer generated invoice and does not require a signature.', { align: 'center' });

  doc.end();
};
