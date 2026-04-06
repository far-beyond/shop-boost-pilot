import { useState } from "react";
import {
  Megaphone, Loader2, Search, Copy, Check, Target, TrendingUp,
  DollarSign, Users, Lightbulb, MousePointerClick, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { exportAdProposalPDF } from "@/lib/adPdfExport";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

type GoogleKeyword = { keyword: string; matchType: string; estimatedCPC: number; priority: string };
type GoogleAdCopy = { headline1: string; headline2: string; headline3: string; description1: string; description2: string };
type MetaAudience = { name: string; ageRange: string; gender: string; interests: string[]; estimatedReach: string };
type MetaCreative = { format: string; primaryText: string; headline: string; description: string; callToAction: string };

type AdProposalResult = {
  summary: string;
  googleAds: {
    campaignType: string;
    dailyBudget: number;
    monthlyBudget: number;
    keywords: GoogleKeyword[];
    adCopies: GoogleAdCopy[];
    expectedCTR: string;
    expectedCPA: string;
  };
  metaAds: {
    campaignObjective: string;
    dailyBudget: number;
    monthlyBudget: number;
    targetAudiences: MetaAudience[];
    adCreatives: MetaCreative[];
    expectedCPM: string;
    expectedCTR: string;
  };
  overallStrategy: {
    recommendedPlatform: string;
    reason: string;
    monthlyTotalBudget: number;
    expectedROAS: string;
    tips: string[];
  };
};

const priorityColor = (p: string) => {
  if (p === "高") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (p === "中") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
};

export default function AdProposal() {
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdProposalResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const runProposal = async () => {
    if (!address) { toast.error("住所を入力してください"); return; }
    if (!industry) { toast.error("業種を入力してください"); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ad-proposal", {
        body: { address, industry, budget, target, storeName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      toast.success("広告提案が完成しました");
    } catch (e: any) {
      toast.error(e.message || "提案の生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("コピーしました");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              広告提案
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">広告プランナー</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AIがGoogle広告・Meta広告の最適プランを自動設計します。
            </p>
          </motion.div>

          {/* Input Form */}
          <motion.div {...fadeUp}>
            <Card className="border border-border/60 shadow-sm mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">店舗所在地 *</label>
                    <Input placeholder="例: 東京都渋谷区神南1丁目" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">業種 *</label>
                    <Input placeholder="例: 美容院、学習塾、居酒屋" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">店舗名（任意）</label>
                    <Input placeholder="例: ヘアサロン BLOOM" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">月間広告予算（任意）</label>
                    <Input placeholder="例: 5万円、10万円" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ターゲット層（任意）</label>
                  <Textarea placeholder="例: 30〜40代の子育て世帯、近隣のオフィスワーカー" value={target} onChange={(e) => setTarget(e.target.value)} rows={2} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={runProposal} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? "提案生成中..." : "AIで広告提案を作成"}
                  </Button>
                  {result && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => exportAdProposalPDF(result, { storeName, address, industry })}
                    >
                      <FileDown className="w-4 h-4" />
                      PDFダウンロード
                    </Button>
                  )}
                </div>
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
                      <Lightbulb className="w-4 h-4 text-primary" />
                      広告戦略の概要
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Overall Strategy Stats */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "推奨プラットフォーム", value: result.overallStrategy.recommendedPlatform, icon: Target },
                  { label: "月間合計予算", value: `¥${result.overallStrategy.monthlyTotalBudget.toLocaleString()}`, icon: DollarSign },
                  { label: "期待ROAS", value: result.overallStrategy.expectedROAS, icon: TrendingUp },
                  { label: "Google CPA", value: result.googleAds.expectedCPA, icon: MousePointerClick },
                ].map((s) => (
                  <Card key={s.label} className="border border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <s.icon className="w-3.5 h-3.5" />
                        {s.label}
                      </div>
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>

              {/* Tabs: Google vs Meta */}
              <motion.div variants={fadeUp}>
                <Tabs defaultValue="google" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="google">Google 広告</TabsTrigger>
                    <TabsTrigger value="meta">Meta 広告</TabsTrigger>
                  </TabsList>

                  {/* Google Ads */}
                  <TabsContent value="google" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">キャンペーンタイプ</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.googleAds.campaignType}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">日予算</p>
                          <p className="text-sm font-bold text-foreground mt-1">¥{result.googleAds.dailyBudget.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">期待CTR</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.googleAds.expectedCTR}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Keywords */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">推奨キーワード</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {result.googleAds.keywords.map((kw, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColor(kw.priority)}`}>
                                  {kw.priority}
                                </span>
                                <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px]">{kw.matchType}</Badge>
                                <span>¥{kw.estimatedCPC}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ad Copies */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">広告文案</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.googleAds.adCopies.map((ad, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border/60 bg-card relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                              onClick={() => copyText(`${ad.headline1} | ${ad.headline2} | ${ad.headline3}\n${ad.description1}\n${ad.description2}`, `g-${i}`)}
                            >
                              {copiedKey === `g-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                            <p className="text-primary font-bold text-sm mb-1">
                              {ad.headline1} | {ad.headline2} | {ad.headline3}
                            </p>
                            <p className="text-xs text-muted-foreground">{ad.description1}</p>
                            <p className="text-xs text-muted-foreground">{ad.description2}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Meta Ads */}
                  <TabsContent value="meta" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">キャンペーン目的</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.metaAds.campaignObjective}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">日予算</p>
                          <p className="text-sm font-bold text-foreground mt-1">¥{result.metaAds.dailyBudget.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">期待CPM / CTR</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.metaAds.expectedCPM} / {result.metaAds.expectedCTR}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Target Audiences */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          ターゲットオーディエンス
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.metaAds.targetAudiences.map((aud, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border/60 bg-card">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-bold text-foreground">{aud.name}</p>
                              <Badge variant="outline" className="text-[10px]">{aud.estimatedReach}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                              <span>年齢: {aud.ageRange}</span>
                              <span>性別: {aud.gender}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {aud.interests.map((int, j) => (
                                <Badge key={j} variant="secondary" className="text-[10px]">{int}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Ad Creatives */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">広告クリエイティブ案</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.metaAds.adCreatives.map((cr, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border/60 bg-card relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                              onClick={() => copyText(`${cr.headline}\n${cr.primaryText}\n${cr.description}`, `m-${i}`)}
                            >
                              {copiedKey === `m-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-[10px]">{cr.format}</Badge>
                              <Badge className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20">{cr.callToAction}</Badge>
                            </div>
                            <p className="text-sm font-bold text-foreground mb-1">{cr.headline}</p>
                            <p className="text-xs text-muted-foreground mb-1">{cr.primaryText}</p>
                            <p className="text-xs text-muted-foreground">{cr.description}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>

              {/* Strategy & Tips */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      総合戦略・運用Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-sm font-bold text-foreground mb-1">
                        推奨: {result.overallStrategy.recommendedPlatform}
                      </p>
                      <p className="text-xs text-muted-foreground">{result.overallStrategy.reason}</p>
                    </div>
                    <ul className="space-y-2">
                      {result.overallStrategy.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span>
                          <span>{tip}</span>
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
