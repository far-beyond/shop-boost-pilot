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

export type AreaAnalysisData = {
  areaName: string;
  population: number;
  households: number;
  ageDistribution: { ageGroup: string; percentage: number; count: number }[];
  householdTypes: { type: string; percentage: number; count: number }[];
  primaryTarget: string;
  suitableIndustries: { industry: string; reason: string; score: number }[];
  unsuitableIndustries: { industry: string; reason: string }[];
  visitMotivations: string[];
  areaCharacteristics: string;
  competitiveEnvironment: string;
};

export type OpeningAnalysisData = {
  overallScore: number;
  scoreBreakdown: { category: string; score: number; maxScore: number; comment: string }[];
  successProbability: string;
  targetCustomer: string;
  estimatedUnitPrice: string;
  estimatedVisitFrequency: string;
  riskFactors: { risk: string; severity: string; mitigation: string }[];
  improvements: string[];
  overallComment: string;
};

export async function exportAreaAnalysisPDF(
  areaResult: AreaAnalysisData | null,
  openingResult: OpeningAnalysisData | null,
  meta: { address: string; radius: string; industry: string }
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
  doc.text("商圏・出店分析レポート", 14, 18);
  doc.setFontSize(11);
  doc.text(areaResult ? "商圏分析" : "出店分析", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `住所: ${meta.address}  |  半径: ${meta.radius}  |  業種: ${meta.industry || "未指定"}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`,
    14, 50
  );

  let y = 62;

  // Area Analysis
  if (areaResult) {
    y = drawHeader(doc, "エリア概要", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.text(`エリア: ${areaResult.areaName}`, 22, y); y += 6;
    doc.text(`推定人口: ${areaResult.population.toLocaleString()}人  |  推定世帯数: ${areaResult.households.toLocaleString()}世帯`, 22, y); y += 6;
    doc.text(`主要ターゲット: ${areaResult.primaryTarget}`, 22, y); y += 8;

    const charLines = doc.splitTextToSize(`エリアの特徴: ${areaResult.areaCharacteristics}`, 165);
    y = checkPage(doc, y, charLines.length * 6);
    doc.text(charLines, 22, y);
    y += charLines.length * 5.5 + 8;

    // Age Distribution
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "年齢構成", y);
    autoTable(doc, {
      startY: y,
      head: [["年齢層", "人数", "割合"]],
      body: areaResult.ageDistribution.map((a) => [
        a.ageGroup, a.count.toLocaleString() + "人", a.percentage + "%",
      ]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Household Types
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "世帯構成", y);
    autoTable(doc, {
      startY: y,
      head: [["世帯タイプ", "世帯数", "割合"]],
      body: areaResult.householdTypes.map((h) => [
        h.type, h.count.toLocaleString() + "世帯", h.percentage + "%",
      ]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Suitable Industries
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "向いている業種", y);
    autoTable(doc, {
      startY: y,
      head: [["業種", "スコア", "理由"]],
      body: areaResult.suitableIndustries.map((s) => [s.industry, String(s.score), s.reason]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 2: { cellWidth: 80 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Competition
    y = checkPage(doc, y, 30);
    y = drawHeader(doc, "競合環境", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    const compLines = doc.splitTextToSize(areaResult.competitiveEnvironment, 165);
    doc.text(compLines, 22, y);
    y += compLines.length * 5.5 + 8;

    // Visit Motivations
    y = checkPage(doc, y, 15);
    y = drawHeader(doc, "来店動機", y);
    doc.setFontSize(10);
    doc.text(areaResult.visitMotivations.join("、"), 22, y);
    y += 12;
  }

  // Opening Analysis
  if (openingResult) {
    if (areaResult) { doc.addPage(); y = 20; }
    y = drawHeader(doc, "出店分析結果", y);
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 50);
    doc.text(`総合スコア: ${openingResult.overallScore} / 100`, 22, y); y += 7;
    doc.setFontSize(10);
    doc.text(`成功確率: ${openingResult.successProbability}`, 22, y); y += 7;
    const commentLines = doc.splitTextToSize(openingResult.overallComment, 165);
    doc.setTextColor(40, 40, 60);
    doc.text(commentLines, 22, y);
    y += commentLines.length * 5.5 + 8;

    // Score Breakdown
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "スコア内訳", y);
    autoTable(doc, {
      startY: y,
      head: [["カテゴリ", "スコア", "満点", "コメント"]],
      body: openingResult.scoreBreakdown.map((s) => [s.category, String(s.score), String(s.maxScore), s.comment]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 3: { cellWidth: 70 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Target info
    y = checkPage(doc, y, 25);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.text(`想定ターゲット: ${openingResult.targetCustomer}`, 22, y); y += 6;
    doc.text(`想定客単価: ${openingResult.estimatedUnitPrice}  |  来店頻度: ${openingResult.estimatedVisitFrequency}`, 22, y); y += 10;

    // Risks
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "リスク要因", y);
    autoTable(doc, {
      startY: y,
      head: [["リスク", "重大度", "対策"]],
      body: openingResult.riskFactors.map((r) => [r.risk, r.severity, r.mitigation]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 2: { cellWidth: 70 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;

    // Improvements
    y = checkPage(doc, y, 30);
    y = drawHeader(doc, "改善アドバイス", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    openingResult.improvements.forEach((imp, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${imp}`, 165);
      y = checkPage(doc, y, lines.length * 6);
      doc.text(lines, 22, y);
      y += lines.length * 5.5 + 3;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`MapBoost AI  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  savePdf(doc, `${meta.address}_商圏分析レポート.pdf`);
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
