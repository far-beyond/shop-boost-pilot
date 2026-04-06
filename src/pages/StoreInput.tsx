import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Layout from "@/components/Layout";
import { ArrowRight, Loader2, Store, AlertTriangle } from "lucide-react";
import { createDiagnosis, runAIDiagnosis } from "@/lib/diagnosisService";
import { checkUsageLimit, incrementUsage } from "@/lib/usageLimitService";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const mediaOptionKeys = [
  "Googleビジネスプロフィール", "Instagram", "X（Twitter）",
  "LINE公式アカウント", "チラシ・ポスティング", "Web広告（Google/Meta）", "食べログ・ホットペッパー等",
];
const mediaLabelKeys = [
  "si.mediaGBP", "si.mediaIG", "si.mediaX",
  "si.mediaLINE", "si.mediaFlyer", "si.mediaWebAd", "si.mediaPortal",
];

export default function StoreInput() {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ allowed: boolean; used: number; limit: number } | null>(null);

  const storeSchema = z.object({
    storeName: z.string().trim().min(1, t("si.errName")).max(100),
    industry: z.string().trim().min(1, t("si.errIndustry")).max(100),
    address: z.string().trim().min(1, t("si.errAddress")).max(200),
    station: z.string().trim().max(100).optional().default(""),
    target: z.string().trim().max(200).optional().default(""),
    strengths: z.string().trim().max(500).optional().default(""),
    concerns: z.string().trim().max(500).optional().default(""),
    budget: z.string().trim().max(100).optional().default(""),
    competitors: z.string().trim().max(500).optional().default(""),
    media: z.array(z.string()).optional().default([]),
  });
  type StoreFormValues = z.infer<typeof storeSchema>;

  useEffect(() => {
    if (!subscription?.subscribed) {
      checkUsageLimit().then(setUsageInfo).catch(() => {});
    }
  }, [subscription]);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: { storeName: "", industry: "", address: "", station: "", target: "", strengths: "", concerns: "", budget: "", competitors: "", media: [] },
  });

  const onSubmit = async (data: StoreFormValues) => {
    if (!subscription?.subscribed) {
      const limit = await checkUsageLimit();
      if (!limit.allowed) { toast.error(t("si.limitMsg")); return; }
    }
    setSubmitting(true);
    try {
      const diagnosis = await createDiagnosis({
        store_name: data.storeName, industry: data.industry, address: data.address,
        station: data.station || undefined, target_audience: data.target || undefined,
        strengths: data.strengths || undefined, concerns: data.concerns || undefined,
        budget: data.budget || undefined, competitors: data.competitors || undefined,
        media: data.media?.length ? data.media : undefined,
      });
      toast.info(t("si.aiStarted"));
      await Promise.all([
        runAIDiagnosis(diagnosis.id, "diagnosis"),
        runAIDiagnosis(diagnosis.id, "promo"),
        runAIDiagnosis(diagnosis.id, "kpi"),
      ]);
      await incrementUsage();
      toast.success(t("si.complete"));
      navigate(`/diagnosis/${diagnosis.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || t("si.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {usageInfo && !usageInfo.allowed && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">{t("usage.limitReached")} ({usageInfo.limit}{t("si.times")})</p>
                <p className="text-xs text-muted-foreground mt-1">{t("usage.upgradeHint")}</p>
              </div>
              <Button size="sm" asChild><Link to="/pricing">{t("usage.viewPlans")}</Link></Button>
            </CardContent>
          </Card>
        )}
        {usageInfo && usageInfo.allowed && usageInfo.limit !== Infinity && (
          <div className="mb-4 text-sm text-muted-foreground text-center">
            {t("usage.monthly")}: {usageInfo.used} / {usageInfo.limit} {t("si.times")}
          </div>
        )}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Store className="w-4 h-4" />{t("si.badge")}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("si.title")}</h1>
          <p className="text-muted-foreground">{t("si.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("si.basicInfo")}</CardTitle>
            <CardDescription>{t("si.basicInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="storeName" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.storeName")} <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder={t("si.storeNamePh")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.industry")} <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder={t("si.industryPh")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.address")} <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder={t("si.addressPh")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="station" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.station")}</FormLabel><FormControl><Input placeholder={t("si.stationPh")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="target" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.target")}</FormLabel><FormControl><Input placeholder={t("si.targetPh")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="strengths" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.strengths")}</FormLabel><FormControl><Textarea placeholder={t("si.strengthsPh")} rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="concerns" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.concerns")}</FormLabel><FormControl><Textarea placeholder={t("si.concernsPh")} rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="budget" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.budget")}</FormLabel><FormControl><Input placeholder={t("si.budgetPh")} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="competitors" render={({ field }) => (
                  <FormItem><FormLabel>{t("si.competitors")}</FormLabel><FormControl><Textarea placeholder={t("si.competitorsPh")} rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="media" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("si.media")}</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mediaOptionKeys.map((m, idx) => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <Checkbox checked={field.value?.includes(m)} onCheckedChange={(checked) => { const c = field.value ?? []; field.onChange(checked ? [...c, m] : c.filter((x) => x !== m)); }} />
                          <span className="text-sm">{t(mediaLabelKeys[idx])}</span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" size="lg" className="w-full gap-2 text-base" disabled={submitting}>
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" />{t("si.analyzing")}</>) : (<>{t("si.start")}<ArrowRight className="w-4 h-4" /></>)}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
