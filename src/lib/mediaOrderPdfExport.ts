import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";
import { saveOrder, type OrderRecord } from "./orderHistoryService";

const BLUE: [number, number, number] = [41, 121, 255];
const DARK: [number, number, number] = [30, 30, 50];
const GRAY: [number, number, number] = [120, 130, 145];
const LIGHT_BG: [number, number, number] = [245, 248, 255];
const PURPLE: [number, number, number] = [139, 92, 246];

function drawLine(doc: jsPDF, y: number) {
  const w = doc.internal.pageSize.getWidth();
  doc.setDrawColor(200, 200, 210);
  doc.setLineWidth(0.3);
  doc.line(14, y, w - 14, y);
}

function drawHeader(doc: jsPDF, title: string, y: number, color: [number, number, number] = BLUE): number {
  doc.setFillColor(...color);
  doc.roundedRect(14, y - 5, 4, 18, 2, 2, "F");
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(title, 22, y + 6);
  return y + 18;
}

function checkPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) { doc.addPage(); return 20; }
  return y;
}

export type MediaOrderData = {
  clientCompany: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  customerCompany: string;
  customerName: string;
  customerEmail: string;
  storeName: string;
  storeAddress: string;
  industry: string;
  startDate: string;
  contractMonths: number;
  managementFeeRate: number;
  targetAudience: string;
  notes: string;
  // Google
  includeGoogle: boolean;
  googleBudget: number;
  googleCampaignType: string;
  googleKeywords: string[];
  googleAdCopies: { headline: string; description: string }[];
  // Meta
  includeMeta: boolean;
  metaBudget: number;
  metaObjective: string;
  metaAudiences: { name: string; ageRange: string; interests: string[] }[];
  metaCreatives: { headline: string; description: string }[];
  // Flyer
  includeFlyer: boolean;
  flyerTotalQuantity: number;
  flyerTotalCost: number;
  flyerAreas: { areaName: string; quantity: number; priority: string }[];
  flyerTiming: string;
};

export async function exportMediaOrderPDF(order: MediaOrderData): Promise<Blob> {
  try {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const orderNo = `MP-${Date.now().toString(36).toUpperCase()}`;

  // === Title ===
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFontSize(20);
  doc.setTextColor(255);
  doc.text("統合媒体プラン 発注書", 14, 17);
  doc.setFontSize(10);
  doc.text("Google Ads + Meta Ads + Flyer Distribution", 14, 27);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`発注番号: ${orderNo}  |  発行日: ${new Date().toLocaleDateString("ja-JP")}`, 14, 46);

  // === Client / Customer ===
  let y = 56;
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(`${order.customerCompany || order.storeName} 様`, 14, y);
  if (order.customerName) {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`${order.customerName} 様`, 14, y + 7);
  }

  const rightX = pageW - 14;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(order.clientCompany, rightX, 56, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`担当: ${order.clientName}`, rightX, 63, { align: "right" });
  doc.text(`TEL: ${order.clientPhone} / ${order.clientEmail}`, rightX, 69, { align: "right" });

  // === Subject ===
  y = 80;
  drawLine(doc, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const mediaList: string[] = [];
  if (order.includeGoogle) mediaList.push("Google広告");
  if (order.includeMeta) mediaList.push("Meta広告");
  if (order.includeFlyer) mediaList.push("チラシ配布");
  doc.text(`件名: ${order.storeName} 統合販促プラン（${mediaList.join(" + ")}）`, 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`対象: ${order.storeName}（${order.industry}） / ${order.storeAddress}`, 14, y); y += 5;
  doc.text(`契約: ${order.startDate} 開始 / ${order.contractMonths}ヶ月`, 14, y); y += 10;

  // === Cost Summary ===
  y = drawHeader(doc, "費用明細（月額・税別）", y, PURPLE);

  const costRows: string[][] = [];
  let totalAdBudget = 0;
  if (order.includeGoogle) {
    costRows.push(["Google広告費", `¥${order.googleBudget.toLocaleString()}`, "Google Adsへの実費"]);
    totalAdBudget += order.googleBudget;
  }
  if (order.includeMeta) {
    costRows.push(["Meta広告費", `¥${order.metaBudget.toLocaleString()}`, "Meta Adsへの実費"]);
    totalAdBudget += order.metaBudget;
  }
  if (order.includeFlyer) {
    costRows.push(["チラシ配布費", `¥${order.flyerTotalCost.toLocaleString()}`, `${order.flyerTotalQuantity.toLocaleString()}部`]);
  }
  const mgmtFee = Math.round(totalAdBudget * order.managementFeeRate / 100);
  costRows.push(["広告運用管理費", `¥${mgmtFee.toLocaleString()}`, `広告費の${order.managementFeeRate}%`]);

  const totalMonthly = totalAdBudget + (order.includeFlyer ? order.flyerTotalCost : 0) + mgmtFee;

  autoTable(doc, {
    startY: y,
    head: [["項目", "月額", "備考"]],
    body: costRows,
    foot: [["合計", `¥${totalMonthly.toLocaleString()}`, ""]],
    styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: PURPLE, font: "NotoSansJP", textColor: [255, 255, 255] },
    footStyles: { fillColor: [240, 235, 255], font: "NotoSansJP", fontStyle: "bold", textColor: DARK },
    columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Total box
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(pageW - 105, y, 91, 22, 3, 3, "F");
  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageW - 105, y, 91, 22, 3, 3, "S");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text("月額合計（税別）", pageW - 101, y + 8);
  doc.setFontSize(14);
  doc.setTextColor(...PURPLE);
  doc.text(`¥${totalMonthly.toLocaleString()}`, pageW - 101, y + 18);
  y += 32;

  // === Google Ads Detail ===
  if (order.includeGoogle) {
    y = checkPage(doc, y, 60);
    y = drawHeader(doc, "Google広告 設定内容", y);
    const gRows = [
      ["キャンペーンタイプ", order.googleCampaignType],
      ["日予算", `¥${Math.round(order.googleBudget / 30).toLocaleString()}`],
      ["対策キーワード", order.googleKeywords.slice(0, 8).join("、")],
    ];
    autoTable(doc, {
      startY: y,
      body: gRows,
      styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 45, fillColor: LIGHT_BG, fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (order.googleAdCopies.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["No.", "見出し", "説明文"]],
        body: order.googleAdCopies.map((ad, i) => [String(i + 1), ad.headline, ad.description]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: LIGHT_BG },
        columnStyles: { 1: { cellWidth: 55 }, 2: { cellWidth: 70 } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  // === Meta Ads Detail ===
  if (order.includeMeta) {
    y = checkPage(doc, y, 60);
    y = drawHeader(doc, "Meta広告 設定内容", y);
    const mRows = [
      ["配信目的", order.metaObjective],
      ["日予算", `¥${Math.round(order.metaBudget / 30).toLocaleString()}`],
    ];
    if (order.metaAudiences[0]) {
      mRows.push(["ターゲット", order.metaAudiences[0].name]);
      mRows.push(["年齢", order.metaAudiences[0].ageRange]);
      mRows.push(["興味関心", order.metaAudiences[0].interests.slice(0, 5).join("、")]);
    }
    autoTable(doc, {
      startY: y,
      body: mRows,
      styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 45, fillColor: LIGHT_BG, fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (order.metaCreatives.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["No.", "見出し", "本文"]],
        body: order.metaCreatives.map((cr, i) => [String(i + 1), cr.headline, cr.description]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: LIGHT_BG },
        columnStyles: { 1: { cellWidth: 50 }, 2: { cellWidth: 70 } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  // === Flyer Detail ===
  if (order.includeFlyer && order.flyerAreas.length > 0) {
    y = checkPage(doc, y, 60);
    y = drawHeader(doc, "チラシ配布 設定内容", y);

    autoTable(doc, {
      startY: y,
      head: [["No.", "配布エリア", "部数", "優先度"]],
      body: order.flyerAreas.map((a, i) => [String(i + 1), a.areaName, a.quantity.toLocaleString(), a.priority]),
      foot: [["", "合計", order.flyerTotalQuantity.toLocaleString(), ""]],
      styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
      footStyles: { fillColor: [230, 235, 245], font: "NotoSansJP", fontStyle: "bold", textColor: DARK },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    if (order.flyerTiming) {
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(`推奨配布タイミング: ${order.flyerTiming}`, 14, y);
      y += 10;
    }
  }

  // === Notes ===
  if (order.notes) {
    y = checkPage(doc, y, 30);
    y = drawHeader(doc, "備考", y);
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    const noteLines = doc.splitTextToSize(order.notes, 170);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 8;
  }

  // === Contract Terms ===
  y = checkPage(doc, y, 45);
  y = drawHeader(doc, "契約条件", y);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const terms = [
    "・広告費はGoogle/Metaへの実費であり、月により変動する場合があります。",
    "・チラシ配布費は印刷費+配布費の合計です。デザイン費は別途ご相談ください。",
    "・運用管理費にはアカウント設定・入札最適化・月次レポート作成が含まれます。",
    `・最低契約期間は${order.contractMonths}ヶ月です。期間満了後は1ヶ月単位で自動更新。`,
    "・解約は1ヶ月前までにご連絡ください。",
  ];
  terms.forEach((t) => {
    y = checkPage(doc, y, 6);
    doc.text(t, 14, y);
    y += 5;
  });
  y += 8;

  // === Signature ===
  y = checkPage(doc, y, 40);
  drawLine(doc, y);
  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text("ご承諾欄", 14, y);
  y += 10;
  doc.text("日付:　　　　年　　月　　日", 14, y);
  y += 10;
  doc.text(`${order.customerCompany || "御社名"} 　　　　　　　　　　　印`, 14, y);

  for (let i = 0; i < 3; i++) {
    const bx = pageW - 30 - i * 32;
    doc.setDrawColor(180, 180, 190);
    doc.setLineWidth(0.3);
    doc.rect(bx, y - 15, 28, 28);
    const labels = ["担当", "確認", "承認"];
    doc.setFontSize(7);
    doc.text(labels[2 - i], bx + 14, y - 17, { align: "center" });
  }

  // === Footer ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`MapBoost AI 統合媒体プラン発注書  |  ${orderNo}  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  savePdf(doc, `${order.storeName}_統合媒体プラン発注書.pdf`);

  // Save to order history
  const historyMedia: string[] = [];
  if (order.includeGoogle) historyMedia.push("Google広告");
  if (order.includeMeta) historyMedia.push("Meta広告");
  if (order.includeFlyer) historyMedia.push("チラシ配布");
  const historyOrder: OrderRecord = {
    id: `media-${Date.now()}`,
    orderNumber: orderNo,
    date: new Date().toLocaleDateString("ja-JP"),
    type: "media",
    storeName: order.storeName,
    totalCost: totalMonthly,
    status: "completed",
    areas: order.includeFlyer ? order.flyerAreas.map((a) => ({ areaName: a.areaName, quantity: a.quantity, priority: a.priority })) : undefined,
    mediaIncluded: historyMedia,
    costs: {
      ...(order.includeGoogle ? { google: order.googleBudget } : {}),
      ...(order.includeMeta ? { meta: order.metaBudget } : {}),
      ...(order.includeFlyer ? { flyer: order.flyerTotalCost } : {}),
      management: mgmtFee,
      total: totalMonthly,
    },
    clientCompany: order.clientCompany,
    notes: order.notes,
  };
  saveOrder(historyOrder);

  return doc.output("blob");
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
