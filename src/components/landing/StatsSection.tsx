import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StatsSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const stats = [
    {
      value: isEn ? "3 min" : "3分",
      label: isEn ? "Trade area analysis completed" : "で商圏分析完了",
    },
    {
      value: isEn ? "47" : "47",
      label: isEn ? "All prefectures covered" : "都道府県対応",
    },
    {
      value: isEn ? "Census" : "国勢調査",
      label: isEn ? "Official data integrated" : "データ連携済み",
    },
    {
      value: isEn ? "Global" : "世界対応",
      label: isEn ? "US Census / WorldPop" : "US Census / WorldPop",
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
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
