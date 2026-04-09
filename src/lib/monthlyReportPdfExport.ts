import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";
import type { OrderRecord } from "./orderHistoryService";

const BLUE: [number, number, number] = [41, 121, 255];
const LIGHT_BG: [number, number, number] = [245, 248, 255];
const GRAY: [number, number, number] = [120, 130, 145];

function header(doc: jsPDF, title: string, y: number): number {
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

export type MonthlyReportExportData = {
  area: any | null;
  orders: OrderRecord[];
  totalSpend: number;
  totalOrders: number;
  areasCovered: string[];
};

function formatYearMonth(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  return `${y}年${parseInt(m)}月`;
}

export async function exportMonthlyReportPDF(
  data: MonthlyReportExportData,
  meta: { storeName?: string; address: string; yearMonth: string }
) {
  try {
    const doc = new jsPDF({ putOnlyUsedFonts: true });
    await loadJapaneseFont(doc);
    const pageW = doc.internal.pageSize.getWidth();
    const monthLabel = formatYearMonth(meta.yearMonth);

    // ---- Title bar ----
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, pageW, 44, "F");
    doc.setFontSize(20);
    doc.setTextColor(255);
    doc.text("月次マーケティングレポート", 14, 18);
    doc.setFontSize(13);
    doc.text(monthLabel, 14, 30);
    doc.setFontSize(10);
    doc.text(meta.storeName || "", 14, 39);

    // ---- Store info ----
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(
      `住所: ${meta.address}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`,
      14,
      54
    );

    let y = 66;

    // ---- Executive Summary ----
    y = header(doc, "エグゼクティブサマリー", y);
    const summaryLines = [
      `対象月: ${monthLabel}`,
      `総発注件数: ${data.totalOrders}件`,
      `総費用: ¥${data.totalSpend.toLocaleString()}`,
      `カバーエリア数: ${data.areasCovered.length}`,
    ];
    if (data.area?.areaCharacteristics) {
      summaryLines.push(`商圏概要: ${data.area.areaCharacteristics}`);
    }
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    summaryLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 170);
      y = checkPage(doc, y, wrapped.length * 6);
      doc.text(wrapped, 22, y);
      y += wrapped.length * 5.5 + 2;
    });
    y += 4;

    // ---- Order Activity Table ----
    if (data.orders.length > 0) {
      y = checkPage(doc, y, 40);
      y = header(doc, "発注活動サマリー", y);

      const orderRows = data.orders.map((o) => [
        o.date,
        o.orderNumber,
        o.type === "flyer" ? "チラシ" : o.type === "ad" ? "広告" : "統合媒体",
        o.storeName || "-",
        `¥${o.totalCost.toLocaleString()}`,
        o.status === "completed" ? "完了" : o.status === "pending" ? "処理中" : "キャンセル",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["日付", "注文番号", "種別", "店舗名", "費用", "ステータス"]],
        body: orderRows,
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      y = checkPage(doc, y, 20);
      y = header(doc, "発注活動サマリー", y);
      doc.setFontSize(10);
      doc.setTextColor(...GRAY);
      doc.text("この月の発注履歴はありません。", 22, y);
      y += 12;
    }

    // ---- Area Analysis ----
    if (data.area) {
      y = checkPage(doc, y, 60);
      y = header(doc, "商圏分析データ", y);

      const areaMetrics = [
        ["エリア", data.area.areaName ?? "-"],
        ["推定人口", data.area.population ? `${Number(data.area.population).toLocaleString()}人` : "-"],
        ["推定世帯数", data.area.households ? `${Number(data.area.households).toLocaleString()}世帯` : "-"],
        ["主要ターゲット", data.area.primaryTarget ?? "-"],
      ];

      // Age distribution if available
      if (data.area.ageDistribution?.length) {
        data.area.ageDistribution.forEach((ag: any) => {
          areaMetrics.push([`年齢層: ${ag.ageGroup}`, `${ag.percentage ?? ag.count ?? "-"}%`]);
        });
      }

      autoTable(doc, {
        startY: y,
        head: [["項目", "値"]],
        body: areaMetrics,
        styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
        tableWidth: 130,
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Competitive Environment
      if (data.area.competitiveEnvironment) {
        y = checkPage(doc, y, 30);
        y = header(doc, "競合環境", y);
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 60);
        const cLines = doc.splitTextToSize(data.area.competitiveEnvironment, 170);
        y = checkPage(doc, y, cLines.length * 6);
        doc.text(cLines, 22, y);
        y += cLines.length * 5.5 + 8;
      }

      // Recommendations
      const recs = data.area.recommendations;
      if (recs && (Array.isArray(recs) ? recs.length > 0 : recs)) {
        y = checkPage(doc, y, 30);
        y = header(doc, "推奨施策", y);
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 60);
        const recList = Array.isArray(recs) ? recs : [recs];
        recList.forEach((rec: string, i: number) => {
          const text = `${i + 1}. ${rec}`;
          const wrapped = doc.splitTextToSize(text, 165);
          y = checkPage(doc, y, wrapped.length * 6);
          doc.text(wrapped, 22, y);
          y += wrapped.length * 5.5 + 2;
        });
      }
    }

    // ---- Footer ----
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(`MapBoost AI  |  月次レポート  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
    }

    const fileName = meta.storeName
      ? `${meta.storeName}_月次レポート_${meta.yearMonth}.pdf`
      : `月次レポート_${meta.yearMonth}.pdf`;
    savePdf(doc, fileName);
  } catch (e) {
    console.error("Monthly report PDF export error:", e);
    throw e;
  }
}
