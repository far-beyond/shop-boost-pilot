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
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.18/files/noto-sans-jp-japanese-400-normal.woff"
      );
      if (!res.ok) {
        console.error("Font fetch failed:", res.status);
        return false;
      }
      const buf = await res.arrayBuffer();
      // Convert ArrayBuffer to base64 safely (no stack overflow)
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
