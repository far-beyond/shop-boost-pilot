import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Users, Home, TrendingUp, Loader2, Search, Building2, AlertTriangle, CheckCircle2, BarChart3, Database, Sparkles, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { exportAreaAnalysisPDF } from "@/lib/areaAnalysisPdfExport";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

const RADIUS_KEYS = ["area.radius1km", "area.radius3km", "area.radius5km"];
const RADIUS_VALUES = ["1km", "3km", "5km"];

const PIE_COLORS = [
  "hsl(217, 91%, 55%)", "hsl(200, 85%, 52%)", "hsl(162, 63%, 42%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 55%)", "hsl(280, 60%, 55%)",
];

type AreaResult = {
  areaName: string;
  population: number;
  households: number;
  ageDistribution: { ageGroup: string; percentage: number; count: number }[];
  householdTypes: { type: string; percentage: number; count: number }[];
  primaryTarget: string;
  suitableIndustries: { industry: string; reason: string; score: number }[];
  unsuitableIndustries: { industry: string; reason: string }[];
  visitMotivations: string[];
  areaCharacteristics: string;
  competitiveEnvironment: string;
};

type OpeningResult = {
  overallScore: number;
  scoreBreakdown: { category: string; score: number; maxScore: number; comment: string }[];
  successProbability: string;
  targetCustomer: string;
  estimatedUnitPrice: string;
  estimatedVisitFrequency: string;
  riskFactors: { risk: string; severity: string; mitigation: string }[];
  improvements: string[];
  overallComment: string;
};

type CensusData = {
  source: string;
  areaName: string;
  areaCode: string;
  totalPopulation: number;
  totalHouseholds: number;
  ageDistribution: { ageGroup: string; population: number; percentage: number }[];
};

export default function AreaAnalysis() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("area");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState("3km");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [areaResult, setAreaResult] = useState<AreaResult | null>(null);
  const [openingResult, setOpeningResult] = useState<OpeningResult | null>(null);
  const [censusData, setCensusData] = useState<CensusData | null>(null);
  const [dataSource, setDataSource] = useState<string>("");

  const runAnalysis = async () => {
    if (!address) { toast.error(t("area.enterAddress")); return; }
    if (activeTab === "opening" && !industry) { toast.error(t("area.enterIndustry")); return; }

    setLoading(true);
    setCensusData(null);
    setDataSource("");
    try {
      const { data, error } = await supabase.functions.invoke("area-analysis", {
        body: { address, radius, industry, analysisType: activeTab },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (activeTab === "area") setAreaResult(data.result);
      else setOpeningResult(data.result);

      if (data.censusData) setCensusData(data.censusData);
      setDataSource(data.dataSource || t("area.aiEstimate"));

      toast.success(data.censusData
        ? t("area.analysisCompleteReal")
        : t("area.analysisCompleteFallback")
      );
    } catch (e: any) {
      toast.error(e.message || t("area.analysisFailed"));
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-500";
    return "text-destructive";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "高") return "destructive";
    if (severity === "中") return "secondary";
    return "outline";
  };

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <MapPin className="w-3.5 h-3.5" />
              {t("area.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("area.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("area.subtitle")}</p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="area" className="gap-2">
                <Users className="w-4 h-4" />
                {t("area.tabArea")}
              </TabsTrigger>
              <TabsTrigger value="opening" className="gap-2">
                <Building2 className="w-4 h-4" />
                {t("area.tabOpening")}
              </TabsTrigger>
            </TabsList>

            {/* Input Form */}
            <motion.div {...fadeUp}>
              <Card className="border border-border/60 shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">{t("area.address")}</label>
                      <Input
                        placeholder={t("area.addressPh")}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    {activeTab === "area" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">{t("area.radius")}</label>
                        <div className="flex gap-2">
                          {RADIUS_VALUES.map((rv, idx) => (
                            <Button
                              key={rv}
                              variant={radius === rv ? "default" : "outline"}
                              size="sm"
                              onClick={() => setRadius(rv)}
                              className="flex-1"
                            >
                              {t(RADIUS_KEYS[idx])}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("area.industry")}{activeTab === "area" ? t("area.industryOptional") : ""}
                      </label>
                      <Input
                        placeholder={t("area.industryPh")}
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={runAnalysis} disabled={loading} className="w-full sm:w-auto gap-2">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {loading ? t("area.analyzing") : t("area.analyze")}
                    </Button>
                    {(areaResult || openingResult) && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => exportAreaAnalysisPDF(areaResult, openingResult, { address, radius, industry })}
                      >
                        <FileDown className="w-4 h-4" />
                        {t("area.pdfDownload")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Area Analysis Results */}
            <TabsContent value="area">
              {areaResult && (
                <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
                  {/* Data Source Badge */}
                  <motion.div variants={fadeUp}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {censusData ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 py-1 px-3">
                          <Database className="w-3.5 h-3.5" />
                          {t("area.realData")}: {censusData.source}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1.5 py-1 px-3">
                          <Sparkles className="w-3.5 h-3.5" />
                          {t("area.aiEstimate")}
                        </Badge>
                      )}
                      {dataSource && (
                        <span className="text-xs text-muted-foreground">{dataSource}</span>
                      )}
                    </div>
                  </motion.div>

                  {/* Census Raw Data (if available) */}
                  {censusData && (
                    <motion.div variants={fadeUp}>
                      <Card className="border-2 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Database className="w-4 h-4 text-emerald-600" />
                            {t("area.censusTitle")} ({censusData.areaName})
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">{t("area.source")}: {censusData.source} ｜ {t("area.areaCode")}: {censusData.areaCode}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-background border">
                              <p className="text-xs text-muted-foreground">{t("area.totalPop")}</p>
                              <p className="text-lg font-bold text-foreground">{censusData.totalPopulation.toLocaleString()}{t("area.people")}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-background border">
                              <p className="text-xs text-muted-foreground">{t("area.households")}</p>
                              <p className="text-lg font-bold text-foreground">{censusData.totalHouseholds.toLocaleString()}{t("area.householdsUnit")}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-background border col-span-2 sm:col-span-1">
                              <p className="text-xs text-muted-foreground">{t("area.dataSource")}</p>
                              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">e-Stat API</p>
                            </div>
                          </div>
                          {censusData.ageDistribution.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">{t("area.ageCompReal")}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {censusData.ageDistribution.map((ag, i) => (
                                  <div key={i} className="p-2 rounded bg-background border text-center">
                                    <p className="text-xs text-muted-foreground">{ag.ageGroup}</p>
                                    <p className="text-sm font-bold text-foreground">{ag.percentage}%</p>
                                    <p className="text-xs text-muted-foreground">{ag.population.toLocaleString()}{t("area.people")}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                  {/* Summary Stats */}
                  <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: t("area.areaLabel"), value: areaResult.areaName, icon: MapPin },
                      { label: t("area.estPop"), value: areaResult.population.toLocaleString() + t("area.people"), icon: Users },
                      { label: t("area.estHouseholds"), value: areaResult.households.toLocaleString() + t("area.householdsUnit"), icon: Home },
                      { label: t("area.radiusLabel"), value: radius, icon: TrendingUp },
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

                  {/* Area Characteristics */}
                  <motion.div variants={fadeUp}>
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t("area.areaFeatures")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{areaResult.areaCharacteristics}</p>
                        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs font-medium text-primary mb-1">{t("area.mainTarget")}</p>
                          <p className="text-sm text-foreground">{areaResult.primaryTarget}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{t("area.ageComp")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={areaResult.ageDistribution}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,92%)" />
                                <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v: number) => [v.toLocaleString() + t("area.people"), t("area.population")]} />
                                <Bar dataKey="count" fill="hsl(217,91%,55%)" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{t("area.householdComp")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={areaResult.householdTypes}
                                  dataKey="percentage"
                                  nameKey="type"
                                  cx="50%" cy="50%"
                                  outerRadius={90}
                                  label={({ type, percentage }) => `${type} ${percentage}%`}
                                >
                                  {areaResult.householdTypes.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => [v + "%", t("area.percentage")]} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Suitable / Unsuitable Industries */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {t("area.suitableInd")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {areaResult.suitableIndustries.map((ind, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-green-700">{ind.score}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{ind.industry}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{ind.reason}</p>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            {t("area.unsuitableInd")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {areaResult.unsuitableIndustries.map((ind, i) => (
                            <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                              <p className="text-sm font-medium text-foreground">{ind.industry}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{ind.reason}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Visit Motivations & Competition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{t("area.visitMotivations")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {areaResult.visitMotivations.map((m, i) => (
                              <Badge key={i} variant="secondary" className="text-xs py-1 px-3">{m}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{t("area.competition")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground leading-relaxed">{areaResult.competitiveEnvironment}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </TabsContent>

            {/* Opening Analysis Results */}
            <TabsContent value="opening">
              {openingResult && (
                <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
                  {/* Score Hero */}
                  <motion.div variants={fadeUp}>
                    <Card className="border border-border/60 overflow-hidden">
                      <div className="relative p-6 sm:p-8" style={{ background: "var(--gradient-primary)" }}>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="relative w-32 h-32 flex-shrink-0">
                            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                              <circle
                                cx="60" cy="60" r="52" fill="none"
                                stroke="white" strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={`${(openingResult.overallScore / 100) * 327} 327`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold text-primary-foreground">{openingResult.overallScore}</span>
                              <span className="text-xs text-primary-foreground/70">/ 100</span>
                            </div>
                          </div>
                          <div className="text-center sm:text-left">
                            <Badge className="bg-white/20 text-primary-foreground border-0 mb-2">
                              {t("area.successProb")}: {openingResult.successProbability}
                            </Badge>
                            <p className="text-primary-foreground/90 text-sm leading-relaxed max-w-md">
                              {openingResult.overallComment}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Score Breakdown Radar */}
                  <motion.div variants={fadeUp}>
                    <Card className="border border-border/60">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{t("area.scoreBreakdown")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={openingResult.scoreBreakdown.map(s => ({
                                subject: s.category,
                                value: (s.score / s.maxScore) * 100,
                                fullMark: 100,
                              }))}>
                                <PolarGrid stroke="hsl(220,16%,92%)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Radar
                                  dataKey="value" stroke="hsl(217,91%,55%)"
                                  fill="hsl(217,91%,55%)" fillOpacity={0.2}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-3">
                            {openingResult.scoreBreakdown.map((s, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-foreground">{s.category}</span>
                                  <span className={`font-bold ${getScoreColor(Math.round((s.score / s.maxScore) * 100))}`}>
                                    {s.score}/{s.maxScore}
                                  </span>
                                </div>
                                <Progress value={(s.score / s.maxScore) * 100} className="h-2" />
                                <p className="text-xs text-muted-foreground">{s.comment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Target & Estimates */}
                  <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: t("area.targetCustomer"), value: openingResult.targetCustomer, icon: Users },
                      { label: t("area.unitPrice"), value: openingResult.estimatedUnitPrice, icon: BarChart3 },
                      { label: t("area.visitFreq"), value: openingResult.estimatedVisitFrequency, icon: TrendingUp },
                    ].map((s) => (
                      <Card key={s.label} className="border border-border/60">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                            <s.icon className="w-3.5 h-3.5" />
                            {s.label}
                          </div>
                          <p className="text-sm font-medium text-foreground">{s.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </motion.div>

                  {/* Risks & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            {t("area.riskFactors")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {openingResult.riskFactors.map((r, i) => (
                            <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <Badge variant={getSeverityColor(r.severity) as any} className="text-[10px]">
                                  {r.severity}{t("area.risk")}
                                </Badge>
                                <span className="text-sm font-medium text-foreground">{r.risk}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{t("area.countermeasure")}: {r.mitigation}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {t("area.improvements")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {openingResult.improvements.map((imp, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-foreground">{imp}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
