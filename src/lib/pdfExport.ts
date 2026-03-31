import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DiagnosisRow, DiagnosisResult, KPIPlan } from "./diagnosisService";

export function exportDiagnosisPDF(diagnosis: DiagnosisRow) {
  const doc = new jsPDF({ putOnlyUsedFonts: true });
  const d = diagnosis.diagnosis_result as DiagnosisResult | null;
  const kpi = diagnosis.kpi_plan as KPIPlan | null;

  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.text(`${diagnosis.store_name} - AI Diagnosis Report`, 14, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Industry: ${diagnosis.industry} | Address: ${diagnosis.address}`, 14, y);
  doc.text(`Generated: ${new Date(diagnosis.created_at).toLocaleDateString("ja-JP")}`, 14, y + 5);
  doc.setTextColor(0);
  y += 15;

  if (d) {
    // Strengths
    doc.setFontSize(13);
    doc.text("Strengths", 14, y);
    y += 6;
    doc.setFontSize(10);
    d.strengths.forEach((s) => {
      doc.text(`• ${s}`, 18, y);
      y += 5;
    });
    y += 4;

    // Weaknesses
    doc.setFontSize(13);
    doc.text("Weaknesses", 14, y);
    y += 6;
    doc.setFontSize(10);
    d.weaknesses.forEach((w) => {
      doc.text(`• ${w}`, 18, y);
      y += 5;
    });
    y += 4;

    // Target Customers
    doc.setFontSize(13);
    doc.text("Target Customers", 14, y);
    y += 6;
    doc.setFontSize(10);
    const targetLines = doc.splitTextToSize(d.targetCustomers, 175);
    doc.text(targetLines, 18, y);
    y += targetLines.length * 5 + 4;

    // Differentiation
    doc.setFontSize(13);
    doc.text("Differentiation Points", 14, y);
    y += 6;
    doc.setFontSize(10);
    d.differentiationPoints.forEach((p) => {
      doc.text(`• ${p}`, 18, y);
      y += 5;
    });
    y += 4;

    // Actions table
    if (d.actions.length > 0) {
      doc.setFontSize(13);
      doc.text("Recommended Actions", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["#", "Action", "Cost", "Difficulty", "Effect"]],
        body: d.actions.map((a, i) => [
          String(i + 1),
          `${a.name}\n${a.reason}`,
          a.estimatedCost,
          a.difficulty,
          a.expectedEffect,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 121, 255] },
        columnStyles: { 1: { cellWidth: 70 } },
        margin: { left: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // KPI table
  if (kpi?.kpis?.length) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.text("KPI Plan", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Metric", "Target", "Measurement", "Frequency"]],
      body: kpi.kpis.map((k) => [k.metric, k.target, k.measurement, k.frequency]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 121, 255] },
      margin: { left: 14 },
    });
  }

  doc.save(`${diagnosis.store_name}_diagnosis.pdf`);
}
