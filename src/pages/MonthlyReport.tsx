import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Calendar, Loader2, FileDown, MapPin, ShoppingCart,
  TrendingUp, Users, BarChart3, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getOrders, type OrderRecord } from "@/lib/orderHistoryService";
import { exportMonthlyReportPDF } from "@/lib/monthlyReportPdfExport";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function getLast12Months(): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    months.push({ value, label });
  }
  return months;
}

function getOrdersForMonth(orders: OrderRecord[], yearMonth: string): OrderRecord[] {
  return orders.filter((o) => o.date.startsWith(yearMonth));
}

type MonthlyReportData = {
  area: any | null;
  orders: OrderRecord[];
  totalSpend: number;
  totalOrders: number;
  areasCovered: string[];
};

export default function MonthlyReport() {
  const { t, language } = useLanguage();
  const months = useMemo(() => getLast12Months(), []);
  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);

  const generateReport = async () => {
    if (!address) { toast.error(t("mr.errAddress")); return; }
    setLoading(true);
    setReportData(null);
    try {
      const allOrders = getOrders();
      const monthOrders = getOrdersForMonth(allOrders, selectedMonth);
      const totalSpend = monthOrders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
      const areasCovered = [...new Set(monthOrders.flatMap((o) => o.areas?.map((a) => a.areaName) || []))];

      const { data: areaRes, error: areaErr } = await supabase.functions.invoke("area-analysis", {
        body: { address, radius: "3km", industry: "", analysisType: "area", language },
      });
      if (areaErr) throw areaErr;

      const area = areaRes?.result ?? null;

      setReportData({
        area,
        orders: monthOrders,
        totalSpend,
        totalOrders: monthOrders.length,
        areasCovered,
      });
      toast.success(t("mr.success"));
    } catch (e: any) {
      toast.error(e.message || t("mr.error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePdfDownload = async () => {
    if (!reportData) return;
    try {
      await exportMonthlyReportPDF(reportData, { storeName, address, yearMonth: selectedMonth });
      toast.success(t("mr.pdfSuccess"));
    } catch {
      toast.error(t("mr.pdfError"));
    }
  };

  const monthLabel = months.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Calendar className="w-3.5 h-3.5" />{t("mr.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("mr.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("mr.subtitle")}</p>
          </motion.div>

          <motion.div {...fadeUp}>
            <Card className="border border-border/60 mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("mr.month")}</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("mr.storeName")}</label>
                    <Input placeholder={t("mr.storeNamePh")} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("mr.address")} *</label>
                    <Input placeholder={t("mr.addressPh")} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={generateReport} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                    {loading ? t("mr.generating") : t("mr.generate")}
                  </Button>
                  {reportData && !loading && (
                    <Button variant="outline" className="gap-2" onClick={handlePdfDownload}>
                      <FileDown className="w-4 h-4" />{t("mr.pdfDownload")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("mr.loadingMsg")}</p>
            </div>
          )}

          {reportData && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Monthly Summary */}
              <section>
                <SectionHeader icon={ShoppingCart} title={`${monthLabel} ${t("mr.summaryTitle")}`} />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <MetricCard label={t("mr.totalOrders")} value={String(reportData.totalOrders)} />
                  <MetricCard label={t("mr.totalSpend")} value={`\u00a5${reportData.totalSpend.toLocaleString()}`} />
                  <MetricCard label={t("mr.areasCovered")} value={String(reportData.areasCovered.length)} />
                  <MetricCard label={t("mr.avgOrderValue")} value={reportData.totalOrders > 0 ? `\u00a5${Math.round(reportData.totalSpend / reportData.totalOrders).toLocaleString()}` : "-"} />
                </div>
                {reportData.orders.length > 0 && (
                  <Card className="border border-border/60">
                    <CardContent className="p-5 space-y-2">
                      {reportData.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                          <div>
                            <p className="text-sm font-bold text-foreground">{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.date} / {order.storeName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{order.type}</Badge>
                            <span className="text-sm font-bold text-foreground">{`\u00a5${order.totalCost.toLocaleString()}`}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {reportData.orders.length === 0 && (
                  <Card className="border border-border/60">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">{t("mr.noOrders")}</p>
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Area Analysis */}
              {reportData.area && (
                <section>
                  <SectionHeader icon={MapPin} title={t("mr.areaTitle")} />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <MetricCard label={t("mr.areaName")} value={reportData.area.areaName ?? "-"} />
                    <MetricCard label={t("mr.population")} value={reportData.area.population ? `${Number(reportData.area.population).toLocaleString()}${t("mr.people")}` : "-"} />
                    <MetricCard label={t("mr.households")} value={reportData.area.households ? `${Number(reportData.area.households).toLocaleString()}${t("mr.householdsUnit")}` : "-"} />
                    <MetricCard label={t("mr.mainTarget")} value={reportData.area.primaryTarget ?? "-"} />
                  </div>
                  <Card className="border border-border/60">
                    <CardContent className="p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">{reportData.area.areaCharacteristics}</p>
                      {reportData.area.competitiveEnvironment && (
                        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="text-xs font-medium text-primary mb-1">{t("mr.compEnv")}</p>
                          <p className="text-sm text-foreground">{reportData.area.competitiveEnvironment}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Recommendations */}
              {reportData.area?.recommendations && (
                <section>
                  <SectionHeader icon={TrendingUp} title={t("mr.recommendationsTitle")} />
                  <Card className="border border-border/60">
                    <CardContent className="p-5 space-y-3">
                      {(Array.isArray(reportData.area.recommendations) ? reportData.area.recommendations : [reportData.area.recommendations]).map((rec: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span>
                          <span>{rec}</span>
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
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
