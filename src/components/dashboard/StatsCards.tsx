import { FileText, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import type { DiagnosisRow } from "@/lib/diagnosisService";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StatsCards({ diagnoses }: { diagnoses: DiagnosisRow[] }) {
  const { t, language } = useLanguage();
  const total = diagnoses.length;
  const completed = diagnoses.filter((d) => d.status === "completed").length;
  const thisMonth = diagnoses.filter((d) => {
    const created = new Date(d.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: t("dash.totalDiagnoses"), value: total, icon: FileText, color: "text-primary" },
    { label: t("dash.completed"), value: completed, icon: CheckCircle2, color: "text-accent" },
    { label: t("dash.thisMonth"), value: thisMonth, icon: TrendingUp, color: "text-primary" },
    {
      label: t("dash.latest"),
      value: diagnoses[0]
        ? new Date(diagnoses[0].created_at).toLocaleDateString(language === "ja" ? "ja-JP" : "en-US", { month: "short", day: "numeric" })
        : "—",
      icon: Clock,
      color: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-3 px-4 sm:pt-5 sm:pb-4 sm:px-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">{s.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground truncate">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
