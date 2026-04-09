import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PricingSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const plans = [
    {
      name: isEn ? "Free" : "Free",
      price: "¥0",
      period: isEn ? "/mo" : "/月",
      popular: false,
      features: isEn
        ? ["3 analyses/month", "Basic trade area map", "CSV export"]
        : ["月3回分析", "基本商圏マップ", "CSV出力"],
      cta: isEn ? "Start Free" : "無料で始める",
      href: "/auth",
    },
    {
      name: "Standard",
      price: "¥9,800",
      period: isEn ? "/mo" : "/月",
      popular: false,
      features: isEn
        ? ["30 analyses/month", "Competitor mapping", "AI ad proposals", "PDF reports"]
        : ["月30回分析", "競合マッピング", "AI広告提案", "PDFレポート"],
      cta: isEn ? "Get Started" : "始める",
      href: "/auth",
    },
    {
      name: "Pro",
      price: "¥29,800",
      period: isEn ? "/mo" : "/月",
      popular: true,
      features: isEn
        ? ["Unlimited analyses", "Flyer distribution design", "MEO analysis", "Priority support"]
        : ["分析無制限", "チラシ配布設計", "MEO分析", "優先サポート"],
      cta: isEn ? "Start Pro" : "Proで始める",
      href: "/auth",
    },
    {
      name: "Agency",
      price: "¥49,800",
      period: isEn ? "/mo" : "/月",
      popular: false,
      features: isEn
        ? ["Multi-location support", "White-label reports", "API access", "Dedicated manager"]
        : ["複数店舗対応", "ホワイトラベル", "API連携", "専任担当者"],
      cta: isEn ? "Contact Us" : "お問い合わせ",
      href: "/auth",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "Plans & Pricing" : "料金プラン"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isEn
              ? "Start free, upgrade as you grow."
              : "まずは無料で。成長に合わせてアップグレード。"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card
                className={`h-full relative flex flex-col ${
                  plan.popular
                    ? "border-2 border-primary shadow-xl scale-[1.02]"
                    : "border border-border/60 shadow-sm"
                } hover:shadow-lg transition-all duration-300`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 text-xs">
                    {isEn ? "Popular" : "人気"}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <CardDescription className="font-semibold text-sm text-foreground">
                    {plan.name}
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold mt-1">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.period}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-2 pb-6 justify-center">
                  <Link to={plan.href} className="w-full">
                    <Button
                      size="sm"
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full gap-1"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <Link
            to="/pricing"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            {isEn ? "Compare all features" : "全機能を比較する"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
