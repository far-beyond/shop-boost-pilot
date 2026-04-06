import { Link } from "react-router-dom";
import { Eye, FileText, Download, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { exportDiagnosisPDF } from "@/lib/pdfExport";
import type { DiagnosisRow, DiagnosisResult } from "@/lib/diagnosisService";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DiagnosisCard({ item, index }: { item: DiagnosisRow; index: number }) {
  const { t, language } = useLanguage();

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    completed: { label: t("dash.status.completed"), variant: "default" },
    processing: { label: t("dash.status.processing"), variant: "secondary" },
    pending: { label: t("dash.status.pending"), variant: "outline" },
    error: { label: t("dash.status.error"), variant: "destructive" },
  };

  const status = statusConfig[item.status] || statusConfig.pending;
  const result = item.diagnosis_result as DiagnosisResult | null;
  const actionCount = result?.actions?.length ?? 0;
  const strengthCount = result?.strengths?.length ?? 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <Card className="group border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.store_name}</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 truncate">{item.industry} · {item.address}</p>
            </div>
            <Badge variant={status.variant} className="shrink-0 text-[10px] sm:text-xs">{status.label}</Badge>
          </div>

          {item.status === "completed" && result && (
            <div className="flex flex-wrap gap-3 mb-3 text-[11px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />{t("dash.strengthsCount")} {strengthCount}</span>
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />{t("dash.actionsCount")} {actionCount}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{new Date(item.created_at).toLocaleDateString(language === "ja" ? "ja-JP" : "en-US")}</span>
            </div>
          )}

          {item.status !== "completed" && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mb-3">
              {new Date(item.created_at).toLocaleDateString(language === "ja" ? "ja-JP" : "en-US")}{t("dash.createdOn")}
            </p>
          )}

          {item.status === "completed" && (
            <div className="flex gap-2 flex-wrap">
              <Link to={`/diagnosis/${item.id}`}>
                <Button size="sm" className="gap-1.5 text-[11px] sm:text-xs h-7 sm:h-8"><Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{t("dash.report")}</Button>
              </Link>
              <Link to={`/promo/${item.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-[11px] sm:text-xs h-7 sm:h-8"><FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{t("dash.promoText")}</Button>
              </Link>
              <Button size="sm" variant="outline" className="gap-1.5 text-[11px] sm:text-xs h-7 sm:h-8" onClick={() => exportDiagnosisPDF(item)}>
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
