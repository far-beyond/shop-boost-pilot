import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";

const PRIMARY: [number, number, number] = [59, 130, 246];
const LIGHT_BG: [number, number, number] = [245, 248, 255];
const GRAY: [number, number, number] = [120, 130, 145];
const DARK: [number, number, number] = [30, 30, 50];

interface ResponseRow {
  name: string;
  address: string;
  phone: string;
  date: string;
  source: string;
  notes: string;
  lat?: number;
  lng?: number;
  geocoded?: boolean;
  geocodeError?: boolean;
}

interface ResponseStats {
  total: number;
  bySource: Record<string, number>;
  byArea: Record<string, number>;
}

function drawHeader(doc: jsPDF, title: string, y: number, color: [number, number, number] = PRIMARY): number {
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

export async function exportResponseReportPDF(
  rows: ResponseRow[],
  stats: ResponseStats,
  filterDateFrom: string,
  filterDateTo: string,
) {
  try {
    const doc = new jsPDF({ putOnlyUsedFonts: true });
    await loadJapaneseFont(doc);
    const pageW = doc.internal.pageSize.getWidth();

    // === Title bar ===
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setFontSize(20);
    doc.setTextColor(255);
    doc.text("反響分析レポート", 14, 18);
    doc.setFontSize(11);
    doc.text("MapBoost AI Response Analysis Report", 14, 28);

    // Meta info
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const dateRange = filterDateFrom || filterDateTo
      ? `期間: ${filterDateFrom || "---"} 〜 ${filterDateTo || "---"}  |  `
      : "";
    doc.text(
      `${dateRange}総反響数: ${stats.total}件  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`,
      14, 50
    );

    let y = 62;

    // === Summary ===
    y = drawHeader(doc, "反響サマリー", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.text(`総反響数: ${stats.total}件`, 22, y); y += 6;
    doc.text(`流入経路数: ${Object.keys(stats.bySource).length}種類`, 22, y); y += 6;
    doc.text(`エリア数: ${Object.keys(stats.byArea).length}エリア`, 22, y); y += 12;

    // === Source breakdown ===
    const sourceData = Object.entries(stats.bySource)
      .sort(([, a], [, b]) => b - a);

    if (sourceData.length > 0) {
      y = checkPage(doc, y, 50);
      y = drawHeader(doc, "流入経路別 内訳", y);

      autoTable(doc, {
        startY: y,
        head: [["流入経路", "反響数", "割合"]],
        body: sourceData.map(([source, count]) => [
          source,
          `${count}件`,
          `${stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%`,
        ]),
        styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: PRIMARY, font: "NotoSansJP", textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // === Area breakdown ===
    const areaData = Object.entries(stats.byArea)
      .sort(([, a], [, b]) => b - a);

    if (areaData.length > 0) {
      y = checkPage(doc, y, 50);
      y = drawHeader(doc, "エリア別 内訳", y);

      autoTable(doc, {
        startY: y,
        head: [["エリア", "反響数", "割合"]],
        body: areaData.slice(0, 30).map(([area, count]) => [
          area,
          `${count}件`,
          `${stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%`,
        ]),
        styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: PRIMARY, font: "NotoSansJP", textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // === Top performing areas ===
    const topAreas = areaData.slice(0, 5);
    if (topAreas.length > 0) {
      y = checkPage(doc, y, 50);
      y = drawHeader(doc, "反響上位エリア TOP5", y);

      autoTable(doc, {
        startY: y,
        head: [["順位", "エリア", "反響数", "割合", "評価"]],
        body: topAreas.map(([area, count], i) => [
          `${i + 1}位`,
          area,
          `${count}件`,
          `${stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%`,
          i === 0 ? "最重点エリア" : i <= 1 ? "重点エリア" : "注目エリア",
        ]),
        styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [34, 197, 94], font: "NotoSansJP", textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // === Footer ===
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(`MapBoost AI 反響分析レポート  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
    }

    savePdf(doc, `反響分析レポート_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (e) {
    console.error("Response report PDF export error:", e);
    throw e;
  }
}
