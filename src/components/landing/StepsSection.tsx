import { FileText, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StepsSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const steps = [
    {
      num: "1",
      icon: FileText,
      title: isEn ? "Enter Store Info" : "店舗情報を入力",
      desc: isEn ? "Address, industry, and target audience" : "住所・業種・ターゲット",
    },
    {
      num: "2",
      icon: Sparkles,
      title: isEn ? "AI Analyzes Trade Area" : "AIが商圏を分析",
      desc: isEn ? "Population, competitors & households mapped" : "人口・競合・世帯をマップ表示",
    },
    {
      num: "3",
      icon: TrendingUp,
      title: isEn ? "Execute Your Plan" : "施策を実行",
      desc: isEn ? "Ads, flyers, SNS — concrete action plans" : "広告・チラシ・SNSの具体プランを出力",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "3 Steps to Your Growth Plan" : "3ステップで集客プランが完成"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="text-center relative"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-card border border-border/60 shadow-md flex items-center justify-center mx-auto mb-5">
                <s.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="text-xs font-bold text-primary/40 tracking-widest uppercase mb-2">
                STEP {s.num}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>

              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 text-primary/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
