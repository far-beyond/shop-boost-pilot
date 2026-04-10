import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";
import { saveOrder, type OrderRecord } from "./orderHistoryService";

const BLUE: [number, number, number] = [41, 121, 255];
const DARK: [number, number, number] = [30, 30, 50];
const GRAY: [number, number, number] = [120, 130, 145];
const LIGHT_BG: [number, number, number] = [245, 248, 255];

export type FlyerOrderData = {
  // 発注元（ユーザー）
  clientCompany: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  // 発注先（ポスティング会社）
  vendorCompany: string;
  vendorEmail: string;
  // 発注内容
  orderDate: string;
  deliveryDate: string;
  areas: {
    areaName: string;
    households: number;
    quantity: number;
    priority: string;
  }[];
  totalQuantity: number;
  paperSize: string;
  paperType: string;
  colorMode: string;
  // コスト
  printingCostPerUnit: number;
  distributionCostPerUnit: number;
  totalCost: number;
  // 備考
  notes: string;
  // 店舗情報
  storeName: string;
  storeAddress: string;
  industry: string;
};

function drawLine(doc: jsPDF, y: number) {
  const w = doc.internal.pageSize.getWidth();
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(14, y, w - 14, y);
}

export async function exportFlyerOrderPDF(order: FlyerOrderData): Promise<Blob> {
  try {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(doc);
  const pageW = doc.internal.pageSize.getWidth();

  // === Title ===
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text("発 注 書", pageW / 2, 25, { align: "center" });

  drawLine(doc, 32);

  // === Order number & date ===
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const orderNo = `MB-${Date.now().toString(36).toUpperCase()}`;
  doc.text(`発注番号: ${orderNo}`, 14, 40);
  doc.text(`発注日: ${order.orderDate}`, pageW - 14, 40, { align: "right" });

  // === Vendor (left) / Client (right) ===
  let y = 52;
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(`${order.vendorCompany} 御中`, 14, y);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  y += 14;

  // Client info (right side)
  const rightX = pageW - 14;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(order.clientCompany, rightX, 52, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`担当: ${order.clientName}`, rightX, 59, { align: "right" });
  doc.text(`TEL: ${order.clientPhone}`, rightX, 65, { align: "right" });
  doc.text(`Email: ${order.clientEmail}`, rightX, 71, { align: "right" });

  // === Subject ===
  y = 82;
  drawLine(doc, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(`件名: ${order.storeName} チラシ配布業務のご依頼`, 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`対象店舗: ${order.storeName}（${order.industry}）`, 14, y);
  y += 5;
  doc.text(`所在地: ${order.storeAddress}`, 14, y);
  y += 5;
  doc.text(`希望納期: ${order.deliveryDate}`, 14, y);
  y += 10;

  // === Distribution Areas Table ===
  doc.setFillColor(...BLUE);
  doc.roundedRect(14, y - 5, 4, 16, 2, 2, "F");
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text("配布エリア明細", 22, y + 4);
  y += 14;

  autoTable(doc, {
    startY: y,
    head: [["No.", "配布エリア", "優先度", "推定世帯数", "配布部数"]],
    body: order.areas.map((a, i) => [
      String(i + 1),
      a.areaName,
      a.priority,
      a.households.toLocaleString(),
      a.quantity.toLocaleString(),
    ]),
    foot: [["", "", "", "合計", order.totalQuantity.toLocaleString()]],
    styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
    footStyles: { fillColor: [230, 235, 245], font: "NotoSansJP", textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // === Spec & Cost ===
  doc.setFillColor(...BLUE);
  doc.roundedRect(14, y - 5, 4, 16, 2, 2, "F");
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text("仕様・費用", 22, y + 4);
  y += 16;

  const specs = [
    ["用紙サイズ", order.paperSize],
    ["用紙種類", order.paperType],
    ["カラー", order.colorMode],
    ["印刷単価", `¥${order.printingCostPerUnit}/枚`],
    ["配布単価", `¥${order.distributionCostPerUnit}/枚`],
    ["合計部数", `${order.totalQuantity.toLocaleString()}部`],
  ];

  autoTable(doc, {
    startY: y,
    body: specs,
    styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 40, fillColor: LIGHT_BG, font: "NotoSansJP" },
      1: { cellWidth: 120, font: "NotoSansJP" },
    },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Total cost box
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(pageW - 100, y, 86, 22, 3, 3, "F");
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageW - 100, y, 86, 22, 3, 3, "S");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text("合計金額（税別）", pageW - 96, y + 8);
  doc.setFontSize(14);
  doc.setTextColor(...BLUE);
  doc.text(`¥${order.totalCost.toLocaleString()}`, pageW - 96, y + 18);
  y += 32;

  // === Notes ===
  if (order.notes) {
    if (y + 40 > 275) { doc.addPage(); y = 20; }
    doc.setFillColor(...BLUE);
    doc.roundedRect(14, y - 5, 4, 16, 2, 2, "F");
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text("備考", 22, y + 4);
    y += 16;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    const noteLines = doc.splitTextToSize(order.notes, 170);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 8;
  }

  // === Stamp area ===
  if (y + 50 > 275) { doc.addPage(); y = 20; }
  y += 10;
  drawLine(doc, y);
  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("承認欄", 14, y);
  // Draw stamp boxes
  for (let i = 0; i < 3; i++) {
    const bx = pageW - 30 - i * 32;
    doc.setDrawColor(180, 180, 190);
    doc.setLineWidth(0.3);
    doc.rect(bx, y - 5, 28, 28);
    const labels = ["担当", "確認", "承認"];
    doc.setFontSize(7);
    doc.text(labels[2 - i], bx + 14, y - 7, { align: "center" });
  }

  // === Footer ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`MapBoost AI 発注書  |  ${orderNo}  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  const fileName = `${order.storeName}_発注書_${order.orderDate}.pdf`;
  savePdf(doc, fileName);

  // Save to order history
  const historyOrder: OrderRecord = {
    id: `flyer-${Date.now()}`,
    orderNumber: orderNo,
    date: order.orderDate,
    type: "flyer",
    storeName: order.storeName,
    totalCost: order.totalCost,
    status: "completed",
    areas: order.areas.map((a) => ({ areaName: a.areaName, quantity: a.quantity, priority: a.priority })),
    mediaIncluded: ["チラシ配布"],
    quantities: { total: order.totalQuantity },
    costs: { printing: order.printingCostPerUnit * order.totalQuantity, distribution: order.distributionCostPerUnit * order.totalQuantity, total: order.totalCost },
    clientCompany: order.clientCompany,
    vendorCompany: order.vendorCompany,
    notes: order.notes,
  };
  saveOrder(historyOrder);

  // Also return as Blob for email attachment
  return doc.output("blob");
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
