import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DiagnosisRow, DiagnosisResult, KPIPlan } from "./diagnosisService";
import { loadJapaneseFont, savePdf } from "./pdfFontLoader";

const BLUE: [number, number, number] = [41, 121, 255];
const LIGHT_BG: [number, number, number] = [245, 248, 255];
const GRAY: [number, number, number] = [120, 130, 145];

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...BLUE);
  doc.roundedRect(14, y - 5, 4, 18, 2, 2, "F");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 50);
  doc.text(title, 22, y + 6);
  return y + 18;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

export async function exportDiagnosisPDF(diagnosis: DiagnosisRow) {
  try {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  await loadJapaneseFont(doc);

  const d = diagnosis.diagnosis_result as DiagnosisResult | null;
  const kpi = diagnosis.kpi_plan as KPIPlan | null;
  const pageW = doc.internal.pageSize.getWidth();

  // ─── Title bar ───
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setFontSize(20);
  doc.setTextColor(255);
  doc.text(`${diagnosis.store_name}`, 14, 18);
  doc.setFontSize(11);
  doc.text("AI集客診断レポート", 14, 28);

  // Meta
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  const meta = `業種: ${diagnosis.industry}  |  住所: ${diagnosis.address}  |  作成日: ${new Date(diagnosis.created_at).toLocaleDateString("ja-JP")}`;
  doc.text(meta, 14, 50);

  let y = 62;

  if (d) {
    // ─── 強み ───
    y = drawSectionHeader(doc, "店舗の強み", y);
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    d.strengths.forEach((s) => {
      y = checkPageBreak(doc, y, 7);
      doc.text(`✓  ${s}`, 22, y);
      y += 6;
    });
    y += 6;

    // ─── 弱み ───
    y = checkPageBreak(doc, y, 30);
    y = drawSectionHeader(doc, "弱み・課題", y);
    doc.setFontSize(10);
    d.weaknesses.forEach((w) => {
      y = checkPageBreak(doc, y, 7);
      doc.text(`!  ${w}`, 22, y);
      y += 6;
    });
    y += 6;

    // ─── 狙うべき客層 ───
    y = checkPageBreak(doc, y, 30);
    y = drawSectionHeader(doc, "狙うべき客層", y);
    doc.setFontSize(10);
    const targetLines = doc.splitTextToSize(d.targetCustomers, 165);
    doc.text(targetLines, 22, y);
    y += targetLines.length * 5.5 + 6;

    // ─── 差別化ポイント ───
    y = checkPageBreak(doc, y, 30);
    y = drawSectionHeader(doc, "差別化ポイント", y);
    doc.setFontSize(10);
    d.differentiationPoints.forEach((p) => {
      y = checkPageBreak(doc, y, 7);
      doc.text(`◆  ${p}`, 22, y);
      y += 6;
    });
    y += 6;

    // ─── ボトルネック ───
    y = checkPageBreak(doc, y, 30);
    y = drawSectionHeader(doc, "集客ボトルネック", y);
    doc.setFontSize(10);
    d.bottlenecks.forEach((b) => {
      y = checkPageBreak(doc, y, 7);
      doc.text(`▸  ${b}`, 22, y);
      y += 6;
    });
    y += 6;

    // ─── 施策テーブル ───
    if (d.actions.length > 0) {
      y = checkPageBreak(doc, y, 50);
      y = drawSectionHeader(doc, "今すぐやるべき施策", y);

      autoTable(doc, {
        startY: y,
        head: [["#", "施策名", "概算コスト", "難易度", "効果の目安"]],
        body: d.actions.map((a, i) => [
          String(i + 1),
          `${a.name}\n${a.reason}`,
          a.estimatedCost,
          a.difficulty,
          a.expectedEffect,
        ]),
        styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: BLUE, font: "NotoSansJP" },
        alternateRowStyles: { fillColor: LIGHT_BG },
        columnStyles: { 1: { cellWidth: 65 } },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  // ─── KPIテーブル ───
  if (kpi?.kpis?.length) {
    y = checkPageBreak(doc, y, 50);
    y = drawSectionHeader(doc, "KPI設計", y);

    autoTable(doc, {
      startY: y,
      head: [["指標名", "目標値", "測定方法", "確認頻度"]],
      body: kpi.kpis.map((k) => [k.metric, k.target, k.measurement, k.frequency]),
      styles: { font: "NotoSansJP", fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: BLUE, font: "NotoSansJP" },
      alternateRowStyles: { fillColor: LIGHT_BG },
      margin: { left: 14, right: 14 },
    });
  }

  // ─── Footer on each page ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`MapBoost AI  |  ページ ${i} / ${totalPages}`, pageW / 2, 290, { align: "center" });
  }

  savePdf(doc, `${diagnosis.store_name}_診断レポート.pdf`);
  } catch (e) {
    console.error("PDF export error:", e);
    throw e;
  }
}
