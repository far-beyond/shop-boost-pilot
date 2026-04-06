import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PRO_PRICE_ID = "price_1TJ6aNJOWCMLKlVheBJP8r39";
const PRO_PRODUCT_ID = "prod_UHfwoH9hAZlxt8";

export default function Pricing() {
  const { user, subscription } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PRO_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast.error(e.message || t("pricing.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast.error(e.message || t("pricing.error"));
    } finally {
      setPortalLoading(false);
    }
  };

  const isProUser = subscription?.subscribed && subscription?.product_id === PRO_PRODUCT_ID;

  const freeFeatures = [
    t("pricing.free.f1"),
    t("pricing.free.f2"),
    t("pricing.free.f3"),
    t("pricing.free.f4"),
  ];

  const proFeatures = [
    t("pricing.pro.f1"),
    t("pricing.pro.f2"),
    t("pricing.pro.f3"),
    t("pricing.pro.f4"),
    t("pricing.pro.f5"),
    t("pricing.pro.f6"),
  ];

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              <Zap className="w-3.5 h-3.5" />
              {t("pricing.badge")}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("pricing.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("pricing.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className={`h-full ${!isProUser ? "ring-2 ring-primary" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-primary" />
                    {t("pricing.free.name")}
                  </CardTitle>
                  <CardDescription>{t("pricing.free.desc")}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold text-foreground">¥0</span>
                    <span className="text-sm text-muted-foreground ml-1">/ {t("pricing.month")}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {freeFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {!isProUser && (
                    <div className="mt-6">
                      <Button variant="outline" className="w-full" disabled>
                        {t("pricing.currentPlan")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className={`h-full ${isProUser ? "ring-2 ring-primary" : "border-primary/30"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="w-5 h-5 text-amber-500" />
                    {t("pricing.pro.name")}
                    {isProUser && (
                      <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-auto">
                        {t("pricing.currentPlan")}
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{t("pricing.pro.desc")}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold text-foreground">¥2,980</span>
                    <span className="text-sm text-muted-foreground ml-1">/ {t("pricing.month")}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {proFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    {isProUser ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleManage}
                        disabled={portalLoading}
                      >
                        {portalLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {t("pricing.manage")}
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={handleCheckout} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {t("pricing.upgrade")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
