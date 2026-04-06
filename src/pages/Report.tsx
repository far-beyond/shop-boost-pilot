import { useState } from "react";
import {
  FileText, Loader2, Search, MapPin, Megaphone, Newspaper,
  Target, TrendingUp, DollarSign, Users, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

type ReportData = {
  area: any | null;
  ad: any | null;
  flyer: any | null;
  loading: boolean;
  error: string | null;
};

export default function Report() {
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [report, setReport] = useState<ReportData>({
    area: null, ad: null, flyer: null, loading: false, error: null,
  });

  const generateReport = async () => {
    if (!address) { toast.error("住所を入力してください"); return; }
    if (!industry) { toast.error("業種を入力してください"); return; }

    setReport({ area: null, ad: null, flyer: null, loading: true, error: null });

    try {
      const body = { address, industry, budget, target, storeName };
      const [areaRes, adRes, flyerRes] = await Promise.all([
        supabase.functions.invoke("area-analysis", {
          body: { address, radius: "3km", industry, analysisType: "area" },
        }),
        supabase.functions.invoke("ad-proposal", { body }),
        supabase.functions.invoke("flyer-plan", { body }),
      ]);

      setReport({
        area: areaRes.data?.result ?? null,
        ad: adRes.data?.result ?? null,
        flyer: flyerRes.data?.result ?? null,
        loading: false,
        error: null,
      });
      toast.success("レポートが完成しました");
    } catch (e: any) {
      setReport((prev) => ({ ...prev, loading: false, error: e.message }));
      toast.error(e.message || "レポート生成に失敗しました");
    }
  };

  const hasData = report.area || report.ad || report.flyer;

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <FileText className="w-3.5 h-3.5" />
              統合レポート
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">分析レポート</h1>
            <p className="text-sm text-muted-foreground mt-1">
              商圏分析・推奨施策・広告配分・チラシ出稿案を1ページで確認できます。
            </p>
          </motion.div>

          {/* Input */}
          <motion.div {...fadeUp}>
            <Card className="border border-border/60 mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">住所 *</label>
                    <Input placeholder="例: 東京都渋谷区神南1丁目" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">業種 *</label>
                    <Input placeholder="例: 美容院、カフェ" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">店舗名（任意）</label>
                    <Input placeholder="例: ヘアサロン BLOOM" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">月間予算（任意）</label>
                    <Input placeholder="例: 10万円" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ターゲット（任意）</label>
                  <Textarea placeholder="例: 20〜30代女性" value={target} onChange={(e) => setTarget(e.target.value)} rows={2} />
                </div>
                <Button onClick={generateReport} disabled={report.loading} className="gap-2">
                  {report.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  {report.loading ? "レポート生成中..." : "統合レポートを作成"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Error */}
          {report.error && (
            <Card className="border-destructive/30 bg-destructive/5 mb-6">
              <CardContent className="py-6 text-center">
                <p className="text-destructive font-medium">レポート生成に失敗しました</p>
                <p className="text-sm text-muted-foreground mt-1">{report.error}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {report.loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">3つのAI分析を同時実行中...</p>
            </div>
          )}

          {/* Report Content */}
          {hasData && !report.loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Section 1: Trade Area */}
              {report.area && (
                <section>
                  <SectionHeader icon={MapPin} title="商圏分析結果" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <MetricCard label="エリア" value={report.area.areaName} />
                    <MetricCard label="推定人口" value={`${report.area.population?.toLocaleString()}人`} />
                    <MetricCard label="推定世帯数" value={`${report.area.households?.toLocaleString()}世帯`} />
                    <MetricCard label="主要ターゲット" value={report.area.primaryTarget} />
                  </div>
                  <Card className="border border-border/60">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">{report.area.areaCharacteristics}</p>
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs font-medium text-primary mb-1">競合環境</p>
                        <p className="text-sm text-foreground">{report.area.competitiveEnvironment}</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Section 2: Recommended Actions (from ad data) */}
              {report.ad && (
                <section>
                  <SectionHeader icon={Target} title="推奨施策" />
                  <Card className="border border-border/60">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{report.ad.summary}</p>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                        <p className="text-sm font-bold text-foreground mb-1">
                          推奨: {report.ad.overallStrategy?.recommendedPlatform}
                        </p>
                        <p className="text-xs text-muted-foreground">{report.ad.overallStrategy?.reason}</p>
                      </div>
                      <ul className="space-y-2">
                        {report.ad.overallStrategy?.tips?.map((tip: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Section 3: Ad Budget Allocation */}
              {report.ad && (
                <section>
                  <SectionHeader icon={DollarSign} title="広告予算配分" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="border border-border/60">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Google</Badge>
                        </div>
                        <p className="text-xl font-bold text-foreground">¥{report.ad.googleAds?.monthlyBudget?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">月間予算</p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <p>CTR: {report.ad.googleAds?.expectedCTR}</p>
                          <p>CPA: {report.ad.googleAds?.expectedCPA}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-border/60">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Meta</Badge>
                        </div>
                        <p className="text-xl font-bold text-foreground">¥{report.ad.metaAds?.monthlyBudget?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">月間予算</p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <p>CPM: {report.ad.metaAds?.expectedCPM}</p>
                          <p>CTR: {report.ad.metaAds?.expectedCTR}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-border/60">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">合計</Badge>
                        </div>
                        <p className="text-xl font-bold text-foreground">¥{report.ad.overallStrategy?.monthlyTotalBudget?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">月間合計予算</p>
                        <div className="mt-3 text-xs text-muted-foreground">
                          <p>期待ROAS: {report.ad.overallStrategy?.expectedROAS}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {/* Section 4: Flyer Plan */}
              {report.flyer && (
                <section>
                  <SectionHeader icon={Newspaper} title="チラシ出稿案" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <MetricCard label="合計部数" value={`${report.flyer.totalQuantity?.toLocaleString()}部`} />
                    <MetricCard label="合計費用" value={`¥${report.flyer.estimatedCost?.totalCost?.toLocaleString()}`} />
                    <MetricCard label="期待反応率" value={report.flyer.expectedResponseRate} />
                    <MetricCard label="期待ROI" value={report.flyer.expectedROI} />
                  </div>
                  <Card className="border border-border/60">
                    <CardContent className="p-5 space-y-3">
                      {report.flyer.distributionAreas?.map((area: any, i: number) => (
                        <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-border/60">
                          <div>
                            <p className="text-sm font-bold text-foreground">{area.areaName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{area.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              推奨部数: {area.recommendedQuantity?.toLocaleString()} / ターゲット: {area.targetDescription}
                            </p>
                          </div>
                          <Badge variant={area.priority === "高" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                            {area.priority}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </section>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
