import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UseCasesSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const cases = [
    {
      emoji: "🍽️",
      title: isEn ? "Restaurants" : "飲食店",
      desc: isEn
        ? "Predict monthly revenue and discover the optimal location through trade area analysis."
        : "新規出店の商圏分析で、月商予測と最適な立地を発見",
      flow: isEn
        ? "Population Analysis → Competitor Research → Flyer Distribution Design"
        : "商圏人口分析 → 競合調査 → チラシ配布エリア設計",
    },
    {
      emoji: "📚",
      title: isEn ? "Tutoring Schools" : "学習塾",
      desc: isEn
        ? "Identify areas with high concentrations of target households and distribute flyers efficiently."
        : "ターゲット世帯が多いエリアを地図で特定し、効率的にチラシ配布",
      flow: isEn
        ? "Family Household Analysis → Area Ads → Distribution Optimization"
        : "子育て世帯分析 → エリア広告 → 配布部数最適化",
    },
    {
      emoji: "💇",
      title: isEn ? "Beauty Salons" : "美容院・サロン",
      desc: isEn
        ? "Visualize competitors within 3km and discover differentiation points."
        : "半径3kmの競合を可視化し、差別化ポイントを発見",
      flow: isEn
        ? "Competitor Mapping → SNS Ad Proposals → Retention Strategy"
        : "競合分布分析 → SNS広告提案 → リピーター施策",
    },
    {
      emoji: "🏥",
      title: isEn ? "Clinics & Hospitals" : "クリニック・病院",
      desc: isEn
        ? "Identify areas with aging populations and plan optimal advertising strategies."
        : "高齢者が多いエリアを特定し、最適な広告戦略を立案",
      flow: isEn
        ? "Age Distribution Analysis → Google Ads → Awareness Expansion"
        : "年齢構成分析 → Google広告 → 認知拡大",
    },
    {
      emoji: "🏢",
      title: isEn ? "Real Estate" : "不動産",
      desc: isEn
        ? "Score candidate locations and support investment decisions with data."
        : "出店候補地のスコアリングで、投資判断をデータで支援",
      flow: isEn
        ? "Location Analysis → Population Trends → Revenue Simulation"
        : "出店分析 → 人口推移 → 収益シミュレーション",
    },
    {
      emoji: "🚬",
      title: isEn ? "Unmanned Stores" : "喫煙所・無人店舗",
      desc: isEn
        ? "Suggest optimal installation points from foot traffic data per location."
        : "立地ごとの人流データから最適な設置場所を提案",
      flow: isEn
        ? "Population Density → Traffic Flow Design → Revenue Forecast"
        : "人口密度分析 → 動線設計 → 収益予測",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isEn ? "Supporting Every Industry" : "あらゆる業種の集客を支援"}
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {isEn
              ? "From restaurants to real estate — MapBoost AI adapts to your business."
              : "飲食店から不動産まで、MapBoost AI はあらゆるビジネスに対応します。"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Card className="h-full border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                <CardHeader className="pb-2">
                  <div className="text-3xl mb-2">{c.emoji}</div>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{c.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-primary/70 bg-primary/5 rounded-lg px-3 py-2 font-medium">
                    {c.flow}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
