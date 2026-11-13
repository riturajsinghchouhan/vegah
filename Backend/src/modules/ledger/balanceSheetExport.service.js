import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';
import { getBalanceSheet } from './reports.service.js';

const inr = (n) => `Rs ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/** Streams the balance sheet as a one-page A4 PDF, in the traditional two-column layout. */
export const streamBalanceSheetPdf = async (query, res) => {
  const sheet = await getBalanceSheet(query);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="balance-sheet-${fmtDate(sheet.asOf).replace(/\s+/g, '-')}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).font('Helvetica-Bold').text('VEGAH EV RENTALS', { align: 'center' });
  doc.fontSize(12).text('BALANCE SHEET', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#555').text(`As at ${fmtDate(sheet.asOf)}`, { align: 'center' });
  doc.moveDown(1.5);

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const colWidth = (right - left - 20) / 2;
  const leftColX = left;
  const rightColX = left + colWidth + 20;

  const renderColumn = (x, title, groups, total, totalLabel) => {
    let y = doc.y;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000').text(title, x, y, { width: colWidth });
    y = doc.y + 6;
    doc.moveTo(x, y).lineTo(x + colWidth, y).strokeColor('#000').lineWidth(1).stroke();
    y += 8;

    groups.forEach((row) => {
      doc.font('Helvetica').fontSize(9).fillColor('#333');
      doc.text(row.name, x, y, { width: colWidth - 70 });
      doc.text(inr(row.amount), x + colWidth - 70, y, { width: 70, align: 'right' });
      y += 16;
    });

    doc.moveTo(x, y).lineTo(x + colWidth, y).strokeColor('#ccc').lineWidth(0.5).stroke();
    y += 6;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000');
    doc.text(totalLabel, x, y, { width: colWidth - 70 });
    doc.text(inr(total), x + colWidth - 70, y, { width: 70, align: 'right' });
    y += 20;
    return y;
  };

  const topY = doc.y;
  const leftBottom = renderColumn(leftColX, 'LIABILITIES & EQUITY', [...sheet.liabilities, ...sheet.equity], sheet.totals.liabilitiesAndEquity, 'Total');
  doc.y = topY;
  const rightBottom = renderColumn(rightColX, 'ASSETS', sheet.assets, sheet.totals.assets, 'Total');

  doc.y = Math.max(leftBottom, rightBottom) + 20;
  doc.font('Helvetica').fontSize(9).fillColor(sheet.totals.balanced ? '#166534' : '#b91c1c')
    .text(
      sheet.totals.balanced
        ? 'Total assets equal total liabilities and equity.'
        : `Does not balance — off by ${inr(sheet.totals.difference)}.`,
      left, doc.y, { width: right - left, align: 'center' }
    );

  doc.moveDown(4);
  doc.font('Helvetica').fontSize(9).fillColor('#888')
    .text('Authorized Signatory', right - 160, doc.y, { width: 160, align: 'center' });
  doc.moveTo(right - 160, doc.y - 4).lineTo(right, doc.y - 4).strokeColor('#999').lineWidth(0.5).stroke();

  doc.end();
};

/** Builds the balance sheet as an .xlsx workbook, same groupings as the PDF. */
export const buildBalanceSheetExcel = async (query) => {
  const sheet = await getBalanceSheet(query);
  const rows = [
    ['BALANCE SHEET'],
    [`As at ${fmtDate(sheet.asOf)}`],
    [],
    ['LIABILITIES & EQUITY', '', 'ASSETS', ''],
  ];

  const leqRows = [...sheet.liabilities, ...sheet.equity];
  const maxRows = Math.max(leqRows.length, sheet.assets.length);
  for (let i = 0; i < maxRows; i += 1) {
    const l = leqRows[i];
    const a = sheet.assets[i];
    rows.push([l ? l.name : '', l ? l.amount : '', a ? a.name : '', a ? a.amount : '']);
  }
  rows.push([]);
  rows.push(['Total Liabilities & Equity', sheet.totals.liabilitiesAndEquity, 'Total Assets', sheet.totals.assets]);
  rows.push([]);
  rows.push(['Balanced', sheet.totals.balanced ? 'Yes' : `No — off by ${sheet.totals.difference}`]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 32 }, { wch: 16 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Sheet');

  return {
    filename: `balance-sheet-${new Date(sheet.asOf).toISOString().slice(0, 10)}.xlsx`,
    buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  };
};
