import { Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/Layout";
import { dummyKPIs } from "@/lib/dummyData";
import { toast } from "sonner";

export default function KPIDesign() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            KPI設計
          </h1>
          <p className="text-muted-foreground">
            施策の効果を測定するための指標と目標値です。
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>カフェ モカ 渋谷店 — KPI一覧</CardTitle>
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
                {dummyKPIs.map((kpi, i) => (
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

        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" variant="outline" className="gap-2" onClick={() => toast.info("PDF出力中…（デモ）")}>
            <Download className="w-4 h-4" />
            PDF出力
          </Button>
          <Button size="lg" className="gap-2" onClick={() => toast.success("保存しました（デモ）")}>
            <Save className="w-4 h-4" />
            保存
          </Button>
        </div>
      </div>
    </Layout>
  );
}
