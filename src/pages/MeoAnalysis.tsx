import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, Loader2, Copy, CheckCircle2, AlertTriangle, ArrowUp, Minus, ArrowDown, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MeoImprovement {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  impact: "low" | "medium" | "high";
}

interface PostSuggestion {
  title: string;
  body: string;
  cta: string;
  imageDescription: string;
}

interface MeoResult {
  meoScore: number;
  profileScore: number;
  reviewScore: number;
  localSeoScore: number;
  improvements: MeoImprovement[];
  postSuggestions: PostSuggestion[];
  competitiveInsight: string;
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const bgColor = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <Progress value={score} className="h-2 w-20" />
      <span className="text-[10px] text-muted-foreground">/ 100</span>
    </div>
  );
}

function DifficultyBadge({ difficulty, t }: { difficulty: string; t: (k: string) => string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
    easy: { variant: "secondary", label: t("meo.easy") },
    medium: { variant: "default", label: t("meo.medium") },
    hard: { variant: "destructive", label: t("meo.hard") },
  };
  const c = config[difficulty] || config.medium;
  return <Badge variant={c.variant} className="text-[10px]">{c.label}</Badge>;
}

function ImpactBadge({ impact, t }: { impact: string; t: (k: string) => string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    high: { icon: <ArrowUp className="w-3 h-3" />, label: t("meo.highImpact"), className: "text-green-600" },
    medium: { icon: <Minus className="w-3 h-3" />, label: t("meo.mediumImpact"), className: "text-yellow-600" },
    low: { icon: <ArrowDown className="w-3 h-3" />, label: t("meo.lowImpact"), className: "text-muted-foreground" },
  };
  const c = config[impact] || config.medium;
  return <span className={`flex items-center gap-1 text-xs font-medium ${c.className}`}>{c.icon}{c.label}</span>;
}

export default function MeoAnalysis() {
  const { t, language } = useLanguage();
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [currentRating, setCurrentRating] = useState("");
  const [monthlyReviews, setMonthlyReviews] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeoResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!storeName.trim()) { toast.error(t("meo.errStoreName")); return; }
    if (!address.trim()) { toast.error(t("meo.errAddress")); return; }
    if (!industry.trim()) { toast.error(t("meo.errIndustry")); return; }

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("meo-analysis", {
        body: {
          storeName: storeName.trim(),
          address: address.trim(),
          industry: industry.trim(),
          currentRating: currentRating ? parseFloat(currentRating) : undefined,
          monthlyReviews: monthlyReviews ? parseInt(monthlyReviews, 10) : undefined,
          language,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      toast.success(t("meo.analysisComplete"));
    } catch (e: any) {
      console.error("MEO analysis error:", e);
      toast.error(t("meo.analysisFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPost = (idx: number, post: PostSuggestion) => {
    const text = `${post.title}\n\n${post.body}\n\n${post.cta}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success(t("meo.copied"));
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <Badge variant="outline" className="gap-1"><Star className="w-3 h-3" />{t("meo.badge")}</Badge>
          <h1 className="text-2xl font-bold tracking-tight">{t("meo.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("meo.subtitle")}</p>
        </motion.div>

        {/* Input Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("meo.storeName")} <span className="text-red-500">*</span></label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder={t("meo.storeNamePh")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("meo.industry")} <span className="text-red-500">*</span></label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={t("meo.industryPh")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("meo.address")} <span className="text-red-500">*</span></label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("meo.addressPh")} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("meo.currentRating")} <span className="text-muted-foreground text-xs">({t("meo.optional")})</span></label>
                  <Input type="number" min="1" max="5" step="0.1" value={currentRating} onChange={(e) => setCurrentRating(e.target.value)} placeholder={t("meo.currentRatingPh")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("meo.monthlyReviews")} <span className="text-muted-foreground text-xs">({t("meo.optional")})</span></label>
                  <Input type="number" min="0" value={monthlyReviews} onChange={(e) => setMonthlyReviews(e.target.value)} placeholder={t("meo.monthlyReviewsPh")} />
                </div>
              </div>
              <Button onClick={handleAnalyze} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("meo.analyzing")}</> : <><Star className="w-4 h-4 mr-2" />{t("meo.analyze")}</>}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {t("meo.scoreCard")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="rounded-lg border border-border/60 bg-background">
                    <ScoreGauge score={result.meoScore} label={t("meo.overallScore")} />
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background">
                    <ScoreGauge score={result.profileScore} label={t("meo.profileScore")} />
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background">
                    <ScoreGauge score={result.reviewScore} label={t("meo.reviewScore")} />
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background">
                    <ScoreGauge score={result.localSeoScore} label={t("meo.localSeoScore")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Improvements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {t("meo.improvements")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.improvements.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-border/60 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <div className="flex items-center gap-2">
                        <DifficultyBadge difficulty={item.difficulty} t={t} />
                        <ImpactBadge impact={item.impact} t={t} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Post Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="w-5 h-5 text-blue-500" />
                  {t("meo.postSuggestions")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.postSuggestions.map((post, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-lg border border-border/60 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm">{post.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-7 px-2 text-xs"
                        onClick={() => handleCopyPost(i, post)}
                      >
                        {copiedIdx === i ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {t("meo.copy")}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.body}</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">CTA</Badge>
                        <span className="text-xs font-medium">{post.cta}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{t("meo.imageLabel")}</Badge>
                        <span className="text-xs text-muted-foreground">{post.imageDescription}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Competitive Insight */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {t("meo.competitiveInsight")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.competitiveInsight}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
