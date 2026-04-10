import { AlertTriangle, Clock, DollarSign, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PainPointsSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const pains = [
    {
      icon: HelpCircle,
      title: isEn ? "Where should I open my store?" : "どこに出店すればいいかわからない",
      desc: isEn
        ? "Location decisions based on gut feeling alone risk costly mistakes."
        : "勘と経験だけで決めると、家賃だけが重くのしかかる失敗も。",
    },
    {
      icon: Clock,
      title: isEn ? "Market research takes too long" : "商圏調査に時間がかかりすぎる",
      desc: isEn
        ? "Manually gathering population data, competitor info, and demographics takes days."
        : "人口データ、競合情報、世帯構成…手作業で集めると何日もかかる。",
    },
    {
      icon: DollarSign,
      title: isEn ? "Expensive consulting fees" : "コンサル費用が高すぎる",
      desc: isEn
        ? "Professional area marketing analysis costs ¥300,000+ per report."
        : "プロのエリアマーケティング分析は1件30万円以上が相場。",
    },
    {
      icon: AlertTriangle,
      title: isEn ? "Ads aren't reaching the right people" : "広告が適切な人に届いていない",
      desc: isEn
        ? "Without data-driven targeting, your marketing budget goes to waste."
        : "データに基づかない広告配信は、予算をドブに捨てるようなもの。",
    },
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
            {isEn ? "Sound Familiar?" : "こんなお悩みありませんか？"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEn
              ? "MapBoost AI solves these challenges in minutes, not weeks."
              : "MapBoost AI なら、これらの課題を数分で解決します。"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pains.map((p, i) => (
            <motion.div
              key={i}
              className="flex gap-4 p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <p.icon className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
