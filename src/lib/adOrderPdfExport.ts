import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";
import { saveOrder, type OrderRecord } from "./orderHistoryService";

const BLUE: [number, number, number] = [41, 121, 255];
const DARK: [number, number, number] = [30, 30, 50];
const GRAY: [number, number, number] = [120, 130, 145];
const LIGHT_BG: [number, number, number] = [245, 248, 255];
const GREEN: [number, number, number] = [34, 197, 94];

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
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

export type AdOrderData = {
  // Client info
  clientCompany: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  // Customer info (advertiser)
  customerCompany: string;
  customerName: string;
  customerEmail: string;
  // Campaign details
  storeName: string;
  storeAddress: string;
  industry: string;
  // Platforms
  platforms: ("google" | "meta")[];
  // Budget
  monthlyAdBudget: number;
  managementFee: number;
  totalMonthlyCharge: number;
  // Duration
  startDate: string;
  contractMonths: number;
  // Targeting
  targetArea: string;
  targetRadius: string;
  targetAudience: string;
  // Google Ads specifics
  googleCampaignType: string;
  googleKeywords: string[];
  googleDailyBudget: number;
  // Meta Ads specifics
  metaObjective: string;
  metaAgeRange: string;
  metaInterests: string[];
  metaDailyBudget: number;
  // Ad copies
  adCopies: { platform: string; headline: string; description: string }[];
  // Notes
  notes: string;
};

export async function exportAdOrderPDF(order: AdOrderData): Promise<Blob> {
  try {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const orderNo = `AD-${Date.now().toString(36).toUpperCase()}`;

  // === Title ===
  doc.setFontSize(22);
  doc.setTextColor(...DARK);
  doc.text("広告運用代行 発注書", pageW / 2, 25, { align: "center" });
  drawLine(doc, 32);

  // Order number & date
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`発注番号: ${orderNo}`, 14, 40);
  doc.text(`発行日: ${new Date().toLocaleDateString("ja-JP")}`, pageW - 14, 40, { align: "right" });

  // === Client / Customer info ===
  let y = 52;

  // Left: customer (advertiser)
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(`${order.customerCompany || order.storeName} 様`, 14, y);
  if (order.customerName) {
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`${order.customerName} 様`, 14, y + 7);
  }

  // Right: client (agency)
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
  const platformNames = order.platforms.map((p) => p === "google" ? "Google広告" : "Meta広告").join(" + ");
  doc.text(`件名: ${order.storeName} ${platformNames} 運用代行`, 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`対象店舗: ${order.storeName}（${order.industry}）`, 14, y); y += 5;
  doc.text(`所在地: ${order.storeAddress}`, 14, y); y += 5;
  doc.text(`契約開始: ${order.startDate}  |  契約期間: ${order.contractMonths}ヶ月`, 14, y); y += 10;

  // === Cost Summary ===
  y = drawHeader(doc, "費用明細（月額）", y);

  const costRows = [
    ["広告費（実費）", `¥${order.monthlyAdBudget.toLocaleString()}`, "Google/Metaへの支払い"],
    ["運用管理費", `¥${order.managementFee.toLocaleString()}`, "レポート作成・最適化込み"],
  ];

  autoTable(doc, {
    startY: y,
    head: [["項目", "月額（税別）", "備考"]],
    body: costRows,
    foot: [["合計", `¥${order.totalMonthlyCharge.toLocaleString()}`, ""]],
    styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
    footStyles: { fillColor: [230, 235, 245], font: "NotoSansJP", fontStyle: "bold", textColor: DARK },
    columnStyles: { 1: { halign: "right", cellWidth: 40, font: "NotoSansJP" } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Total box
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(pageW - 105, y, 91, 22, 3, 3, "F");
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageW - 105, y, 91, 22, 3, 3, "S");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text("月額合計（税別）", pageW - 101, y + 8);
  doc.setFontSize(14);
  doc.setTextColor(...BLUE);
  doc.text(`¥${order.totalMonthlyCharge.toLocaleString()}`, pageW - 101, y + 18);
  y += 32;

  // === Targeting ===
  y = checkPage(doc, y, 40);
  y = drawHeader(doc, "ターゲティング設定", y);

  autoTable(doc, {
    startY: y,
    body: [
      ["配信エリア", `${order.targetArea}（半径${order.targetRadius}）`],
      ["ターゲット層", order.targetAudience],
      ...(order.platforms.includes("google") ? [
        ["Google キャンペーンタイプ", order.googleCampaignType],
        ["Google 日予算", `¥${order.googleDailyBudget.toLocaleString()}`],
        ["対策キーワード", order.googleKeywords.join("、")],
      ] : []),
      ...(order.platforms.includes("meta") ? [
        ["Meta 配信目的", order.metaObjective],
        ["Meta 日予算", `¥${order.metaDailyBudget.toLocaleString()}`],
        ["Meta 年齢", order.metaAgeRange],
        ["Meta 興味関心", order.metaInterests.join("、")],
      ] : []),
    ],
    styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 45, fillColor: LIGHT_BG, fontStyle: "bold", font: "NotoSansJP" },
    },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // === Ad Copies ===
  if (order.adCopies.length > 0) {
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "広告文案", y);

    autoTable(doc, {
      startY: y,
      head: [["No.", "媒体", "見出し", "説明文"]],
      body: order.adCopies.map((ad, i) => [
        String(i + 1),
        ad.platform === "google" ? "Google" : "Meta",
        ad.headline,
        ad.description,
      ]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 2: { cellWidth: 50, font: "NotoSansJP" }, 3: { cellWidth: 60, font: "NotoSansJP" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // === Notes ===
  if (order.notes) {
    y = checkPage(doc, y, 30);
    y = drawHeader(doc, "備考・特記事項", y);
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    const noteLines = doc.splitTextToSize(order.notes, 170);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 8;
  }

  // === Terms ===
  y = checkPage(doc, y, 40);
  y = drawHeader(doc, "契約条件", y);
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const terms = [
    "・広告費はGoogle/Metaへの実費であり、変動する場合があります。",
    "・運用管理費には、アカウント設定・広告文作成・入札最適化・月次レポートが含まれます。",
    "・最低契約期間は上記の通りです。期間満了後は1ヶ月単位で自動更新となります。",
    "・解約は1ヶ月前までにご連絡ください。",
    "・広告審査の結果、配信できない場合があります。その場合は代替案をご提案します。",
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
  doc.text("ご承諾欄（署名・捺印）", 14, y);
  y += 12;
  doc.text("日付:　　　　年　　月　　日", 14, y);
  y += 10;
  doc.text(`${order.customerCompany || "御社名"} 　　　　　　　　　　　印`, 14, y);

  // Stamp boxes
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
    doc.text(`MapBoost AI 広告運用発注書  |  ${orderNo}  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  const fileName = `${order.storeName}_広告運用発注書.pdf`;
  savePdf(doc, fileName);

  // Save to order history
  const historyMediaNames = order.platforms.map((p) => p === "google" ? "Google広告" : "Meta広告");
  const historyOrder: OrderRecord = {
    id: `ad-${Date.now()}`,
    orderNumber: orderNo,
    date: new Date().toLocaleDateString("ja-JP"),
    type: "ad",
    storeName: order.storeName,
    totalCost: order.totalMonthlyCharge,
    status: "completed",
    mediaIncluded: historyMediaNames,
    costs: { adBudget: order.monthlyAdBudget, managementFee: order.managementFee, total: order.totalMonthlyCharge },
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
