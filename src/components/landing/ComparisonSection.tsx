import { Check, X, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ComparisonSection() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const features = [
    { name: isEn ? "Trade area analysis" : "商圏分析", mapboost: true, traditional: true, excel: false },
    { name: isEn ? "AI-powered insights" : "AI施策提案", mapboost: true, traditional: false, excel: false },
    { name: isEn ? "Real census data" : "国勢調査データ連携", mapboost: true, traditional: true, excel: false },
    { name: isEn ? "Competitor mapping" : "競合マッピング", mapboost: true, traditional: true, excel: false },
    { name: isEn ? "Ad plan auto-generation" : "広告プラン自動生成", mapboost: true, traditional: false, excel: false },
    { name: isEn ? "Flyer order forms" : "チラシ発注書作成", mapboost: true, traditional: "partial", excel: false },
    { name: isEn ? "MEO analysis" : "MEO分析", mapboost: true, traditional: false, excel: false },
    { name: isEn ? "Response analysis" : "反響分析", mapboost: true, traditional: true, excel: "partial" },
    { name: isEn ? "Multi-location compare" : "複数立地比較", mapboost: true, traditional: false, excel: false },
    { name: isEn ? "Global support" : "海外対応", mapboost: true, traditional: false, excel: false },
    { name: isEn ? "Setup time" : "導入時間", mapboost: "30sec", traditional: "1week", excel: "days" },
    { name: isEn ? "Monthly cost" : "月額費用", mapboost: "¥9,800〜", traditional: "¥50,000〜", excel: "¥0" },
  ];

  const renderCell = (value: boolean | string) => {
    if (value === true) return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    if (value === false) return <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
    if (value === "partial") return <Minus className="w-5 h-5 text-amber-500 mx-auto" />;
    return <span className="text-xs font-medium text-foreground">{value}</span>;
  };

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
            {isEn ? "Why MapBoost AI?" : "なぜ MapBoost AI なのか？"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEn
              ? "Compare with traditional area marketing tools."
              : "従来のエリアマーケティング手法との比較"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left p-4 text-muted-foreground font-medium w-1/3">
                    {isEn ? "Feature" : "機能"}
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="text-primary font-bold text-base">MapBoost AI</span>
                      <span className="text-[10px] text-muted-foreground">{isEn ? "This product" : "本サービス"}</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="font-semibold text-foreground">{isEn ? "Traditional Tools" : "従来ツール"}</span>
                      <span className="text-[10px] text-muted-foreground">{isEn ? "¥50,000+/mo" : "月額5万円〜"}</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className="font-semibold text-foreground">{isEn ? "Manual / Excel" : "手作業/Excel"}</span>
                      <span className="text-[10px] text-muted-foreground">{isEn ? "Free but slow" : "無料だけど遅い"}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                    <td className="p-3 pl-4 text-foreground font-medium">{f.name}</td>
                    <td className="p-3 text-center bg-primary/5">{renderCell(f.mapboost)}</td>
                    <td className="p-3 text-center">{renderCell(f.traditional)}</td>
                    <td className="p-3 text-center">{renderCell(f.excel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
