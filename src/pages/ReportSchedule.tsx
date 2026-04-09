import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Bell, BellOff, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { toast } from "sonner";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const STORAGE_KEY = "mapboost_report_schedule";

type ScheduleConfig = {
  enabled: boolean;
  storeName: string;
  address: string;
  email: string;
};

function loadConfig(): ScheduleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, storeName: "", address: "", email: "" };
}

function saveConfig(config: ScheduleConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export default function ReportSchedule() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<ScheduleConfig>(loadConfig);

  const update = (patch: Partial<ScheduleConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    saveConfig(config);
    toast.success(t("mrs.saved"));
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-3xl">
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Calendar className="w-3.5 h-3.5" />{t("mrs.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("mrs.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("mrs.subtitle")}</p>
          </motion.div>

          <motion.div {...fadeUp}>
            <Card className="border border-border/60 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {config.enabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                    {t("mrs.autoToggleLabel")}
                  </span>
                  <Switch checked={config.enabled} onCheckedChange={(v) => update({ enabled: v })} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.enabled && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm text-primary font-medium">{t("mrs.enabledMsg")}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("mrs.storeName")}</label>
                  <Input placeholder={t("mrs.storeNamePh")} value={config.storeName} onChange={(e) => update({ storeName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t("mrs.address")}</label>
                  <Input placeholder={t("mrs.addressPh")} value={config.address} onChange={(e) => update({ address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />{t("mrs.email")}
                  </label>
                  <Input type="email" placeholder={t("mrs.emailPh")} value={config.email} onChange={(e) => update({ email: e.target.value })} />
                </div>

                <Button onClick={handleSave} className="gap-2 w-full sm:w-auto">
                  <Save className="w-4 h-4" />{t("mrs.save")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {!config.enabled && (
            <motion.div {...fadeUp}>
              <Card className="border border-border/60 bg-muted/30">
                <CardContent className="py-8 text-center">
                  <BellOff className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">{t("mrs.disabledMsg")}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
