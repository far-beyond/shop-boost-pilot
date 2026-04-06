import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Newspaper, MapPin, Loader2, Search, Copy, Check, Lightbulb,
  CalendarDays, DollarSign, Target, TrendingUp, FileText, Megaphone, Download,
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
import { exportFlyerPlanPDF } from "@/lib/flyerPdfExport";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

type DistributionArea = {
  areaName: string;
  reason: string;
  estimatedHouseholds: number;
  recommendedQuantity: number;
  priority: "高" | "中" | "低";
  targetDescription: string;
};

type Catchcopy = {
  headline: string;
  subCopy: string;
  tone: string;
  targetAudience: string;
  callToAction: string;
};

type FlyerPlan = {
  summary: string;
  distributionAreas: DistributionArea[];
  totalQuantity: number;
  estimatedCost: {
    printingCostPerUnit: number;
    distributionCostPerUnit: number;
    totalPrintingCost: number;
    totalDistributionCost: number;
    totalCost: number;
  };
  timing: {
    bestDays: string[];
    bestTimeSlots: string[];
    seasonalTips: string;
    frequency: string;
  };
  catchcopies: Catchcopy[];
  designTips: string[];
  expectedResponseRate: string;
  expectedROI: string;
};

const priorityColor = (p: string) => {
  if (p === "高") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (p === "中") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
};

export default function FlyerPlan() {
  const { t, language } = useLanguage();
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FlyerPlan | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const runPlan = async () => {
    if (!address) { toast.error(t("common.enterAddress")); return; }
    if (!industry) { toast.error(t("common.enterIndustry")); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("flyer-plan", {
        body: { address, industry, budget, target, storeName, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      toast.success(t("flyer.planComplete"));
    } catch (e: any) {
      toast.error(e.message || t("flyer.planFailed"));
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const areaChartData = result?.distributionAreas.map((a) => ({
    name: a.areaName,
    quantity: a.recommendedQuantity,
    households: a.estimatedHouseholds,
  })) || [];

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent mb-2">
              <Newspaper className="w-3.5 h-3.5" />
              {t("flyer.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("flyer.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("flyer.subtitle")}
            </p>
          </motion.div>

          {/* Input Form */}
          <motion.div {...fadeUp}>
            <Card className="border border-border/60 shadow-sm mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("flyer.storeLocation")} *</label>
                    <Input
                      placeholder={t("flyer.addressPh")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("flyer.industry")} *</label>
                    <Input
                      placeholder={t("flyer.industryPh")}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("flyer.storeName")}</label>
                    <Input
                      placeholder={t("flyer.storeNamePh")}
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("flyer.budget")}</label>
                    <Input
                      placeholder={t("flyer.budgetPh")}
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("flyer.targetAudience")}</label>
                  <Textarea
                    placeholder={t("flyer.targetPh")}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button onClick={runPlan} disabled={loading} className="w-full sm:w-auto gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? t("flyer.generating") : t("flyer.generate")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
              {/* PDF Export + Summary */}
              <motion.div variants={fadeUp} className="flex justify-end">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => result && exportFlyerPlanPDF(result, { storeName, address, industry })}
                >
                  <Download className="w-4 h-4" />
                  {t("flyer.pdfDownload")}
                </Button>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {t("flyer.summary")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stats Row */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t("flyer.totalQty"), value: result.totalQuantity.toLocaleString() + t("flyer.copies"), icon: Newspaper },
                  { label: t("flyer.totalCost"), value: "¥" + result.estimatedCost.totalCost.toLocaleString(), icon: DollarSign },
                  { label: t("flyer.expectedResponse"), value: result.expectedResponseRate, icon: TrendingUp },
                  { label: t("flyer.expectedROI"), value: result.expectedROI, icon: Target },
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

              {/* Distribution Areas */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t("flyer.distAreas")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.distributionAreas.map((area, i) => (
                      <div key={i} className="p-4 rounded-lg border border-border/60 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{area.areaName}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColor(area.priority)}`}>
                              {t("flyer.priority")}: {area.priority}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {area.recommendedQuantity.toLocaleString()}{t("flyer.copies")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{area.reason}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{t("flyer.estHouseholds")}: {area.estimatedHouseholds.toLocaleString()}</span>
                          <span>{t("flyer.targetDesc")}: {area.targetDescription}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Area Chart */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{t("flyer.areaDistChart")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={areaChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,92%)" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => [v.toLocaleString(), ""]} />
                          <Bar dataKey="quantity" fill="hsl(217,91%,55%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Cost Breakdown & Timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div variants={fadeUp}>
                  <Card className="border border-border/60 h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        {t("flyer.costBreakdown")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {[
                          { label: t("flyer.printUnit"), value: `¥${result.estimatedCost.printingCostPerUnit}${t("flyer.perSheet")}` },
                          { label: t("flyer.distUnit"), value: `¥${result.estimatedCost.distributionCostPerUnit}${t("flyer.perSheet")}` },
                          { label: t("flyer.printTotal"), value: `¥${result.estimatedCost.totalPrintingCost.toLocaleString()}` },
                          { label: t("flyer.distTotal"), value: `¥${result.estimatedCost.totalDistributionCost.toLocaleString()}` },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium text-foreground">{item.value}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between text-sm font-bold">
                          <span className="text-foreground">{t("flyer.total")}</span>
                          <span className="text-primary">¥{result.estimatedCost.totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <Card className="border border-border/60 h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        {t("flyer.timing")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t("flyer.bestDays")}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.timing.bestDays.map((d) => (
                            <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t("flyer.bestTime")}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.timing.bestTimeSlots.map((t) => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t("flyer.frequency")}</p>
                        <p className="text-sm text-foreground">{result.timing.frequency}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t("flyer.seasonalTips")}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{result.timing.seasonalTips}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Catchcopies */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-primary" />
                      {t("flyer.catchcopies")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.catchcopies.map((cc, i) => (
                        <div key={i} className="p-4 rounded-lg border border-border/60 bg-card relative group">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                            onClick={() => copyText(`${cc.headline}\n${cc.subCopy}\n${cc.callToAction}`, i)}
                          >
                            {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                          <p className="text-base font-bold text-foreground mb-1 pr-8">{cc.headline}</p>
                          <p className="text-sm text-muted-foreground mb-2">{cc.subCopy}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{cc.tone}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{cc.targetAudience}</span>
                          </div>
                          <p className="text-xs text-primary font-medium">CTA: {cc.callToAction}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Design Tips */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      {t("flyer.designTips")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.designTips.map((tip, i) => (
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
