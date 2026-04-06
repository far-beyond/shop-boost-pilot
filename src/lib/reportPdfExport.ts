import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

let fontLoaded = false;
let fontBase64 = "";

async function loadJapaneseFont(doc: jsPDF) {
  if (!fontLoaded) {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.18/files/noto-sans-jp-japanese-400-normal.woff"
    );
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    fontBase64 = btoa(binary);
    fontLoaded = true;
  }
  doc.addFileToVFS("NotoSansJP-Regular.woff", fontBase64);
  doc.addFont("NotoSansJP-Regular.woff", "NotoSansJP", "normal");
  doc.setFont("NotoSansJP");
}

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

function bulletList(doc: jsPDF, items: string[], x: number, startY: number, maxW: number): number {
  let y = startY;
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  items.forEach((item) => {
    const lines = doc.splitTextToSize(`•  ${item}`, maxW);
    y = checkPage(doc, y, lines.length * 6);
    doc.text(lines, x, y);
    y += lines.length * 5.5 + 2;
  });
  return y;
}

export type ReportExportData = {
  area: any | null;
  ad: any | null;
  flyer: any | null;
};

export async function exportReportPDF(
  data: ReportExportData,
  meta: { storeName?: string; address: string; industry: string; budget?: string }
) {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(doc);
  const pageW = doc.internal.pageSize.getWidth();

  // Title bar
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setFontSize(20);
  doc.setTextColor(255);
  doc.text(meta.storeName || "統合分析レポート", 14, 18);
  doc.setFontSize(11);
  doc.text("商圏分析・広告提案・チラシ出稿 統合レポート", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `業種: ${meta.industry}  |  住所: ${meta.address}  |  作成日: ${new Date().toLocaleDateString("ja-JP")}`,
    14,
    50
  );

  let y = 62;

  // ─── Section 1: Trade Area ───
  if (data.area) {
    y = header(doc, "商圏分析結果", y);

    const metrics = [
      ["エリア", data.area.areaName ?? "-"],
      ["推定人口", data.area.population ? `${Number(data.area.population).toLocaleString()}人` : "-"],
      ["推定世帯数", data.area.households ? `${Number(data.area.households).toLocaleString()}世帯` : "-"],
      ["主要ターゲット", data.area.primaryTarget ?? "-"],
    ];

    autoTable(doc, {
      startY: y,
      head: [["項目", "値"]],
      body: metrics,
      styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
      tableWidth: 120,
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (data.area.areaCharacteristics) {
      y = checkPage(doc, y, 20);
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 60);
      const lines = doc.splitTextToSize(data.area.areaCharacteristics, 170);
      doc.text(lines, 22, y);
      y += lines.length * 5.5 + 4;
    }

    if (data.area.competitiveEnvironment) {
      y = checkPage(doc, y, 16);
      doc.setFontSize(9);
      doc.setTextColor(...BLUE);
      doc.text("競合環境:", 22, y);
      doc.setTextColor(40, 40, 60);
      const cLines = doc.splitTextToSize(data.area.competitiveEnvironment, 160);
      y += 5;
      doc.text(cLines, 22, y);
      y += cLines.length * 5.5 + 8;
    }
  }

  // ─── Section 2: Recommended Strategy ───
  if (data.ad) {
    y = checkPage(doc, y, 40);
    y = header(doc, "推奨施策", y);

    if (data.ad.summary) {
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 60);
      const sLines = doc.splitTextToSize(data.ad.summary, 170);
      doc.text(sLines, 22, y);
      y += sLines.length * 5.5 + 4;
    }

    if (data.ad.overallStrategy) {
      const s = data.ad.overallStrategy;
      y = checkPage(doc, y, 20);
      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(14, y - 4, pageW - 28, 18, 2, 2, "F");
      doc.setFontSize(10);
      doc.setTextColor(...BLUE);
      doc.text(`推奨プラットフォーム: ${s.recommendedPlatform ?? "-"}`, 18, y + 2);
      doc.setTextColor(60, 60, 80);
      doc.setFontSize(9);
      const rLines = doc.splitTextToSize(s.reason ?? "", 160);
      doc.text(rLines.slice(0, 1), 18, y + 9);
      y += 22;

      if (s.tips?.length) {
        y = bulletList(doc, s.tips, 22, y, 165);
        y += 4;
      }
    }

    // Budget allocation table
    y = checkPage(doc, y, 40);
    y = header(doc, "広告予算配分", y);

    const budgetRows: string[][] = [];
    if (data.ad.googleAds) {
      budgetRows.push([
        "Google広告",
        `¥${Number(data.ad.googleAds.monthlyBudget ?? 0).toLocaleString()}`,
        data.ad.googleAds.expectedCTR ?? "-",
        data.ad.googleAds.expectedCPA ?? "-",
      ]);
    }
    if (data.ad.metaAds) {
      budgetRows.push([
        "Meta広告",
        `¥${Number(data.ad.metaAds.monthlyBudget ?? 0).toLocaleString()}`,
        data.ad.metaAds.expectedCTR ?? "-",
        data.ad.metaAds.expectedCPM ?? "-",
      ]);
    }
    if (data.ad.overallStrategy) {
      budgetRows.push([
        "合計",
        `¥${Number(data.ad.overallStrategy.monthlyTotalBudget ?? 0).toLocaleString()}`,
        "-",
        `ROAS: ${data.ad.overallStrategy.expectedROAS ?? "-"}`,
      ]);
    }

    if (budgetRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["媒体", "月間予算", "CTR", "CPA / CPM"]],
        body: budgetRows,
        styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // Google keywords
    if (data.ad.googleAds?.keywords?.length) {
      y = checkPage(doc, y, 40);
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 50);
      doc.text("Google広告 キーワード", 22, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [["キーワード", "マッチタイプ", "推定CPC", "優先度"]],
        body: data.ad.googleAds.keywords.map((kw: any) => [
          kw.keyword, kw.matchType, `¥${kw.estimatedCPC}`, kw.priority,
        ]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ─── Section 3: Flyer Plan ───
  if (data.flyer) {
    y = checkPage(doc, y, 40);
    y = header(doc, "チラシ出稿案", y);

    const flyerMetrics = [
      ["合計部数", data.flyer.totalQuantity ? `${Number(data.flyer.totalQuantity).toLocaleString()}部` : "-"],
      ["合計費用", data.flyer.estimatedCost?.totalCost ? `¥${Number(data.flyer.estimatedCost.totalCost).toLocaleString()}` : "-"],
      ["期待反応率", data.flyer.expectedResponseRate ?? "-"],
      ["期待ROI", data.flyer.expectedROI ?? "-"],
    ];

    autoTable(doc, {
      startY: y,
      head: [["項目", "値"]],
      body: flyerMetrics,
      styles: { font: "NotoSansJP", fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
      tableWidth: 120,
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Distribution areas
    if (data.flyer.distributionAreas?.length) {
      y = checkPage(doc, y, 40);
      autoTable(doc, {
        startY: y,
        head: [["配布エリア", "推奨部数", "ターゲット", "優先度", "理由"]],
        body: data.flyer.distributionAreas.map((a: any) => [
          a.areaName ?? "-",
          a.recommendedQuantity ? Number(a.recommendedQuantity).toLocaleString() : "-",
          a.targetDescription ?? "-",
          a.priority ?? "-",
          a.reason ?? "-",
        ]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        columnStyles: { 4: { cellWidth: 50 } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
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

  const fileName = meta.storeName ? `${meta.storeName}_統合レポート.pdf` : "統合レポート.pdf";
  doc.save(fileName);
}
