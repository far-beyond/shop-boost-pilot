import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Megaphone, Loader2, Search, Newspaper, Monitor, Target,
  TrendingUp, DollarSign, Users, Copy, Check, MapPin, FileDown,
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
import { motion } from "framer-motion";
import { toast } from "sonner";
import { exportMediaPlanPDF } from "@/lib/mediaPlanPdfExport";
import { exportMediaOrderPDF, type MediaOrderData } from "@/lib/mediaOrderPdfExport";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

type MediaPlanResult = { google: any | null; meta: any | null; flyer: any | null; };

export default function MediaPlan() {
  const { t, language } = useLanguage();
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [storeName, setStoreName] = useState("");
  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaPlanResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSending, setOrderSending] = useState(false);
  const [orderForm, setOrderForm] = useState({
    clientCompany: "", clientName: "", clientEmail: "", clientPhone: "",
    customerCompany: "", customerName: "", customerEmail: "",
    managementFeeRate: "20", startDate: "", contractMonths: "3",
    includeGoogle: true, includeMeta: true, includeFlyer: true, notes: "",
  });
  const updateOF = (k: string, v: string | boolean) => setOrderForm((p) => ({ ...p, [k]: v }));

  const buildMediaOrder = (): MediaOrderData => {
    const r = result!;
    const g = r.google; const m = r.meta; const f = r.flyer;
    return {
      ...orderForm,
      managementFeeRate: parseInt(orderForm.managementFeeRate),
      contractMonths: parseInt(orderForm.contractMonths),
      storeName: storeName || address, storeAddress: address, industry,
      includeGoogle: orderForm.includeGoogle && !!g,
      includeMeta: orderForm.includeMeta && !!m,
      includeFlyer: orderForm.includeFlyer && !!f,
      googleBudget: g?.monthlyBudget || 0,
      googleCampaignType: g?.campaignType || "",
      googleKeywords: g?.keywords?.map((k: any) => k.keyword) || [],
      googleAdCopies: g?.adCopies?.map((a: any) => ({ headline: `${a.headline1} | ${a.headline2}`, description: a.description1 })) || [],
      metaBudget: m?.monthlyBudget || 0,
      metaObjective: m?.campaignObjective || "",
      metaAudiences: m?.targetAudiences?.map((a: any) => ({ name: a.name, ageRange: a.ageRange, interests: a.interests || [] })) || [],
      metaCreatives: m?.adCreatives?.map((c: any) => ({ headline: c.headline, description: c.primaryText })) || [],
      flyerTotalQuantity: f?.totalQuantity || 0,
      flyerTotalCost: f?.estimatedCost?.totalCost || 0,
      flyerAreas: f?.distributionAreas?.map((a: any) => ({ areaName: a.areaName, quantity: a.recommendedQuantity, priority: a.priority })) || [],
      flyerTiming: f?.timing?.bestDays?.join("、") || "",
    };
  };

  const handleGenMediaOrder = async () => {
    if (!orderForm.clientCompany) { toast.error("会社名は必須です"); return; }
    await exportMediaOrderPDF(buildMediaOrder());
    toast.success(t("media.orderComplete"));
  };

  const handleSendMediaOrder = async () => {
    if (!orderForm.customerEmail) { toast.error("送信先メールを入力してください"); return; }
    setOrderSending(true);
    try {
      const od = buildMediaOrder();
      const blob = await exportMediaOrderPDF(od);
      const reader = new FileReader();
      const b64 = await new Promise<string>((res) => { reader.onloadend = () => res((reader.result as string).split(",")[1]); reader.readAsDataURL(blob); });
      const { error } = await supabase.functions.invoke("send-flyer-order", {
        body: { to: orderForm.customerEmail, subject: `【ご提案】${od.storeName} 統合販促プランのご案内`, storeName: od.storeName, clientCompany: od.clientCompany, clientName: od.clientName, totalQuantity: 0, totalCost: 0, deliveryDate: od.startDate, pdfBase64: b64 },
      });
      if (error) throw error;
      toast.success(t("media.orderSent"));
      setOrderOpen(false);
    } catch (e: any) {
      toast.error(t("media.orderFailed") + ": " + (e.message || ""));
    } finally { setOrderSending(false); }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t("media.copied"));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runPlan = async () => {
    if (!address) { toast.error(t("media.errAddress")); return; }
    if (!industry) { toast.error(t("media.errIndustry")); return; }
    setLoading(true);
    try {
      const body = { address, industry, budget, target, storeName, language };
      const [adRes, flyerRes] = await Promise.all([
        supabase.functions.invoke("ad-proposal", { body }),
        supabase.functions.invoke("flyer-plan", { body }),
      ]);
      if (adRes.error) throw adRes.error;
      if (flyerRes.error) throw flyerRes.error;
      setResult({
        google: adRes.data?.result?.googleAds ?? null,
        meta: adRes.data?.result?.metaAds ?? null,
        flyer: flyerRes.data?.result ?? null,
      });
      toast.success(t("media.success"));
    } catch (e: any) {
      toast.error(e.message || t("media.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl">
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              {t("media.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("media.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("media.subtitle")}</p>
          </motion.div>

          <motion.div {...fadeUp}>
            <Card className="border border-border/60 mb-8">
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("media.address")} *</label>
                    <Input placeholder={t("media.addressPh")} value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("media.industry")} *</label>
                    <Input placeholder={t("media.industryPh")} value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("media.storeName")}</label>
                    <Input placeholder={t("media.storeNamePh")} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t("media.budget")}</label>
                    <Input placeholder={t("media.budgetPh")} value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("media.target")}</label>
                  <Textarea placeholder={t("media.targetPh")} value={target} onChange={(e) => setTarget(e.target.value)} rows={2} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={runPlan} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? t("media.generating") : t("media.generate")}
                  </Button>
                  {result && (
                    <>
                      <Button variant="outline" className="gap-2" onClick={() => exportMediaPlanPDF(result, { storeName, address, industry })}>
                        <FileDown className="w-4 h-4" />
                        {t("media.pdfDownload")}
                      </Button>
                      <Button className="gap-2" onClick={() => setOrderOpen(true)}>
                        <ClipboardList className="w-4 h-4" />
                        {t("media.createOrder")}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {result && (
            <motion.div {...fadeUp}>
              <Tabs defaultValue="meta" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="meta" className="gap-1.5 text-xs sm:text-sm"><Monitor className="w-3.5 h-3.5" /> {t("media.tabMeta")}</TabsTrigger>
                  <TabsTrigger value="google" className="gap-1.5 text-xs sm:text-sm"><Target className="w-3.5 h-3.5" /> {t("media.tabGoogle")}</TabsTrigger>
                  <TabsTrigger value="flyer" className="gap-1.5 text-xs sm:text-sm"><Newspaper className="w-3.5 h-3.5" /> {t("media.tabFlyer")}</TabsTrigger>
                </TabsList>

                <TabsContent value="meta" className="space-y-4 mt-4">
                  {result.meta ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label={t("media.campaignObj")} value={result.meta.campaignObjective} />
                        <StatCard label={t("media.dailyBudget")} value={`¥${result.meta.dailyBudget?.toLocaleString()}`} />
                        <StatCard label={t("media.expectedCPM")} value={`${result.meta.expectedCPM} / ${result.meta.expectedCTR}`} />
                      </div>
                      {result.meta.targetAudiences?.map((aud: any, i: number) => (
                        <Card key={i} className="border border-border/60">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-sm font-bold text-foreground">{aud.name}</p>
                              <Badge variant="outline" className="text-[10px]">{aud.estimatedReach}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{t("media.age")}: {aud.ageRange} / {t("media.gender")}: {aud.gender}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {aud.interests?.map((int: string, j: number) => (
                                <Badge key={j} variant="secondary" className="text-[10px]">{int}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <EmptyState message={t("media.noMeta")} />
                  )}
                </TabsContent>

                <TabsContent value="google" className="space-y-4 mt-4">
                  {result.google ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label={t("media.campaignType")} value={result.google.campaignType} />
                        <StatCard label={t("media.dailyBudget")} value={`¥${result.google.dailyBudget?.toLocaleString()}`} />
                        <StatCard label={t("media.expectedCTR")} value={`${result.google.expectedCTR} / ${result.google.expectedCPA}`} />
                      </div>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{t("media.keywords")}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {result.google.keywords?.map((kw: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    kw.priority === "高" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                    kw.priority === "中" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}>{kw.priority}</span>
                                  <span className="text-sm font-medium text-foreground">{kw.keyword}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">¥{kw.estimatedCPC}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{t("media.adCopy")}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {result.google.adCopies?.map((ad: any, i: number) => (
                            <div key={i} className="p-4 rounded-lg border border-border/60 relative group">
                              <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                onClick={() => copyText(`${ad.headline1} | ${ad.headline2}\n${ad.description1}`, `gc-${i}`)}>
                                {copiedKey === `gc-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                              <p className="text-primary font-bold text-sm mb-1">{ad.headline1} | {ad.headline2} | {ad.headline3}</p>
                              <p className="text-xs text-muted-foreground">{ad.description1}</p>
                              <p className="text-xs text-muted-foreground">{ad.description2}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <EmptyState message={t("media.noGoogle")} />
                  )}
                </TabsContent>

                <TabsContent value="flyer" className="space-y-4 mt-4">
                  {result.flyer ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <StatCard label={t("media.totalQty")} value={`${result.flyer.totalQuantity?.toLocaleString()}`} />
                        <StatCard label={t("media.totalCost")} value={`¥${result.flyer.estimatedCost?.totalCost?.toLocaleString()}`} />
                        <StatCard label={t("media.responseRate")} value={result.flyer.expectedResponseRate} />
                      </div>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{t("media.distAreas")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {result.flyer.distributionAreas?.map((area: any, i: number) => (
                            <div key={i} className="p-4 rounded-lg border border-border/60">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-sm font-bold text-foreground">{area.areaName}</p>
                                <Badge variant={area.priority === "高" ? "destructive" : "secondary"} className="text-[10px]">{area.priority}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{area.reason}</p>
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{t("media.households")}: {area.estimatedHouseholds?.toLocaleString()}</span>
                                <span>{t("media.recQty")}: {area.recommendedQuantity?.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{t("media.timing")}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div><p className="text-xs font-medium text-foreground mb-1">{t("media.bestDays")}</p><p>{result.flyer.timing?.bestDays?.join(", ")}</p></div>
                            <div><p className="text-xs font-medium text-foreground mb-1">{t("media.bestTime")}</p><p>{result.flyer.timing?.bestTimeSlots?.join(", ")}</p></div>
                            <div><p className="text-xs font-medium text-foreground mb-1">{t("media.frequency")}</p><p>{result.flyer.timing?.frequency}</p></div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="border border-border/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base">{t("media.catchcopy")}</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {result.flyer.catchcopies?.map((cc: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg border border-border/60 relative group">
                              <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                                onClick={() => copyText(`${cc.headline}\n${cc.subCopy}`, `fc-${i}`)}>
                                {copiedKey === `fc-${i}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                              <p className="text-sm font-bold text-foreground">{cc.headline}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{cc.subCopy}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <EmptyState message={t("media.noFlyer")} />
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />{t("media.orderTitle")}</DialogTitle>
            <DialogDescription>{t("media.orderDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("media.agencyInfo")}</p>
              <Input placeholder={t("media.companyName")} value={orderForm.clientCompany} onChange={(e) => updateOF("clientCompany", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder={t("media.contactPerson")} value={orderForm.clientName} onChange={(e) => updateOF("clientName", e.target.value)} />
                <Input placeholder={t("media.phone")} value={orderForm.clientPhone} onChange={(e) => updateOF("clientPhone", e.target.value)} />
              </div>
              <Input placeholder={t("media.email")} type="email" value={orderForm.clientEmail} onChange={(e) => updateOF("clientEmail", e.target.value)} />
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("media.customerInfo")}</p>
              <Input placeholder={t("media.customerCompany")} value={orderForm.customerCompany} onChange={(e) => updateOF("customerCompany", e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder={t("media.customerName")} value={orderForm.customerName} onChange={(e) => updateOF("customerName", e.target.value)} />
                <Input placeholder={t("media.customerEmail")} type="email" value={orderForm.customerEmail} onChange={(e) => updateOF("customerEmail", e.target.value)} />
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("media.mediaSelection")}</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={orderForm.includeGoogle} onCheckedChange={(c) => updateOF("includeGoogle", !!c)} />Google Ads</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={orderForm.includeMeta} onCheckedChange={(c) => updateOF("includeMeta", !!c)} />Meta Ads</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={orderForm.includeFlyer} onCheckedChange={(c) => updateOF("includeFlyer", !!c)} />{t("media.tabFlyer")}</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{t("media.startDate")}</label>
                  <Input type="date" value={orderForm.startDate} onChange={(e) => updateOF("startDate", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("media.contractPeriod")}</label>
                  <Select value={orderForm.contractMonths} onValueChange={(v) => updateOF("contractMonths", v)}>
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
                  <label className="text-xs text-muted-foreground">{t("media.feeRate")}</label>
                  <Select value={orderForm.managementFeeRate} onValueChange={(v) => updateOF("managementFeeRate", v)}>
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

            <Textarea placeholder={t("media.orderNotes")} value={orderForm.notes} onChange={(e) => updateOF("notes", e.target.value)} rows={2} />

            {result && (
              <div className="text-xs text-muted-foreground bg-primary/5 rounded-lg p-3 space-y-1">
                {result.google && orderForm.includeGoogle && <p>Google広告: ¥{result.google.monthlyBudget?.toLocaleString()}/月</p>}
                {result.meta && orderForm.includeMeta && <p>Meta広告: ¥{result.meta.monthlyBudget?.toLocaleString()}/月</p>}
                {result.flyer && orderForm.includeFlyer && <p>チラシ: ¥{result.flyer.estimatedCost?.totalCost?.toLocaleString()} / {result.flyer.totalQuantity?.toLocaleString()}部</p>}
                <p>管理費: {orderForm.managementFeeRate}%</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 gap-2" variant="outline" onClick={handleGenMediaOrder}>
                <FileDown className="w-4 h-4" />{t("media.generateOrder")}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleSendMediaOrder} disabled={orderSending || !orderForm.customerEmail}>
                {orderSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t("media.sendOrder")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-2 border-border">
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
