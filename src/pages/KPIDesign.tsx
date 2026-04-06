import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Target, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { getDiagnosis, type KPIPlan } from "@/lib/diagnosisService";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function KPIDesign() {
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
          <p className="text-destructive">{t("promo.dataNotFound")}</p>
          <Link to="/dashboard"><Button variant="outline">{t("diag.backToDashboard")}</Button></Link>
        </div>
      </Layout>
    );
  }

  const kpiPlan = diagnosis.kpi_plan as KPIPlan | null;
  const kpis = kpiPlan?.kpis || [];

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
          <motion.div className="text-center mb-8 sm:mb-10" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-3">
              <BarChart3 className="w-3.5 h-3.5" />
              {t("kpi.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {diagnosis.store_name}{t("kpi.title")}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("kpi.subtitle")}</p>
          </motion.div>

          {kpis.length === 0 ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t("kpi.generating")}</p>
            </div>
          ) : (
            <motion.div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10" variants={stagger} initial="initial" animate="animate">
              {kpis.map((kpi, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="flex">
                      <div className="w-1.5 shrink-0" style={{ background: "var(--gradient-primary)" }} />
                      <div className="flex-1">
                        <CardHeader className="pb-2 pt-4 sm:pt-5 px-4 sm:px-6">
                          <CardTitle className="text-base sm:text-lg flex items-center gap-2.5">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-primary-foreground shrink-0" style={{ background: "var(--gradient-primary)" }}>{i + 1}</span>
                            {kpi.metric}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-5">
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            {[
                              { label: t("kpi.target"), value: kpi.target },
                              { label: t("kpi.measurement"), value: kpi.measurement },
                              { label: t("kpi.frequency"), value: kpi.frequency },
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
            </motion.div>
          )}

          <motion.div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3" {...fadeUp} transition={{ delay: 0.5 }}>
            <Link to={`/promo/${id}`} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="gap-2 text-sm sm:text-base px-6 sm:px-8 w-full shadow-sm">{t("diag.viewPromo")}</Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 text-sm sm:text-base px-6 sm:px-8 w-full shadow-sm">
                {t("diag.backToDashboard")}<ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
