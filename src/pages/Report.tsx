import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FileText, Loader2, Search, MapPin, Megaphone, Newspaper,
  Target, TrendingUp, DollarSign, Users, BarChart3, FileDown,
} from "lucide-react";
import { exportReportPDF } from "@/lib/reportPdfExport";
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

type ReportData = { area: any | null; ad: any | null; flyer: any | null; loading: boolean; error: string | null; };

export default function Report() {
  const { t, language } = useLanguage();
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [report, setReport] = useState<ReportData>({ area: null, ad: null, flyer: null, loading: false, error: null });

  const generateReport = async () => {
    if (!address) { toast.error(t("rpt.errAddress")); return; }
    if (!industry) { toast.error(t("rpt.errIndustry")); return; }
    setReport({ area: null, ad: null, flyer: null, loading: true, error: null });
    try {
      const body = { address, industry, budget, target, storeName, language };
      const [areaRes, adRes, flyerRes] = await Promise.all([
        supabase.functions.invoke("area-analysis", { body: { address, radius: "3km", industry, analysisType: "area", language } }),
        supabase.functions.invoke("ad-proposal", { body }),
        supabase.functions.invoke("flyer-plan", { body }),
      ]);
      setReport({ area: areaRes.data?.result ?? null, ad: adRes.data?.result ?? null, flyer: flyerRes.data?.result ?? null, loading: false, error: null });
      toast.success(t("rpt.success"));
    } catch (e: any) {
      setReport((prev) => ({ ...prev, loading: false, error: e.message }));
      toast.error(e.message || t("rpt.error"));
    }
  };

  const hasData = report.area || report.ad || report.flyer;

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <FileText className="w-3.5 h-3.5" />{t("rpt.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("rpt.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("rpt.subtitle")}</p>
          </motion.div>

          <motion.div {...fadeUp}>
            <Card className="border border-border/60 mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("rpt.address")} *</label>
                    <Input placeholder={t("rpt.addressPh")} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("rpt.industry")} *</label>
                    <Input placeholder={t("rpt.industryPh")} value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("rpt.storeName")}</label>
                    <Input placeholder={t("rpt.storeNamePh")} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("rpt.budget")}</label>
                    <Input placeholder={t("rpt.budgetPh")} value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("rpt.target")}</label>
                  <Textarea placeholder={t("rpt.targetPh")} value={target} onChange={(e) => setTarget(e.target.value)} rows={2} />
                </div>
                <div className="flex gap-3">
                  <Button onClick={generateReport} disabled={report.loading} className="gap-2">
                    {report.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                    {report.loading ? t("rpt.generating") : t("rpt.generate")}
                  </Button>
                  {hasData && !report.loading && (
                    <Button variant="outline" className="gap-2" onClick={() => exportReportPDF({ area: report.area, ad: report.ad, flyer: report.flyer }, { storeName, address, industry, budget })}>
                      <FileDown className="w-4 h-4" />{t("rpt.pdfDownload")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {report.error && (
            <Card className="border-destructive/30 bg-destructive/5 mb-6">
              <CardContent className="py-6 text-center">
                <p className="text-destructive font-medium">{t("rpt.errorTitle")}</p>
                <p className="text-sm text-muted-foreground mt-1">{report.error}</p>
              </CardContent>
            </Card>
          )}

          {report.loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("rpt.loadingMsg")}</p>
            </div>
          )}

          {hasData && !report.loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {report.area && (
                <section>
                  <SectionHeader icon={MapPin} title={t("rpt.sArea")} />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <MetricCard label={t("rpt.areaName")} value={report.area.areaName} />
                    <MetricCard label={t("rpt.pop")} value={`${report.area.population?.toLocaleString()}`} />
                    <MetricCard label={t("rpt.hh")} value={`${report.area.households?.toLocaleString()}`} />
                    <MetricCard label={t("rpt.mainTarget")} value={report.area.primaryTarget} />
                  </div>
                  <Card className="border border-border/60">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">{report.area.areaCharacteristics}</p>
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs font-medium text-primary mb-1">{t("rpt.compEnv")}</p>
                        <p className="text-sm text-foreground">{report.area.competitiveEnvironment}</p>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}
              {report.ad && (
                <section>
                  <SectionHeader icon={Target} title={t("rpt.sActions")} />
                  <Card className="border border-border/60">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{report.ad.summary}</p>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                        <p className="text-sm font-bold text-foreground mb-1">{t("rpt.recommended")}: {report.ad.overallStrategy?.recommendedPlatform}</p>
                        <p className="text-xs text-muted-foreground">{report.ad.overallStrategy?.reason}</p>
                      </div>
                      <ul className="space-y-2">
                        {report.ad.overallStrategy?.tips?.map((tip: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span><span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </section>
              )}
              {report.ad && (
                <section>
                  <SectionHeader icon={DollarSign} title={t("rpt.sBudget")} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card className="border border-border/60">
                      <CardContent className="p-5">
                        <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-3">Google</Badge>
                        <p className="text-xl font-bold text-foreground">¥{report.ad.googleAds?.monthlyBudget?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("rpt.monthlyBudget")}</p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground"><p>CTR: {report.ad.googleAds?.expectedCTR}</p><p>CPA: {report.ad.googleAds?.expectedCPA}</p></div>
                      </CardContent>
                    </Card>
                    <Card className="border border-border/60">
                      <CardContent className="p-5">
                        <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-3">Meta</Badge>
                        <p className="text-xl font-bold text-foreground">¥{report.ad.metaAds?.monthlyBudget?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("rpt.monthlyBudget")}</p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground"><p>CPM: {report.ad.metaAds?.expectedCPM}</p><p>CTR: {report.ad.metaAds?.expectedCTR}</p></div>
                      </CardContent>
                    </Card>
                    <Card className="border border-border/60">
                      <CardContent className="p-5">
                        <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 mb-3">{t("rpt.total")}</Badge>
                        <p className="text-xl font-bold text-foreground">¥{report.ad.overallStrategy?.monthlyTotalBudget?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t("rpt.monthlyTotal")}</p>
                        <div className="mt-3 text-xs text-muted-foreground"><p>{t("rpt.expectedROAS")}: {report.ad.overallStrategy?.expectedROAS}</p></div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}
              {report.flyer && (
                <section>
                  <SectionHeader icon={Newspaper} title={t("rpt.sFlyer")} />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <MetricCard label={t("rpt.totalQty")} value={`${report.flyer.totalQuantity?.toLocaleString()}`} />
                    <MetricCard label={t("rpt.totalCost")} value={`¥${report.flyer.estimatedCost?.totalCost?.toLocaleString()}`} />
                    <MetricCard label={t("rpt.responseRate")} value={report.flyer.expectedResponseRate} />
                    <MetricCard label={t("rpt.expectedROI")} value={report.flyer.expectedROI} />
                  </div>
                  <Card className="border border-border/60">
                    <CardContent className="p-5 space-y-3">
                      {report.flyer.distributionAreas?.map((area: any, i: number) => (
                        <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-border/60">
                          <div>
                            <p className="text-sm font-bold text-foreground">{area.areaName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{area.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t("rpt.recQty")}: {area.recommendedQuantity?.toLocaleString()} / {t("rpt.targetLabel")}: {area.targetDescription}</p>
                          </div>
                          <Badge variant={area.priority === "高" ? "destructive" : "secondary"} className="text-[10px] shrink-0">{area.priority}</Badge>
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
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}><Icon className="w-4 h-4" /></div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-bold text-foreground mt-1">{value}</p></CardContent></Card>
  );
}
