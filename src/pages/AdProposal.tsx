import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Megaphone, Loader2, Search, Copy, Check, Target, TrendingUp,
  DollarSign, Users, Lightbulb, MousePointerClick, FileDown,
  ClipboardList, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { exportAdProposalPDF } from "@/lib/adPdfExport";
import { exportAdOrderPDF, type AdOrderData } from "@/lib/adOrderPdfExport";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

type GoogleKeyword = { keyword: string; matchType: string; estimatedCPC: number; priority: string };
type GoogleAdCopy = { headline1: string; headline2: string; headline3: string; description1: string; description2: string };
type MetaAudience = { name: string; ageRange: string; gender: string; interests: string[]; estimatedReach: string };
type MetaCreative = { format: string; primaryText: string; headline: string; description: string; callToAction: string };

type AdProposalResult = {
  summary: string;
  googleAds: {
    campaignType: string;
    dailyBudget: number;
    monthlyBudget: number;
    keywords: GoogleKeyword[];
    adCopies: GoogleAdCopy[];
    expectedCTR: string;
    expectedCPA: string;
  };
  metaAds: {
    campaignObjective: string;
    dailyBudget: number;
    monthlyBudget: number;
    targetAudiences: MetaAudience[];
    adCreatives: MetaCreative[];
    expectedCPM: string;
    expectedCTR: string;
  };
  overallStrategy: {
    recommendedPlatform: string;
    reason: string;
    monthlyTotalBudget: number;
    expectedROAS: string;
    tips: string[];
  };
};

const priorityColor = (p: string) => {
  const v = p?.toLowerCase();
  if (v === "高" || v === "high") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (v === "中" || v === "medium") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
};

export default function AdProposal() {
  const { t, language } = useLanguage();
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdProposalResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSending, setOrderSending] = useState(false);
  const [orderForm, setOrderForm] = useState({
    clientCompany: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    customerCompany: "",
    customerName: "",
    customerEmail: "",
    managementFeeRate: "20",
    startDate: "",
    contractMonths: "3",
    targetRadius: "5km",
    notes: "",
    platformGoogle: true,
    platformMeta: true,
  });

  const updateOrderField = (field: string, value: string | boolean) =>
    setOrderForm((prev) => ({ ...prev, [field]: value }));

  const buildAdOrderData = (): AdOrderData => {
    const r = result!;
    const feeRate = parseInt(orderForm.managementFeeRate) / 100;
    const monthlyAdBudget = r.overallStrategy.monthlyTotalBudget;
    const managementFee = Math.round(monthlyAdBudget * feeRate);
    const platforms: ("google" | "meta")[] = [];
    if (orderForm.platformGoogle) platforms.push("google");
    if (orderForm.platformMeta) platforms.push("meta");

    const adCopies: { platform: string; headline: string; description: string }[] = [];
    if (orderForm.platformGoogle) {
      r.googleAds.adCopies.forEach((ad) => {
        adCopies.push({ platform: "google", headline: `${ad.headline1} | ${ad.headline2}`, description: ad.description1 });
      });
    }
    if (orderForm.platformMeta) {
      r.metaAds.adCreatives.forEach((cr) => {
        adCopies.push({ platform: "meta", headline: cr.headline, description: cr.primaryText });
      });
    }

    return {
      clientCompany: orderForm.clientCompany,
      clientName: orderForm.clientName,
      clientEmail: orderForm.clientEmail,
      clientPhone: orderForm.clientPhone,
      customerCompany: orderForm.customerCompany,
      customerName: orderForm.customerName,
      customerEmail: orderForm.customerEmail,
      storeName: storeName || address,
      storeAddress: address,
      industry,
      platforms,
      monthlyAdBudget,
      managementFee,
      totalMonthlyCharge: monthlyAdBudget + managementFee,
      startDate: orderForm.startDate,
      contractMonths: parseInt(orderForm.contractMonths),
      targetArea: address,
      targetRadius: orderForm.targetRadius,
      targetAudience: target || r.metaAds.targetAudiences?.[0]?.name || "",
      googleCampaignType: r.googleAds.campaignType,
      googleKeywords: r.googleAds.keywords.map((k) => k.keyword),
      googleDailyBudget: r.googleAds.dailyBudget,
      metaObjective: r.metaAds.campaignObjective,
      metaAgeRange: r.metaAds.targetAudiences?.[0]?.ageRange || "",
      metaInterests: r.metaAds.targetAudiences?.[0]?.interests || [],
      metaDailyBudget: r.metaAds.dailyBudget,
      adCopies,
      notes: orderForm.notes,
    };
  };

  const handleGenerateAdOrder = async () => {
    if (!orderForm.clientCompany) {
      toast.error("発注元の会社名は必須です");
      return;
    }
    await exportAdOrderPDF(buildAdOrderData());
    toast.success(t("ad.orderComplete"));
  };

  const handleSendAdOrder = async () => {
    if (!orderForm.customerEmail) {
      toast.error("送信先メールアドレスを入力してください");
      return;
    }
    setOrderSending(true);
    try {
      const orderData = buildAdOrderData();
      const pdfBlob = await exportAdOrderPDF(orderData);
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(pdfBlob);
      });
      const { error } = await supabase.functions.invoke("send-flyer-order", {
        body: {
          to: orderForm.customerEmail,
          subject: `【お見積書】${orderData.storeName} 広告運用代行のご提案`,
          storeName: orderData.storeName,
          clientCompany: orderData.clientCompany,
          clientName: orderData.clientName,
          totalQuantity: 0,
          totalCost: orderData.totalMonthlyCharge,
          deliveryDate: orderData.startDate,
          pdfBase64: base64,
        },
      });
      if (error) throw error;
      toast.success(t("ad.orderSent"));
      setOrderOpen(false);
    } catch (e: any) {
      toast.error(t("ad.orderSendFailed") + ": " + (e.message || ""));
    } finally {
      setOrderSending(false);
    }
  };

  const runProposal = async () => {
    if (!address) { toast.error(t("common.enterAddress")); return; }
    if (!industry) { toast.error(t("common.enterIndustry")); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ad-proposal", {
        body: { address, industry, budget, target, storeName, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      toast.success(t("ad.proposalComplete"));
    } catch (e: any) {
      toast.error(e.message || t("ad.proposalFailed"));
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              {t("ad.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("ad.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("ad.subtitle")}
            </p>
          </motion.div>

          {/* Input Form */}
          <motion.div {...fadeUp}>
            <Card className="border border-border/60 shadow-sm mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("ad.storeLocation")} *</label>
                    <Input placeholder={t("ad.addressPh")} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("ad.industry")} *</label>
                    <Input placeholder={t("ad.industryPh")} value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("ad.storeName")}</label>
                    <Input placeholder={t("ad.storeNamePh")} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("ad.monthlyBudget")}</label>
                    <Input placeholder={t("ad.budgetPh")} value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("ad.targetAudience")}</label>
                  <Textarea placeholder={t("ad.targetPh")} value={target} onChange={(e) => setTarget(e.target.value)} rows={2} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={runProposal} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? t("ad.generating") : t("ad.generate")}
                  </Button>
                  {result && (
                    <>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => exportAdProposalPDF(result, { storeName, address, industry })}
                      >
                        <FileDown className="w-4 h-4" />
                        {t("ad.pdfDownload")}
                      </Button>
                      <Button
                        className="gap-2"
                        onClick={() => setOrderOpen(true)}
                      >
                        <ClipboardList className="w-4 h-4" />
                        {t("ad.createOrder")}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {result && (
            <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
              {/* Summary */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      {t("ad.strategySummary")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Overall Strategy Stats */}
              <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t("ad.recPlatform"), value: result.overallStrategy.recommendedPlatform, icon: Target },
                  { label: t("ad.monthlyTotal"), value: `¥${result.overallStrategy.monthlyTotalBudget.toLocaleString()}`, icon: DollarSign },
                  { label: t("ad.expectedROAS"), value: result.overallStrategy.expectedROAS, icon: TrendingUp },
                  { label: t("ad.googleCPA"), value: result.googleAds.expectedCPA, icon: MousePointerClick },
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

              {/* Tabs: Google vs Meta */}
              <motion.div variants={fadeUp}>
                <Tabs defaultValue="google" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="google">{t("ad.googleAds")}</TabsTrigger>
                    <TabsTrigger value="meta">{t("ad.metaAds")}</TabsTrigger>
                  </TabsList>

                  {/* Google Ads */}
                  <TabsContent value="google" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t("ad.campaignType")}</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.googleAds.campaignType}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t("ad.dailyBudget")}</p>
                          <p className="text-sm font-bold text-foreground mt-1">¥{result.googleAds.dailyBudget.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t("ad.expectedCTR")}</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.googleAds.expectedCTR}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Keywords */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t("ad.recKeywords")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {result.googleAds.keywords.map((kw, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-card">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityColor(kw.priority)}`}>
                                  {kw.priority}
                                </span>
                                <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px]">{kw.matchType}</Badge>
                                <span>¥{kw.estimatedCPC}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ad Copies */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t("ad.adCopies")}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.googleAds.adCopies.map((ad, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border/60 bg-card relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                              onClick={() => copyText(`${ad.headline1} | ${ad.headline2} | ${ad.headline3}\n${ad.description1}\n${ad.description2}`, `g-${i}`)}
                            >
                              {copiedKey === `g-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                            <p className="text-primary font-bold text-sm mb-1">
                              {ad.headline1} | {ad.headline2} | {ad.headline3}
                            </p>
                            <p className="text-xs text-muted-foreground">{ad.description1}</p>
                            <p className="text-xs text-muted-foreground">{ad.description2}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Meta Ads */}
                  <TabsContent value="meta" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t("ad.campaignObj")}</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.metaAds.campaignObjective}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t("ad.dailyBudget")}</p>
                          <p className="text-sm font-bold text-foreground mt-1">¥{result.metaAds.dailyBudget.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">{t("ad.expectedCPM_CTR")}</p>
                          <p className="text-sm font-bold text-foreground mt-1">{result.metaAds.expectedCPM} / {result.metaAds.expectedCTR}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Target Audiences */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {t("ad.targetAudiences")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.metaAds.targetAudiences.map((aud, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border/60 bg-card">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-bold text-foreground">{aud.name}</p>
                              <Badge variant="outline" className="text-[10px]">{aud.estimatedReach}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                              <span>{t("ad.age")}: {aud.ageRange}</span>
                              <span>{t("ad.gender")}: {aud.gender}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {aud.interests.map((int, j) => (
                                <Badge key={j} variant="secondary" className="text-[10px]">{int}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Ad Creatives */}
                    <Card className="border border-border/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t("ad.adCreatives")}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {result.metaAds.adCreatives.map((cr, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border/60 bg-card relative group">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                              onClick={() => copyText(`${cr.headline}\n${cr.primaryText}\n${cr.description}`, `m-${i}`)}
                            >
                              {copiedKey === `m-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-[10px]">{cr.format}</Badge>
                              <Badge className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20">{cr.callToAction}</Badge>
                            </div>
                            <p className="text-sm font-bold text-foreground mb-1">{cr.headline}</p>
                            <p className="text-xs text-muted-foreground mb-1">{cr.primaryText}</p>
                            <p className="text-xs text-muted-foreground">{cr.description}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </motion.div>

              {/* Strategy & Tips */}
              <motion.div variants={fadeUp}>
                <Card className="border border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      {t("ad.overallStrategy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-sm font-bold text-foreground mb-1">
                        {t("ad.recommended")}: {result.overallStrategy.recommendedPlatform}
                      </p>
                      <p className="text-xs text-muted-foreground">{result.overallStrategy.reason}</p>
                    </div>
                    <ul className="space-y-2">
                      {result.overallStrategy.tips.map((tip, i) => (
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

      {/* Ad Order Dialog */}
      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {t("ad.orderTitle")}
            </DialogTitle>
            <DialogDescription>{t("ad.orderDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Your company (agency) */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("ad.agencyInfo")}</p>
              <Input placeholder={t("ad.companyName")} value={orderForm.clientCompany} onChange={(e) => updateOrderField("clientCompany", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder={t("ad.contactPerson")} value={orderForm.clientName} onChange={(e) => updateOrderField("clientName", e.target.value)} />
                <Input placeholder={t("ad.phone")} value={orderForm.clientPhone} onChange={(e) => updateOrderField("clientPhone", e.target.value)} />
              </div>
              <Input placeholder={t("ad.email")} type="email" value={orderForm.clientEmail} onChange={(e) => updateOrderField("clientEmail", e.target.value)} />
            </div>

            {/* Customer (advertiser) */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("ad.customerInfo")}</p>
              <Input placeholder={t("ad.customerCompany")} value={orderForm.customerCompany} onChange={(e) => updateOrderField("customerCompany", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder={t("ad.customerName")} value={orderForm.customerName} onChange={(e) => updateOrderField("customerName", e.target.value)} />
                <Input placeholder={t("ad.customerEmail")} type="email" value={orderForm.customerEmail} onChange={(e) => updateOrderField("customerEmail", e.target.value)} />
              </div>
            </div>

            {/* Platforms & Contract */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("ad.campaignSettings")}</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={orderForm.platformGoogle} onCheckedChange={(c) => updateOrderField("platformGoogle", !!c)} />
                  Google Ads
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={orderForm.platformMeta} onCheckedChange={(c) => updateOrderField("platformMeta", !!c)} />
                  Meta Ads
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{t("ad.startDate")}</label>
                  <Input type="date" value={orderForm.startDate} onChange={(e) => updateOrderField("startDate", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("ad.contractPeriod")}</label>
                  <Select value={orderForm.contractMonths} onValueChange={(v) => updateOrderField("contractMonths", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1ヶ月</SelectItem>
                      <SelectItem value="3">3ヶ月</SelectItem>
                      <SelectItem value="6">6ヶ月</SelectItem>
                      <SelectItem value="12">12ヶ月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("ad.feeRate")}</label>
                  <Select value={orderForm.managementFeeRate} onValueChange={(v) => updateOrderField("managementFeeRate", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Textarea placeholder={t("ad.orderNotes")} value={orderForm.notes} onChange={(e) => updateOrderField("notes", e.target.value)} rows={2} />

            {/* Cost Summary */}
            {result && (
              <div className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-3 space-y-1">
                <p>{t("ad.adBudget")}: ¥{result.overallStrategy.monthlyTotalBudget.toLocaleString()}/月</p>
                <p>{t("ad.mgmtFee")}: ¥{Math.round(result.overallStrategy.monthlyTotalBudget * parseInt(orderForm.managementFeeRate) / 100).toLocaleString()}/月</p>
                <p className="font-semibold text-primary text-sm">
                  {t("ad.monthlyTotal")}: ¥{(result.overallStrategy.monthlyTotalBudget + Math.round(result.overallStrategy.monthlyTotalBudget * parseInt(orderForm.managementFeeRate) / 100)).toLocaleString()}/月
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" variant="outline" onClick={handleGenerateAdOrder}>
                <FileDown className="w-4 h-4" />
                {t("ad.generateOrder")}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSendAdOrder} disabled={orderSending || !orderForm.customerEmail}>
                {orderSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t("ad.sendOrder")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
