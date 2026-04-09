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

export async function exportMediaPlanPDF(
  result: { google: any; meta: any; flyer: any },
  info: { storeName?: string; address: string; industry: string }
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
  doc.text(info.storeName || "統合媒体プラン", 14, 18);
  doc.setFontSize(11);
  doc.text("Google広告 / Meta広告 / チラシ 統合レポート", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `業種: ${info.industry}  |  住所: ${info.address}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`,
    14, 50
  );

  let y = 62;

  // Google Ads
  if (result.google) {
    const g = result.google;
    y = drawHeader(doc, "Google広告プラン", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.text(`キャンペーンタイプ: ${g.campaignType || "—"}`, 22, y); y += 6;
    doc.text(`日予算: ¥${(g.dailyBudget || 0).toLocaleString()}  |  月予算: ¥${(g.monthlyBudget || 0).toLocaleString()}`, 22, y); y += 6;
    doc.text(`期待CTR: ${g.expectedCTR || "—"}  |  期待CPA: ${g.expectedCPA || "—"}`, 22, y); y += 8;

    if (g.keywords?.length) {
      y = checkPage(doc, y, 40);
      autoTable(doc, {
        startY: y,
        head: [["キーワード", "マッチタイプ", "推定CPC", "優先度"]],
        body: g.keywords.map((kw: any) => [kw.keyword, kw.matchType, `¥${kw.estimatedCPC}`, kw.priority]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Meta Ads
  if (result.meta) {
    const m = result.meta;
    y = checkPage(doc, y, 30);
    y = drawHeader(doc, "Meta広告プラン", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.text(`キャンペーン目的: ${m.campaignObjective || "—"}`, 22, y); y += 6;
    doc.text(`日予算: ¥${(m.dailyBudget || 0).toLocaleString()}  |  月予算: ¥${(m.monthlyBudget || 0).toLocaleString()}`, 22, y); y += 6;
    doc.text(`期待CPM: ${m.expectedCPM || "—"}  |  期待CTR: ${m.expectedCTR || "—"}`, 22, y); y += 8;

    if (m.targetAudiences?.length) {
      y = checkPage(doc, y, 40);
      autoTable(doc, {
        startY: y,
        head: [["オーディエンス名", "年齢", "性別", "興味関心", "推定リーチ"]],
        body: m.targetAudiences.map((a: any) => [a.name, a.ageRange, a.gender, (a.interests || []).join(", "), a.estimatedReach]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        columnStyles: { 3: { cellWidth: 50, font: "NotoSansJP" } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Flyer
  if (result.flyer) {
    const f = result.flyer;
    y = checkPage(doc, y, 30);
    y = drawHeader(doc, "チラシ配布プラン", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);

    if (f.summary) {
      const sumLines = doc.splitTextToSize(f.summary, 165);
      doc.text(sumLines, 22, y);
      y += sumLines.length * 5.5 + 6;
    }

    doc.text(`合計部数: ${(f.totalQuantity || 0).toLocaleString()}部`, 22, y); y += 6;
    if (f.estimatedCost) {
      doc.text(`合計費用: ¥${(f.estimatedCost.totalCost || 0).toLocaleString()}`, 22, y); y += 6;
    }
    doc.text(`期待反応率: ${f.expectedResponseRate || "—"}  |  期待ROI: ${f.expectedROI || "—"}`, 22, y); y += 8;

    if (f.distributionAreas?.length) {
      y = checkPage(doc, y, 40);
      autoTable(doc, {
        startY: y,
        head: [["エリア名", "優先度", "推定世帯数", "推奨部数", "ターゲット層"]],
        body: f.distributionAreas.map((a: any) => [
          a.areaName, a.priority, (a.estimatedHouseholds || 0).toLocaleString(),
          (a.recommendedQuantity || 0).toLocaleString(), a.targetDescription || "—",
        ]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (f.timing) {
      y = checkPage(doc, y, 20);
      doc.text(`最適な曜日: ${(f.timing.bestDays || []).join("、")}`, 22, y); y += 6;
      doc.text(`推奨頻度: ${f.timing.frequency || "—"}`, 22, y); y += 8;
    }
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`MapBoost AI  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  const fileName = info.storeName ? `${info.storeName}_媒体プラン.pdf` : "媒体プラン.pdf";
  savePdf(doc, fileName);
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
