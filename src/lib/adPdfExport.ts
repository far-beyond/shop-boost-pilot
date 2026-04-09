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

export type AdProposalData = {
  summary: string;
  googleAds: {
    campaignType: string;
    dailyBudget: number;
    monthlyBudget: number;
    keywords: { keyword: string; matchType: string; estimatedCPC: number; priority: string }[];
    adCopies: { headline1: string; headline2: string; headline3: string; description1: string; description2: string }[];
    expectedCTR: string;
    expectedCPA: string;
  };
  metaAds: {
    campaignObjective: string;
    dailyBudget: number;
    monthlyBudget: number;
    targetAudiences: { name: string; ageRange: string; gender: string; interests: string[]; estimatedReach: string }[];
    adCreatives: { format: string; primaryText: string; headline: string; description: string; callToAction: string }[];
    expectedCPM: string;
    expectedCTR: string;
  };
  overallStrategy: {
    recommendedPlatform: string;
    reason: string;
    monthlyTotalBudget: number;
    expectedROAS: string;
    tips: string[];
  };
};

export async function exportAdProposalPDF(
  data: AdProposalData,
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
  doc.text(meta.storeName || "広告提案レポート", 14, 18);
  doc.setFontSize(11);
  doc.text("Google広告 / Meta広告 提案書", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`業種: ${meta.industry}  |  住所: ${meta.address}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`, 14, 50);

  let y = 62;

  // Summary
  y = drawHeader(doc, "広告戦略の概要", y);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  const summaryLines = doc.splitTextToSize(data.summary, 170);
  doc.text(summaryLines, 22, y);
  y += summaryLines.length * 5.5 + 8;

  // Overall Strategy
  y = checkPage(doc, y, 40);
  y = drawHeader(doc, "総合戦略", y);
  doc.setFontSize(10);
  const stratItems = [
    `推奨プラットフォーム: ${data.overallStrategy.recommendedPlatform}`,
    `月間合計予算: ¥${data.overallStrategy.monthlyTotalBudget.toLocaleString()}`,
    `期待ROAS: ${data.overallStrategy.expectedROAS}`,
    `推奨理由: ${data.overallStrategy.reason}`,
  ];
  stratItems.forEach((s) => {
    const lines = doc.splitTextToSize(`•  ${s}`, 165);
    y = checkPage(doc, y, lines.length * 6);
    doc.text(lines, 22, y);
    y += lines.length * 5.5 + 2;
  });
  y += 6;

  // Google Ads Section
  y = checkPage(doc, y, 30);
  y = drawHeader(doc, "Google広告プラン", y);
  doc.setFontSize(10);
  const gStats = [
    `キャンペーンタイプ: ${data.googleAds.campaignType}`,
    `日予算: ¥${data.googleAds.dailyBudget.toLocaleString()}  /  月予算: ¥${data.googleAds.monthlyBudget.toLocaleString()}`,
    `期待CTR: ${data.googleAds.expectedCTR}  /  期待CPA: ${data.googleAds.expectedCPA}`,
  ];
  gStats.forEach((s) => {
    doc.text(`•  ${s}`, 22, y);
    y += 6;
  });
  y += 4;

  // Google Keywords Table
  y = checkPage(doc, y, 40);
  autoTable(doc, {
    startY: y,
    head: [["キーワード", "マッチタイプ", "推定CPC", "優先度"]],
    body: data.googleAds.keywords.map((kw) => [
      kw.keyword,
      kw.matchType,
      `¥${kw.estimatedCPC}`,
      kw.priority,
    ]),
    styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP" },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Google Ad Copies
  y = checkPage(doc, y, 30);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 50);
  doc.text("広告文案", 22, y);
  y += 8;
  doc.setFontSize(9);
  data.googleAds.adCopies.forEach((ad, i) => {
    y = checkPage(doc, y, 28);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y - 4, pageW - 28, 24, 2, 2, "F");
    doc.setTextColor(...BLUE);
    doc.text(`案${i + 1}: ${ad.headline1} | ${ad.headline2} | ${ad.headline3}`, 18, y + 2);
    doc.setTextColor(60, 60, 80);
    doc.text(ad.description1, 18, y + 9);
    doc.text(ad.description2, 18, y + 15);
    y += 28;
  });
  y += 6;

  // Meta Ads Section
  y = checkPage(doc, y, 30);
  y = drawHeader(doc, "Meta広告プラン", y);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  const mStats = [
    `キャンペーン目的: ${data.metaAds.campaignObjective}`,
    `日予算: ¥${data.metaAds.dailyBudget.toLocaleString()}  /  月予算: ¥${data.metaAds.monthlyBudget.toLocaleString()}`,
    `期待CPM: ${data.metaAds.expectedCPM}  /  期待CTR: ${data.metaAds.expectedCTR}`,
  ];
  mStats.forEach((s) => {
    doc.text(`•  ${s}`, 22, y);
    y += 6;
  });
  y += 4;

  // Meta Audiences Table
  y = checkPage(doc, y, 40);
  autoTable(doc, {
    startY: y,
    head: [["オーディエンス名", "年齢", "性別", "興味関心", "推定リーチ"]],
    body: data.metaAds.targetAudiences.map((aud) => [
      aud.name,
      aud.ageRange,
      aud.gender,
      aud.interests.join(", "),
      aud.estimatedReach,
    ]),
    styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP" },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: { 3: { cellWidth: 50, font: "NotoSansJP" } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Meta Creatives
  y = checkPage(doc, y, 30);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 50);
  doc.text("広告クリエイティブ案", 22, y);
  y += 8;
  doc.setFontSize(9);
  data.metaAds.adCreatives.forEach((cr, i) => {
    y = checkPage(doc, y, 30);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y - 4, pageW - 28, 26, 2, 2, "F");
    doc.setTextColor(...BLUE);
    doc.text(`案${i + 1} [${cr.format}]: ${cr.headline}`, 18, y + 2);
    doc.setTextColor(60, 60, 80);
    const pLines = doc.splitTextToSize(cr.primaryText, 160);
    doc.text(pLines.slice(0, 2), 18, y + 9);
    doc.text(`CTA: ${cr.callToAction}`, 18, y + 18);
    y += 30;
  });
  y += 6;

  // Tips
  y = checkPage(doc, y, 30);
  y = drawHeader(doc, "運用アドバイス", y);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  data.overallStrategy.tips.forEach((tip, i) => {
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

  const fileName = meta.storeName ? `${meta.storeName}_広告提案書.pdf` : "広告提案書.pdf";
  savePdf(doc, fileName);
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
