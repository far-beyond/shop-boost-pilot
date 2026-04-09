import { ArrowRight, XCircle, CheckCircle2, Database, Map, CreditCard, Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SocialProofSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const before = isEn
    ? [
        "Site selection based on gut feeling",
        "Blanket flyer distribution = wasted budget",
        "No visibility into competitor landscape",
        "Ad spending controlled by agencies",
      ]
    : [
        "勘と経験に頼った出店判断",
        "チラシは全戸配布で無駄なコスト",
        "競合の状況が把握できない",
        "広告は代理店任せで不透明",
      ];

  const after = isEn
    ? [
        "Data-driven scientific site selection",
        "Efficient distribution to target households",
        "Competitors mapped by location & type",
        "AI auto-designs optimal ad plans",
      ]
    : [
        "データに基づいた科学的な出店判断",
        "ターゲット世帯に絞った効率配布",
        "競合の位置・業種を地図で一目瞭然",
        "AIが最適な広告プランを自動設計",
      ];

  const poweredBy = [
    { icon: Database, label: isEn ? "e-Stat Census Data" : "e-Stat 国勢調査データ連携" },
    { icon: Map, label: isEn ? "OpenStreetMap" : "OpenStreetMap 地図データ" },
    { icon: CreditCard, label: isEn ? "Stripe Secure Payments" : "Stripe 安全な決済" },
    { icon: Cpu, label: isEn ? "AI Analysis Engine" : "AI搭載分析エンジン" },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "Before & After MapBoost" : "MapBoost 導入で変わること"}
          </h2>
        </motion.div>

        {/* Before / After cards */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-4 items-center mb-16">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border border-destructive/20 bg-destructive/5 shadow-sm h-full">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold text-destructive mb-4 uppercase tracking-wide">
                  Before
                </div>
                <ul className="space-y-3">
                  {before.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4 text-destructive/60 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md" style={{ background: "var(--gradient-primary)" }}>
              <ArrowRight className="w-6 h-6 text-primary-foreground" />
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border border-accent/30 bg-accent/5 shadow-sm h-full">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold text-accent mb-4 uppercase tracking-wide">
                  After
                </div>
                <ul className="space-y-3">
                  {after.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Powered-by badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
        >
          {poweredBy.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-background border border-border/60 rounded-full px-4 py-2 text-xs text-muted-foreground shadow-sm"
            >
              <item.icon className="w-4 h-4 text-primary/60" />
              {item.label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
