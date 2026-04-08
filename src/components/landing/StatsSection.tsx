import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StatsSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const stats = [
    {
      value: isEn ? "3 min" : "3分",
      label: isEn ? "Instant trade area analysis" : "で商圏分析が完了",
      sub: isEn ? "From address input to full report" : "住所入力からレポートまで",
    },
    {
      value: isEn ? "47" : "47",
      label: isEn ? "All prefectures covered" : "都道府県 完全対応",
      sub: isEn ? "Japan nationwide support" : "日本全国をカバー",
    },
    {
      value: isEn ? "Real Data" : "実データ",
      label: isEn ? "Census data integrated" : "国勢調査データ連携",
      sub: isEn ? "e-Stat, US Census, WorldPop" : "e-Stat・US Census・WorldPop",
    },
    {
      value: isEn ? "Global" : "世界対応",
      label: isEn ? "Worldwide coverage" : "海外エリアも分析可能",
      sub: isEn ? "Analyze any location worldwide" : "アメリカ・ヨーロッパ・アジア",
    },
  ];

  return (
    <section className="py-20 md:py-24 border-b border-border/40">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{s.value}</div>
              <div className="text-sm font-medium text-foreground mb-1">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
