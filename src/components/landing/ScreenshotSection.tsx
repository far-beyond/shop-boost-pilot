import { MapPin, Users, Megaphone, FileText, BarChart3, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ScreenshotSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const features = [
    { icon: MapPin, label: isEn ? "Trade Area Analysis" : "地図商圏分析" },
    { icon: Users, label: isEn ? "Competitor Mapping" : "競合マッピング" },
    { icon: Megaphone, label: isEn ? "AI Ad Proposals" : "AI広告提案" },
    { icon: FileText, label: isEn ? "Flyer Distribution" : "チラシ配布設計" },
    { icon: BarChart3, label: isEn ? "MEO Analysis" : "MEO分析" },
    { icon: CalendarDays, label: isEn ? "Monthly Reports" : "月次レポート" },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "Intuitive Dashboard" : "直感的なダッシュボード"}
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {isEn
              ? "Everything you need in one place — analysis, insights, and action plans."
              : "分析・インサイト・施策提案を、ひとつの画面で完結。"}
          </p>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border/60 shadow-2xl overflow-hidden bg-background"
        >
          {/* Address bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 border-b border-border/40">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/40" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/40" />
              <div className="w-3 h-3 rounded-full bg-accent/40" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-background border border-border/60 rounded-md px-4 py-1 text-xs text-muted-foreground font-mono max-w-xs w-full text-center">
                boost.share-map.net
              </div>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="p-6 md:p-8">
            {/* Top bar mock */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg" style={{ background: "var(--gradient-primary)" }} />
                <span className="text-sm font-semibold text-foreground">MapBoost AI</span>
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-6 rounded bg-muted/60" />
                <div className="w-16 h-6 rounded bg-muted/60" />
              </div>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-primary-foreground shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <f.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Fake chart area */}
            <div className="mt-5 rounded-xl border border-border/40 bg-muted/10 p-4 flex items-end gap-1.5 h-24">
              {[40, 55, 35, 65, 50, 70, 45, 80, 60, 75, 55, 85].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background: "var(--gradient-primary)",
                    opacity: 0.5 + (h / 170),
                  }}
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.04 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
