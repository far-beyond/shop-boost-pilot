import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Loader2, Plus, Calendar, ArrowUpRight, Filter,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Layout from "@/components/Layout";
import { getUserDiagnoses } from "@/lib/diagnosisService";
import { fetchStoreCandidates, type StoreCandidate } from "@/lib/storeCandidateService";
import { motion } from "framer-motion";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

type CombinedItem = {
  id: string;
  clientName: string;
  storeName: string;
  industry: string;
  date: string;
  status: string;
  type: "diagnosis" | "candidate";
};

const statusLabel: Record<string, { text: string; color: string }> = {
  completed: { text: "完了", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  pending: { text: "処理中", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  draft: { text: "下書き", color: "bg-muted text-muted-foreground" },
};

export default function AgencyDashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: diagnoses, isLoading: dLoading } = useQuery({
    queryKey: ["diagnoses"],
    queryFn: getUserDiagnoses,
  });

  const { data: candidates, isLoading: cLoading } = useQuery({
    queryKey: ["store-candidates"],
    queryFn: fetchStoreCandidates,
  });

  const isLoading = dLoading || cLoading;

  const items: CombinedItem[] = [
    ...(diagnoses ?? []).map((d: any) => ({
      id: d.id,
      clientName: "-",
      storeName: d.store_name,
      industry: d.industry,
      date: d.created_at,
      status: d.status,
      type: "diagnosis" as const,
    })),
    ...(candidates ?? []).map((c: StoreCandidate) => ({
      id: c.id,
      clientName: "-",
      storeName: c.store_name,
      industry: c.industry,
      date: c.created_at,
      status: c.status,
      type: "candidate" as const,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = items.filter((item) => {
    const matchSearch = !search ||
      item.storeName.toLowerCase().includes(search.toLowerCase()) ||
      item.industry.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-6xl">
          {/* Header */}
          <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8" {...fadeUp}>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
                <Building2 className="w-3.5 h-3.5" />
                代理店ダッシュボード
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">案件管理</h1>
              <p className="text-sm text-muted-foreground mt-1">すべての診断・候補地を一元管理します。</p>
            </div>
            <div className="flex gap-2">
              <Link to="/input">
                <Button className="gap-2" size="sm">
                  <Plus className="w-4 h-4" /> 新規診断
                </Button>
              </Link>
              <Link to="/store-candidates">
                <Button variant="outline" className="gap-2" size="sm">
                  <Plus className="w-4 h-4" /> 候補地追加
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "総案件数", value: items.length },
              { label: "診断完了", value: items.filter((i) => i.status === "completed").length },
              { label: "処理中", value: items.filter((i) => i.status === "pending").length },
              { label: "出店候補地", value: (candidates ?? []).length },
            ].map((s) => (
              <Card key={s.label} className="border border-border/60">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div {...fadeUp} className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="店舗名・業種で検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="pending">処理中</SelectItem>
                <SelectItem value="draft">下書き</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !filtered.length ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">該当する案件がありません</p>
              </CardContent>
            </Card>
          ) : (
            <motion.div {...fadeUp}>
              <Card className="border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">種別</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">店舗名</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">業種</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">分析日時</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">ステータス</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item, i) => {
                        const st = statusLabel[item.status] ?? statusLabel.draft;
                        return (
                          <tr key={item.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-[10px]">
                                {item.type === "diagnosis" ? "診断" : "候補地"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-medium text-sm text-foreground">{item.storeName}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{item.industry}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(item.date).toLocaleDateString("ja-JP")}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                                {st.text}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.type === "diagnosis" && (
                                <Link to={`/diagnosis/${item.id}`}>
                                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                                    詳細 <ArrowUpRight className="w-3 h-3" />
                                  </Button>
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
