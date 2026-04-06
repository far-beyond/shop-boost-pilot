import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PricingSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const included = isEn
    ? [
        "Trade area analysis (unlimited)",
        "Competitor analysis",
        "AI ad proposals",
        "Flyer distribution design",
        "Location scoring",
        "Integrated reports & PDF export",
        "Census data integration",
        "Global support (US Census / WorldPop)",
      ]
    : [
        "商圏分析（無制限）",
        "競合分析",
        "AI広告提案",
        "チラシ配布設計",
        "出店候補地スコアリング",
        "統合レポート・PDF出力",
        "国勢調査データ連携",
        "海外対応（US Census / WorldPop）",
      ];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "Simple Pricing" : "シンプルな料金プラン"}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 border-primary/30 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardDescription className="text-primary font-semibold text-sm">
                {isEn ? "All Features Included" : "全機能使い放題"}
              </CardDescription>
              <CardTitle className="text-4xl md:text-5xl font-bold mt-2">
                ¥2,980
                <span className="text-base font-normal text-muted-foreground">
                  /{isEn ? "mo" : "月"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {included.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4 pb-8 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-base px-10 py-6 gap-2 shadow-lg">
                  {isEn ? "Start for Free" : "無料で始める"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
