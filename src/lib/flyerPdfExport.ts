import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";

const BLUE: [number, number, number] = [41, 121, 255];
const LIGHT_BG: [number, number, number] = [245, 248, 255];
const GRAY: [number, number, number] = [120, 130, 145];

function drawHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...BLUE);
  doc.roundedRect(14, y - 5, 4, 18, 2, 2, "F");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 50);
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

export type FlyerPlanData = {
  summary: string;
  distributionAreas: {
    areaName: string;
    reason: string;
    estimatedHouseholds: number;
    recommendedQuantity: number;
    priority: string;
    targetDescription: string;
  }[];
  totalQuantity: number;
  estimatedCost: {
    printingCostPerUnit: number;
    distributionCostPerUnit: number;
    totalPrintingCost: number;
    totalDistributionCost: number;
    totalCost: number;
  };
  timing: {
    bestDays: string[];
    bestTimeSlots: string[];
    seasonalTips: string;
    frequency: string;
  };
  catchcopies: {
    headline: string;
    subCopy: string;
    tone: string;
    targetAudience: string;
    callToAction: string;
  }[];
  designTips: string[];
  expectedResponseRate: string;
  expectedROI: string;
};

export async function exportFlyerPlanPDF(
  plan: FlyerPlanData,
  meta: { storeName?: string; address: string; industry: string }
) {
  try {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(doc);
  const pageW = doc.internal.pageSize.getWidth();

  // Title bar
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setFontSize(20);
  doc.setTextColor(255);
  doc.text(meta.storeName || "チラシ配布計画", 14, 18);
  doc.setFontSize(11);
  doc.text("チラシ配布計画レポート", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`業種: ${meta.industry}  |  住所: ${meta.address}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`, 14, 50);

  let y = 62;

  // Summary
  y = drawHeader(doc, "配布計画の概要", y);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  const summaryLines = doc.splitTextToSize(plan.summary, 170);
  doc.text(summaryLines, 22, y);
  y += summaryLines.length * 5.5 + 8;

  // Stats
  y = checkPage(doc, y, 20);
  y = drawHeader(doc, "主要指標", y);
  doc.setFontSize(10);
  const stats = [
    `合計部数: ${plan.totalQuantity.toLocaleString()}部`,
    `合計費用: ¥${plan.estimatedCost.totalCost.toLocaleString()}`,
    `期待反応率: ${plan.expectedResponseRate}`,
    `期待ROI: ${plan.expectedROI}`,
  ];
  stats.forEach((s) => {
    doc.text(`•  ${s}`, 22, y);
    y += 6;
  });
  y += 6;

  // Distribution Areas Table
  y = checkPage(doc, y, 50);
  y = drawHeader(doc, "配布エリア計画", y);
  autoTable(doc, {
    startY: y,
    head: [["エリア名", "優先度", "推定世帯数", "推奨部数", "ターゲット層", "選定理由"]],
    body: plan.distributionAreas.map((a) => [
      a.areaName,
      a.priority,
      a.estimatedHouseholds.toLocaleString(),
      a.recommendedQuantity.toLocaleString(),
      a.targetDescription,
      a.reason,
    ]),
    styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP" },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: { 4: { cellWidth: 35 }, 5: { cellWidth: 45 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Cost Breakdown
  y = checkPage(doc, y, 40);
  y = drawHeader(doc, "費用内訳", y);
  doc.setFontSize(10);
  const costs = [
    `印刷単価: ¥${plan.estimatedCost.printingCostPerUnit}/枚`,
    `配布単価: ¥${plan.estimatedCost.distributionCostPerUnit}/枚`,
    `印刷費合計: ¥${plan.estimatedCost.totalPrintingCost.toLocaleString()}`,
    `配布費合計: ¥${plan.estimatedCost.totalDistributionCost.toLocaleString()}`,
    `合計: ¥${plan.estimatedCost.totalCost.toLocaleString()}`,
  ];
  costs.forEach((c) => {
    y = checkPage(doc, y, 7);
    doc.text(`•  ${c}`, 22, y);
    y += 6;
  });
  y += 6;

  // Timing
  y = checkPage(doc, y, 30);
  y = drawHeader(doc, "配布タイミング", y);
  doc.setFontSize(10);
  doc.text(`最適な曜日: ${plan.timing.bestDays.join("、")}`, 22, y); y += 6;
  doc.text(`最適な時間帯: ${plan.timing.bestTimeSlots.join("、")}`, 22, y); y += 6;
  doc.text(`推奨頻度: ${plan.timing.frequency}`, 22, y); y += 6;
  const tipLines = doc.splitTextToSize(`季節アドバイス: ${plan.timing.seasonalTips}`, 165);
  y = checkPage(doc, y, tipLines.length * 6);
  doc.text(tipLines, 22, y);
  y += tipLines.length * 5.5 + 8;

  // Catchcopies
  y = checkPage(doc, y, 50);
  y = drawHeader(doc, "キャッチコピー案", y);
  autoTable(doc, {
    startY: y,
    head: [["#", "キャッチコピー", "サブコピー", "トーン", "CTA"]],
    body: plan.catchcopies.map((c, i) => [
      String(i + 1),
      c.headline,
      c.subCopy,
      c.tone,
      c.callToAction,
    ]),
    styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP" },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: { 1: { cellWidth: 40 }, 2: { cellWidth: 45 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Design Tips
  y = checkPage(doc, y, 30);
  y = drawHeader(doc, "デザインアドバイス", y);
  doc.setFontSize(10);
  plan.designTips.forEach((tip, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${tip}`, 165);
    y = checkPage(doc, y, lines.length * 6);
    doc.text(lines, 22, y);
    y += lines.length * 5.5 + 3;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`MapBoost AI  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  const fileName = meta.storeName ? `${meta.storeName}_チラシ配布計画.pdf` : "チラシ配布計画.pdf";
  savePdf(doc, fileName);
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
