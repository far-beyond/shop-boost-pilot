import jsPDF from "jspdf";

let fontLoaded = false;
let fontBase64 = "";

/**
 * Load Noto Sans JP font into jsPDF document.
 * Uses ArrayBuffer → base64 conversion that works across all browsers.
 * Falls back gracefully if font loading fails.
 */
export async function loadJapaneseFont(doc: jsPDF): Promise<boolean> {
  try {
    if (!fontLoaded) {
      // Static TTF from Google Fonts - 3MB, full Japanese coverage, jsPDF compatible
      const res = await fetch(
        "https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf"
      );
      if (!res.ok) {
        console.error("Font fetch failed:", res.status);
        return false;
      }
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf]);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(blob);
      });
      fontBase64 = dataUrl.split(",")[1];
      fontLoaded = true;
    }
    doc.addFileToVFS("NotoSansJP-Regular.ttf", fontBase64);
    doc.addFont("NotoSansJP-Regular.ttf", "NotoSansJP", "normal");
    doc.setFont("NotoSansJP");
    // Set as default font for autoTable globally
    (doc as any).autoTableSetDefaults?.({
      styles: { font: "NotoSansJP" },
      headStyles: { font: "NotoSansJP" },
      bodyStyles: { font: "NotoSansJP" },
      footStyles: { font: "NotoSansJP" },
    });
    return true;
  } catch (e) {
    console.error("Failed to load Japanese font:", e);
    return false;
  }
}

/**
 * Save PDF with fallback for environments where doc.save() doesn't work
 * (e.g., some mobile browsers, PWA, iframe).
 */
export function savePdf(doc: jsPDF, fileName: string): void {
  try {
    // Use blob + link click for maximum browser compatibility (Firefox, Safari, Chrome)
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  } catch {
    try {
      // Fallback: standard jsPDF save
      doc.save(fileName);
    } catch {
      // Last resort: open in new tab
      const dataUri = doc.output("datauristring");
      window.open(dataUri, "_blank");
    }
  }
}
