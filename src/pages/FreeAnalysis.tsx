import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  MapPin, Users, Home, TrendingUp, Loader2, Search, Building2,
  Share2, Lock, ArrowRight, Sparkles, Shield, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  fetchMapAreaAnalysis,
  type MapAreaAnalysisResult,
} from "@/lib/mapAreaService";

const FREE_LIMIT = 3;
const STORAGE_KEY = "mapboost_free_count";

function getUsageCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

function incrementUsage(): number {
  const next = getUsageCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export default function FreeAnalysis() {
  const { t, language } = useLanguage();
  const isEn = language === "en";

  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MapAreaAnalysisResult | null>(null);
  const [limitReached, setLimitReached] = useState(getUsageCount() >= FREE_LIMIT);

  const handleAnalyze = useCallback(async () => {
    if (!address.trim()) {
      toast.error(t("free.errorNoAddress"));
      return;
    }
    if (getUsageCount() >= FREE_LIMIT) {
      setLimitReached(true);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await fetchMapAreaAnalysis(address, "1km", industry || undefined, language);
      setResult(data);
      incrementUsage();
      if (getUsageCount() >= FREE_LIMIT) setLimitReached(true);
    } catch (err: any) {
      toast.error(err?.message || t("free.errorGeneral"));
    } finally {
      setLoading(false);
    }
  }, [address, industry, language, t]);

  const score = result?.summary?.tradeAreaScore ?? 0;

  const shareText = isEn
    ? `I analyzed my trade area with MapBoost AI! Score: ${score}/100 #MapBoost`
    : `MapBoost AIで商圏分析してみた！スコア: ${score}/100 #MapBoost`;

  const shareUrl = "https://boost.share-map.net/free-analysis";

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsl(217 91% 60% / 0.08), hsl(280 80% 60% / 0.06), hsl(217 91% 60% / 0.04))" }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="free-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(217 91% 55%)" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#free-grid)" />
          </svg>

          <div className="container mx-auto px-4 max-w-3xl relative z-10">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {t("free.badge")}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight tracking-tight mb-4">
                {t("free.headline")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                {t("free.subtext")}
              </p>
            </motion.div>

            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {limitReached && !result ? (
                <Card className="border-orange-300 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                  <CardContent className="p-8 text-center">
                    <Lock className="w-10 h-10 mx-auto mb-4 text-orange-500" />
                    <h3 className="text-lg font-semibold mb-2">{t("free.limitReached")}</h3>
                    <p className="text-muted-foreground mb-6">{t("free.limitMessage")}</p>
                    <Link to="/auth">
                      <Button size="lg" className="gap-2">
                        {t("free.signupCta")}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-xl border-border/60">
                  <CardContent className="p-6 md:p-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          <MapPin className="w-4 h-4 inline mr-1.5 text-primary" />
                          {t("free.addressLabel")}
                        </label>
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t("free.addressPlaceholder")}
                          className="h-14 text-lg"
                          disabled={loading}
                          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                          <Building2 className="w-4 h-4 inline mr-1.5" />
                          {t("free.industryLabel")}
                        </label>
                        <Input
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder={t("free.industryPlaceholder")}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                      <Button
                        size="lg"
                        className="w-full h-14 text-lg gap-2 shadow-lg hover:shadow-xl transition-all"
                        onClick={handleAnalyze}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t("free.analyzing")}
                          </>
                        ) : (
                          <>
                            <Search className="w-5 h-5" />
                            {t("free.startButton")}
                          </>
                        )}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground/70 flex items-center justify-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        {t("free.noLoginRequired")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {loading && (
            <motion.section
              className="py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="container mx-auto px-4 max-w-3xl">
                <Card>
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-muted-foreground">{t("free.loadingMessage")}</p>
                      <div className="w-full max-w-md space-y-3 mt-4">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.section
              className="py-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="container mx-auto px-4 max-w-3xl space-y-6">
                {/* Score Header */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                          <circle
                            cx="40" cy="40" r="34" fill="none"
                            stroke="hsl(var(--primary))" strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(score / 100) * 213.6} 213.6`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-primary">
                          {score}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{t("free.scoreTitle")}</h2>
                        <p className="text-sm text-muted-foreground">
                          {score >= 70 ? t("free.scoreHigh") : score >= 40 ? t("free.scoreMedium") : t("free.scoreLow")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Users, label: t("free.population"), value: result.summary.totalPopulation.toLocaleString(), color: "text-blue-600" },
                    { icon: Home, label: t("free.households"), value: result.summary.totalHouseholds.toLocaleString(), color: "text-green-600" },
                    { icon: Building2, label: t("free.competitors"), value: String(result.summary.competitorCount), color: "text-orange-600" },
                    { icon: TrendingUp, label: t("free.tradeAreaScore"), value: `${score}/100`, color: "text-purple-600" },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                    >
                      <Card>
                        <CardContent className="p-4 text-center">
                          <m.icon className={`w-5 h-5 mx-auto mb-1 ${m.color}`} />
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <p className="text-lg font-bold">{m.value}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Age Distribution */}
                {result.summary.ageDistribution.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">{t("free.ageDistribution")}</h3>
                        <div className="space-y-2.5">
                          {result.summary.ageDistribution.map((ag, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-16 shrink-0 text-right">{ag.ageGroup}</span>
                              <div className="flex-1">
                                <Progress value={ag.percentage} className="h-3" />
                              </div>
                              <span className="text-xs font-medium w-12 text-right">{ag.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Recommendations - First visible, rest blurred */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        {t("free.recommendations")}
                      </h3>

                      {/* First recommendation - visible */}
                      {result.summary.recommendations[0] && (
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
                          <p className="text-sm">{result.summary.recommendations[0]}</p>
                        </div>
                      )}

                      {/* Remaining recommendations - blurred with CTA */}
                      {result.summary.recommendations.length > 1 && (
                        <div className="relative">
                          <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden="true">
                            {result.summary.recommendations.slice(1).map((rec, i) => (
                              <div key={i} className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>

                          {/* CTA Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background/60 to-background/90 rounded-lg">
                            <div className="text-center p-4">
                              <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-medium mb-3">{t("free.unlockMessage")}</p>
                              <Link to="/auth">
                                <Button size="sm" className="gap-1.5">
                                  {t("free.signupToUnlock")}
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Social Share */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card>
                    <CardContent className="p-6 text-center">
                      <h3 className="font-semibold mb-3 flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        {t("free.shareTitle")}
                      </h3>
                      <div className="flex items-center justify-center gap-3">
                        <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            {t("free.shareX")}
                          </Button>
                        </a>
                        <a href={lineShareUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                            </svg>
                            {t("free.shareLine")}
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-center py-6"
                >
                  <p className="text-muted-foreground mb-4">{t("free.bottomCtaText")}</p>
                  <Link to="/auth">
                    <Button size="lg" className="gap-2 px-10 shadow-lg">
                      {t("free.bottomCtaButton")}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground/60 mt-3">{t("free.remainingUses")}{Math.max(0, FREE_LIMIT - getUsageCount())}{t("free.remainingUsesSuffix")}</p>
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
