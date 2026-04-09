import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MapAreaAnalysisResult, CompetitorStore } from "./mapAreaService";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";

const BLUE: [number, number, number] = [41, 121, 255];
const RED: [number, number, number] = [239, 68, 68];
const LIGHT_BG: [number, number, number] = [245, 248, 255];
const GRAY: [number, number, number] = [120, 130, 145];
const DARK: [number, number, number] = [30, 30, 50];

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

function groupByIndustry(competitors: CompetitorStore[]): Record<string, CompetitorStore[]> {
  const groups: Record<string, CompetitorStore[]> = {};
  for (const c of competitors) {
    const key = c.industry || "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

export async function exportCompetitorReportPDF(
  result: MapAreaAnalysisResult,
  meta: { address: string; radius: string; industry: string }
) {
  try {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(doc);
  const pageW = doc.internal.pageSize.getWidth();

  // === Title bar ===
  doc.setFillColor(...RED);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setFontSize(20);
  doc.setTextColor(255);
  doc.text("競合環境分析レポート", 14, 18);
  doc.setFontSize(11);
  doc.text("MapBoost AI Competitor Analysis", 14, 28);

  // Meta
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `住所: ${meta.address}  |  半径: ${meta.radius}  |  業種: ${meta.industry || "全業種"}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`,
    14, 50
  );

  let y = 62;

  // === Summary ===
  y = drawHeader(doc, "エリア概要", y);
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);

  const summary = result.summary;
  const censusSource = result.censusData?.source || summary.dataSource || "AI推定";
  const isRealData = result.competitors.some((c) => c.id.startsWith("osm-"));

  doc.text(`総人口: ${summary.totalPopulation.toLocaleString()}人`, 22, y); y += 6;
  doc.text(`総世帯数: ${summary.totalHouseholds.toLocaleString()}世帯`, 22, y); y += 6;
  doc.text(`データソース: ${censusSource}`, 22, y); y += 6;
  doc.text(`競合店舗数: ${result.competitors.length}件${isRealData ? "（OpenStreetMap実データ）" : "（AI推定）"}`, 22, y); y += 6;
  doc.text(`商圏スコア: ${summary.tradeAreaScore} / 100`, 22, y); y += 10;

  if (summary.competitiveEnvironment) {
    const envLines = doc.splitTextToSize(`競合環境: ${summary.competitiveEnvironment}`, 165);
    y = checkPage(doc, y, envLines.length * 6);
    doc.text(envLines, 22, y);
    y += envLines.length * 5.5 + 8;
  }

  // === Competitor List ===
  y = checkPage(doc, y, 50);
  y = drawHeader(doc, "競合店舗一覧", y, RED);

  if (result.competitors.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["No.", "店舗名", "業種", "距離", "座標"]],
      body: result.competitors.map((c, i) => [
        String(i + 1),
        c.name,
        c.industry,
        `${c.distance.toLocaleString()}m`,
        `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`,
      ]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: RED, font: "NotoSansJP", textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      columnStyles: { 1: { cellWidth: 55, font: "NotoSansJP" }, 2: { cellWidth: 35, font: "NotoSansJP" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // === Industry Breakdown ===
  const groups = groupByIndustry(result.competitors);
  const industryData = Object.entries(groups)
    .map(([industry, stores]) => ({
      industry,
      count: stores.length,
      avgDistance: Math.round(stores.reduce((s, c) => s + c.distance, 0) / stores.length),
      nearest: Math.min(...stores.map((c) => c.distance)),
    }))
    .sort((a, b) => b.count - a.count);

  if (industryData.length > 0) {
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "業種別 競合分布", y, RED);

    autoTable(doc, {
      startY: y,
      head: [["業種", "店舗数", "平均距離", "最寄り距離", "密度評価"]],
      body: industryData.map((d) => [
        d.industry,
        `${d.count}件`,
        `${d.avgDistance.toLocaleString()}m`,
        `${d.nearest.toLocaleString()}m`,
        d.count >= 5 ? "高密度" : d.count >= 3 ? "中密度" : "低密度",
      ]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: RED, font: "NotoSansJP", textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // === Distance Analysis ===
  y = checkPage(doc, y, 50);
  y = drawHeader(doc, "距離別 競合分析", y);

  const within500 = result.competitors.filter((c) => c.distance <= 500).length;
  const within1000 = result.competitors.filter((c) => c.distance <= 1000).length;
  const within2000 = result.competitors.filter((c) => c.distance <= 2000).length;
  const beyond2000 = result.competitors.filter((c) => c.distance > 2000).length;

  autoTable(doc, {
    startY: y,
    head: [["距離帯", "店舗数", "割合", "脅威度"]],
    body: [
      ["500m以内", `${within500}件`, `${result.competitors.length ? Math.round((within500 / result.competitors.length) * 100) : 0}%`, within500 >= 3 ? "高" : within500 >= 1 ? "中" : "低"],
      ["500m〜1km", `${within1000 - within500}件`, `${result.competitors.length ? Math.round(((within1000 - within500) / result.competitors.length) * 100) : 0}%`, (within1000 - within500) >= 5 ? "高" : "中"],
      ["1km〜2km", `${within2000 - within1000}件`, `${result.competitors.length ? Math.round(((within2000 - within1000) / result.competitors.length) * 100) : 0}%`, "低"],
      ["2km以上", `${beyond2000}件`, `${result.competitors.length ? Math.round((beyond2000 / result.competitors.length) * 100) : 0}%`, "影響小"],
    ],
    styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // === Age Distribution (if available) ===
  if (summary.ageDistribution?.length > 0) {
    y = checkPage(doc, y, 50);
    y = drawHeader(doc, "商圏人口 年齢構成", y);

    autoTable(doc, {
      startY: y,
      head: [["年齢層", "人数", "割合"]],
      body: summary.ageDistribution.map((a) => [
        a.ageGroup,
        `${a.count.toLocaleString()}人`,
        `${a.percentage}%`,
      ]),
      styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP", textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // === Recommendations ===
  if (summary.recommendations?.length > 0) {
    y = checkPage(doc, y, 30);
    y = drawHeader(doc, "分析所見・提案", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    summary.recommendations.forEach((rec, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, 165);
      y = checkPage(doc, y, lines.length * 6);
      doc.text(lines, 22, y);
      y += lines.length * 5.5 + 3;
    });
  }

  // === Footer ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`MapBoost AI 競合環境分析  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  savePdf(doc, `${meta.address}_競合環境分析レポート.pdf`);
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
