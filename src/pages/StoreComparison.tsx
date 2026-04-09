import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  MapPin, Loader2, Search, Trophy, TrendingUp, Users, Home, Building2, Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { fetchMapAreaAnalysis, type MapAreaAnalysisResult } from "@/lib/mapAreaService";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

type LocationEntry = {
  address: string;
  result: MapAreaAnalysisResult | null;
  loading: boolean;
};

function getBestIdx(results: (MapAreaAnalysisResult | null)[], getter: (r: MapAreaAnalysisResult) => number, higher = true): number {
  let best = -1;
  let bestVal = higher ? -Infinity : Infinity;
  results.forEach((r, i) => {
    if (!r) return;
    const v = getter(r);
    if ((higher && v > bestVal) || (!higher && v < bestVal)) { bestVal = v; best = i; }
  });
  return best;
}

export default function StoreComparison() {
  const { t, language } = useLanguage();
  const isEn = language === "en";
  const [industry, setIndustry] = useState("");
  const [radius, setRadius] = useState("3km");
  const [locations, setLocations] = useState<LocationEntry[]>([
    { address: "", result: null, loading: false },
    { address: "", result: null, loading: false },
  ]);

  const updateAddress = (i: number, address: string) => {
    setLocations((prev) => prev.map((loc, idx) => idx === i ? { ...loc, address } : loc));
  };

  const addLocation = () => {
    if (locations.length >= 5) return;
    setLocations((prev) => [...prev, { address: "", result: null, loading: false }]);
  };

  const removeLocation = (i: number) => {
    if (locations.length <= 2) return;
    setLocations((prev) => prev.filter((_, idx) => idx !== i));
  };

  const runComparison = async () => {
    const valid = locations.filter((l) => l.address.trim());
    if (valid.length < 2) { toast.error(isEn ? "Enter at least 2 addresses" : "2つ以上の住所を入力してください"); return; }

    setLocations((prev) => prev.map((l) => ({ ...l, loading: !!l.address.trim(), result: null })));

    const promises = locations.map(async (loc, i) => {
      if (!loc.address.trim()) return null;
      try {
        return await fetchMapAreaAnalysis(loc.address, radius, industry, language);
      } catch (e) {
        console.error(`Analysis failed for ${loc.address}:`, e);
        return null;
      }
    });

    const results = await Promise.all(promises);
    setLocations((prev) => prev.map((l, i) => ({ ...l, loading: false, result: results[i] })));
    toast.success(isEn ? "Comparison complete" : "比較分析が完了しました");
  };

  const results = locations.map((l) => l.result);
  const hasResults = results.some((r) => r !== null);

  const bestPop = getBestIdx(results, (r) => r.summary.totalPopulation);
  const bestHousehold = getBestIdx(results, (r) => r.summary.totalHouseholds);
  const leastCompetitors = getBestIdx(results, (r) => r.summary.competitorCount, false);
  const bestScore = getBestIdx(results, (r) => r.summary.tradeAreaScore);

  // AI recommendation
  const getRecommendation = () => {
    const scored = results.map((r, i) => {
      if (!r) return { i, score: 0, reasons: [] as string[] };
      let score = 0;
      const reasons: string[] = [];
      if (i === bestPop) { score += 30; reasons.push(isEn ? "Highest population" : "人口が最多"); }
      if (i === bestHousehold) { score += 25; reasons.push(isEn ? "Most households" : "世帯数が最多"); }
      if (i === leastCompetitors) { score += 25; reasons.push(isEn ? "Fewest competitors" : "競合が最少"); }
      if (i === bestScore) { score += 20; reasons.push(isEn ? "Best trade area score" : "商圏スコアが最高"); }
      return { i, score, reasons };
    });
    return scored.sort((a, b) => b.score - a.score)[0];
  };

  const recommendation = hasResults ? getRecommendation() : null;

  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444"];

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-6xl">
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <MapPin className="w-3.5 h-3.5" />
              {isEn ? "Location Comparison" : "立地比較分析"}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isEn ? "Compare Multiple Locations" : "複数立地を比較分析"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEn ? "Compare up to 5 locations side by side to find the best one." : "最大5つの立地を並べて比較。最適な出店場所をAIが判定します。"}
            </p>
          </motion.div>

          {/* Input */}
          <motion.div {...fadeUp}>
            <Card className="border border-border/60 shadow-sm mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder={isEn ? "Industry (e.g. Hair salon)" : "業種（例: 美容院、学習塾）"} value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground shrink-0">{isEn ? "Radius:" : "半径:"}</span>
                    {["1km", "3km", "5km"].map((r) => (
                      <button key={r} onClick={() => setRadius(r)} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${radius === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{r}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {locations.map((loc, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: colors[i] }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <Input
                        placeholder={`${isEn ? "Address" : "住所"} ${String.fromCharCode(65 + i)}`}
                        value={loc.address}
                        onChange={(e) => updateAddress(i, e.target.value)}
                        className="flex-1"
                      />
                      {locations.length > 2 && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeLocation(i)}><X className="w-4 h-4" /></Button>
                      )}
                      {loc.loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {locations.length < 5 && (
                    <Button variant="outline" size="sm" className="gap-1" onClick={addLocation}><Plus className="w-3.5 h-3.5" />{isEn ? "Add Location" : "立地を追加"}</Button>
                  )}
                  <Button onClick={runComparison} disabled={locations.some((l) => l.loading)} className="gap-2">
                    {locations.some((l) => l.loading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {isEn ? "Compare" : "比較分析する"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Recommendation */}
          {recommendation && recommendation.reasons.length > 0 && (
            <motion.div {...fadeUp} className="mb-6">
              <Card className="border-2 border-primary/30 bg-primary/5 shadow-md">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                      {isEn ? "AI Recommendation" : "AIおすすめ判定"}
                      <Badge className="text-xs">{isEn ? "Best" : "最適"}</Badge>
                    </h3>
                    <p className="text-sm text-foreground mb-2">
                      <span className="font-bold" style={{ color: colors[recommendation.i] }}>
                        {String.fromCharCode(65 + recommendation.i)}. {locations[recommendation.i]?.address}
                      </span>
                      {isEn ? " is the recommended location." : " がおすすめです。"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {recommendation.reasons.map((r, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Comparison Table */}
          {hasResults && (
            <motion.div {...fadeUp} className="space-y-4">
              {/* Stats comparison */}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${results.filter(Boolean).length}, 1fr)` }}>
                {results.map((r, i) => {
                  if (!r) return null;
                  const isBest = i === bestScore;
                  return (
                    <Card key={i} className={`border ${isBest ? "border-primary/50 ring-2 ring-primary/20" : "border-border/60"}`}>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: colors[i] }}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="truncate">{locations[i].address}</span>
                          {isBest && <Trophy className="w-4 h-4 text-primary shrink-0" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        <MetricRow icon={<Users className="w-3.5 h-3.5" />} label={isEn ? "Population" : "人口"} value={r.summary.totalPopulation.toLocaleString()} best={i === bestPop} />
                        <MetricRow icon={<Home className="w-3.5 h-3.5" />} label={isEn ? "Households" : "世帯数"} value={r.summary.totalHouseholds.toLocaleString()} best={i === bestHousehold} />
                        <MetricRow icon={<Building2 className="w-3.5 h-3.5" />} label={isEn ? "Competitors" : "競合"} value={String(r.summary.competitorCount)} best={i === leastCompetitors} />
                        <MetricRow icon={<TrendingUp className="w-3.5 h-3.5" />} label={isEn ? "Score" : "スコア"} value={`${r.summary.tradeAreaScore}/100`} best={i === bestScore} />

                        {/* Age distribution mini bars */}
                        {r.summary.ageDistribution.length > 0 && (
                          <div className="pt-2 border-t border-border/40">
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase">{isEn ? "Age" : "年齢構成"}</p>
                            {r.summary.ageDistribution.map((ag, j) => (
                              <div key={j} className="flex items-center gap-1 text-[10px] mb-0.5">
                                <span className="w-12 text-muted-foreground truncate">{ag.ageGroup}</span>
                                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${ag.percentage}%`, backgroundColor: colors[j % colors.length] }} />
                                </div>
                                <span className="w-8 text-right">{ag.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recommendations */}
                        {r.summary.recommendations.length > 0 && (
                          <div className="pt-2 border-t border-border/40">
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase">{isEn ? "Insights" : "所見"}</p>
                            {r.summary.recommendations.slice(0, 2).map((rec, j) => (
                              <p key={j} className="text-[10px] text-foreground leading-relaxed">{rec}</p>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function MetricRow({ icon, label, value, best }: { icon: React.ReactNode; label: string; value: string; best: boolean }) {
  return (
    <div className={`flex items-center justify-between text-xs ${best ? "text-primary font-semibold" : "text-foreground"}`}>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="flex items-center gap-1">
        {value}
        {best && <Trophy className="w-3 h-3 text-primary" />}
      </span>
    </div>
  );
}
