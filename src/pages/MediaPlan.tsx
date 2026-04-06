import { useState } from "react";
import {
  Megaphone, Loader2, Search, Newspaper, Monitor, Target,
  TrendingUp, DollarSign, Users, Copy, Check, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

type MediaPlanResult = {
  google: any | null;
  meta: any | null;
  flyer: any | null;
};

export default function MediaPlan() {
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaPlanResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("コピーしました");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runPlan = async () => {
    if (!address) { toast.error("住所を入力してください"); return; }
    if (!industry) { toast.error("業種を入力してください"); return; }

    setLoading(true);
    try {
      const body = { address, industry, budget, target, storeName };
      const [adRes, flyerRes] = await Promise.all([
        supabase.functions.invoke("ad-proposal", { body }),
        supabase.functions.invoke("flyer-plan", { body }),
      ]);

      if (adRes.error) throw adRes.error;
      if (flyerRes.error) throw flyerRes.error;

      const adData = adRes.data?.result;
      const flyerData = flyerRes.data?.result;

      setResult({
        google: adData?.googleAds ?? null,
        meta: adData?.metaAds ?? null,
        flyer: flyerData ?? null,
      });
      toast.success("媒体プランが完成しました");
    } catch (e: any) {
      toast.error(e.message || "プラン生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              媒体プラン
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">統合媒体プランナー</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Google広告・Meta広告・チラシ配布を一括でプランニングします。
            </p>
          </motion.div>

          {/* Input */}
          <motion.div {...fadeUp}>
            <Card className="border border-border/60 mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">店舗所在地 *</label>
                    <Input placeholder="例: 東京都渋谷区神南1丁目" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">業種 *</label>
                    <Input placeholder="例: 美容院、学習塾" value={industry} onChange={(e) => setIndustry(e.target.value)} />
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
                  <label className="text-sm font-medium text-foreground">ターゲット層（任意）</label>
                  <Textarea placeholder="例: 30〜40代の子育て世帯" value={target} onChange={(e) => setTarget(e.target.value)} rows={2} />
                </div>
                <Button onClick={runPlan} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? "プラン生成中..." : "統合媒体プランを作成"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div {...fadeUp}>
              <Tabs defaultValue="meta" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="meta" className="gap-1.5 text-xs sm:text-sm">
                    <Monitor className="w-3.5 h-3.5" /> Meta広告
                  </TabsTrigger>
                  <TabsTrigger value="google" className="gap-1.5 text-xs sm:text-sm">
                    <Target className="w-3.5 h-3.5" /> Google広告
                  </TabsTrigger>
                  <TabsTrigger value="flyer" className="gap-1.5 text-xs sm:text-sm">
                    <Newspaper className="w-3.5 h-3.5" /> チラシ
                  </TabsTrigger>
                </TabsList>

                {/* Meta Tab */}
                <TabsContent value="meta" className="space-y-4 mt-4">
                  {result.meta ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label="キャンペーン目的" value={result.meta.campaignObjective} />
                        <StatCard label="日予算" value={`¥${result.meta.dailyBudget?.toLocaleString()}`} />
                        <StatCard label="期待CPM / CTR" value={`${result.meta.expectedCPM} / ${result.meta.expectedCTR}`} />
                      </div>
                      {result.meta.targetAudiences?.map((aud: any, i: number) => (
                        <Card key={i} className="border border-border/60">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm font-bold text-foreground">{aud.name}</p>
                              <Badge variant="outline" className="text-[10px]">{aud.estimatedReach}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">年齢: {aud.ageRange} / 性別: {aud.gender}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {aud.interests?.map((int: string, j: number) => (
                                <Badge key={j} variant="secondary" className="text-[10px]">{int}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <EmptyState message="Meta広告データがありません" />
                  )}
                </TabsContent>

                {/* Google Tab */}
                <TabsContent value="google" className="space-y-4 mt-4">
                  {result.google ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label="キャンペーンタイプ" value={result.google.campaignType} />
                        <StatCard label="日予算" value={`¥${result.google.dailyBudget?.toLocaleString()}`} />
                        <StatCard label="期待CTR / CPA" value={`${result.google.expectedCTR} / ${result.google.expectedCPA}`} />
                      </div>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">推奨キーワード</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {result.google.keywords?.map((kw: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    kw.priority === "高" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                    kw.priority === "中" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}>{kw.priority}</span>
                                  <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">¥{kw.estimatedCPC}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">広告文案</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {result.google.adCopies?.map((ad: any, i: number) => (
                            <div key={i} className="p-4 rounded-lg border border-border/60 relative group">
                              <Button
                                variant="ghost" size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                onClick={() => copyText(`${ad.headline1} | ${ad.headline2}\n${ad.description1}`, `gc-${i}`)}
                              >
                                {copiedKey === `gc-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                              <p className="text-primary font-bold text-sm mb-1">{ad.headline1} | {ad.headline2} | {ad.headline3}</p>
                              <p className="text-xs text-muted-foreground">{ad.description1}</p>
                              <p className="text-xs text-muted-foreground">{ad.description2}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <EmptyState message="Google広告データがありません" />
                  )}
                </TabsContent>

                {/* Flyer Tab */}
                <TabsContent value="flyer" className="space-y-4 mt-4">
                  {result.flyer ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label="合計部数" value={`${result.flyer.totalQuantity?.toLocaleString()}部`} />
                        <StatCard label="合計費用" value={`¥${result.flyer.estimatedCost?.totalCost?.toLocaleString()}`} />
                        <StatCard label="期待反応率" value={result.flyer.expectedResponseRate} />
                      </div>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            配布エリア
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {result.flyer.distributionAreas?.map((area: any, i: number) => (
                            <div key={i} className="p-4 rounded-lg border border-border/60">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-bold text-foreground">{area.areaName}</p>
                                <Badge variant={area.priority === "高" ? "destructive" : "secondary"} className="text-[10px]">
                                  {area.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{area.reason}</p>
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span>世帯数: {area.estimatedHouseholds?.toLocaleString()}</span>
                                <span>推奨部数: {area.recommendedQuantity?.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">配布タイミング</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1">最適な曜日</p>
                              <p>{result.flyer.timing?.bestDays?.join("、")}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1">最適な時間帯</p>
                              <p>{result.flyer.timing?.bestTimeSlots?.join("、")}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground mb-1">推奨頻度</p>
                              <p>{result.flyer.timing?.frequency}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">キャッチコピー案</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {result.flyer.catchcopies?.map((cc: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border border-border/60 relative group">
                              <Button
                                variant="ghost" size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                onClick={() => copyText(`${cc.headline}\n${cc.subCopy}`, `fc-${i}`)}
                              >
                                {copiedKey === `fc-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                              <p className="text-sm font-bold text-foreground">{cc.headline}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{cc.subCopy}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <EmptyState message="チラシデータがありません" />
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-2 border-border">
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
