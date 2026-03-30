import { Link } from "react-router-dom";
import { Edit, Eye, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/Layout";
import { dummyDashboardItems } from "@/lib/dummyData";

const statusColor: Record<string, string> = {
  完了: "bg-accent text-accent-foreground",
  診断済み: "bg-primary text-primary-foreground",
  入力中: "bg-secondary text-secondary-foreground",
};

export default function Dashboard() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <LayoutDashboard className="w-4 h-4" />
            ダッシュボード
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            案件一覧
          </h1>
          <p className="text-muted-foreground">過去に作成した診断・施策の一覧です。</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>作成済み案件</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
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
                {dummyDashboardItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.storeName}</TableCell>
                    <TableCell>{item.createdAt}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[item.status] || ""}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link to="/diagnosis">
                          <Button size="sm" variant="outline" className="gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            レポート
                          </Button>
                        </Link>
                        <Link to="/input">
                          <Button size="sm" variant="outline" className="gap-1">
                            <Edit className="w-3.5 h-3.5" />
                            再編集
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
