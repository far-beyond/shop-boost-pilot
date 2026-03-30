import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Edit, Eye, LayoutDashboard, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/Layout";
import { getUserDiagnoses } from "@/lib/diagnosisService";

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-accent text-accent-foreground" },
  processing: { label: "処理中", className: "bg-primary text-primary-foreground" },
  pending: { label: "作成中", className: "bg-secondary text-secondary-foreground" },
  error: { label: "エラー", className: "bg-destructive text-destructive-foreground" },
};

export default function Dashboard() {
  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnoses"],
    queryFn: getUserDiagnoses,
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <LayoutDashboard className="w-4 h-4" />
            ダッシュボード
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">案件一覧</h1>
          <p className="text-muted-foreground">過去に作成した診断・施策の一覧です。</p>
        </div>

        <div className="flex justify-end mb-4">
          <Link to="/input">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新しい診断を作成
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>作成済み案件</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !diagnoses?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>まだ診断がありません</p>
                <Link to="/input">
                  <Button className="mt-4 gap-2">
                    <Plus className="w-4 h-4" />
                    最初の診断を作成
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>店舗名</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnoses.map((item) => {
                    const status = statusConfig[item.status] || statusConfig.pending;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.store_name}</TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString("ja-JP")}</TableCell>
                        <TableCell>
                          <Badge className={status.className}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {item.status === "completed" && (
                              <Link to={`/diagnosis/${item.id}`}>
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  レポート
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
