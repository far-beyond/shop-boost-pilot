import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Loader2, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { getUserDiagnoses } from "@/lib/diagnosisService";
import { motion } from "framer-motion";
import StatsCards from "@/components/dashboard/StatsCards";
import DiagnosisCard from "@/components/dashboard/DiagnosisCard";
import DiagnosisTrendChart from "@/components/dashboard/DiagnosisTrendChart";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Dashboard() {
  const { data: diagnoses, isLoading } = useQuery({
    queryKey: ["diagnoses"],
    queryFn: getUserDiagnoses,
  });
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t("dash.badge")}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("dash.title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("dash.subtitle")}</p>
            </div>
            <Link to="/input">
              <Button className="gap-2 shadow-sm w-full sm:w-auto">
                <Plus className="w-4 h-4" />{t("dash.newDiagnosis")}
              </Button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : !diagnoses?.length ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-dashed border-2 border-border">
                <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-1">{t("dash.noDiagnosis")}</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center px-4">{t("dash.noDiagnosisDesc")}</p>
                  <Link to="/input">
                    <Button className="gap-2"><Plus className="w-4 h-4" />{t("dash.createFirst")}</Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              <StatsCards diagnoses={diagnoses} />
              <DiagnosisTrendChart diagnoses={diagnoses} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {diagnoses.map((item, i) => (
                  <DiagnosisCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
