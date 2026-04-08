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

export type LocationMatchData = {
  summary: string;
  recommendedLocations: {
    rank: number;
    areaName: string;
    matchScore: number;
    population: string;
    mainTarget: string;
    strengths: string[];
    risks: string[];
    storeOpeningAdvice: string;
    adStrategy: string;
    flyerStrategy: string;
    estimatedMonthlyCustomers: string;
    competitionLevel: string;
    rentEstimate: string;
  }[];
  comparisonTable: {
    areaName: string;
    matchScore: number;
    competitionLevel: string;
    targetFit: string;
    costEfficiency: string;
    growthPotential: string;
  }[];
  overallRecommendation: {
    bestArea: string;
    reason: string;
    actionPlan: string[];
    budgetGuide: string;
  };
};

export async function exportLocationMatchPDF(
  data: LocationMatchData,
  meta: { industry: string; serviceDescription: string }
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
  doc.text("ロケーションマッチングレポート", 14, 18);
  doc.setFontSize(11);
  doc.text("エリア適性分析・出店/広告/チラシ戦略", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`業種: ${meta.industry}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`, 14, 50);

  let y = 62;

  // Summary
  y = drawHeader(doc, "分析結果の概要", y);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  const summaryLines = doc.splitTextToSize(data.summary, 170);
  doc.text(summaryLines, 22, y);
  y += summaryLines.length * 5.5 + 8;

  // Best pick
  y = checkPage(doc, y, 30);
  y = drawHeader(doc, "AIの最終推奨", y);
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 50);
  doc.text(`推奨エリア: ${data.overallRecommendation.bestArea}`, 22, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  const reasonLines = doc.splitTextToSize(data.overallRecommendation.reason, 165);
  doc.text(reasonLines, 22, y);
  y += reasonLines.length * 5.5 + 4;
  doc.text(`初期投資目安: ${data.overallRecommendation.budgetGuide}`, 22, y);
  y += 10;

  // Comparison Table
  y = checkPage(doc, y, 50);
  y = drawHeader(doc, "エリア比較表", y);
  autoTable(doc, {
    startY: y,
    head: [["エリア", "スコア", "競合", "ターゲット適合", "コスト効率", "成長性"]],
    body: data.comparisonTable.map((r) => [
      r.areaName, String(r.matchScore), r.competitionLevel, r.targetFit, r.costEfficiency, r.growthPotential,
    ]),
    styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP" },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Each location detail
  for (const loc of data.recommendedLocations) {
    y = checkPage(doc, y, 80);
    y = drawHeader(doc, `#${loc.rank} ${loc.areaName}（${loc.matchScore}点）`, y);
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 60);

    const info = [
      `人口: ${loc.population}  |  主要ターゲット: ${loc.mainTarget}`,
      `競合密度: ${loc.competitionLevel}  |  家賃相場: ${loc.rentEstimate}  |  月間見込み: ${loc.estimatedMonthlyCustomers}`,
    ];
    info.forEach((line) => { doc.text(line, 22, y); y += 5.5; });
    y += 3;

    // Strengths
    doc.setTextColor(34, 139, 34);
    doc.text("強み:", 22, y); y += 5;
    doc.setTextColor(40, 40, 60);
    loc.strengths.forEach((s) => {
      const lines = doc.splitTextToSize(`• ${s}`, 160);
      y = checkPage(doc, y, lines.length * 5.5);
      doc.text(lines, 26, y);
      y += lines.length * 5 + 1;
    });
    y += 2;

    // Risks
    doc.setTextColor(200, 120, 0);
    doc.text("リスク:", 22, y); y += 5;
    doc.setTextColor(40, 40, 60);
    loc.risks.forEach((r) => {
      const lines = doc.splitTextToSize(`• ${r}`, 160);
      y = checkPage(doc, y, lines.length * 5.5);
      doc.text(lines, 26, y);
      y += lines.length * 5 + 1;
    });
    y += 3;

    // Strategies
    const strategies = [
      { label: "出店アドバイス", text: loc.storeOpeningAdvice },
      { label: "広告戦略", text: loc.adStrategy },
      { label: "チラシ戦略", text: loc.flyerStrategy },
    ];
    strategies.forEach((st) => {
      y = checkPage(doc, y, 15);
      doc.setFontSize(9);
      doc.setTextColor(...BLUE);
      doc.text(`${st.label}:`, 22, y); y += 5;
      doc.setTextColor(40, 40, 60);
      const lines = doc.splitTextToSize(st.text, 160);
      y = checkPage(doc, y, lines.length * 5.5);
      doc.text(lines, 26, y);
      y += lines.length * 5 + 4;
    });
    y += 6;
  }

  // Action Plan
  y = checkPage(doc, y, 40);
  y = drawHeader(doc, "具体的アクションプラン", y);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  data.overallRecommendation.actionPlan.forEach((step, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${step}`, 165);
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

  savePdf(doc, `${meta.industry}_エリアマッチングレポート.pdf`);
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
