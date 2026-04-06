import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertTriangle, CheckCircle2, Target, TrendingUp, Users, Loader2, Download, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { getDiagnosis, type DiagnosisResult } from "@/lib/diagnosisService";
import { exportDiagnosisPDF } from "@/lib/pdfExport";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function Diagnosis() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();

  const { data: diagnosis, isLoading, error } = useQuery({
    queryKey: ["diagnosis", id],
    queryFn: () => getDiagnosis(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (error || !diagnosis) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <p className="text-destructive">{t("diag.notFound")}</p>
          <Link to="/dashboard"><Button variant="outline">{t("diag.backToDashboard")}</Button></Link>
        </div>
      </Layout>
    );
  }

  const d = diagnosis.diagnosis_result as DiagnosisResult | null;

  if (!d) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("diag.generating")}</p>
        </div>
      </Layout>
    );
  }

  const analysisCards = [
    { icon: CheckCircle2, iconClass: "text-accent", bgClass: "bg-accent/10", title: t("diag.strengths"), items: d.strengths, marker: "✓", markerClass: "text-accent" },
    { icon: AlertTriangle, iconClass: "text-destructive", bgClass: "bg-destructive/10", title: t("diag.weaknesses"), items: d.weaknesses, marker: "!", markerClass: "text-destructive" },
    { icon: Users, iconClass: "text-primary", bgClass: "bg-primary/10", title: t("diag.targetCustomers"), content: d.targetCustomers },
    { icon: TrendingUp, iconClass: "text-primary", bgClass: "bg-primary/10", title: t("diag.differentiation"), items: d.differentiationPoints, marker: "◆", markerClass: "text-primary" },
  ];

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
          <motion.div className="text-center mb-8 sm:mb-10" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-3">
              <Target className="w-3.5 h-3.5" />
              {t("diag.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {diagnosis.store_name}{t("diag.title")}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("diag.subtitle")}</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8" variants={stagger} initial="initial" animate="animate">
            {analysisCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div key={idx} variants={fadeUp}>
                  <Card className="h-full border-border/60 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
                        <div className={`w-8 h-8 rounded-lg ${card.bgClass} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${card.iconClass}`} />
                        </div>
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {card.content ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">{card.content}</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {card.items?.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                              <span className={`${card.markerClass} mt-0.5 shrink-0 font-medium`}>{card.marker}</span>
                              <span className="text-foreground/80">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
            <Card className="mb-6 sm:mb-8 border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-base sm:text-lg">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4 text-destructive" />
                  </div>
                  {t("diag.bottlenecks")}
                </CardTitle>
                <CardDescription className="pl-10">{t("diag.bottlenecksDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {d.bottlenecks.map((b, i) => (
                    <Badge key={i} variant="secondary" className="text-xs sm:text-sm py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-lg font-normal">{b}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{t("diag.actions")}</h2>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {d.actions.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="flex">
                      <div className="w-1.5 shrink-0" style={{ background: "var(--gradient-primary)" }} />
                      <div className="flex-1">
                        <CardHeader className="pb-2 pt-4 sm:pt-5 px-4 sm:px-6">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)" }}>{i + 1}</span>
                            {a.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
                          <p className="text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">{a.reason}</p>
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            {[
                              { label: t("diag.estimatedCost"), value: a.estimatedCost },
                              { label: t("diag.difficulty"), value: a.difficulty },
                              { label: t("diag.expectedEffect"), value: a.expectedEffect },
                            ].map((metric) => (
                              <div key={metric.label} className="rounded-lg bg-muted/50 p-2 sm:p-3 text-center">
                                <span className="text-[10px] sm:text-xs text-muted-foreground block mb-0.5">{metric.label}</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground">{metric.value}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3" {...fadeUp} transition={{ delay: 0.7 }}>
            <Button size="lg" variant="outline" className="gap-2 text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto shadow-sm" onClick={() => exportDiagnosisPDF(diagnosis)}>
              <Download className="w-4 h-4" />{t("diag.pdfExport")}
            </Button>
            <Link to={`/promo/${id}`} className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 text-sm sm:text-base px-6 sm:px-8 w-full shadow-sm">{t("diag.viewPromo")}<ArrowRight className="w-4 h-4" /></Button>
            </Link>
            <Link to={`/kpi/${id}`} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2 text-sm sm:text-base px-6 sm:px-8 w-full shadow-sm">{t("diag.viewKpi")}</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
