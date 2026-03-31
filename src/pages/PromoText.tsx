import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, RefreshCw, Loader2, Feather, Zap, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { getDiagnosis, runAIDiagnosis, type PromoTexts } from "@/lib/diagnosisService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const tabs = ["Googleビジネスプロフィール", "Instagram", "X", "チラシ", "LINE", "広告見出し"];

async function adjustPromoText(text: string, tone: "soft" | "strong" | "alternative"): Promise<string> {
  const { data, error } = await supabase.functions.invoke("adjust-promo", {
    body: { text, tone },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.result;
}

export default function PromoText() {
  const { id } = useParams<{ id: string }>();
  const [regenerating, setRegenerating] = useState(false);
  const [adjustingKey, setAdjustingKey] = useState<string | null>(null);

  const { data: diagnosis, isLoading, error, refetch } = useQuery({
    queryKey: ["diagnosis", id],
    queryFn: () => getDiagnosis(id!),
    enabled: !!id,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("クリップボードにコピーしました");
  };

  const handleRegenerate = async () => {
    if (!id) return;
    setRegenerating(true);
    try {
      await runAIDiagnosis(id, "promo");
      await refetch();
      toast.success("販促文を再生成しました");
    } catch (err: any) {
      toast.error(err.message || "再生成に失敗しました");
    } finally {
      setRegenerating(false);
    }
  };

  const handleAdjust = async (tab: string, index: number, tone: "soft" | "strong" | "alternative") => {
    const texts = (diagnosis?.promo_texts || {}) as PromoTexts;
    const originalText = texts[tab]?.[index];
    if (!originalText) return;

    const key = `${tab}-${index}-${tone}`;
    setAdjustingKey(key);
    try {
      const adjusted = await adjustPromoText(originalText, tone);
      // Replace the text in the current promo_texts
      const updatedTexts = { ...texts };
      updatedTexts[tab] = [...(updatedTexts[tab] || [])];
      updatedTexts[tab][index] = adjusted;
      // Update in DB
      await supabase.from("diagnoses").update({ promo_texts: updatedTexts as any }).eq("id", id!);
      await refetch();
      const labels = { soft: "やわらかく", strong: "力強く", alternative: "別案" };
      toast.success(`${labels[tone]}調整しました`);
    } catch (err: any) {
      toast.error(err.message || "調整に失敗しました");
    } finally {
      setAdjustingKey(null);
    }
  };

  if (isLoading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (error || !diagnosis) {
    return <Layout><div className="min-h-[60vh] flex flex-col items-center justify-center gap-4"><p className="text-destructive">データが見つかりません</p><Link to="/dashboard"><Button variant="outline">ダッシュボードに戻る</Button></Link></div></Layout>;
  }

  const texts = (diagnosis.promo_texts || {}) as PromoTexts;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">販促文の自動生成</h1>
          <p className="text-muted-foreground">{diagnosis.store_name} — 媒体ごとの販促文</p>
        </div>

        {Object.keys(texts).length === 0 ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">販促文を生成中です…</p>
          </div>
        ) : (
          <Tabs defaultValue={tabs[0]}>
            <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">{t}</TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {(texts[tab] || []).map((text, i) => {
                  const isAdjusting = (tone: string) => adjustingKey === `${tab}-${i}-${tone}`;
                  return (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <p className="whitespace-pre-wrap text-sm text-foreground mb-4 leading-relaxed">{text}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleCopy(text)}>
                            <Copy className="w-3.5 h-3.5" />コピー
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleAdjust(tab, i, "soft")} disabled={!!adjustingKey}>
                            {isAdjusting("soft") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Feather className="w-3.5 h-3.5" />}
                            やわらかく
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleAdjust(tab, i, "strong")} disabled={!!adjustingKey}>
                            {isAdjusting("strong") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                            力強く
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleAdjust(tab, i, "alternative")} disabled={!!adjustingKey}>
                            {isAdjusting("alternative") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
                            別案を出す
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline" className="gap-2" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            販促文を再生成
          </Button>
          <Link to={`/kpi/${id}`}>
            <Button className="gap-2">KPI設計を見る</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
