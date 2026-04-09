import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, Loader2, Building2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

// TODO: Replace these with actual Stripe Price IDs after creating products in Stripe Dashboard
const STANDARD_PRICE_ID = "price_standard_placeholder";
const PRO_PRICE_ID = "price_1TJ6aNJOWCMLKlVheBJP8r39"; // existing
const PRO_PRODUCT_ID = "prod_UHfwoH9hAZlxt8"; // existing

export default function Pricing() {
  const { user, subscription } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setLoadingPlan(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (e: any) {
      toast.error(e.message || t("pricing.error"));
    } finally {
      setLoadingPlan(null);
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

  const plans = [
    {
      key: "free",
      icon: <Zap className="w-5 h-5 text-primary" />,
      name: t("pricing.free.name"),
      desc: t("pricing.free.desc"),
      price: "¥0",
      features: [t("pricing.free.f1"), t("pricing.free.f2"), t("pricing.free.f3")],
      action: null,
      popular: false,
      highlight: !isProUser,
    },
    {
      key: "standard",
      icon: <Star className="w-5 h-5 text-blue-500" />,
      name: t("pricing.standard.name"),
      desc: t("pricing.standard.desc"),
      price: "¥9,800",
      features: [
        t("pricing.standard.f1"), t("pricing.standard.f2"), t("pricing.standard.f3"),
        t("pricing.standard.f4"), t("pricing.standard.f5"),
      ],
      action: () => handleCheckout(STANDARD_PRICE_ID, "standard"),
      popular: false,
      highlight: false,
    },
    {
      key: "pro",
      icon: <Crown className="w-5 h-5 text-amber-500" />,
      name: t("pricing.pro.name"),
      desc: t("pricing.pro.desc"),
      price: "¥29,800",
      features: [
        t("pricing.pro.f1"), t("pricing.pro.f2"), t("pricing.pro.f3"), t("pricing.pro.f4"),
        t("pricing.pro.f5"), t("pricing.pro.f6"), t("pricing.pro.f7"), t("pricing.pro.f8"),
      ],
      action: () => handleCheckout(PRO_PRICE_ID, "pro"),
      popular: true,
      highlight: isProUser,
    },
    {
      key: "agency",
      icon: <Building2 className="w-5 h-5 text-purple-500" />,
      name: t("pricing.agency.name"),
      desc: t("pricing.agency.desc"),
      price: "¥49,800",
      features: [
        t("pricing.agency.f1"), t("pricing.agency.f2"), t("pricing.agency.f3"),
        t("pricing.agency.f4"), t("pricing.agency.f5"),
      ],
      action: () => navigate("/contact"),
      popular: false,
      highlight: false,
      contactOnly: true,
    },
  ];

  return (
    <Layout>
      <div className="min-h-[80vh]" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-12 max-w-6xl">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`h-full relative ${plan.highlight ? "ring-2 ring-primary" : plan.popular ? "border-primary/40" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-3">{t("pricing.popular")}</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {plan.icon}
                      {plan.name}
                      {plan.highlight && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-auto">
                          {t("pricing.currentPlan")}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">{plan.desc}</CardDescription>
                    <div className="pt-2">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ {t("pricing.month")}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-5">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.key === "free" && !isProUser && (
                      <Button variant="outline" className="w-full text-xs" disabled>
                        {t("pricing.currentPlan")}
                      </Button>
                    )}
                    {plan.key !== "free" && isProUser && plan.highlight && (
                      <Button variant="outline" className="w-full text-xs" onClick={handleManage} disabled={portalLoading}>
                        {portalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                        {t("pricing.manage")}
                      </Button>
                    )}
                    {plan.key !== "free" && !plan.highlight && plan.action && (
                      <Button
                        className={`w-full text-xs ${plan.popular ? "" : "variant-outline"}`}
                        variant={plan.contactOnly ? "outline" : "default"}
                        onClick={plan.action}
                        disabled={loadingPlan === plan.key}
                      >
                        {loadingPlan === plan.key && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                        {plan.contactOnly ? t("pricing.contact") : t("pricing.upgrade")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
