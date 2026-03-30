import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/Layout";
import { getDiagnosis, type KPIPlan } from "@/lib/diagnosisService";
import { toast } from "sonner";

export default function KPIDesign() {
  const { id } = useParams<{ id: string }>();

  const { data: diagnosis, isLoading, error } = useQuery({
    queryKey: ["diagnosis", id],
    queryFn: () => getDiagnosis(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (error || !diagnosis) {
    return <Layout><div className="min-h-[60vh] flex flex-col items-center justify-center gap-4"><p className="text-destructive">データが見つかりません</p><Link to="/dashboard"><Button variant="outline">ダッシュボードに戻る</Button></Link></div></Layout>;
  }

  const kpiPlan = diagnosis.kpi_plan as KPIPlan | null;
  const kpis = kpiPlan?.kpis || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">KPI設計</h1>
          <p className="text-muted-foreground">{diagnosis.store_name} — 施策の効果を測定するための指標と目標値</p>
        </div>

        {kpis.length === 0 ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">KPI設計を生成中です…</p>
          </div>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{diagnosis.store_name} — KPI一覧</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>指標名</TableHead>
                    <TableHead>目標値</TableHead>
                    <TableHead>測定方法</TableHead>
                    <TableHead>確認頻度</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpis.map((kpi, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{kpi.metric}</TableCell>
                      <TableCell>{kpi.target}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{kpi.measurement}</TableCell>
                      <TableCell>{kpi.frequency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to={`/promo/${id}`}>
            <Button size="lg" variant="outline" className="gap-2">販促文を見る</Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" className="gap-2">
              ダッシュボードに戻る
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
