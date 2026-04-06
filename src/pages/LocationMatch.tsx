import { useState } from "react";
import {
  MapPin, Loader2, Search, Target, TrendingUp, Shield, AlertTriangle,
  Crown, Building2, Megaphone, Newspaper, Users, ChevronRight, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

type LocationItem = {
  rank: number;
  areaName: string;
  matchScore: number;
  population: string;
  mainTarget: string;
  strengths: string[];
  risks: string[];
  storeOpeningAdvice: string;
  adStrategy: string;
  flyerStrategy: string;
  estimatedMonthlyCustomers: string;
  competitionLevel: string;
  rentEstimate: string;
};

type ComparisonRow = {
  areaName: string;
  matchScore: number;
  competitionLevel: string;
  targetFit: string;
  costEfficiency: string;
  growthPotential: string;
};

type LocationMatchResult = {
  summary: string;
  recommendedLocations: LocationItem[];
  comparisonTable: ComparisonRow[];
  overallRecommendation: {
    bestArea: string;
    reason: string;
    actionPlan: string[];
    budgetGuide: string;
  };
};

const scoreColor = (s: number) => {
  if (s >= 80) return "text-green-600 dark:text-green-400";
  if (s >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const scoreBg = (s: number) => {
  if (s >= 80) return "bg-green-500";
  if (s >= 60) return "bg-amber-500";
  return "bg-red-500";
};

const compLevelBadge = (level: string) => {
  if (level === "低") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (level === "中") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
};

export default function LocationMatch() {
  const [industry, setIndustry] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LocationMatchResult | null>(null);
  const [selectedArea, setSelectedArea] = useState<number>(0);

  const runMatch = async () => {
    if (!industry) { toast.error("業種を入力してください"); return; }
    if (!serviceDescription) { toast.error("サービス内容を入力してください"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("location-match", {
        body: { industry, serviceDescription, targetAudience, budget, currentLocation, preferences },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      setSelectedArea(0);
      toast.success("エリアマッチング分析が完了しました");
    } catch (e: any) {
      toast.error(e.message || "分析に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const loc = result?.recommendedLocations?.[selectedArea];

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <MapPin className="w-3.5 h-3.5" />
              エリアマッチング
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">ロケーションマッチング</h1>
            <p className="text-sm text-muted-foreground mt-1">
              あなたのサービスに最適な出店・広告・チラシ配布エリアをAIが提案します。
            </p>
          </motion.div>

          {/* Input Form */}
          <motion.div {...fadeUp}>
            <Card className="border border-border/60 shadow-sm mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">業種 *</label>
                    <Input placeholder="例: 美容院、カフェ、学習塾" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">予算規模（任意）</label>
                    <Input placeholder="例: 初期投資500万円、月額30万円" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">希望エリア・現在地（任意）</label>
                    <Input placeholder="例: 東京都内、大阪市周辺" value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">ターゲット層（任意）</label>
                    <Input placeholder="例: 20〜30代女性、ファミリー層" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">サービス内容 *</label>
                  <Textarea
                    placeholder="例: オーガニック食材を使ったヘルシーカフェ。テイクアウトとイートイン両対応。WiFi完備でリモートワーカーにも対応。"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">その他の条件（任意）</label>
                  <Textarea
                    placeholder="例: 駅徒歩5分以内、家賃は月30万円以下、競合が少ないエリア希望"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button onClick={runMatch} disabled={loading} className="w-full sm:w-auto gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? "エリア分析中..." : "AIでエリアマッチング"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
              {/* Summary */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      分析結果の概要
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Best Pick Banner */}
              <motion.div variants={fadeUp}>
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                        <Crown className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-primary mb-1">AIの最終推奨</p>
                        <p className="text-lg font-bold text-foreground">{result.overallRecommendation.bestArea}</p>
                        <p className="text-sm text-muted-foreground mt-1">{result.overallRecommendation.reason}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          💰 初期投資目安: {result.overallRecommendation.budgetGuide}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Area Ranking Cards */}
              <motion.div variants={fadeUp}>
                <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  推奨エリアランキング
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-4">
                  {result.recommendedLocations.map((loc, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedArea(i)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedArea === i
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          #{loc.rank}
                        </span>
                        <span className={`text-sm font-bold ${scoreColor(loc.matchScore)}`}>
                          {loc.matchScore}点
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{loc.areaName}</p>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Selected Area Detail */}
              {loc && (
                <motion.div variants={fadeUp} key={selectedArea}>
                  <Card className="border border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          {loc.areaName}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${scoreColor(loc.matchScore)}`}>
                            {loc.matchScore}
                          </span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <Progress value={loc.matchScore} className={`h-2 mt-2 [&>div]:${scoreBg(loc.matchScore)}`} />
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: "推定人口", value: loc.population, icon: Users },
                          { label: "主要ターゲット", value: loc.mainTarget, icon: Target },
                          { label: "競合密度", value: loc.competitionLevel, icon: Shield },
                          { label: "家賃相場", value: loc.rentEstimate, icon: Building2 },
                        ].map((s) => (
                          <div key={s.label} className="p-3 rounded-lg border border-border/60 bg-card">
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                              <s.icon className="w-3.5 h-3.5" />
                              {s.label}
                            </div>
                            <p className="text-sm font-bold text-foreground">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        月間見込み顧客数: <span className="font-bold text-foreground">{loc.estimatedMonthlyCustomers}</span>
                      </p>

                      {/* Strengths & Risks */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" /> 強み
                          </p>
                          <ul className="space-y-1.5">
                            {loc.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ChevronRight className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> リスク
                          </p>
                          <ul className="space-y-1.5">
                            {loc.risks.map((r, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ChevronRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Strategy Tabs */}
                      <Tabs defaultValue="store" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="store" className="text-xs gap-1">
                            <Building2 className="w-3.5 h-3.5" /> 出店
                          </TabsTrigger>
                          <TabsTrigger value="ad" className="text-xs gap-1">
                            <Megaphone className="w-3.5 h-3.5" /> 広告
                          </TabsTrigger>
                          <TabsTrigger value="flyer" className="text-xs gap-1">
                            <Newspaper className="w-3.5 h-3.5" /> チラシ
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="store" className="mt-3">
                          <div className="p-4 rounded-lg border border-border/60 bg-card">
                            <p className="text-sm text-muted-foreground leading-relaxed">{loc.storeOpeningAdvice}</p>
                          </div>
                        </TabsContent>
                        <TabsContent value="ad" className="mt-3">
                          <div className="p-4 rounded-lg border border-border/60 bg-card">
                            <p className="text-sm text-muted-foreground leading-relaxed">{loc.adStrategy}</p>
                          </div>
                        </TabsContent>
                        <TabsContent value="flyer" className="mt-3">
                          <div className="p-4 rounded-lg border border-border/60 bg-card">
                            <p className="text-sm text-muted-foreground leading-relaxed">{loc.flyerStrategy}</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Comparison Table */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">エリア比較表</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/60">
                            <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">エリア</th>
                            <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">スコア</th>
                            <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">競合</th>
                            <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">ターゲット適合</th>
                            <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">コスト効率</th>
                            <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">成長性</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.comparisonTable.map((row, i) => (
                            <tr key={i} className="border-b border-border/30 last:border-0">
                              <td className="py-2.5 px-3 font-medium text-foreground">{row.areaName}</td>
                              <td className={`py-2.5 px-3 text-center font-bold ${scoreColor(row.matchScore)}`}>{row.matchScore}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${compLevelBadge(row.competitionLevel)}`}>
                                  {row.competitionLevel}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-muted-foreground">{row.targetFit}</td>
                              <td className="py-2.5 px-3 text-center text-muted-foreground">{row.costEfficiency}</td>
                              <td className="py-2.5 px-3 text-center text-muted-foreground">{row.growthPotential}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Action Plan */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      具体的アクションプラン
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.overallRecommendation.actionPlan.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}>
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
