import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function PlanSettingsTab() {
  const { t } = useLanguage();
  const [freeLimit, setFreeLimit] = useState("10");
  const [proPrice, setProPrice] = useState("2980");
  const [trialDays, setTrialDays] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-billing", {
        body: { action: "get-plan-settings" },
      });
      if (!error && data?.settings) {
        setFreeLimit(data.settings.free_monthly_limit || "10");
        setProPrice(data.settings.pro_monthly_price || "2980");
        setTrialDays(data.settings.free_trial_days || "0");
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-billing", {
        body: {
          action: "save-plan-settings",
          settings: {
            free_monthly_limit: freeLimit,
            pro_monthly_price: proPrice,
            free_trial_days: trialDays,
          },
        },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success(t("admin.planSettingsSaved"));
    } catch (e: any) {
      toast.error(t("admin.planSettingsError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.planSettings")}</CardTitle>
        <CardDescription>{t("admin.planSettingsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="freeLimit">{t("admin.freeMonthlyLimit")}</Label>
          <Input
            id="freeLimit"
            type="number"
            min="0"
            value={freeLimit}
            onChange={(e) => setFreeLimit(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proPrice">{t("admin.proMonthlyPrice")}</Label>
          <Input
            id="proPrice"
            type="number"
            min="0"
            value={proPrice}
            onChange={(e) => setProPrice(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trialDays">{t("admin.freeTrialDays")}</Label>
          <Input
            id="trialDays"
            type="number"
            min="0"
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button onClick={saveSettings} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t("admin.savePlanSettings")}
        </Button>
      </CardContent>
    </Card>
  );
}
