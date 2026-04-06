import { MapPin, Users, Megaphone, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeaturesSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const features = [
    {
      icon: MapPin,
      title: isEn ? "Trade Area Analysis" : "商圏分析",
      desc: isEn
        ? "Visualize population, households, and age distribution on a map."
        : "地図上で人口・世帯・年齢構成を可視化",
      detail: isEn
        ? "Powered by real census data from e-Stat, US Census, and WorldPop."
        : "e-Stat・US Census・WorldPop の実データと連携。",
    },
    {
      icon: Users,
      title: isEn ? "Competitor Analysis" : "競合分析",
      desc: isEn
        ? "Map surrounding competitors and get AI-powered differentiation strategies."
        : "周辺の競合店舗をマッピング。差別化ポイントをAIが提案。",
      detail: isEn
        ? "Automatically detect competitors and analyze their positioning."
        : "競合を自動検出し、ポジショニングを分析。",
    },
    {
      icon: Megaphone,
      title: isEn ? "Ad Proposals" : "広告提案",
      desc: isEn
        ? "AI auto-designs optimal plans for Meta & Google Ads."
        : "Meta広告・Google広告の最適プランをAIが自動設計。",
      detail: isEn
        ? "Budget allocation and targeting included."
        : "予算配分・ターゲット設定まで。",
    },
    {
      icon: FileText,
      title: isEn ? "Flyer Distribution Design" : "チラシ配布設計",
      desc: isEn
        ? "AI recommends distribution area, quantity, and timing."
        : "配布エリア・部数・タイミングをAIが提案。",
      detail: isEn
        ? "Export order sheets for printing companies."
        : "ポスティング会社への発注書も出力。",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "What MapBoost AI Can Do" : "MapBoost AI でできること"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="flex gap-5 p-6 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-lg transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                style={{ background: "var(--gradient-primary)" }}
              >
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{f.desc}</p>
                <p className="text-xs text-primary/60">{f.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
