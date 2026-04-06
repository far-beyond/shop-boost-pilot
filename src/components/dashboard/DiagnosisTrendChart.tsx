import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { DiagnosisRow } from "@/lib/diagnosisService";
import { useLanguage } from "@/contexts/LanguageContext";

type MonthData = { month: string; count: number; completed: number };

function buildMonthlyData(diagnoses: DiagnosisRow[], locale: string): MonthData[] {
  const now = new Date();
  const months: MonthData[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString(locale, { month: "short" });
    const inMonth = diagnoses.filter((dx) => {
      const c = new Date(dx.created_at);
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
    });
    months.push({ month: label, count: inMonth.length, completed: inMonth.filter((dx) => dx.status === "completed").length });
  }
  return months;
}

export default function DiagnosisTrendChart({ diagnoses }: { diagnoses: DiagnosisRow[] }) {
  const { t, language } = useLanguage();
  const locale = language === "ja" ? "ja-JP" : "en-US";
  const data = useMemo(() => buildMonthlyData(diagnoses, locale), [diagnoses, locale]);
  const hasData = data.some((d) => d.count > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg text-xs">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-muted-foreground">
            {p.dataKey === "count" ? t("dash.totalCount") : t("dash.completedCount")}: <span className="font-semibold text-foreground">{p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
      <Card className="border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
            </div>
            {t("dash.trendTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-5 pb-5">
          {!hasData ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">{t("dash.noTrendData")}</div>
          ) : (
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(217 91% 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(217 91% 55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(162 63% 42%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(162 63% 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(217 14% 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(217 14% 46%)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="hsl(217 91% 55%)" strokeWidth={2} fill="url(#gradCount)" />
                  <Area type="monotone" dataKey="completed" stroke="hsl(162 63% 42%)" strokeWidth={2} fill="url(#gradCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {hasData && (
            <div className="flex gap-4 mt-3 px-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2.5 h-2.5 rounded-sm bg-primary" />{t("dash.totalDiagnoses")}</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2.5 h-2.5 rounded-sm bg-accent" />{t("dash.completed")}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
