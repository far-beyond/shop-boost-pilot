import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, LayoutDashboard, Loader2, Plus, FileText, TrendingUp, Clock, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { getUserDiagnoses, type DiagnosisRow, type DiagnosisResult } from "@/lib/diagnosisService";
import { exportDiagnosisPDF } from "@/lib/pdfExport";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "完了", variant: "default" },
  processing: { label: "処理中", variant: "secondary" },
  pending: { label: "作成中", variant: "outline" },
  error: { label: "エラー", variant: "destructive" },
};

function StatsCards({ diagnoses }: { diagnoses: DiagnosisRow[] }) {
  const total = diagnoses.length;
  const completed = diagnoses.filter((d) => d.status === "completed").length;
  const thisMonth = diagnoses.filter((d) => {
    const created = new Date(d.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: "総診断数", value: total, icon: FileText, color: "text-primary" },
    { label: "完了済み", value: completed, icon: CheckCircle2, color: "text-accent" },
    { label: "今月の診断", value: thisMonth, icon: TrendingUp, color: "text-primary" },
    { label: "直近の診断", value: diagnoses[0] ? new Date(diagnoses[0].created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }) : "—", icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function DiagnosisCard({ item, index }: { item: DiagnosisRow; index: number }) {
  const status = statusConfig[item.status] || statusConfig.pending;
  const result = item.diagnosis_result as DiagnosisResult | null;
  const actionCount = result?.actions?.length ?? 0;
  const strengthCount = result?.strengths?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="group border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground text-base truncate">{item.store_name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{item.industry} · {item.address}</p>
            </div>
            <Badge variant={status.variant} className="shrink-0 text-xs">{status.label}</Badge>
          </div>

          {item.status === "completed" && result && (
            <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                強み {strengthCount}件
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                施策 {actionCount}件
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(item.created_at).toLocaleDateString("ja-JP")}
              </span>
            </div>
          )}

          {item.status !== "completed" && (
            <p className="text-xs text-muted-foreground mb-4">
              {new Date(item.created_at).toLocaleDateString("ja-JP")} に作成
            </p>
          )}

          {item.status === "completed" && (
            <div className="flex gap-2 flex-wrap">
              <Link to={`/diagnosis/${item.id}`}>
                <Button size="sm" className="gap-1.5 text-xs h-8">
                  <Eye className="w-3.5 h-3.5" />
                  レポートを見る
                </Button>
              </Link>
              <Link to={`/promo/${item.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                  <FileText className="w-3.5 h-3.5" />
                  販促文
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => exportDiagnosisPDF(item)}
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnoses"],
    queryFn: getUserDiagnoses,
  });

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          {/* Header */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                ダッシュボード
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">診断案件の管理</h1>
              <p className="text-sm text-muted-foreground mt-1">過去の診断レポートの確認・管理ができます。</p>
            </div>
            <Link to="/input">
              <Button className="gap-2 shadow-sm">
                <Plus className="w-4 h-4" />
                新しい診断を作成
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !diagnoses?.length ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-dashed border-2 border-border">
                <CardContent className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-1">診断がまだありません</h3>
                  <p className="text-sm text-muted-foreground mb-6">店舗情報を入力して、AIによる集客診断を始めましょう。</p>
                  <Link to="/input">
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      最初の診断を作成
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              <StatsCards diagnoses={diagnoses} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnoses.map((item, i) => (
                  <DiagnosisCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
